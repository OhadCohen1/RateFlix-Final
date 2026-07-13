export interface MovieMetadata {
  synopsis: string;
  tags: string[];
}

const GEMINI_MODEL = 'gemini-2.5-flash';

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
  }[];
}

/**
 * Generates marketing metadata for a movie from its title using Google Gemini:
 * a catchy 2-sentence synopsis in Hebrew and 3 relevant string tags.
 * Uses the REST API directly (no SDK) with a JSON response schema.
 */
export const generateMovieMetadata = async (title: string): Promise<MovieMetadata> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const prompt =
    'You are a creative movie marketing copywriter. ' +
    `Write metadata for the movie titled "${title}". ` +
    'The synopsis must be exactly 2 catchy sentences written in Hebrew. ' +
    'The tags must be 3 short, relevant genre/theme keywords in Hebrew.';

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              synopsis: { type: 'STRING' },
              tags: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['synopsis', 'tags'],
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    throw new Error('Gemini returned an empty response');
  }

  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as { synopsis?: unknown }).synopsis !== 'string'
  ) {
    throw new Error('Gemini response did not match the expected shape');
  }

  const { synopsis, tags } = parsed as { synopsis: string; tags?: unknown };

  return {
    synopsis,
    tags: Array.isArray(tags) ? tags.slice(0, 3).map(String) : [],
  };
};
