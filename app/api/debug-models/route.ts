import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// We define GET explicitly so the browser can hit it
export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing from environment variables" }, { status: 500 });
    }

    // We use a direct fetch to Google's discovery API 
    // This bypasses SDK versioning issues and shows us the truth.
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ google_error: data.error }, { status: 500 });
    }

    // Filter for models that support embeddings so we can find the 768-dim winner
    const embeddingModels = data.models
      ?.filter((m: any) => m.supportedGenerationMethods.includes('embedContent'))
      .map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description
      }));

    return NextResponse.json({ 
      status: "Online",
      message: "Check the list below for the exact 'name' string to use in our code.",
      count: embeddingModels?.length || 0,
      models: embeddingModels 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Route crashed", 
      details: error.message 
    }, { status: 500 });
  }
}