import { NextResponse } from 'next/server';
import { parseDocument, parseURL } from '@/lib/documentParser';
import { segmentIntoChapters } from '@/lib/chapterSegmenter';
import { getSheetData, updateSheetRow } from '@/lib/googleSheets';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const url = formData.get('url') as string | null;

        if (!file && !url) {
            return NextResponse.json(
                { success: false, error: 'No file or URL provided' },
                { status: 400 }
            );
        }

        // Parse document
        let text: string;
        if (file) {
            console.log('Parsing file:', file.name);
            text = await parseDocument(file);
        } else if (url) {
            console.log('Parsing URL:', url);
            text = await parseURL(url);
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid input' },
                { status: 400 }
            );
        }

        // Segment into chapters
        const chapters = segmentIntoChapters(text);
        console.log(`Segmented into ${chapters.length} chapters`);

        // Get sheet name from env or use default
        const sheetName = process.env.SHEET_NAME || '시트1';

        // Clear existing data (optional - comment out if you want to append)
        // For now, we'll append starting from row 2

        // Write chapters to Google Sheets
        const startRow = 2; // Assuming row 1 is header
        for (let i = 0; i < chapters.length; i++) {
            const rowNumber = startRow + i;
            const chapterText = chapters[i];

            // Write to Column A (Source)
            await updateSheetRow(sheetName, rowNumber, 'A', chapterText);

            // Set initial stage to 'CHAPTER_REVIEW' in Column E (Status)
            await updateSheetRow(sheetName, rowNumber, 'E', 'CHAPTER_REVIEW');
        }

        // Apply formatting (Column A width 500 + Wrap)
        try {
            const { formatSheetStructure } = await import('@/lib/googleSheets');
            await formatSheetStructure(sheetName);
        } catch (fmtError) {
            console.error('Formatting error:', fmtError);
        }

        // Send Telegram notification for first chapter review
        if (chapters.length > 0) {
            try {
                console.log('Attempting to send Telegram notification...');
                const { sendChapterReviewRequest } = await import('@/lib/telegram');
                await sendChapterReviewRequest(chapters[0], startRow, 1);
                console.log('Telegram notification sent successfully');
            } catch (tgError) {
                console.error('Failed to send Telegram notification:', tgError);
            }
        }

        return NextResponse.json({
            success: true,
            chapterCount: chapters.length,
            message: `Successfully uploaded and segmented into ${chapters.length} chapters. Chapter review request sent to Telegram.`,
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
