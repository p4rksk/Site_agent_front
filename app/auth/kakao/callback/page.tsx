"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function KakaoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    // Spring Boot에 코드 전달 → JWT 받기
    fetch(`${process.env.NEXT_PUBLIC_SPRING_URL}/auth/kakao?code=${code}`)
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        if (data.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">로그인 처리 중...</p>
    </div>
  );
}
