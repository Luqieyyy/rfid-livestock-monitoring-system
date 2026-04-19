import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are FarmSense AI Assistant, a knowledgeable livestock expert for the FarmSense marketplace platform in Malaysia.

You ONLY answer questions related to:
- Livestock breeds (cows, goats) — characteristics, traits, suitability
- Livestock health, care, feeding, and nutrition
- Buying and selling livestock — pricing, what to look for, negotiation tips
- Slaughter yield estimation (daging, tulang, lemak)
- Livestock management and farming practices
- FarmSense marketplace — how to browse, view animal profiles, contact sellers

You MUST REFUSE to answer anything outside these topics. If the user asks about unrelated topics, politely redirect them back to livestock or buying/selling questions.

Keep responses concise, practical, and helpful. Use simple language. You may respond in either English or Bahasa Melayu depending on what language the user uses. Be friendly and professional.

Do not make up prices — if asked about current market prices, give general ranges based on Malaysian market knowledge and advise users to check current market rates.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response. Please try again.' },
      { status: 500 }
    );
  }
}
