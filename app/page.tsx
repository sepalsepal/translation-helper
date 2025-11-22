import FileUpload from '@/components/FileUpload';

export default function Home() {
    return (
        <main className="min-h-screen bg-line-gray">
            {/* Header / Navigation Bar Style */}
            <header className="bg-line-green text-white py-4 px-6 shadow-sm sticky top-0 z-10">
                <div className="container mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-wide">Translation Helper</h1>
                    <div className="text-sm font-medium opacity-90">AI Powered</div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Hero Section */}
                <div className="text-center mb-10 pt-8">
                    <h2 className="text-3xl font-bold text-line-dark mb-3">
                        Document Translation
                    </h2>
                    <p className="text-gray-500">
                        Simple, fast, and accurate translations powered by AI.
                    </p>
                </div>

                {/* Main Upload Area */}
                <div className="mb-12">
                    <FileUpload />
                </div>

                {/* Features - LINE Style Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center text-line-green">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-line-dark text-sm mb-1">Easy Upload</h3>
                        <p className="text-xs text-gray-400">Drag & drop or URL</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center text-line-green">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-line-dark text-sm mb-1">AI Powered</h3>
                        <p className="text-xs text-gray-400">GPT-4o Engine</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center text-line-green">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-line-dark text-sm mb-1">Quality Control</h3>
                        <p className="text-xs text-gray-400">3-stage workflow</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
