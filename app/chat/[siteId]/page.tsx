"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { file: string; page: number; content: string }[];
}

interface ChatLog {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
}

export default function ChatPage() {
  const { siteId } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [expandedSources, setExpandedSources] = useState<number | null>(null);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const currentInput = input;
    const userMessage: Message = { role: "user", content: currentInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentInput,
          site_id: Number(siteId),
        }),
      });
      const data = await res.json();
      const answer = data.answer;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer, sources: data.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "서버 연결에 실패했습니다." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // **굵게** 마크다운 렌더링
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className={line.startsWith("*") ? "mt-1" : ""}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
          )}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-500 text-lg">
          ←
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-800">현장 AI 에이전트</h1>
          <p className="text-xs text-gray-400">문서 기반 AI 답변</p>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-600">
          ☰ 대화기록
        </button>
      </header>

      {/* 대화 기록 드로어 */}
      {showHistory && (
        <div className="absolute inset-0 z-20 flex">
          <div className="w-72 bg-white h-full shadow-xl p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">대화 기록</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400">
                ✕
              </button>
            </div>
            {chatLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center mt-10">
                대화 기록이 없습니다
              </p>
            ) : (
              chatLogs.map((log) => (
                <div key={log.id} className="border-b py-3">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {log.question}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{log.createdAt}</p>
                </div>
              ))
            )}
          </div>
          <div
            className="flex-1 bg-black/30"
            onClick={() => setShowHistory(false)}
          />
        </div>
      )}

      {/* 전체 내용 모달 */}
      {expandedContent && (
        <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">출처 전체 내용</h3>
              <button
                onClick={() => setExpandedContent(null)}
                className="text-gray-400">
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {expandedContent}
            </p>
          </div>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
              🏗️
            </div>
            <p className="text-gray-500 text-sm">
              현장 문서에 대해 질문해보세요
            </p>
            <p className="text-gray-400 text-xs">예) 화장실은 어디에 있나요?</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-1">
                AI
              </div>
            )}
            <div
              className={`max-w-xs md:max-w-lg ${msg.role === "user" ? "" : "flex-1"}`}>
              <div
                className={`p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 shadow-sm rounded-tl-sm"
                }`}>
                {renderContent(msg.content)}
              </div>

              {/* 출처 카드 */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() =>
                      setExpandedSources(expandedSources === idx ? null : idx)
                    }
                    className="flex items-center gap-1 text-xs text-blue-500 font-medium">
                    <span>📎</span>
                    <span>근거 {msg.sources.length}건 보기</span>
                    <span>{expandedSources === idx ? "▲" : "▼"}</span>
                  </button>

                  {expandedSources === idx && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {msg.sources.map((source, i) => (
                        <div
                          key={i}
                          onClick={() => setExpandedContent(source.content)}
                          className="bg-white border border-gray-200 rounded-xl p-3 text-xs cursor-pointer hover:border-blue-300 hover:shadow-sm transition">
                          <p className="text-blue-600 font-semibold truncate">
                            📄 {source.file}
                          </p>
                          <p className="text-gray-400 text-xs mb-1">
                            {source.page}페이지
                          </p>
                          <p className="text-gray-500 line-clamp-3 leading-relaxed">
                            {source.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
              AI
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2 items-end">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing)
                sendMessage();
            }}
            placeholder="예) 화장실은 어디에 있나요?"
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-500 text-white w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 flex-shrink-0">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
