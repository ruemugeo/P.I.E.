import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Upload to Supabase Storage
    const { data: upload, error } = await supabase.storage
      .from('vault')
      .upload(`${Date.now()}-${file.name}`, file);

    if (error) throw error;

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vault/${upload.path}`;

    // 2. AI Summarization
    const fileBuffer = await file.arrayBuffer();

    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          text: 'Extract the core concepts and 3 bullet points from this document for a digital brain. Summarize briefly.',
        },
        {
          inlineData: {
            data: Buffer.from(fileBuffer).toString('base64'),
            mimeType: file.type,
          },
        },
      ],
    });

    const summary = result.text || '';

    // 3. Save as Thought
    await supabase.from('thoughts').insert({
      content: `[DOC: ${file.name}] ${summary}`,
      category: 'research',
      file_url: fileUrl,
      tags: ['auto-summary', 'document']
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
