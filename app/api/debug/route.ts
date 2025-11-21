import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';

    let cleaned = rawKey;
    // Remove wrapping quotes if they exist
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    // Replace literal \n with actual newline
    cleaned = cleaned.replace(/\\n/g, '\n');

    return NextResponse.json({
        status: rawKey ? 'Key Found' : 'Key Missing',
        rawLength: rawKey.length,
        cleanedLength: cleaned.length,
        startsWithHeader: cleaned.startsWith('-----BEGIN PRIVATE KEY-----'),
        endsWithFooter: cleaned.endsWith('-----END PRIVATE KEY-----'),
        containsEscapedNewline: rawKey.includes('\\n'),
        containsRealNewline: cleaned.includes('\n'),
        first20: cleaned.substring(0, 20),
        last20: cleaned.substring(cleaned.length - 20),
    });
}
