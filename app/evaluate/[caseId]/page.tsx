"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { CASES } from "@/lib/cases";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MSE_FIELDS = [
  { key: "appearance", label: "외모 및 행동 (Appearance & Behavior)" },
  { key: "speech", label: "언어 (Speech)" },
  { key: "mood", label: "기분 및 정동 (Mood & Affect)" },
  { key: "thought", label: "사고 과정 및 내용 (Thought Process & Content)" },
  { key: "perception", label: "지각 (Perception)" },
  { key: "cognition", label: "인지 (Cognition)" },
  { key: "insight", label: "병식 및 판단 (Insight & Judgment)" },
];

function EvaluateContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const caseId = params.caseId as string;
  const caseData = CASES[caseId];

  const sessionKey = searchParams.get("sessionKey") || "";
  const messages: Message[] = typeof window !== "undefined" && sessionKey
    ? JSON.parse(localStorage.getItem(sessionKey) || "[]")
    : JSON.parse(searchParams.get("session") || "[]");

  const [mseData, setMseData] = useState<Record<string, string>>({});
  const [evaluationResults, setEvaluationResults] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [loadingEval, setLoadingEval] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<"mse" | "results">("mse");

  function parseScore(text: string): number | null {
    const match = text.match(/총점:\s*(\d+)\s*\/\s*10/);
    return match ? parseInt(match[1]) : null;
  }

  function stripScore(text: string): string {
    return text.replace(/\n*총점:\s*\d+\s*\/\s*10\s*$/, "").trim();
  }

  const isMseCase = caseData?.category === "mse";

  async function runEvaluation(type: string) {
    setLoadingEval((prev) => ({ ...prev, [type]: true }));
    setEvaluationResults((prev) => ({ ...prev, [type]: "" }));

    const mseContent = type === "mse" ? Object.entries(mseData).map(([k, v]) => `${k}: ${v}`).join("\n") : undefined;

    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, conversation: messages, evaluationType: type, mseContent }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let fullResult = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      fullResult += text;
      setEvaluationResults((prev) => ({ ...prev, [type]: (prev[type] || "") + text }));
    }

    const score = parseScore(fullResult);
    setScores((prev) => ({ ...prev, [type]: score }));
    setEvaluationResults((prev) => ({ ...prev, [type]: stripScore(prev[type] || "") }));
    setLoadingEval((prev) => ({ ...prev, [type]: false }));

    const sessionId = sessionKey ? localStorage.getItem(`${sessionKey}_supabase_id`) : null;
    if (sessionId) {
      await supabase.from("evaluations").insert({
        session_id: sessionId,
        evaluation_type: type,
        mse_content: mseContent || null,
        result_text: stripScore(fullResult),
        score,
      });
    }
  }

  async function startEvaluation() {
    setStep("results");
    const types = caseData.evaluationTypes;
    for (const type of types) {
      await runEvaluation(type);
    }
  }

  const evalTypeLabel: Record<string, string> = {
    mse: "MSE 사정 평가",
    communication: "치료적 의사소통 평가",
    procedure: "입퇴원 절차 설명 평가",
    intervention: "간호중재 평가",
    injection: "근육주사 간호행위 평가",
  };

  if (!caseData) return <div className="p-8 text-center text-red-500">케이스를 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.push("/")} className="text-gray-500 hover:text-gray-800 text-sm">
            ← 케이스 목록으로
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">대화 종료 - 평가</h1>
          <p className="text-gray-500 text-sm mt-1">{caseData.title}</p>
        </div>

        {/* 대화 요약 */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">대화 기록 ({messages.length}개 메시지)</h2>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`text-sm px-3 py-2 rounded-lg ${msg.role === "user" ? "bg-blue-50 text-blue-800" : "bg-gray-50 text-gray-700"}`}>
                <span className="font-medium">{msg.role === "user" ? "학생" : "환자"}:</span> {msg.content.substring(0, 100)}{msg.content.length > 100 ? "..." : ""}
              </div>
            ))}
          </div>
        </div>

        {step === "mse" && (
          <>
            {isMseCase && (
              <div className="bg-white rounded-xl border p-6 mb-6">
                <h2 className="font-semibold text-gray-800 mb-4">MSE 사정 작성</h2>
                <p className="text-sm text-gray-500 mb-4">대화를 바탕으로 환자의 정신 상태를 사정하여 작성하세요.</p>
                <div className="space-y-4">
                  {MSE_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                      <textarea
                        value={mseData[field.key] || ""}
                        onChange={(e) => setMseData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder="관찰한 내용을 작성하세요..."
                        rows={2}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={startEvaluation}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              평가 시작하기
            </button>
          </>
        )}

        {step === "results" && (
          <div className="space-y-6">
            {caseData.evaluationTypes.map((type) => (
              <div key={type} className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-800">{evalTypeLabel[type] || type}</h2>
                  {scores[type] != null && (
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${scores[type]! >= 8 ? "bg-green-100 text-green-700" : scores[type]! >= 6 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {scores[type]}/10
                    </span>
                  )}
                </div>
                {loadingEval[type] && !evaluationResults[type] && (
                  <div className="text-gray-400 text-sm animate-pulse">평가 중...</div>
                )}
                {evaluationResults[type] && (
                  <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
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
                      {evaluationResults[type]}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => router.push("/")}
              className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              새 케이스 시작
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">로딩 중...</div>}>
      <EvaluateContent />
    </Suspense>
  );
}
