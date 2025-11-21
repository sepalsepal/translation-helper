import { NextResponse } from 'next/server';
import { updateSheetRow } from '@/lib/googleSheets';
import { sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, rowNumber, stage } = body;

        const sheetName = process.env.SHEET_NAME || '시트1';

        if (action === 'approve') {
            // Move to next stage
            let nextStage = '';
            let nextColumn = '';

            if (stage === 'CHAPTER_REVIEW') {
                // Approved chapter structure, start translation
                nextStage = 'TRANSLATION';
                await updateSheetRow(sheetName, rowNumber, 'E', 'TRANSLATION');

                // Trigger translation process
                // This will be handled by a separate process endpoint
                return NextResponse.json({
                    success: true,
                    message: 'Chapter approved. Starting translation...',
                    nextStage: 'TRANSLATION',
                });
            } else if (stage === 'TRANSLATION') {
                // Approved translation, start adaptation
                nextStage = 'ADAPTATION';
                await updateSheetRow(sheetName, rowNumber, 'E', 'ADAPTATION');

                return NextResponse.json({
                    success: true,
                    message: 'Translation approved. Starting adaptation...',
                    nextStage: 'ADAPTATION',
                });
            } else if (stage === 'ADAPTATION') {
                // Approved adaptation, mark as completed
                nextStage = 'COMPLETED';
                await updateSheetRow(sheetName, rowNumber, 'E', 'COMPLETED');

                return NextResponse.json({
                    success: true,
                    message: 'Adaptation approved. Chapter completed!',
                    nextStage: 'COMPLETED',
                });
            }
        } else if (action === 'reject') {
            // Mark as rejected and notify
            await updateSheetRow(sheetName, rowNumber, 'E', 'REJECTED');

            return NextResponse.json({
                success: true,
                message: 'Rejected. Please review manually.',
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('Approval Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
