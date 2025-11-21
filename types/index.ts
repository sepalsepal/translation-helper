export type WorkflowStage = 'CHAPTER_REVIEW' | 'TRANSLATION' | 'ADAPTATION' | 'COMPLETED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TranslationItem {
    rowNumber: number;
    sourceText: string;
    translatedText: string;
    aiWashedText: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EMPTY';
}

export interface ChapterItem {
    chapterNumber: number;
    rowNumber: number;
    sourceText: string;
    translatedText?: string;
    adaptedText?: string;
    stage: WorkflowStage;
    approvalStatus: ApprovalStatus;
}

export interface SheetConfig {
    spreadsheetId: string;
    sheetName: string;
}
