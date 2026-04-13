"use client";

import { useState } from "react";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadPdf = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    try {
      const response = await fetch(
        "https://site-agent.onrender.com/upload-pdf",
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json();
      setMessage(data.message);
    } catch {
      setMessage("업로드 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-green-600 text-white p-4 text-center font-bold text-xl">
        관리자 - PDF 업로드
      </header>

      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-4">
        <div className="bg-white p-6 rounded-lg shadow w-full max-w-md">
          <p className="text-sm text-gray-500 mb-4">
            현장 안전수칙 PDF 파일을 업로드하세요.
          </p>

          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border rounded p-2 text-sm mb-4"
          />

          <button
            onClick={uploadPdf}
            disabled={!file || loading}
            className="w-full bg-green-600 text-white py-2 rounded text-sm disabled:opacity-50">
            {loading ? "업로드 중..." : "업로드"}
          </button>

          {message && (
            <p className="mt-4 text-sm text-center text-green-700">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
