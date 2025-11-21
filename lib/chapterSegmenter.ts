export function segmentIntoChapters(text: string): string[] {
    // Split by paragraphs (double newlines or single newlines)
    const paragraphs = text
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    const chapters: string[] = [];
    let currentChapter = '';
    let sentenceCount = 0;

    for (const paragraph of paragraphs) {
        // Split paragraph into sentences (simple approach)
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            currentChapter += (currentChapter ? ' ' : '') + trimmedSentence;
            sentenceCount++;

            // Group 2-3 sentences together
            if (sentenceCount >= 2 && sentenceCount <= 3) {
                // Check if next sentence would make it too long
                const nextSentenceIndex = sentences.indexOf(sentence) + 1;
                if (nextSentenceIndex >= sentences.length || sentenceCount === 3) {
                    chapters.push(currentChapter);
                    currentChapter = '';
                    sentenceCount = 0;
                }
            }
        }
    }

    // Add remaining content
    if (currentChapter.trim()) {
        chapters.push(currentChapter.trim());
    }

    return chapters;
}

export function estimateChapterCount(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return Math.ceil(sentences.length / 2.5); // Average 2.5 sentences per chapter
}
