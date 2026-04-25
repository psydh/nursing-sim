"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Evaluation {
  id: string;
  evaluation_type: string;
  mse_content: string | null;
  result_text: string;
  score: number | null;
}

interface Session {
  id: string;
  student_id: string;
  student_name: string;
  case_id: string;
  conversation: Message[];
  started_at: string;
  ended_at: string | null;
  evaluations: Evaluation[];
}

const EVAL_LABELS: Record<string, string> = {
  mse: "MSE 사정 평가",
  communication: "치료적 의사소통 평가",
  procedure: "입퇴원 절차 설명 평가",
  intervention: "간호중재 평가",
  injection: "근육주사 간호행위 평가",
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, evaluations (*)")
        .eq("id", params.id)
        .single();

      if (!error && data) setSession(data as Session);
      setLoading(false);
    }
    fetchSession();
  }, [params.id]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  }

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">불러오는 중...</div>;
  if (!session) return <div className="p-8 text-center text-red-500 text-sm">세션을 찾을 수 없습니다.</div>;

  const totalAvg = session.evaluations.filter((e) => e.score != null).length > 0
    ? (session.evaluations.reduce((s, e) => s + (e.score ?? 0), 0) /
        session.evaluations.filter((e) => e.score != null).length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <button onClick={() => router.push("/")} className="text-gray-500 hover:text-gray-800 text-sm">
          ← 목록으로
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* 학생 정보 */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">학생 정보</h2>
            {totalAvg && (
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                parseFloat(totalAvg) >= 8 ? "bg-green-100 text-green-700" :
                parseFloat(totalAvg) >= 6 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                평균 {totalAvg}/10
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">학번</p>
              <p className="font-semibold text-gray-900">{session.student_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">이름</p>
              <p className="font-semibold text-gray-900">{session.student_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">케이스</p>
              <p className="font-semibold text-blue-600">{session.case_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">시작 시간</p>
              <p className="text-sm text-gray-700">{formatDate(session.started_at)}</p>
            </div>
          </div>
        </div>

        {/* 대화 기록 */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-800 mb-4">
            대화 기록 <span className="text-gray-400 font-normal text-sm">({session.conversation.length}개 메시지)</span>
          </h2>
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {session.conversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  <span className="text-xs opacity-60 block mb-1">
                    {msg.role === "user" ? "학생" : "환자"}
                  </span>
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 평가 결과 */}
        <div>
          <h2 className="font-semibold text-gray-800 text-base mb-3">평가 결과</h2>
          {session.evaluations.length === 0 ? (
            <div className="bg-white rounded-xl border p-5 text-center text-gray-400 text-sm">
              평가 결과가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {session.evaluations.map((ev) => (
                <div key={ev.id} className="bg-white rounded-xl border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">
                      {EVAL_LABELS[ev.evaluation_type] || ev.evaluation_type}
                    </h3>
                    {ev.score != null && (
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        ev.score >= 8 ? "bg-green-100 text-green-700" :
                        ev.score >= 6 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {ev.score}/10
                      </span>
                    )}
                  </div>
                  {ev.mse_content && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-700 mb-1">학생 작성 MSE</p>
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{ev.mse_content}</p>
                    </div>
                  )}
                  <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-base font-bold mt-4 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mt-4 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mt-3 mb-1">{children}</h3>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ol: ({ children }) => <ol className="list-decimal list-outside ml-5 space-y-2 my-2">{children}</ol>,
                        ul: ({ children }) => <ul className="list-disc list-outside ml-5 space-y-1 my-2">{children}</ul>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        p: ({ children }) => <p className="my-1">{children}</p>,
                      }}
                    >
                      {ev.result_text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
