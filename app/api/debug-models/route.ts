import { NextResponse } from 'next/server';

type GoogleModel = {
  name: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
};

type GoogleModelsResponse = {
  models?: GoogleModel[];
  error?: {
    message?: string;
  };
};

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing from environment variables' },
        { status: 500 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = (await response.json()) as GoogleModelsResponse;

    if (data.error) {
      return NextResponse.json({ google_error: data.error }, { status: 500 });
    }

    const embeddingModels = data.models
      ?.filter((model) => model.supportedGenerationMethods?.includes('embedContent'))
      .map((model) => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
      }));

    return NextResponse.json({
      status: 'Online',
      message: "Check the list below for the exact 'name' string to use in our code.",
      count: embeddingModels?.length || 0,
      models: embeddingModels,
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Route crashed',
        details,
      },
      { status: 500 }
    );
  }
}
