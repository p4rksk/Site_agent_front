"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  // ✅ 로그인 상태 체크 함수 (재사용 가능)
  const checkLoginStatus = () => {
    setRole(localStorage.getItem("role"));
  };

  useEffect(() => {
    // 1. 초기 로그인 상태 체크
    checkLoginStatus();

    // 2. 커스텀 이벤트 리스너 등록
    //    → 로그인/로그아웃 시 즉시 반영
    window.addEventListener("loginStatusChanged", checkLoginStatus);

    return () => {
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      window.removeEventListener("loginStatusChanged", checkLoginStatus);
    };
  }, []);

  if (!role) return null;

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);

    window.dispatchEvent(new Event("loginStatusChanged"));

    window.location.href = "/";
  };

  return (
    <button
      onClick={handleLogout}
      className="absolute top-4 right-4 z-50 bg-white px-3 py-2 rounded-xl text-sm shadow-md text-gray-600 font-semibold">
      로그아웃
    </button>
  );
}
