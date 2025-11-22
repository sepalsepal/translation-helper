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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            {/* Project Selection Section */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Project Selection</h3>

                {/* Toggle */}
                <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button
                        onClick={() => setProjectMode('new')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${projectMode === 'new'
                                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        ✨ New Project
                    </button>
                    <button
                        onClick={() => setProjectMode('existing')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${projectMode === 'existing'
                                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        📂 Existing Project
                    </button>
                </div>

                {/* Inputs */}
                {projectMode === 'new' ? (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            New Project Name
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g., Marketing Brochure Q4"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Select Existing Project
                        </label>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            disabled={isLoadingProjects}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <option value="">Select a project...</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                        {isLoadingProjects && <p className="text-xs text-slate-500 mt-1">Loading projects...</p>}
                    </div>
                )}
            </div>

            <hr className="border-slate-200 dark:border-slate-700 my-8" />

            {/* Mode Selector (File/URL) */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setMode('file')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${mode === 'file'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                >
                    📄 Upload File
                </button>
                <button
                    onClick={() => setMode('url')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${mode === 'url'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
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
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                        }`}
                >
                    {file ? (
                        <div className="space-y-4">
                            <div className="text-6xl">📄</div>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{file.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="text-sm text-red-600 dark:text-red-400 hover:underline"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-6xl mb-4">📁</div>
                            <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                                Drag & drop your file here
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                or
                            </p>
                            <label className="inline-block">
                                <input
                                    type="file"
                                    onChange={handleFileSelect}
                                    accept=".pdf,.docx,.txt"
                                    className="hidden"
                                />
                                <span className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700 transition-colors inline-block">
                                    Choose File
                                </span>
                            </label>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
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
                        placeholder="https://docs.google.com/document/d/YOUR_DOC_ID/edit"
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enter a Google Drive DOC/DOCX URL (document must be publicly accessible or shared)
                    </p>
                </div>
            )}
            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={uploading || (!file && !url) || (projectMode === 'new' ? !projectName.trim() : !selectedProjectId)}
                className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
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
