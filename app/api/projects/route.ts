import { NextResponse } from 'next/server';
import { findFolder, listFolders } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const rootFolder = await findFolder('TransAuto');
        if (!rootFolder || !rootFolder.id) {
            return NextResponse.json({ projects: [] });
        }

        const projects = await listFolders(rootFolder.id);
        return NextResponse.json({ projects });
    } catch (error: any) {
        console.error('Error fetching projects:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
