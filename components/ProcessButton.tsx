'use client';

import { useState } from 'react';

export default function ProcessButton() {
    const [loading, setLoading] = useState(false);

    const handleProcess = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/process', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            const data = await res.json();
            alert(JSON.stringify(data, null, 2));
        } catch (error) {
            alert('Error: ' + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleProcess}
            disabled={loading}
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 text-left disabled:opacity-50"
        >
            <h2 className="mb-3 text-2xl font-semibold">
                {loading ? 'Processing...' : 'Start Translation'}{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                    -&gt;
                </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
                Trigger AI translation for new rows and send notifications.
            </p>
        </button>
    );
}
