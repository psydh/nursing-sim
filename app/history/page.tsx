"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Evaluation {
  score: number | null;
}

interface Session {
  id: string;
  case_id: string;
  started_at: string;
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

function avgScore(evaluations: Evaluation[]) {
  const scored = evaluations.filter((e) => e.score != null);
  if (scored.length === 0) return null;
  return (scored.reduce((s, e) => s + (e.score ?? 0), 0) / scored.length).toFixed(1);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("student_info");
    if (stored) {
      const info = JSON.parse(stored);
      setStudentId(info.student_id);
      setStudentName(info.student_name);
      fetchSessions(info.student_id);
    }
  }, []);

  async function fetchSessions(id: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .select("id, case_id, started_at, evaluations(score)")
      .eq("student_id", id)
      .order("started_at", { ascending: false });

    if (!error && data) setSessions(data as Session[]);
    setLoading(false);
    setLoaded(true);
  }

  function scoreColor(avg: string | null) {
    if (!avg) return "bg-gray-100 text-gray-500";
    const n = parseFloat(avg);
    if (n >= 8) return "bg-green-100 text-green-700";
    if (n >= 6) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.push("/")} className="text-gray-500 hover:text-gray-800 text-sm">
            ← 케이스 목록으로
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">내 학습 기록</h1>
          {studentName && (
            <p className="text-gray-500 text-sm mt-1">{studentName} ({studentId})</p>
          )}
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
        )}

        {loaded && sessions.length === 0 && (
          <div className="bg-white rounded-xl border p-10 text-center text-gray-400 text-sm">
            완료한 시뮬레이션이 없습니다.
          </div>
        )}

        {sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map((session) => {
              const avg = avgScore(session.evaluations);
              return (
                <button
                  key={session.id}
                  onClick={() => router.push(`/history/${session.id}`)}
                  className="w-full bg-white rounded-xl border px-5 py-4 text-left hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {CASE_TITLES[session.case_id] || session.case_id}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(session.started_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {avg ? (
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColor(avg)}`}>
                          {avg}/10
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">평가 없음</span>
                      )}
                      <span className="text-gray-300 text-sm">›</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
