import React from "react";

export default function Index({ actes = [] }) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Actes Liturgiques - Admin</h1>
            <p className="text-sm text-gray-600 mb-4">
                Module branché. Total actes: {actes.length}
            </p>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(actes, null, 2)}
            </pre>
        </div>
    );
}
