import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function translateText(text: string, context: string = ''): Promise<string> {
    if (!openai) {
        console.warn('OpenAI API Key not set. Returning mock translation.');
        return `[Mock Translation] ${text}`;
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Or 'gpt-3.5-turbo' if cost is a concern
            messages: [
                {
                    role: 'system',
                    content: `You are a professional translator for an animation production book. 
          Translate the following English text to Korean. 
          Tone: Professional, industry-standard terms.
          Context: ${context}`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
        });

        return response.choices[0].message.content || '';
    } catch (error) {
        console.error('Error translating text:', error);
        return '';
    }
}
