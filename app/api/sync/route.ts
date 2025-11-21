import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // In a real app, you might pass the sheet name as a query param
        const sheetName = 'Foreword'; // Default for now based on your screenshot
        const data = await getSheetData(sheetName);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
