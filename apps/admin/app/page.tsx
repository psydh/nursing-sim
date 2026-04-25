"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Evaluation {
  evaluation_type: string;
  score: number | null;
}

interface Session {
  id: string;
  student_id: string;
  student_name: string;
  case_id: string;
  started_at: string;
  ended_at: string | null;
  evaluations: Evaluation[];
}

const EVAL_LABELS: Record<string, string> = {
  mse: "MSE",
  communication: "의사소통",
  procedure: "절차",
  intervention: "간호중재",
  injection: "주사",
};

function scoreBadgeClass(score: number | null) {
  if (score == null) return "bg-gray-100 text-gray-500";
  if (score >= 8) return "bg-green-100 text-green-700";
  if (score >= 6) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export default function AdminPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [caseFilter, setCaseFilter] = useState("");

  useEffect(() => {
    async function fetchSessions() {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          id, student_id, student_name, case_id, started_at, ended_at,
          evaluations (evaluation_type, score)
        `)
        .order("started_at", { ascending: false });

      if (!error && data) setSessions(data as Session[]);
      setLoading(false);
    }
    fetchSessions();
  }, []);

  const caseIds = [...new Set(sessions.map((s) => s.case_id))].sort();

  const filtered = sessions.filter((s) => {
    const matchSearch =
      !search ||
      s.student_id.includes(search) ||
      s.student_name.includes(search);
    const matchCase = !caseFilter || s.case_id === caseFilter;
    return matchSearch && matchCase;
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function avgScore(evals: Evaluation[]) {
    const scored = evals.filter((e) => e.score != null);
    if (!scored.length) return null;
    return (scored.reduce((s, e) => s + e.score!, 0) / scored.length).toFixed(1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Nursing Sim 관리자</h1>
        <span className="text-sm text-gray-500">총 {sessions.length}개 세션</span>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* 필터 */}
        <div className="flex gap-3 mb-5">
          <input
            type="text"
            placeholder="학번 또는 이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm w-60 focus:outline-none focus:border-blue-400 text-gray-900 placeholder:text-gray-400"
          />
          <select
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 text-gray-900"
          >
            <option value="">전체 케이스</option>
            {caseIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          {(search || caseFilter) && (
            <button
              onClick={() => { setSearch(""); setCaseFilter(""); }}
              className="text-sm text-gray-500 hover:text-gray-800 px-2"
            >
              초기화
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20 text-sm">불러오는 중...</div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">학번</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">이름</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">케이스</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">시작 시간</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">평가 점수</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">평균</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((session) => {
                  const avg = avgScore(session.evaluations);
                  const avgNum = avg ? parseFloat(avg) : null;
                  return (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-800 font-medium">{session.student_id}</td>
                      <td className="px-4 py-3 text-gray-800">{session.student_name}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                          {session.case_id}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(session.started_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {session.evaluations.length === 0 ? (
                            <span className="text-xs text-gray-400">미완료</span>
                          ) : (
                            session.evaluations.map((e) => (
                              <span
                                key={e.evaluation_type}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreBadgeClass(e.score)}`}
                              >
                                {EVAL_LABELS[e.evaluation_type] || e.evaluation_type}
                                {e.score != null ? ` ${e.score}/10` : ""}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {avgNum != null && (
                          <span className={`font-bold text-sm ${
                            avgNum >= 8 ? "text-green-600" :
                            avgNum >= 6 ? "text-yellow-600" :
                            "text-red-600"
                          }`}>
                            {avg}/10
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/sessions/${session.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap"
                        >
                          상세보기 →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                      세션이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
