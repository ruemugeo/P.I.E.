import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The order of models we trust for deep analysis
const ANALYSIS_MODELS = [
  'gemini-2.0-flash', 
  'gemini-1.5-pro', 
  'gemini-1.5-flash'
];

async function analyzeWithFallback(prompt: string) {
  let lastError = null;

  for (const modelName of ANALYSIS_MODELS) {
    try {
      console.log(`[Lattice] Analysis Attempt: ${modelName}`);
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (e: any) {
      lastError = e;
      console.error(`[Lattice] ${modelName} Analysis failed:`, e.message);
      continue; // Try the next model
    }
  }
  throw new Error(lastError?.message || "All analysis models failed");
}

export async function POST(req: Request) {
  try {
    const { content, lens } = await req.json();

    const prompts = {
      angel: "Act as a high-level strategic mentor. Find the positive growth potential and ethical alignment in this thought. Provide 2-3 actionable words of encouragement.",
      devil: "Act as a rigorous devil's advocate. Identify the logical fallacies, hidden risks, and potential downsides of this idea. Be brutally honest but constructive.",
      zap: "Act as a cross-disciplinary polymath. Connect this thought to a concept in an unrelated field (e.g. biology, architecture, or music theory) to spark a new perspective."
    };

    const selectedPrompt = prompts[lens as keyof typeof prompts] || prompts.zap;
    const finalPrompt = `${selectedPrompt}\n\nThought to analyze: "${content}"`;

    const analysis = await analyzeWithFallback(finalPrompt);

    return NextResponse.json({ 
      analysis,
      lensUsed: lens
    });

  } catch (error: any) {
    console.error('🔥 ANALYSIS CRASH:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}