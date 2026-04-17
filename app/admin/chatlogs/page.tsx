"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ChatLog {
  id: number;
  siteName: string;
  username: string;
  question: string;
  answer: string;
  createdAt: string;
}

export default function ChatLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    // Mock 데이터
    setLogs([
      {
        id: 1,
        siteName: "A현장",
        username: "홍길동",
        question: "화장실 위치가 어디에요?",
        answer: "3층에 있습니다.",
        createdAt: "2026-04-17",
      },
      {
        id: 2,
        siteName: "B현장",
        username: "김철수",
        question: "안전모 착용 규정은?",
        answer: "작업 시 항상 착용해야 합니다.",
        createdAt: "2026-04-17",
      },
    ]);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white text-gray-800 p-4 flex items-center gap-3 border-b border-gray-200">
        <button onClick={() => router.back()} className="text-gray-600">
          ←
        </button>
        <div>
          <h1 className="font-bold text-sm">대화 내용 조회</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
              <div>
                <p className="text-sm font-semibold">{log.username}</p>
                <p className="text-xs text-gray-400">
                  {log.siteName} · {log.createdAt}
                </p>
              </div>
              <span className="text-gray-400">
                {expanded === log.id ? "▲" : "▼"}
              </span>
            </div>
            {expanded === log.id && (
              <div className="mt-3 border-t pt-3 space-y-2">
                <div className="bg-blue-50 rounded-lg p-2 text-sm">
                  <p className="text-xs text-gray-400 mb-1">질문</p>
                  <p>{log.question}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-sm">
                  <p className="text-xs text-gray-400 mb-1">답변</p>
                  <p>{log.answer}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
