"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function KakaoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    fetch(`${process.env.NEXT_PUBLIC_SPRING_URL}/user/kakao-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "USER");
        router.push("/");
      })
      .catch((err) => {
        console.error("카카오 로그인 실패:", err);
        router.push("/");
      });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">로그인 처리 중...</p>
    </div>
  );
}

export default function KakaoCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-gray-500">
          로딩 중...
        </div>
      }>
      <KakaoCallbackInner />
    </Suspense>
  );
}
