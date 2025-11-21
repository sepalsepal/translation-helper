import { NextResponse } from 'next/server';
import { getSheetData, updateSheetRow } from '@/lib/googleSheets';
import { translateText } from '@/lib/openai';
import { sendApprovalRequest } from '@/lib/telegram';

export const maxDuration = 60; // Allow longer timeout for AI/Sheets operations (Vercel specific)
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const defaultSheetName = process.env.SHEET_NAME || '시트1';
        const { sheetName = defaultSheetName } = await request.json();

        // 1. Read Data
        const rows = await getSheetData(sheetName);

        // 2. Filter for rows that need translation
        // Condition: Source exists, Translation is empty, Status is not 'APPROVED'
        const targetRows = rows.filter(row =>
            row.sourceText &&
            !row.translatedText &&
            row.status !== 'APPROVED'
        );

        if (targetRows.length === 0) {
            return NextResponse.json({ message: 'No new rows to translate.' });
        }

        // 3. Process each row (Limit to 3 for safety/demo purposes)
        const processed = [];
        for (const row of targetRows.slice(0, 3)) {
            // AI Translation
            const translated = await translateText(row.sourceText);

            // Update Sheet with "Draft" translation (Optional: or just keep in memory)
            // Let's write it to the 'AI Washing' column (Column C) for now, or Column B if that's the target.
            // Based on user screenshot: Col A=Source, Col B=Trans, Col C=AI.
            // Let's assume we write to Col B (Trans) as a draft.
            await updateSheetRow(sheetName, row.rowNumber, 'B', translated);

            // Send Telegram Notification
            await sendApprovalRequest(row.sourceText, translated, row.rowNumber);

            processed.push({
                row: row.rowNumber,
                source: row.sourceText,
                translated
            });
        }

        return NextResponse.json({
            success: true,
            processedCount: processed.length,
            processed
        });

    } catch (error: any) {
        console.error('Process Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
