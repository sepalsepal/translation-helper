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

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export async function getSheetData(sheetName: string): Promise<TranslationItem[]> {
    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
        throw new Error('Missing Google Sheets credentials');
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: GOOGLE_CLIENT_EMAIL,
                private_key: GOOGLE_PRIVATE_KEY,
            },
            scopes: SCOPES,
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A2:E`, // Assuming Header is Row 1. A: Source, B: Trans, C: AI, D: Status
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

export async function updateSheetRow(sheetName: string, rowNumber: number, colIndex: string, value: string) {
    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
        throw new Error('Missing Google Sheets credentials');
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: GOOGLE_CLIENT_EMAIL,
                private_key: GOOGLE_PRIVATE_KEY,
            },
            scopes: SCOPES,
        });

        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!${colIndex}${rowNumber}`,
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

export async function formatSheetStructure(sheetName: string) {
    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
        throw new Error('Missing Google Sheets credentials');
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: GOOGLE_CLIENT_EMAIL,
                private_key: GOOGLE_PRIVATE_KEY,
            },
            scopes: SCOPES,
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Get sheetId first (needed for batchUpdate)
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        const sheet = spreadsheet.data.sheets?.find(
            (s) => s.properties?.title === sheetName
        );

        if (!sheet || !sheet.properties?.sheetId) {
            console.warn(`Sheet ${sheetName} not found, skipping formatting`);
            return;
        }

        const sheetId = sheet.properties.sheetId;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
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
    } catch (error) {
        console.error('Error formatting sheet:', error);
        // Don't throw here to avoid failing the whole upload if formatting fails
    }
}
