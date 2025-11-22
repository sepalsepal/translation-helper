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
            model: 'gpt-4o',
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

export async function adaptText(text: string): Promise<string> {
    if (!openai) {
        return `[Mock Adaptation] ${text}`;
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are a professional editor for animation production content.
          Improve the following Korean translation to be more natural, fluent, and suitable for the industry.
          Maintain the original meaning but enhance readability and flow.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.4,
        });

        return response.choices[0].message.content || '';
    } catch (error) {
        console.error('Error adapting text:', error);
        return '';
    }
}
