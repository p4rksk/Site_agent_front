"use client";

import { useState } from "react";

interface Source {
  page: number;
  file: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://site-agent.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "서버 연결에 실패했습니다." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (filename: string) => {
    const response = await fetch(
      `https://site-agent.onrender.com/download/${filename}`,
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white p-4 text-center font-bold text-xl">
        현장 안전수칙 AI 에이전트
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-10">
            현장 안전수칙에 대해 질문해보세요!
          </p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-lg text-sm ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-800 shadow"
              }`}>
              {msg.content}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  {msg.sources.map((source, i) => (
                    <button
                      key={i}
                      onClick={() => downloadPdf(source.file)}
                      className="underline">
                      📄 {source.file} {source.page}페이지
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg shadow text-gray-400 text-sm">
              답변 생성 중...
            </div>
          </div>
        )}
      </div>

      {/* 입력창 */}
      <div className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="질문을 입력하세요..."
          className="flex-1 border rounded-full px-4 py-2 text-sm outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm disabled:opacity-50">
          전송
        </button>
      </div>
    </div>
  );
}
