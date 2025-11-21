import FileUpload from '@/components/FileUpload';

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                        AI Translation Helper
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
                        Upload your document and let AI translate it with professional quality
                    </p>
                </div>

                {/* Main Upload Area */}
                <div className="max-w-4xl mx-auto">
                    <FileUpload />
                </div>

                {/* Features */}
                <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Easy Upload</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Drag & drop or paste URL
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">AI Powered</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            GPT-4o translation engine
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Quality Control</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            3-stage approval workflow
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
