import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CHAT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

type ThoughtRow = {
  content: string;
};

async function generateWithFallback(prompt: string, interestContext: string) {
  let lastError: Error | null = null;

  for (const modelName of CHAT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: `You are Lattice, the user's cognitive exoskeleton.
User's Core Interests: ${interestContext}
Answer based ONLY on the context logs provided. Be concise.`,
        },
      });

      return { text: response.text, modelUsed: modelName };
    } catch (error: unknown) {
      const e = error instanceof Error ? error : new Error('Unknown Gemini error');
      lastError = e;
      const status = 'status' in e ? e.status : undefined;

      if (status === 429 || status === 503 || e.message.includes('quota')) {
        console.warn(`[Lattice] Model ${modelName} reached limit. Shifting to next node...`);
        continue;
      }

      throw e;
    }
  }

  throw new Error(`Neural Network Exhausted: ${lastError?.message ?? 'Unknown error'}`);
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const supabase = getSupabase();

    const { data: interests } = await supabase
      .from('thoughts')
      .select('content')
      .eq('category', 'interest');

    const interestContext =
      interests?.map((item: ThoughtRow) => item.content).join(', ') || 'No specific interests logged.';

    const embedResult = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: message,
      config: { taskType: 'RETRIEVAL_QUERY', outputDimensionality: 3072 },
    });

    const queryEmbedding = embedResult.embeddings?.[0]?.values;
    if (!queryEmbedding) {
      throw new Error('Embedding generation failed.');
    }

    const { data: matchedThoughts, error } = await supabase.rpc('match_thoughts', {
      query_embedding: queryEmbedding,
      match_threshold: 0.4,
      match_count: 8,
    });

    if (error) {
      throw error;
    }

    const context = matchedThoughts?.length
      ? matchedThoughts.map((thought: ThoughtRow) => `- ${thought.content}`).join('\n')
      : 'No specific records found.';

    const prompt = `
      CONTEXT FROM USER LOGS:
      ${context}

      USER QUESTION:
      ${message}

      INSTRUCTIONS:
      You are the Lattice Cognitive Engine. Answer based ONLY on the context above.
      If unsure, admit it. Keep it brief and cybernetic in tone.
    `;

    const { text, modelUsed } = await generateWithFallback(prompt, interestContext);

    return NextResponse.json({
      reply: text,
      metadata: { model: modelUsed, contextCount: matchedThoughts?.length || 0 },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('CHAT ERROR:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
