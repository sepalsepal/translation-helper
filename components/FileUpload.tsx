'use client';

import { useState, useCallback, useEffect } from 'react';

interface Project {
    id: string;
    name: string;
}

export default function FileUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [mode, setMode] = useState<'file' | 'url'>('file');

    // Project Selection State
    const [projectMode, setProjectMode] = useState<'new' | 'existing'>('new');
    const [projectName, setProjectName] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    // Fetch projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoadingProjects(true);
            try {
                const res = await fetch('/api/projects');
                const data = await res.json();
                if (data.projects) {
                    setProjects(data.projects);
                }
            } catch (error) {
                console.error('Failed to fetch projects', error);
            } finally {
                setIsLoadingProjects(false);
            }
        };
        fetchProjects();
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            validateAndSetFile(droppedFile);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    };

    const validateAndSetFile = (file: File) => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const validExtensions = ['.pdf', '.docx', '.txt'];

        const isValidType = validTypes.includes(file.type) || validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (!isValidType) {
            alert('Please upload a PDF, DOCX, or TXT file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File size must be less than 10MB');
            return;
        }

        setFile(file);
    };

    const handleUpload = async () => {
        if (projectMode === 'new' && !projectName.trim()) {
            alert('Please enter a Project Name');
            return;
        }
        if (projectMode === 'existing' && !selectedProjectId) {
            alert('Please select a Project');
            return;
        }

        if (!file && !url) {
            alert('Please select a file or enter a URL');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();

            if (projectMode === 'new') {
                formData.append('projectName', projectName.trim());
            } else {
                formData.append('projectFolderId', selectedProjectId);
                const selectedProject = projects.find(p => p.id === selectedProjectId);
                if (selectedProject) {
                    formData.append('projectName', selectedProject.name);
                }
            }

            if (mode === 'file' && file) {
                formData.append('file', file);
            } else if (mode === 'url' && url) {
                formData.append('url', url);
            }

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                alert(`Success! Processed ${data.chapterCount} chapters`);
                // Refresh projects list if new project was created
                if (projectMode === 'new') {
                    // Ideally re-fetch, but for now just alert
                }
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Upload failed: ' + error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            {/* Project Selection Section */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-line-dark mb-4 uppercase tracking-wider">Project Selection</h3>

                {/* Toggle */}
                <div className="flex gap-2 mb-4 bg-line-gray p-1 rounded-xl">
                    <button
                        onClick={() => setProjectMode('new')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${projectMode === 'new'
                            ? 'bg-white text-line-green shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        ✨ New Project
                    </button>
                    <button
                        onClick={() => setProjectMode('existing')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${projectMode === 'existing'
                            ? 'bg-white text-line-green shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        📂 Existing Project
                    </button>
                </div>

                {/* Inputs */}
                {projectMode === 'new' ? (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">
                            NEW PROJECT NAME
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g., Marketing Brochure Q4"
                            className="w-full px-4 py-3.5 border-0 bg-line-gray rounded-xl text-line-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-line-green transition-all"
                        />
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">
                            SELECT EXISTING PROJECT
                        </label>
                        <div className="relative">
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                disabled={isLoadingProjects}
                                className="w-full px-4 py-3.5 border-0 bg-line-gray rounded-xl text-line-dark focus:outline-none focus:ring-2 focus:ring-line-green appearance-none disabled:opacity-50 transition-all"
                            >
                                <option value="">Select a project...</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {isLoadingProjects && <p className="text-xs text-line-green mt-2 font-medium">Loading projects...</p>}
                    </div>
                )}
            </div>

            <hr className="border-gray-100 my-8" />

            {/* Mode Selector (File/URL) */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setMode('file')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border ${mode === 'file'
                        ? 'bg-line-green text-white border-line-green shadow-md shadow-green-100'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                >
                    📄 Upload File
                </button>
                <button
                    onClick={() => setMode('url')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border ${mode === 'url'
                        ? 'bg-line-green text-white border-line-green shadow-md shadow-green-100'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                >
                    🔗 Paste URL
                </button>
            </div>

            {/* File Upload Mode */}
            {mode === 'file' && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${isDragging
                        ? 'border-line-green bg-green-50'
                        : 'border-gray-200 hover:border-line-green hover:bg-gray-50'
                        }`}
                >
                    {file ? (
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-line-gray rounded-full flex items-center justify-center text-3xl">
                                📄
                            </div>
                            <div>
                                <p className="font-bold text-line-dark">{file.name}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="text-xs font-bold text-red-500 hover:text-red-600 py-1 px-3 rounded-full hover:bg-red-50 transition-colors"
                            >
                                Remove File
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 mx-auto bg-line-gray rounded-full flex items-center justify-center text-3xl mb-4 text-gray-400">
                                📁
                            </div>
                            <p className="text-base font-bold text-line-dark mb-2">
                                Drag & drop your file here
                            </p>
                            <p className="text-sm text-gray-400 mb-6">
                                or
                            </p>
                            <label className="inline-block">
                                <input
                                    type="file"
                                    onChange={handleFileSelect}
                                    accept=".pdf,.docx,.txt"
                                    className="hidden"
                                />
                                <span className="px-8 py-3 bg-line-dark text-white rounded-full font-bold text-sm cursor-pointer hover:bg-black transition-all shadow-lg shadow-gray-200 inline-block">
                                    Choose File
                                </span>
                            </label>
                            <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-wide">
                                Supported: PDF, DOCX, TXT (max 10MB)
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* URL Mode */}
            {mode === 'url' && (
                <div className="space-y-4">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://docs.google.com/document/d/..."
                        className="w-full px-4 py-4 border-0 bg-line-gray rounded-xl text-line-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-line-green transition-all"
                    />
                    <p className="text-xs text-gray-400 px-1">
                        Enter a Google Drive DOC/DOCX URL (must be publicly accessible)
                    </p>
                </div>
            )}
            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={uploading || (!file && !url) || (projectMode === 'new' ? !projectName.trim() : !selectedProjectId)}
                className="w-full mt-8 py-4 bg-line-green text-white rounded-xl font-bold text-lg hover:bg-[#05b34c] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-100 active:scale-[0.99]"
            >
                {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                    </span>
                ) : (
                    '🚀 Start Translation'
                )}
            </button>
        </div>
    );
}
