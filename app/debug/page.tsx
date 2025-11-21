'use client';
import { useState, useEffect } from 'react';

export default function DebugPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/debug').then(res => res.json()).then(setData);
    }, []);

    if (!data) return <div className="p-10">Loading debug info...</div>;

    return (
        <div className="p-10 font-mono max-w-3xl mx-auto">
            <h1 className="text-2xl mb-6 font-bold">System Diagnosis</h1>

            <div className="bg-gray-100 p-6 rounded-lg shadow-sm mb-6">
                <h2 className="text-xl mb-4 border-b pb-2">Private Key Check</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="font-semibold">Status:</div>
                    <div className={data.status === 'Key Found' ? 'text-green-600' : 'text-red-600'}>{data.status}</div>

                    <div className="font-semibold">Starts with Header:</div>
                    <div className={data.startsWithHeader ? 'text-green-600' : 'text-red-600'}>
                        {data.startsWithHeader ? 'YES (Correct)' : 'NO (Error)'}
                    </div>

                    <div className="font-semibold">Ends with Footer:</div>
                    <div className={data.endsWithFooter ? 'text-green-600' : 'text-red-600'}>
                        {data.endsWithFooter ? 'YES (Correct)' : 'NO (Error)'}
                    </div>

                    <div className="font-semibold">Line Breaks:</div>
                    <div>
                        {data.containsRealNewline ? 'Detected (Good)' : 'Not Detected (Bad)'}
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 text-zinc-100 p-6 rounded-lg overflow-auto">
                <h3 className="text-sm text-zinc-400 mb-2">Raw Debug Data</h3>
                <pre className="text-xs">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
}
