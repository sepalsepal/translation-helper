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
        const projectName = formData.get('projectName') as string | null;
        let projectFolderId = formData.get('projectFolderId') as string | null;

        if ((!file && !url) || (!projectName && !projectFolderId)) {
            return NextResponse.json(
                { success: false, error: 'Missing file, URL, or Project details' },
                { status: 400 }
            );
        }

        // 1. Google Drive Integration
        const { findFolder, createFolder, uploadFile, createSpreadsheet } = await import('@/lib/googleDrive');

        // Find or Create Root Folder 'TransAuto'
        let rootFolder = await findFolder('TransAuto');
        let rootFolderId = rootFolder?.id || undefined;

        if (!rootFolderId) {
            console.log("Creating root 'TransAuto' folder...");
            const newRootId = await createFolder('TransAuto');
            if (!newRootId) throw new Error('Failed to create root folder');
            rootFolderId = newRootId;
        }

        // Get or Create Project Folder
        if (!projectFolderId && projectName) {
            console.log(`Creating project folder: ${projectName}`);
            projectFolderId = await createFolder(projectName, rootFolderId);
        } else if (projectFolderId) {
            console.log(`Using existing project folder ID: ${projectFolderId}`);
            // ... existing logic
            if (!projectName) {
                // ...
            }
        }

        if (!projectFolderId) {
            throw new Error('Failed to determine Project Folder ID');
        }

        // Upload Source File
        if (file) {
            console.log('Uploading source file to Drive...');
            const buffer = Buffer.from(await file.arrayBuffer());
            await uploadFile(file.name, buffer, file.type, projectFolderId as string);
        } else if (url) {
            console.log('Uploading source URL to Drive...');
            await uploadFile('source_url.txt', url, 'text/plain', projectFolderId as string);
        }

        // Create Translation Spreadsheet
        console.log('Creating translation spreadsheet...');
        const spreadsheetId = await createSpreadsheet(`${projectName} - Translation`, projectFolderId as string);
        console.log(`Spreadsheet created: ${spreadsheetId}`);

        // 2. Parse Document
        let text: string;
        if (file) {
            console.log('Parsing file:', file.name);
            text = await parseDocument(file);
        } else if (url) {
            console.log('Parsing URL:', url);
            text = await parseURL(url);
        } else {
            throw new Error('Invalid input');
        }

        // 3. Segment into chapters
        const chapters = segmentIntoChapters(text);
        console.log(`Segmented into ${chapters.length} chapters`);

        // 4. Write to Google Sheets (using new spreadsheetId)
        const sheetName = process.env.SHEET_NAME || '시트1';
        const startRow = 2;

        for (let i = 0; i < chapters.length; i++) {
            const rowNumber = startRow + i;
            const chapterText = chapters[i];

            // Write to Column A (Source)
            await updateSheetRow(sheetName, rowNumber, 'A', chapterText, spreadsheetId);

            // Set initial stage to 'CHAPTER_REVIEW' in Column E (Status)
            await updateSheetRow(sheetName, rowNumber, 'E', 'CHAPTER_REVIEW', spreadsheetId);
        }

        // 5. Apply formatting
        try {
            const { formatSheetStructure } = await import('@/lib/googleSheets');
            await formatSheetStructure(sheetName, spreadsheetId);
        } catch (fmtError) {
            console.error('Formatting error:', fmtError);
        }

        // 6. Send Telegram notification
        if (chapters.length > 0) {
            try {
                console.log('Attempting to send Telegram notification...');
                const { sendChapterReviewRequest } = await import('@/lib/telegram');
                await sendChapterReviewRequest(chapters[0], startRow, 0, spreadsheetId); // chapterIndex 0
                console.log('Telegram notification sent successfully');
            } catch (tgError) {
                console.error('Failed to send Telegram notification:', tgError);
            }
        }

        return NextResponse.json({
            success: true,
            chapterCount: chapters.length,
            spreadsheetId: spreadsheetId,
            message: `Successfully created project "${projectName}" and uploaded ${chapters.length} chapters.`,
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
