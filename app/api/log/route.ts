import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables!');
  }
  return createClient(url, key);
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CHAT_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

type LogAnalysis = {
  category?: string;
  sentiment?: string;
  tasks?: string[];
  summary?: string;
};

async function generateWithFallback(prompt: string) {
  let lastError: Error | null = null;

  for (const modelName of CHAT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: `
            Analyze the input and return ONLY a JSON object exactly like this:
            {
              "category": "One word (e.g., Work, Health, Idea, Personal)",
              "sentiment": "An emoji + word (e.g., Excited)",
              "tasks": ["List of actionable items if any, otherwise empty array"],
              "summary": "A 5-word snappy summary"
            }
          `,
        },
      });

      const parsedData = JSON.parse(response.text || '{}') as LogAnalysis;
      return { data: parsedData, activeModel: modelName };
    } catch (error: unknown) {
      const e = error instanceof Error ? error : new Error('Unknown Gemini error');
      lastError = e;
      const status = 'status' in e ? e.status : undefined;

      if (status === 429 || status === 503) {
        continue;
      }
    }
  }

  throw new Error(`AI Failure: ${lastError?.message || 'Unknown Error'}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content = body?.content;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { data: aiResponse, activeModel } = await generateWithFallback(`Analyze: ${content}`);

    const embeddingResult = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: content,
      config: { taskType: 'RETRIEVAL_DOCUMENT', outputDimensionality: 3072 },
    });
    const embedding = embeddingResult.embeddings?.[0]?.values;
    if (!embedding) {
      throw new Error('Embedding generation failed.');
    }

    const supabase = getSupabase();

    const { data: thoughtData, error: thoughtError } = await supabase
      .from('thoughts')
      .insert([
        {
          content,
          category: aiResponse.category || 'Thought',
          sentiment: aiResponse.sentiment || 'Neutral',
          embedding,
        },
      ])
      .select()
      .single();

    if (thoughtError) {
      throw thoughtError;
    }

    if (Array.isArray(aiResponse.tasks) && aiResponse.tasks.length > 0) {
      const taskInserts = aiResponse.tasks.map((taskStr: string) => ({
        title: taskStr,
        priority: 'medium',
        status: 'todo',
      }));

      const { error: taskError } = await supabase.from('tasks').insert(taskInserts);
      if (taskError) {
        console.error('Failed to insert tasks:', taskError);
      }
    }

    return NextResponse.json({ success: true, model: activeModel, thought: thoughtData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('LOG ERROR:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
