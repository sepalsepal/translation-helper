import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { updateSheetRow } from '@/lib/googleSheets';
import { sendTranslationApprovalRequest, sendAdaptationApprovalRequest } from '@/lib/telegram';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const update = await request.json();

        // Handle Callback Queries (Button Clicks)
        if (update.callback_query) {
            const callbackQuery = update.callback_query;
            const chatId = callbackQuery.message.chat.id;
            const data = callbackQuery.data;
            const token = process.env.TELEGRAM_BOT_TOKEN;

            if (!token) {
                return NextResponse.json({ error: 'Missing Telegram Token' }, { status: 500 });
            }

            const bot = new TelegramBot(token, { polling: false });

            // Parse callback data: action:chapterIndex:spreadsheetId
            // Actions: ap_ch (Approve Chapter), re_ch (Reject Chapter)
            //          ap_tr (Approve Trans), re_tr (Reject Trans)
            //          ap_ad (Approve Adapt), re_ad (Reject Adapt)

            const parts = data.split(':');
            if (parts.length < 3) {
                console.error('Invalid callback data format:', data);
                await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error: Invalid data' });
                return NextResponse.json({ success: false });
            }

            const actionCode = parts[0];
            const chapterIndex = parseInt(parts[1]);
            const spreadsheetId = parts.slice(2).join(':'); // Join back in case ID has colons (unlikely but safe)

            // Calculate row number (assuming header is row 1, so index 0 is row 2)
            const rowNumber = chapterIndex + 2;
            const sheetName = process.env.SHEET_NAME || '시트1';

            // Fetch current row data
            const { getRowData } = await import('@/lib/googleSheets');
            const rowData = await getRowData(sheetName, rowNumber, spreadsheetId);

            if (!rowData) {
                await bot.sendMessage(chatId, '❌ Error: Could not fetch data from sheet.');
                return NextResponse.json({ success: false });
            }

            let replyText = '';

            // --- Chapter Review Stage ---
            if (actionCode === 'ap_ch') {
                // 1. Update Status
                await updateSheetRow(sheetName, rowNumber, 'E', 'TRANSLATION', spreadsheetId);
                await bot.sendMessage(chatId, `✅ Chapter ${chapterIndex + 1} Approved. Translating... ⏳`);

                // 2. Run AI Translation
                const { translateText } = await import('@/lib/openai');
                const translatedText = await translateText(rowData.sourceText);

                // 3. Update Sheet (Column B)
                await updateSheetRow(sheetName, rowNumber, 'B', translatedText, spreadsheetId);

                // 4. Send Next Approval Request
                await sendTranslationApprovalRequest(rowData.sourceText, translatedText, rowNumber, chapterIndex, spreadsheetId);

                replyText = `Translation ready for review.`;

            } else if (actionCode === 're_ch') {
                await updateSheetRow(sheetName, rowNumber, 'E', 'REJECTED', spreadsheetId);
                replyText = `❌ Chapter ${chapterIndex + 1} Rejected.`;
            }

            // --- Translation Approval Stage ---
            else if (actionCode === 'ap_tr') {
                // 1. Update Status
                await updateSheetRow(sheetName, rowNumber, 'E', 'ADAPTATION', spreadsheetId);
                await bot.sendMessage(chatId, `✅ Translation ${chapterIndex + 1} Approved. Adapting... ⏳`);

                // 2. Run AI Adaptation
                const { adaptText } = await import('@/lib/openai');
                // Use the translated text from the sheet (or the one we just approved if we trust the flow)
                // Better to use rowData.translatedText, but we need to be sure it's there.
                // Since we are approving, it should be there.
                const adaptedText = await adaptText(rowData.translatedText);

                // 3. Update Sheet (Column C)
                await updateSheetRow(sheetName, rowNumber, 'C', adaptedText, spreadsheetId);

                // 4. Send Next Approval Request
                await sendAdaptationApprovalRequest(rowData.translatedText, adaptedText, rowNumber, chapterIndex, spreadsheetId);

                replyText = `Adaptation ready for review.`;

            } else if (actionCode === 're_tr') {
                await updateSheetRow(sheetName, rowNumber, 'E', 'REJECTED', spreadsheetId);
                replyText = `❌ Translation ${chapterIndex + 1} Rejected.`;
            }

            // --- Adaptation Approval Stage ---
            else if (actionCode === 'ap_ad') {
                // 1. Update Status & Final Text
                await updateSheetRow(sheetName, rowNumber, 'E', 'COMPLETED', spreadsheetId);
                await updateSheetRow(sheetName, rowNumber, 'D', rowData.adaptedText, spreadsheetId); // Final = Adapted

                replyText = `✅ Adaptation ${chapterIndex + 1} Approved. Chapter Completed! 🎉`;
            } else if (actionCode === 're_ad') {
                await updateSheetRow(sheetName, rowNumber, 'E', 'REJECTED', spreadsheetId);
                replyText = `❌ Adaptation ${chapterIndex + 1} Rejected.`;
            }

            // Answer callback to remove loading state
            try {
                await bot.answerCallbackQuery(callbackQuery.id, { text: 'Processed' });
            } catch (e) {
                // Ignore answerCallbackQuery errors (sometimes fails if too slow)
                console.log('answerCallbackQuery failed/skipped');
            }

            // Send confirmation message (if not already sent by next step logic)
            if (replyText) {
                // await bot.sendMessage(chatId, replyText);
                // We already sent status messages or next requests. 
                // Let's send the final completion message only for rejection or completion.
                if (actionCode.startsWith('re_') || actionCode === 'ap_ad') {
                    await bot.sendMessage(chatId, replyText);
                }
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: true }); // Ignore other updates
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
