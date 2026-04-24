"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  if (!role) return null;

  return (
    <button
      onClick={() => {
        localStorage.clear();
        setRole(null);
        router.refresh(); // ← push("/") 대신 refresh()
        window.location.href = "/"; // ← 강제 새로고침
      }}
      className="absolute top-4 right-4 z-50 bg-white px-3 py-2 rounded-xl text-sm shadow-md text-gray-600 font-semibold">
      로그아웃
    </button>
  );
}
