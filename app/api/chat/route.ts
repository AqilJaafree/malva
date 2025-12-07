import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API,
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Add a system message for the crypto assistant context
    const systemMessage = {
      role: 'system',
      content: `You are Malva AI, an intelligent crypto analytics assistant specialized in Real World Assets (RWA), DCA strategies, and Solana blockchain. You help users:
- Analyze market trends and on-chain data
- Create dollar-cost averaging (DCA) strategies
- Understand staking opportunities
- Review portfolio performance
- Provide insights on RWA tokens like tokenized stocks (TSLAx, AAPLx, etc.), wrapped BTC, and gold-backed tokens

Keep responses concise, informative, and actionable. Use data-driven insights when possible.`,
    };

    // Combine system message with user messages
    const allMessages = [systemMessage, ...messages];

    const chatCompletion = await groq.chat.completions.create({
      messages: allMessages as any,
      model: 'llama-3.3-70b-versatile', // Fast and capable model
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const responseMessage = chatCompletion.choices[0]?.message?.content;

    if (!responseMessage) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: responseMessage,
      usage: chatCompletion.usage,
      model: chatCompletion.model,
    });
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Groq.APIError) {
      return NextResponse.json(
        { error: `Groq API Error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
