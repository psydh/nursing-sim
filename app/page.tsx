"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const CASES = [
  {
    category: "MSE (정신 상태 사정)",
    color: "blue",
    icon: "🧠",
    topics: [
      { id: "mse-1", title: "조현병 환자의 정신 상태 사정", desc: "35세 여성, 환청이 심해져 불안해하는 조현병 환자" },
      { id: "mse-2", title: "조울증 환자의 기분 상태 평가", desc: "32세 남성, 조증 상태의 조울증 입원 환자" },
      { id: "mse-3", title: "자살 위험이 높은 환자의 긴급 평가", desc: "26세 여성, 자살 충동으로 응급실 방문 환자" },
    ],
  },
  {
    category: "입·퇴원 절차",
    color: "emerald",
    icon: "📋",
    topics: [
      { id: "admit-1", title: "강제 입원 환자의 권리 보호", desc: "28세 남성, 자살 시도로 강제 입원 후 퇴원을 원하는 환자" },
      { id: "admit-2", title: "자발적 입원 환자의 퇴원 계획 수립", desc: "45세 여성, 우울증 치료 후 퇴원 계획 중인 환자" },
      { id: "admit-3", title: "퇴원 후 지역사회 연계", desc: "50세 남성, 장기 입원 후 퇴원을 앞둔 환자" },
    ],
  },
  {
    category: "정신간호중재",
    color: "violet",
    icon: "💊",
    topics: [
      { id: "nursing-1", title: "병식 없는 환자의 약물 거부", desc: "42세 남성, 자신이 병이 없다며 약물 복용을 거부하는 조현병 환자" },
      { id: "nursing-2", title: "자해 위험이 있는 환자의 안전 확보", desc: "29세 남성, 자해 시도 가능성이 있는 조현병 환자" },
      { id: "nursing-3", title: "근육주사: 정신적 동요 관리", desc: "38세 남성, 과도한 공격성으로 할로페리돌 IM 투여 필요" },
      { id: "nursing-4", title: "근육주사: 환자 불안 관리 후 진정제 투여", desc: "40세 여성, 급성 불안 발작으로 진정제 근육주사 필요" },
    ],
  },
];

const cardAccent: Record<string, string> = {
  blue: "border-l-blue-400",
  emerald: "border-l-emerald-400",
  violet: "border-l-violet-400",
};

const badgeStyle: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
};

const dotColor: Record<string, string> = {
  blue: "bg-blue-400",
  emerald: "bg-emerald-400",
  violet: "bg-violet-400",
};

export default function Home() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [completedCases, setCompletedCases] = useState<Set<string>>(new Set());
  const [avgScores, setAvgScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const stored = localStorage.getItem("student_info");
    if (stored) {
      const info = JSON.parse(stored);
      setStudentId(info.student_id);
      setStudentName(info.student_name);
      setIsLoggedIn(true);
      loadProgress(info.student_id);
    }
  }, []);

  async function loadProgress(id: string) {
    const { data } = await supabase
      .from("sessions")
      .select("case_id, evaluations(score)")
      .eq("student_id", id);

    if (!data) return;

    const completed = new Set<string>();
    const scores: Record<string, number[]> = {};

    for (const session of data) {
      const evals = (session.evaluations as { score: number | null }[]) || [];
      const scored = evals.filter((e) => e.score != null);
      if (scored.length > 0) {
        completed.add(session.case_id);
        if (!scores[session.case_id]) scores[session.case_id] = [];
        const avg = scored.reduce((s, e) => s + (e.score ?? 0), 0) / scored.length;
        scores[session.case_id].push(avg);
      }
    }

    const avgMap: Record<string, number> = {};
    for (const [caseId, vals] of Object.entries(scores)) {
      avgMap[caseId] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    }

    setCompletedCases(completed);
    setAvgScores(avgMap);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId.trim() || !studentName.trim()) {
      setError("학번과 이름을 모두 입력해주세요.");
      return;
    }
    localStorage.setItem("student_info", JSON.stringify({ student_id: studentId.trim(), student_name: studentName.trim() }));
    setIsLoggedIn(true);
    setError("");
    loadProgress(studentId.trim());
  }

  function handleLogout() {
    localStorage.removeItem("student_info");
    setIsLoggedIn(false);
    setStudentId("");
    setStudentName("");
    setCompletedCases(new Set());
    setAvgScores({});
  }

  const totalCases = CASES.reduce((s, c) => s + c.topics.length, 0);
  const doneCount = completedCases.size;

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 mb-4">
              <span className="text-3xl">🏥</span>
            </div>
            <h1 className="text-3xl font-bold text-white">정신간호 시뮬레이션</h1>
            <p className="text-blue-200/70 mt-2 text-sm">AI 환자와의 대화로 임상 역량을 키우세요</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">학번</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="학번을 입력하세요"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">이름</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                />
              </div>
              {error && <p className="text-red-300 text-xs">{error}</p>}
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-400 text-white py-3 rounded-xl font-semibold transition-all mt-2 shadow-lg shadow-blue-500/30"
              >
                학습 시작하기
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-800 flex items-center gap-2">
            <span>🏥</span> 정신간호 시뮬레이션
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/history")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              내 학습 기록
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                {studentName[0]}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">{studentName}</span>
            </div>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 진행 현황 배너 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm">안녕하세요, {studentName} 학생</p>
              <p className="text-xl font-bold mt-0.5">
                {doneCount === 0
                  ? "첫 번째 케이스를 시작해보세요"
                  : `${doneCount}개 케이스를 완료했어요`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{doneCount}<span className="text-lg text-blue-200">/{totalCases}</span></p>
              <p className="text-blue-200 text-xs mt-0.5">완료</p>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${(doneCount / totalCases) * 100}%` }}
            />
          </div>
        </div>

        {/* 케이스 목록 */}
        <div className="space-y-8">
          {CASES.map((section) => (
            <div key={section.category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{section.icon}</span>
                <h2 className="font-bold text-gray-800">{section.category}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeStyle[section.color]}`}>
                  {section.topics.filter((t) => completedCases.has(t.id)).length}/{section.topics.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.topics.map((topic, i) => {
                  const done = completedCases.has(topic.id);
                  const score = avgScores[topic.id];
                  return (
                    <button
                      key={topic.id}
                      onClick={() => router.push(`/chat/${topic.id}`)}
                      className={`text-left bg-white rounded-xl border-l-4 ${cardAccent[section.color]} border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor[section.color]}`} />
                            <span className="text-xs text-gray-400">케이스 {i + 1}</span>
                          </div>
                          <p className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                            {topic.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{topic.desc}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {done ? (
                            <>
                              <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</span>
                              {score != null && (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${score >= 8 ? "bg-green-50 text-green-600" : score >= 6 ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-500"}`}>
                                  {score}/10
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-xs group-hover:bg-blue-50 group-hover:text-blue-400 transition-colors">›</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
