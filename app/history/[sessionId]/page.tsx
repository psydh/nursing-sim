"use client";

export const dynamic = "force-dynamic";

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

const CASE_TITLES: Record<string, string> = {
  "mse-1": "조현병 환자의 정신 상태 사정",
  "mse-2": "조울증 환자의 기분 상태 평가",
  "mse-3": "자살 위험이 높은 환자의 긴급 평가",
  "admit-1": "강제 입원 환자의 권리 보호",
  "admit-2": "자발적 입원 환자의 퇴원 계획 수립",
  "admit-3": "퇴원 후 지역사회 연계",
  "nursing-1": "병식 없는 환자의 약물 거부",
  "nursing-2": "자해 위험이 있는 환자의 안전 확보",
  "nursing-3": "근육주사: 정신적 동요 관리",
  "nursing-4": "근육주사: 환자 불안 관리 후 진정제 투여",
};

const EVAL_LABELS: Record<string, string> = {
  mse: "MSE 사정 평가",
  communication: "치료적 의사소통 평가",
  procedure: "입퇴원 절차 설명 평가",
  intervention: "간호중재 평가",
  injection: "근육주사 간호행위 평가",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function scoreColor(score: number) {
  if (score >= 8) return "bg-green-100 text-green-700";
  if (score >= 6) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, evaluations(*)")
        .eq("id", params.sessionId)
        .single();

      if (!error && data) setSession(data as Session);
      setLoading(false);
    }
    fetchSession();
  }, [params.sessionId]);

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">불러오는 중...</div>;
  if (!session) return <div className="p-8 text-center text-red-500 text-sm">세션을 찾을 수 없습니다.</div>;

  const scored = session.evaluations.filter((e) => e.score != null);
  const totalAvg = scored.length > 0
    ? (scored.reduce((s, e) => s + (e.score ?? 0), 0) / scored.length).toFixed(1)
    : null;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-expand { max-height: none !important; overflow: visible !important; }
          body { background: white; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white border-b px-6 py-4 no-print">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button onClick={() => router.push("/history")} className="text-gray-500 hover:text-gray-800 text-sm">
              ← 내 학습 기록
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              인쇄하기
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-6 space-y-6">
          {/* 인쇄용 제목 */}
          <div className="hidden print:block text-center pb-4 border-b">
            <h1 className="text-xl font-bold">정신간호 시뮬레이션 결과</h1>
            <p className="text-sm text-gray-500 mt-1">{formatDate(session.started_at)}</p>
          </div>

          {/* 학생 정보 */}
          <div className="bg-white rounded-xl border p-5 print-page">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">학생 정보</h2>
              {totalAvg && (
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColor(parseFloat(totalAvg))}`}>
                  평균 {totalAvg}/10
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
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
                <p className="font-medium text-gray-800">{CASE_TITLES[session.case_id] || session.case_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">시작 시간</p>
                <p className="text-gray-700">{formatDate(session.started_at)}</p>
              </div>
            </div>
          </div>

          {/* 대화 기록 */}
          <div className="bg-white rounded-xl border p-5 print-page">
            <h2 className="font-semibold text-gray-800 mb-4">
              대화 기록
              <span className="text-gray-400 font-normal text-sm ml-2">({session.conversation.length}개 메시지)</span>
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 print-expand">
              {session.conversation.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${
                    msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
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
          {session.evaluations.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">평가 결과</h2>
              <div className="space-y-4">
                {session.evaluations.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-xl border p-5 print-page">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">
                        {EVAL_LABELS[ev.evaluation_type] || ev.evaluation_type}
                      </h3>
                      {ev.score != null && (
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColor(ev.score)}`}>
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
            </div>
          )}

          <div className="no-print pb-4">
            <button
              onClick={() => window.print()}
              className="w-full border-2 border-blue-200 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              인쇄하기
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
