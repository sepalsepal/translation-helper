import { NextResponse } from 'next/server';
import { findFolder, createFolder, createSpreadsheet } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { projectName } = await request.json();

        if (!projectName) {
            return NextResponse.json(
                { error: 'Project name is required' },
                { status: 400 }
            );
        }

        // 1. Find or create root folder 'TransAuto'
        let rootFolder = await findFolder('TransAuto');
        let rootFolderId = rootFolder?.id;

        if (!rootFolderId) {
            rootFolderId = await createFolder('TransAuto');
        }

        if (!rootFolderId) {
            throw new Error('Failed to find or create root folder');
        }

        // 2. Create project folder
        const projectFolderId = await createFolder(projectName, rootFolderId);
        if (!projectFolderId) {
            throw new Error('Failed to create project folder');
        }

        // 3. Create spreadsheet inside project folder
        const spreadsheetName = `${projectName}_Trans`;
        const spreadsheetId = await createSpreadsheet(spreadsheetName, projectFolderId);

        return NextResponse.json({
            success: true,
            projectId: projectFolderId,
            spreadsheetId,
            projectName,
        });

    } catch (error: any) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
