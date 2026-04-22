import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Perform a deep analysis on this thought: "${content}". 
                 Categorize it and suggest 3 actionable next steps. 
                 Format as JSON: {"category": "...", "steps": ["...", "...", "..."]}`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return NextResponse.json({ 
      analysis: JSON.parse(response.text || "{}") 
    });

   catch (error: any) {
    console.error('🔥 ANALYZE ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
