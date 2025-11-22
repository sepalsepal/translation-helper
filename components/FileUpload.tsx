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
            alert('PDF, DOCX, TXT 파일만 업로드 가능합니다.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('파일 크기는 10MB 이하여야 합니다.');
            return;
        }

        setFile(file);
    };

    const [isCreatingProject, setIsCreatingProject] = useState(false);

    // ... (existing useEffect)

    const handleCreateProject = async () => {
        if (!projectName.trim()) {
            alert('프로젝트 이름을 입력해주세요.');
            return;
        }

        setIsCreatingProject(true);
        try {
            const createRes = await fetch('/api/projects/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectName: projectName.trim() }),
            });
            const createData = await createRes.json();

            if (!createData.success) {
                throw new Error(createData.error || '프로젝트 생성 실패');
            }

            let successMsg = `프로젝트 "${createData.projectName}"가 생성되었습니다!`;
            if (createData.webViewLink) {
                successMsg += `\n\n구글 드라이브 링크: ${createData.webViewLink}`;
                // Open link in new tab for convenience
                window.open(createData.webViewLink, '_blank');
            }
            alert(successMsg);

            // Refresh projects and select the new one
            const res = await fetch('/api/projects');
            const data = await res.json();
            if (data.projects) {
                setProjects(data.projects);
                setSelectedProjectId(createData.projectId);
                setProjectMode('existing'); // Switch to existing mode
                setProjectName(''); // Clear input
            }
        } catch (error: any) {
            alert('프로젝트 생성 실패: ' + error.message);
        } finally {
            setIsCreatingProject(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCreateProject();
        }
    };

    // ... (existing handlers: handleDragOver, handleDragLeave, handleDrop, handleFileSelect, validateAndSetFile)

    const handleUpload = async () => {
        // Validation
        if (projectMode === 'new') {
            alert('먼저 프로젝트를 생성해주세요.');
            return;
        }
        if (!selectedProjectId) {
            alert('프로젝트를 선택해주세요.');
            return;
        }

        if (!file && !url) {
            alert('파일을 선택하거나 URL을 입력해주세요.');
            return;
        }

        setUploading(true);
        try {
            const selectedProject = projects.find(p => p.id === selectedProjectId);
            const targetProjectName = selectedProject ? selectedProject.name : '';

            // Upload File
            const formData = new FormData();
            formData.append('projectFolderId', selectedProjectId);
            formData.append('projectName', targetProjectName);

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
                alert(`성공! ${data.chapterCount}개의 챕터가 처리되었습니다.`);
                // Optional: Reset file/url state
                setFile(null);
                setUrl('');
            } else {
                alert(`오류: ${data.error}`);
            }
        } catch (error: any) {
            alert('작업 실패: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            {/* Project Selection Section */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-line-dark mb-4 uppercase tracking-wider">프로젝트 선택</h3>

                {/* Toggle */}
                <div className="flex gap-2 mb-4 bg-line-gray p-1 rounded-xl">
                    <button
                        onClick={() => setProjectMode('new')}
                        className={`flex-1 py-2.5 px-2 md:px-4 rounded-lg text-xs md:text-sm font-bold transition-all ${projectMode === 'new'
                            ? 'bg-white text-line-green shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        ✨ 새 프로젝트
                    </button>
                    <button
                        onClick={() => setProjectMode('existing')}
                        className={`flex-1 py-2.5 px-2 md:px-4 rounded-lg text-xs md:text-sm font-bold transition-all ${projectMode === 'existing'
                            ? 'bg-white text-line-green shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        📂 기존 프로젝트
                    </button>
                </div>

                {/* Inputs */}
                {projectMode === 'new' ? (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">
                            새 프로젝트 이름
                        </label>
                        <div className="flex gap-2 flex-col md:flex-row">
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="예: 마케팅 브로슈어 Q4"
                                className="flex-1 px-4 py-3.5 border-0 bg-line-gray rounded-xl text-line-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-line-green transition-all"
                            />
                            <button
                                type="button"
                                onClick={handleCreateProject}
                                disabled={isCreatingProject || !projectName.trim()}
                                className="px-6 py-3.5 bg-zinc-800 text-white rounded-xl font-bold text-sm hover:bg-black disabled:opacity-50 transition-all whitespace-nowrap shadow-sm"
                            >
                                {isCreatingProject ? '생성 중...' : '생성'}
                            </button>
                        </div>
                        <div className="flex justify-between items-center mt-2 ml-1">
                            <p className="text-[10px] text-gray-400">
                                * 이름을 입력하고 엔터(Enter)를 누르거나 생성 버튼을 클릭하세요.
                            </p>
                            <span className="text-[10px] text-gray-300">v1.2</span>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">
                            기존 프로젝트 선택
                        </label>
                        <div className="relative">
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                disabled={isLoadingProjects}
                                className="w-full px-4 py-3.5 border-0 bg-line-gray rounded-xl text-line-dark focus:outline-none focus:ring-2 focus:ring-line-green appearance-none disabled:opacity-50 transition-all"
                            >
                                <option value="">프로젝트를 선택하세요...</option>
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
                        {isLoadingProjects && <p className="text-xs text-line-green mt-2 font-medium">프로젝트 목록 로딩 중...</p>}
                    </div>
                )}
            </div>

            <hr className="border-gray-100 my-8" />

            {/* Mode Selector (File/URL) */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setMode('file')}
                    className={`flex-1 py-3 px-2 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all border ${mode === 'file'
                        ? 'bg-line-green text-white border-line-green shadow-md shadow-green-100'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                >
                    📄 파일 업로드
                </button>
                <button
                    onClick={() => setMode('url')}
                    className={`flex-1 py-3 px-2 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all border ${mode === 'url'
                        ? 'bg-line-green text-white border-line-green shadow-md shadow-green-100'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                >
                    🔗 URL 입력
                </button>
            </div>

            {/* File Upload Mode */}
            {mode === 'file' && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 md:p-10 text-center transition-all ${isDragging
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
                                <p className="font-bold text-line-dark break-all">{file.name}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="text-xs font-bold text-red-500 hover:text-red-600 py-1 px-3 rounded-full hover:bg-red-50 transition-colors"
                            >
                                파일 삭제
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-line-gray rounded-full flex items-center justify-center text-2xl md:text-3xl mb-4 text-gray-400">
                                📁
                            </div>
                            <p className="text-sm md:text-base font-bold text-line-dark mb-2">
                                파일을 여기에 드래그하세요
                            </p>
                            <p className="text-xs md:text-sm text-gray-400 mb-6">
                                또는
                            </p>
                            <label className="inline-block">
                                <input
                                    type="file"
                                    onChange={handleFileSelect}
                                    accept=".pdf,.docx,.txt"
                                    className="hidden"
                                />
                                <span className="px-6 md:px-8 py-2.5 md:py-3 bg-line-dark text-white rounded-full font-bold text-xs md:text-sm cursor-pointer hover:bg-black transition-all shadow-lg shadow-gray-200 inline-block">
                                    파일 선택
                                </span>
                            </label>
                            <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-wide">
                                지원 형식: PDF, DOCX, TXT (최대 10MB)
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
                        Google Drive 문서 URL을 입력하세요 (공개 또는 공유된 문서)
                    </p>
                </div>
            )}
            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={uploading || (!file && !url) || !selectedProjectId}
                className="w-full mt-8 py-4 bg-line-green text-white rounded-xl font-bold text-lg hover:bg-[#05b34c] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-100 active:scale-[0.99]"
            >
                {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        처리 중...
                    </span>
                ) : (
                    '🚀 번역 시작'
                )}
            </button>
        </div>
    );
}
