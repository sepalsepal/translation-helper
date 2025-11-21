import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

export const dynamic = 'force-dynamic';

export async function GET() {
    let tokenPrefix = '';

    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (token) {
            tokenPrefix = token.substring(0, 5) + '...';
        }

        if (!token || !chatId) {
            return NextResponse.json({
                success: false,
                error: 'Missing Telegram credentials',
                env: {
                    hasToken: !!token,
                    hasChatId: !!chatId,
                    tokenPrefix
                }
            }, { status: 500 });
        }

        const bot = new TelegramBot(token, { polling: false });

        let botInfo = null;
        let messageSent = false;
        let errorDetails = null;

        try {
            botInfo = await bot.getMe();
        } catch (e: any) {
            console.error('getMe failed:', e);
            errorDetails = { step: 'getMe', message: e.message };
        }

        if (botInfo) {
            try {
                await bot.sendMessage(chatId, '🔔 Test notification from Translation Helper Debugger');
                messageSent = true;
            } catch (e: any) {
                console.error('sendMessage failed:', e);
                errorDetails = { step: 'sendMessage', message: e.message };
            }
        }

        return NextResponse.json({
            success: !!botInfo,
            env: {
                hasToken: !!token,
                hasChatId: !!chatId,
                tokenPrefix,
                chatId
            },
            botInfo,
            messageSent,
            error: errorDetails ? errorDetails.message : null,
            fullError: errorDetails
        });

    } catch (error: any) {
        console.error('Telegram Debug Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            env: {
                tokenPrefix
            }
        }, { status: 500 });
    }
}
