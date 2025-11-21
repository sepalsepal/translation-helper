import { NextResponse } from 'next/server';
import { updateSheetRow } from '@/lib/googleSheets';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = token ? new TelegramBot(token, { polling: false }) : null;

export async function POST(request: Request) {
    if (!bot) {
        return NextResponse.json({ error: 'Bot not initialized' }, { status: 500 });
    }

    try {
        const update = await request.json();

        // Handle Callback Query (Button Click)
        if (update.callback_query) {
            const query = update.callback_query;
            const data = query.data; // e.g., "approve_12"
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;

            if (data.startsWith('approve_')) {
                const rowNumber = parseInt(data.split('_')[1]);

                // Update Sheet Status to APPROVED (Assuming Col D is Status)
                // And maybe mark the translation as Final?
                // For now, let's just mark a status column.
                // Let's assume Column D is "Status"
                await updateSheetRow('Foreword', rowNumber, 'D', 'APPROVED');

                // Update Telegram Message to show it's done
                await bot.editMessageText(`✅ Approved! (Row ${rowNumber})`, {
                    chat_id: chatId,
                    message_id: messageId
                });
            }

            if (data.startsWith('edit_')) {
                // Edit logic would go here (complex interaction, skipping for MVP)
                await bot.sendMessage(chatId, "Edit feature coming soon. Please edit in Google Sheets directly.");
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
