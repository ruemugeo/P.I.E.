import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const CHAT_MODELS = [
  'gemini-2.5-flash', 
  'gemini-2.5-flash-lite', 
  'gemini-1.5-flash', 
  'gemini-1.5-pro'
];

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  const { content, lens } = await req.json();
  
  const prompts = {
    angel: "Provide an encouraging, supportive perspective on this idea. How does it align with personal growth?",
    devil: "Be the ultimate skeptic. Find the flaws, the risks, and the logical gaps in this thought. Don't be mean, be rigorous.",
    zap: "Make a 'spontaneous connection.' Connect this thought to a completely different field (like biology, space, or history) to create a new insight."
  };

  const model = ai.getGenerativeModel({
    for (const modelName of CHAT_MODELS) {
    try {
    model: modelName });
  const result = await model.generateContent(`${prompts[lens]}\n\nThought: "${content}"`);
  
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
}
}
}