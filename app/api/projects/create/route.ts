import { NextResponse } from 'next/server';
import { createFolder, createSpreadsheet, findFolder, shareFolder } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        console.log('[v1.6] Project creation request received');
        const { projectName } = await request.json();

        if (!projectName) {
            return NextResponse.json(
                { error: 'Project name is required' },
                { status: 400 }
            );
        }

        // 1. Find or create root folder 'TransAuto'
        console.log('[v1.7] Finding root folder...');
        let rootFolder = await findFolder('TransAuto');
        let rootFolderId = rootFolder?.id || undefined;

        if (!rootFolderId) {
            console.log('[v1.7] Creating root folder...');
            const newRoot = await createFolder('TransAuto');
            if (!newRoot.id) throw new Error('Failed to create root folder');
            rootFolderId = newRoot.id;
        }
        console.log('[v1.7] Root folder ID:', rootFolderId);

        if (!rootFolderId) {
            throw new Error('Failed to find or create root folder');
        }

        // 2. Create project folder
        console.log('[v1.7] Creating project folder:', projectName);
        const projectFolder = await createFolder(projectName, rootFolderId);
        const projectFolderId = projectFolder.id;

        if (!projectFolderId) {
            throw new Error('Failed to create project folder');
        }
        console.log('[v1.7] Project folder created:', projectFolderId);

        // Make folder accessible to user (public link)
        console.log('[v1.7] Sharing folder...');
        await shareFolder(projectFolderId);

        // 3. Create spreadsheet inside project folder
        const spreadsheetName = `${projectName}_Trans`;
        console.log('[v1.7] Creating spreadsheet:', spreadsheetName);
        let spreadsheetId: string | undefined;
        try {
            spreadsheetId = await createSpreadsheet(spreadsheetName, projectFolderId);
            console.log('[v1.7] Spreadsheet created');
        } catch (sheetError) {
            console.error('[v1.7] Failed to create spreadsheet:', sheetError);
            // We don't block project creation if sheet fails, but we should probably let the user know?
            // For now, let's just log it.
        }

        return NextResponse.json({
            success: true,
            projectId: projectFolderId,
            spreadsheetId,
            projectName: projectName,
            webViewLink: projectFolder.webViewLink
        });

    } catch (error: any) {
        console.error('[v1.7] Project creation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
