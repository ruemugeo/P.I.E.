import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Cluster = {
  title: string;
  summary: string;
  status: string;
  relevance: number;
};

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch recent thoughts to summarize into "Knowledge Clusters"
    const { data: thoughts } = await supabase
      .from('thoughts')
      .select('content, category')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!thoughts || thoughts.length === 0) {
      return NextResponse.json({ clusters: [] });
    }

    // 2. Ask AI to organize these raw thoughts into a "Wiki" structure
    const prompt = `
      Analyze these raw logs and organize them into 3-5 high-level "Project Clusters".
      For each cluster, provide a title, a 1-sentence summary, and a "status" (Active, Research, or Archived).
      
      Logs:
      ${thoughts.map(t => `[${t.category}] ${t.content}`).join('\n')}

      Return ONLY a JSON array: 
      [{"title": "string", "summary": "string", "status": "string", "relevance": number}]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite', // Use lite for speed/quota
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const clusters = JSON.parse(response.text || '[]') as Cluster[];
    return NextResponse.json({ clusters });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
