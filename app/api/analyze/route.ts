import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  const { content, lens } = await req.json();
  
  const prompts = {
    angel: "Provide an encouraging, supportive perspective on this idea. How does it align with personal growth?",
    devil: "Be the ultimate skeptic. Find the flaws, the risks, and the logical gaps in this thought. Don't be mean, be rigorous.",
    zap: "Make a 'spontaneous connection.' Connect this thought to a completely different field (like biology, space, or history) to create a new insight."
  };

  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`${prompts[lens]}\n\nThought: "${content}"`);
  
  return NextResponse.json({ analysis: result.response.text() });
}