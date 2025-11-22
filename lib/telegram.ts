import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

// Create a bot instance. 
// In a serverless environment (Next.js API routes), we usually use 'webhook' mode or just simple HTTP requests.
// For simplicity in sending notifications, we can use the library in 'polling: false' mode.
const bot = token ? new TelegramBot(token, { polling: false }) : null;

export async function sendTelegramMessage(message: string) {
    if (!bot || !chatId) {
        console.warn('Telegram credentials not set. Skipping notification.');
        return;
    }

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}

export async function sendTelegramNotification(message: string) {
    return sendTelegramMessage(message);
}

// Stage 1: Chapter Structure Review
export async function sendChapterReviewRequest(chapter: string, rowNumber: number, chapterIndex: number, spreadsheetId: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.warn('Telegram credentials not set. Skipping chapter review request.');
        return;
    }

    const bot = new TelegramBot(token, { polling: false });

    // Callback data format: action:chapterIndex:spreadsheetId
    // Max 64 bytes. spreadsheetId is ~44 chars.
    // action: 'ap_ch' (5) + ':' (1) + index (2) + ':' (1) + id (44) = ~53 chars. Safe.
    const approveData = `ap_ch:${chapterIndex}:${spreadsheetId}`;
    const rejectData = `re_ch:${chapterIndex}:${spreadsheetId}`;

    try {
        await bot.sendMessage(chatId, `
📝 *Chapter Structure Review* (Chapter ${chapterIndex + 1})

*Source Text:*
${chapter}

_Is this segmentation correct?_
`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '✅ Approve', callback_data: approveData },
                    { text: '❌ Reject', callback_data: rejectData }
                ]]
            }
        });
    } catch (error) {
        console.error('Error sending chapter review request:', error);
    }
}

// Stage 2: Translation Approval
export async function sendTranslationApprovalRequest(source: string, translation: string, rowNumber: number, chapterIndex: number, spreadsheetId: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) return;

    const bot = new TelegramBot(token, { polling: false });

    const approveData = `ap_tr:${chapterIndex}:${spreadsheetId}`;
    const rejectData = `re_tr:${chapterIndex}:${spreadsheetId}`;

    try {
        await bot.sendMessage(chatId, `
📝 *Translation Approval* (Chapter ${chapterIndex + 1})

*Source:*
${source}

*Translation:*
${translation}

_Is this translation accurate?_
`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '✅ Approve', callback_data: approveData },
                    { text: '❌ Reject', callback_data: rejectData }
                ]]
            }
        });
    } catch (error) {
        console.error('Error sending translation approval request:', error);
    }
}

// Stage 3: Adaptation Approval
export async function sendAdaptationApprovalRequest(translation: string, adaptation: string, rowNumber: number, chapterIndex: number, spreadsheetId: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) return;

    const bot = new TelegramBot(token, { polling: false });

    const approveData = `ap_ad:${chapterIndex}:${spreadsheetId}`;
    const rejectData = `re_ad:${chapterIndex}:${spreadsheetId}`;

    try {
        await bot.sendMessage(chatId, `
✨ *Adaptation Approval* (Chapter ${chapterIndex + 1})

*Translation:*
${translation}

*Adaptation:*
${adaptation}

_Is this adaptation natural?_
`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '✅ Approve', callback_data: approveData },
                    { text: '❌ Reject', callback_data: rejectData }
                ]]
            }
        });
    } catch (error) {
        console.error('Error sending adaptation approval request:', error);
    }
}

// Legacy function for backward compatibility
export async function sendApprovalRequest(source: string, translation: string, rowNumber: number) {
    const chapterIndex = rowNumber - 2;
    const spreadsheetId = process.env.SPREADSHEET_ID || '';
    return sendTranslationApprovalRequest(source, translation, rowNumber, chapterIndex, spreadsheetId);
}
