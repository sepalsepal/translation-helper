import { google } from 'googleapis';
import { TranslationItem } from '@/types';

// Environment variables for credentials
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Helper to clean the private key
const getCleanedKey = () => {
    const key = process.env.GOOGLE_PRIVATE_KEY;
    if (!key) return undefined;

    console.log('Raw Key Length:', key.length);

    let cleaned = key;
    // Remove wrapping quotes if they exist
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }

    // Replace literal \n with actual newline
    cleaned = cleaned.replace(/\\n/g, '\n');

    console.log('Cleaned Key Length:', cleaned.length);
    console.log('Starts with -----BEGIN:', cleaned.startsWith('-----BEGIN'));

    return cleaned;
};

const GOOGLE_PRIVATE_KEY = getCleanedKey();

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
];

const { JWT } = google.auth;

export async function getSheetData(sheetName: string, spreadsheetId?: string): Promise<TranslationItem[]> {
    const targetSpreadsheetId = spreadsheetId || SPREADSHEET_ID;

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !targetSpreadsheetId) {
        throw new Error('Missing Google Sheets credentials or Spreadsheet ID');
    }

    try {
        const auth = new JWT({
            email: GOOGLE_CLIENT_EMAIL,
            key: GOOGLE_PRIVATE_KEY,
            scopes: SCOPES,
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: targetSpreadsheetId,
            range: `${sheetName}!A:E`, // A: Source, B: Trans, C: Adapt, D: Final, E: Status
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return [];
        }

        return rows.map((row, index) => ({
            rowNumber: index + 2, // 1-based index, +1 for header
            sourceText: row[0] || '',
            translatedText: row[1] || '',
            aiWashedText: row[2] || '',
            status: 'PENDING', // Default status, logic to be refined
        }));
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        throw error;
    }
}

export async function updateSheetRow(sheetName: string, row: number, col: string, value: string, spreadsheetId?: string) {
    const targetSpreadsheetId = spreadsheetId || SPREADSHEET_ID;

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !targetSpreadsheetId) {
        throw new Error('Missing Google Sheets credentials');
    }

    try {
        const auth = new JWT({
            email: GOOGLE_CLIENT_EMAIL,
            key: GOOGLE_PRIVATE_KEY,
            scopes: SCOPES,
        });

        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.values.update({
            spreadsheetId: targetSpreadsheetId,
            range: `${sheetName}!${col}${row}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[value]],
            },
        });
    } catch (error) {
        console.error('Error updating sheet row:', error);
        throw error;
    }
}

export async function formatSheetStructure(sheetName: string, spreadsheetId?: string) {
    const targetSpreadsheetId = spreadsheetId || SPREADSHEET_ID;

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !targetSpreadsheetId) {
        throw new Error('Missing Google Sheets credentials');
    }

    const auth = new JWT({
        email: GOOGLE_CLIENT_EMAIL,
        key: GOOGLE_PRIVATE_KEY,
        scopes: SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get sheetId (gid) for the given sheetName
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: targetSpreadsheetId,
    });

    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) {
        console.error(`Sheet "${sheetName}" not found`);
        return;
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: targetSpreadsheetId,
        requestBody: {
            requests: [
                // Set Column A width to 500
                {
                    updateDimensionProperties: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'COLUMNS',
                            startIndex: 0, // Column A
                            endIndex: 1,
                        },
                        properties: {
                            pixelSize: 500,
                        },
                        fields: 'pixelSize',
                    },
                },
                // Enable text wrapping for Column A
                {
                    repeatCell: {
                        range: {
                            sheetId: sheetId,
                            startColumnIndex: 0,
                            endColumnIndex: 1,
                        },
                        cell: {
                            userEnteredFormat: {
                                wrapStrategy: 'WRAP',
                            },
                        },
                        fields: 'userEnteredFormat.wrapStrategy',
                    },
                },
            ],
        },
    });
    console.log('Sheet formatting applied');
}

export async function getRowData(sheetName: string, row: number, spreadsheetId?: string) {
    const targetSpreadsheetId = spreadsheetId || SPREADSHEET_ID;

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !targetSpreadsheetId) {
        throw new Error('Missing Google Sheets credentials');
    }

    const auth = new JWT({
        email: GOOGLE_CLIENT_EMAIL,
        key: GOOGLE_PRIVATE_KEY,
        scopes: SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: targetSpreadsheetId,
        range: `${sheetName}!A${row}:E${row}`,
    });

    const values = response.data.values?.[0];
    if (!values) return null;

    return {
        sourceText: values[0] || '',
        translatedText: values[1] || '',
        adaptedText: values[2] || '',
        finalText: values[3] || '',
        status: values[4] || '',
    };
} catch (error) {
    console.error('Error formatting sheet:', error);
    // Don't throw here to avoid failing the whole upload if formatting fails
}
}
