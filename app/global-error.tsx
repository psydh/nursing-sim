"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-semibold text-gray-800">오류가 발생했습니다</h1>
          <p className="text-gray-500 text-sm">
            {error.message || "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요."}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
