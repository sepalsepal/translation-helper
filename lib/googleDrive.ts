import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Initialize auth - reuse the same credentials as Sheets
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file', // Allow creating/editing files created by the app
    'https://www.googleapis.com/auth/drive.readonly' // Allow reading files shared with the app
];

function getAuth() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error('Missing Google credentials');
    }

    return new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: SCOPES,
    });
}

export async function getDriveClient() {
    const auth = getAuth();
    return google.drive({ version: 'v3', auth });
}

/**
 * Find a folder by name within a parent folder (or root if not specified)
 */
export async function findFolder(name: string, parentId?: string) {
    const drive = await getDriveClient();
    const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false ${parentId ? `and '${parentId}' in parents` : ''}`;

    const res = await drive.files.list({
        q,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    return res.data.files?.[0] || null;
}

/**
 * Create a new folder
 */
export async function createFolder(name: string, parentId?: string) {
    const drive = await getDriveClient();
    const fileMetadata: any = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) {
        fileMetadata.parents = [parentId];
    }

    const file = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
    });

    return file.data.id;
}

/**
 * Upload a file to a specific folder
 */
export async function uploadFile(name: string, content: string | Buffer, mimeType: string, parentId: string) {
    const drive = await getDriveClient();

    // Create a readable stream if content is Buffer (optional, googleapis handles Buffer directly usually)
    // But for clarity and robustness:
    const media = {
        mimeType,
        body: content,
    };

    const fileMetadata = {
        name,
        parents: [parentId],
    };

    const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
    });

    return file.data.id;
}

/**
 * Create a new Google Sheet in a specific folder
 */
export async function createSpreadsheet(title: string, parentId: string) {
    // We use the Drive API to create a file with spreadsheet mimeType, 
    // or we can use Sheets API to create and then move it.
    // Using Sheets API create is easier for initialization, but moving is extra step.
    // Let's use Drive API to create an empty sheet or copy a template.

    // Actually, Sheets API 'create' doesn't easily allow specifying parent folder directly in one go.
    // Standard pattern: Create via Sheets API -> Get ID -> Move via Drive API.

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
            properties: {
                title,
            },
        },
        fields: 'spreadsheetId',
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) throw new Error('Failed to create spreadsheet');

    // Move to parent folder
    const drive = await getDriveClient();

    // 1. Get current parents (usually 'root')
    const file = await drive.files.get({
        fileId: spreadsheetId,
        fields: 'parents',
    });

    const previousParents = file.data.parents?.join(',') || '';

    // 2. Add new parent and remove old parents
    await drive.files.update({
        fileId: spreadsheetId,
        addParents: parentId,
        removeParents: previousParents,
        fields: 'id, parents',
    });

    return spreadsheetId;
}
