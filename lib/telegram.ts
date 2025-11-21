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
export async function sendChapterReviewRequest(sourceText: string, rowNumber: number, chapterNumber: number) {
    if (!bot || !chatId) {
        return;
    }

    const message = `
📋 *Chapter Structure Review*
Chapter: ${chapterNumber} | Row: ${rowNumber}

*Source Text:*
${sourceText.substring(0, 500)}${sourceText.length > 500 ? '...' : ''}
  `;

    const opts = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Approve Structure', callback_data: `approve_chapter_${rowNumber}` },
                    { text: '❌ Reject', callback_data: `reject_chapter_${rowNumber}` }
                ]
            ]
        }
    };

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...opts });
    } catch (error) {
        console.error('Error sending chapter review request:', error);
    }
}

// Stage 2: Translation Approval
export async function sendTranslationApprovalRequest(source: string, translation: string, rowNumber: number) {
    if (!bot || !chatId) {
        return;
    }

    const message = `
🌐 *Translation Approval*
Row: ${rowNumber}

*Source:*
${source.substring(0, 300)}${source.length > 300 ? '...' : ''}

*Translation:*
${translation.substring(0, 300)}${translation.length > 300 ? '...' : ''}
  `;

    const opts = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Approve Translation', callback_data: `approve_translation_${rowNumber}` },
                    { text: '❌ Reject', callback_data: `reject_translation_${rowNumber}` }
                ]
            ]
        }
    };

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...opts });
    } catch (error) {
        console.error('Error sending translation approval request:', error);
    }
}

// Stage 3: Adaptation Approval
export async function sendAdaptationApprovalRequest(translation: string, adaptation: string, rowNumber: number) {
    if (!bot || !chatId) {
        return;
    }

    const message = `
✨ *Adaptation Approval*
Row: ${rowNumber}

*Translation:*
${translation.substring(0, 250)}${translation.length > 250 ? '...' : ''}

*Adaptation:*
${adaptation.substring(0, 250)}${adaptation.length > 250 ? '...' : ''}
  `;

    const opts = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Approve Adaptation', callback_data: `approve_adaptation_${rowNumber}` },
                    { text: '❌ Reject', callback_data: `reject_adaptation_${rowNumber}` }
                ]
            ]
        }
    };

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...opts });
    } catch (error) {
        console.error('Error sending adaptation approval request:', error);
    }
}

// Legacy function for backward compatibility
export async function sendApprovalRequest(source: string, translation: string, rowNumber: number) {
    return sendTranslationApprovalRequest(source, translation, rowNumber);
}
