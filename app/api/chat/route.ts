import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// 1. Fetch your "Interests" to prime the AI's personality
const { data: interests } = await supabase
  .from('thoughts')
  .select('content')
  .eq('category', 'interest');

const interestContext = interests?.map(i => i.content).join(', ') || "No specific interests logged.";

// 2. Add this to your system prompt
const systemPrompt = `You are Lattice, the user's cognitive exoskeleton. 
User's Core Interests: ${interestContext}
Use this context to make connections in your answers.`;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The Model Rotation Array
const CHAT_MODELS = [
  'gemini-2.5-flash', 
  'gemini-2.5-flash-lite', 
  'gemini-1.5-flash', 
  'gemini-1.5-pro'
];

async function generateWithFallback(prompt: string) {
  let lastError = null;

  for (const modelName of CHAT_MODELS) {
    try {
      // Reverting to the 'ai.models.generateContent' pattern that worked in your logger
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          // You can add systemInstructions here if needed for the chat
          systemInstruction: "You are the Lattice Cognitive Engine. Answer based on the context logs provided. Be concise."
        }
      });
      
      return { text: response.text, modelUsed: modelName };
    } catch (e: any) {
      lastError = e;
      // If quota (429) or overloaded (503), try the next model
      if (e.status === 429 || e.status === 503 || e.message?.includes('quota')) {
        console.warn(`[Lattice] Model ${modelName} reached limit. Shifting to next node...`);
        continue;
      }
      throw e; 
    }
  }
  throw new Error(`Neural Network Exhausted: ${lastError?.message}`);
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. Embed the query (3072 dimensions)
    const embedResult = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: message,
      config: { taskType: 'RETRIEVAL_QUERY', outputDimensionality: 3072 }
    });
    const queryEmbedding = embedResult.embeddings[0].values;

    // 2. Search Supabase
    const supabase = getSupabase();
    const { data: matchedThoughts, error } = await supabase.rpc('match_thoughts', {
      query_embedding: queryEmbedding,
      match_threshold: 0.4, // Slightly lower threshold for better recall
      match_count: 8        // Grabbing 8 memories for richer context
    });

    if (error) throw error;

    // 3. Prepare Context
    const context = matchedThoughts?.length 
      ? matchedThoughts.map((t: any) => `- ${t.content}`).join('\n')
      : 'No specific records found.';

    // 4. Generate Answer with Fallback Logic
    const prompt = `
      CONTEXT FROM USER LOGS:
      ${context}

      USER QUESTION:
      ${message}

      INSTRUCTIONS:
      You are the Lattice Cognitive Engine. Answer based ONLY on the context above. 
      If unsure, admit it. Keep it brief and cybernetic in tone.
    `;

    const { text, modelUsed } = await generateWithFallback(prompt);

    return NextResponse.json({ 
      reply: text, 
      metadata: { model: modelUsed, contextCount: matchedThoughts?.length || 0 } 
    });

  } catch (error: any) {
    console.error('🔥 CHAT ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}