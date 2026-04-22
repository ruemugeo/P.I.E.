import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { content, mode } = await req.json();

const proModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });    
    let prompt = "";
    if (mode === 'devil') {
      prompt = `Act as a Devil's Advocate. Brutally but constructively deconstruct this thought. Find logical fallacies, present counter-arguments, and point out blind spots. Keep your response extremely concise, punchy, and under 150 words. Thought: "${content}"`;
    } else {
      prompt = `Act as an Angel Companion. Validate this thought. Expand on its potential and hype up the core insight. Keep your response extremely concise, energetic, and under 150 words. Thought: "${content}"`;
    }

    const result = await proModel.generateContent(prompt);
    const analysis = result.response.text();

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: 'Failed to analyze thought' }, { status: 500 });
  }
}