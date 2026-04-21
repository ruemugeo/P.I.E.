import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Fallback to ANON key if SERVICE_ROLE is missing in .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'No content provided' }, { status: 400 });

    console.log("1. Received thought:", content);

    // Summon the PIE Ghost
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });    
    const prompt = `
      You are the core processor for the PIE (Personal Intelligence Engine).
      Analyze the following raw thought from the user: "${content}"
      
      Extract the following data and return it strictly as a JSON object (DO NOT wrap it in markdown code blocks):
      1. "category": A single word categorization (e.g., Synthesis, Collision, Interest, System, Vent, Idea).
      2. "sentiment": A 1-3 word description of the emotional/logical tone, optionally including an emoji.
      3. "tasks": An array of actionable items found in the thought. If none, return an empty array [].
         For each task, provide:
         - "title": The action item.
         - "priority": "high", "medium", or "low" based on urgency.

      Example output format:
      {
        "category": "Idea",
        "sentiment": "focused 🧠",
        "tasks": [
          { "title": "Buy groceries", "priority": "medium" }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    
    console.log("2. Raw Gemini Response:", rawText);

    // AGGRESSIVE JSON SANITIZER (Strips markdown backticks and 'json' text)
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const aiResponse = JSON.parse(rawText);
    console.log("3. Cleaned & Parsed AI Data:", aiResponse);

    // Insert the Thought into Supabase
    const { data: thoughtData, error: thoughtError } = await supabase
      .from('thoughts')
      .insert([{ 
        content, 
        category: aiResponse.category || 'Log', 
        sentiment: aiResponse.sentiment || 'neutral' 
      }])
      .select()
      .single();

    if (thoughtError) {
      console.error("Supabase Thought Insert Error:", thoughtError);
      throw thoughtError;
    }

    // If tasks were found, insert them into the Tasks table
    if (aiResponse.tasks && Array.isArray(aiResponse.tasks) && aiResponse.tasks.length > 0) {
      const tasksToInsert = aiResponse.tasks.map((task: any) => ({
        title: task.title,
        priority: task.priority || 'medium',
        status: 'todo',
        thought_id: thoughtData.id
      }));

      const { error: taskError } = await supabase.from('tasks').insert(tasksToInsert);
      
      if (taskError) {
        console.error("Supabase Task Extraction Error:", taskError);
      } else {
        console.log(`4. Successfully saved ${tasksToInsert.length} tasks to database.`);
      }
    }

    return NextResponse.json({ success: true, extractedTasks: aiResponse.tasks?.length || 0 });

  } catch (error) {
    console.error('LATTICE FATAL ERROR:', error);
    return NextResponse.json({ error: 'Failed to process thought.' }, { status: 500 });
  }
}