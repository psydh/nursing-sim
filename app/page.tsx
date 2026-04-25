"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const CASES = [
  {
    category: "MSE (정신 상태 사정)",
    color: "blue",
    topics: [
      { id: "mse-1", title: "조현병 환자의 정신 상태 사정", desc: "35세 여성, 환청이 심해져 불안해하는 조현병 환자" },
      { id: "mse-2", title: "조울증 환자의 기분 상태 평가", desc: "32세 남성, 조증 상태의 조울증 입원 환자" },
      { id: "mse-3", title: "자살 위험이 높은 환자의 긴급 평가", desc: "26세 여성, 자살 충동으로 응급실 방문 환자" },
    ],
  },
  {
    category: "입·퇴원 절차",
    color: "green",
    topics: [
      { id: "admit-1", title: "강제 입원 환자의 권리 보호", desc: "28세 남성, 자살 시도로 강제 입원 후 퇴원을 원하는 환자" },
      { id: "admit-2", title: "자발적 입원 환자의 퇴원 계획 수립", desc: "45세 여성, 우울증 치료 후 퇴원 계획 중인 환자" },
      { id: "admit-3", title: "퇴원 후 지역사회 연계", desc: "50세 남성, 장기 입원 후 퇴원을 앞둔 환자" },
    ],
  },
  {
    category: "정신간호중재",
    color: "purple",
    topics: [
      { id: "nursing-1", title: "병식 없는 환자의 약물 거부", desc: "42세 남성, 자신이 병이 없다며 약물 복용을 거부하는 조현병 환자" },
      { id: "nursing-2", title: "자해 위험이 있는 환자의 안전 확보", desc: "29세 남성, 자해 시도 가능성이 있는 조현병 환자" },
      { id: "nursing-3", title: "근육주사: 정신적 동요 관리", desc: "38세 남성, 과도한 공격성으로 할로페리돌 IM 투여 필요" },
      { id: "nursing-4", title: "근육주사: 환자 불안 관리 후 진정제 투여", desc: "40세 여성, 급성 불안 발작으로 진정제 근육주사 필요" },
    ],
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  green: "bg-green-50 border-green-200 hover:bg-green-100",
  purple: "bg-purple-50 border-purple-200 hover:bg-purple-100",
};

const headerColorMap: Record<string, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  purple: "bg-purple-600",
};

export default function Home() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("student_info");
    if (stored) {
      const info = JSON.parse(stored);
      setStudentId(info.student_id);
      setStudentName(info.student_name);
      setIsLoggedIn(true);
    }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId.trim() || !studentName.trim()) {
      setError("학번과 이름을 모두 입력해주세요.");
      return;
    }
    localStorage.setItem("student_info", JSON.stringify({ student_id: studentId.trim(), student_name: studentName.trim() }));
    setIsLoggedIn(true);
    setError("");
  }

  function handleLogout() {
    localStorage.removeItem("student_info");
    setIsLoggedIn(false);
    setStudentId("");
    setStudentName("");
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border shadow-sm p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">정신간호 시뮬레이션</h1>
          <p className="text-gray-500 text-sm text-center mb-6">시작하려면 학번과 이름을 입력하세요</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학번</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="학번을 입력하세요"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              시작하기
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">정신간호 시뮬레이션</h1>
          <p className="text-gray-500 mt-2">케이스를 선택하여 환자와의 대화를 시작하세요</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-sm text-gray-600">{studentName} ({studentId})</span>
            <button onClick={() => router.push("/history")} className="text-xs text-blue-500 hover:text-blue-700 underline">
              내 학습 기록
            </button>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 underline">
              로그아웃
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {CASES.map((section) => (
            <div key={section.category}>
              <div className={`${headerColorMap[section.color]} text-white px-4 py-2 rounded-t-lg font-semibold`}>
                {section.category}
              </div>
              <div className="border border-t-0 rounded-b-lg overflow-hidden">
                {section.topics.map((topic, i) => (
                  <button
                    key={topic.id}
                    onClick={() => router.push(`/chat/${topic.id}`)}
                    className={`w-full text-left px-4 py-4 border-b last:border-b-0 ${colorMap[section.color]} transition-colors`}
                  >
                    <div className="font-medium text-gray-800">
                      주제{i + 1}. {topic.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{topic.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
