import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            return NextResponse.json({
                success: false,
                error: 'Missing Telegram credentials',
                env: {
                    hasToken: !!token,
                    hasChatId: !!chatId
                }
            }, { status: 500 });
        }

        const bot = new TelegramBot(token, { polling: false });

        // Try to get bot info
        const me = await bot.getMe();

        // Try to send a test message
        await bot.sendMessage(chatId, '🔔 Test notification from Translation Helper Debugger');

        return NextResponse.json({
            success: true,
            botInfo: me,
            message: 'Test message sent successfully',
            chatId: chatId
        });

    } catch (error: any) {
        console.error('Telegram Debug Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
