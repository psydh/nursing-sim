"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CASES } from "@/lib/cases";
import { supabase } from "@/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;
  const caseData = CASES[caseId];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const startedAt = useRef<string>(new Date().toISOString());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    if (sessionEnded) return;
    if (timeLeft <= 0) {
      endSession();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, sessionEnded]);

  const INIT_TRIGGER: Message = { role: "user", content: "안녕하세요. 저는 간호학생입니다." };

  async function streamToLast(msgs: Message[]) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, messages: msgs }),
      });

      if (!res.ok) throw new Error(`API 오류: ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantMsg += decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantMsg };
          return updated;
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다. 새로고침 해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  async function startSession() {
    setIsLoading(true);
    setError("");
    setMessages([{ role: "assistant", content: "" }]);
    await streamToLast([INIT_TRIGGER]);
  }

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);
    setError("");
    await streamToLast([INIT_TRIGGER, ...updatedMessages]);
  }

  async function endSession() {
    setSessionEnded(true);
    const sessionKey = `session_${caseId}_${Date.now()}`;
    localStorage.setItem(sessionKey, JSON.stringify(messages));

    const studentInfo = JSON.parse(localStorage.getItem("student_info") || "{}");
    const { data } = await supabase
      .from("sessions")
      .insert({
        student_id: studentInfo.student_id || "unknown",
        student_name: studentInfo.student_name || "unknown",
        case_id: caseId,
        conversation: messages,
        started_at: startedAt.current,
        ended_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const sessionId = data?.id || null;
    localStorage.setItem(`${sessionKey}_supabase_id`, sessionId || "");
    router.push(`/evaluate/${caseId}?sessionKey=${sessionKey}`);
  }

  if (!caseData) return <div className="p-8 text-center text-red-500">케이스를 찾을 수 없습니다.</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <button onClick={() => router.push("/")} className="text-gray-500 hover:text-gray-800 text-sm">
          ← 케이스 목록
        </button>
        <div className="flex flex-col items-center flex-1 mx-4">
          <h1 className="font-semibold text-gray-800 text-sm">{caseData.title}</h1>
          <span className={`text-sm font-mono font-bold mt-0.5 ${timeLeft <= 60 ? "text-red-500" : timeLeft <= 180 ? "text-orange-500" : "text-[#1a4a96]"}`}>
            {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
        </div>
        <button
          onClick={endSession}
          disabled={messages.length < 2}
          className="bg-red-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          대화 종료
        </button>
      </div>

      {/* 안내 배너 */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-xs text-blue-700 text-center">
        환자와 10분간 대화를 나누세요. 대화가 끝나면 &quot;대화 종료&quot; 버튼을 눌러 평가를 시작합니다.
      </div>
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700 text-center">
          {error}
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 mr-2 flex-shrink-0 mt-1">
                환자
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.content || (isLoading && i === messages.length - 1 ? "입력 중..." : "")}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white ml-2 flex-shrink-0 mt-1">
                나
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t px-4 py-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading || sessionEnded}
          className="flex-1 border rounded-full px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 disabled:bg-gray-100 disabled:text-gray-400"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim() || sessionEnded}
          className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          전송
        </button>
      </div>
    </div>
  );
}
