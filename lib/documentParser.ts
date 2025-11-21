// @ts-nocheck - Bypass type checking for external libraries
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const cheerio = require('cheerio');

export async function parseDocument(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
        return await parsePDF(buffer);
    } else if (fileName.endsWith('.docx')) {
        return await parseDOCX(buffer);
    } else if (fileName.endsWith('.txt')) {
        return buffer.toString('utf-8');
    } else {
        throw new Error('Unsupported file type');
    }
}

async function parsePDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to parse PDF file');
    }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        console.error('DOCX parsing error:', error);
        throw new Error('Failed to parse DOCX file');
    }
}

export async function parseURL(url: string): Promise<string> {
    try {
        // Check if it's a Google Drive URL
        if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) {
            throw new Error('Only Google Drive DOC/DOCX URLs are supported');
        }

        // Extract file ID from various Google Drive URL formats
        let fileId = '';

        // Format: https://drive.google.com/file/d/FILE_ID/view
        const driveMatch = url.match(/\/file\/d\/([^\/]+)/);
        if (driveMatch) {
            fileId = driveMatch[1];
        }

        // Format: https://docs.google.com/document/d/FILE_ID/edit
        const docsMatch = url.match(/\/document\/d\/([^\/]+)/);
        if (docsMatch) {
            fileId = docsMatch[1];
        }

        if (!fileId) {
            throw new Error('Could not extract file ID from Google Drive URL');
        }

        // Convert to export URL (plain text format)
        const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`;

        const response = await fetch(exportUrl);

        if (!response.ok) {
            throw new Error('Failed to access Google Drive document. Make sure the document is publicly accessible or shared.');
        }

        const text = await response.text();
        return text;
    } catch (error: any) {
        console.error('Google Drive parsing error:', error);
        throw new Error(error.message || 'Failed to fetch content from Google Drive');
    }
}
