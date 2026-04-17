"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SiteRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const siteId = searchParams.get("siteId");
  const isEditMode = !!siteId;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [adminId, setAdminId] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");

  useEffect(() => {
    if (!lat || !lng || isEditMode) return;
    window.kakao?.maps.load(() => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2Address(
        Number(lng),
        Number(lat),
        (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            setAddress(result[0].address.address_name);
          }
        },
      );
    });
  }, [lat, lng]);

  useEffect(() => {
    if (!isEditMode) return;
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_SPRING_URL}/admin/sites/${siteId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setName(data.name);
        setAddress(data.address);
      });
  }, [siteId]);

  const handleSubmit = async () => {
    if (!name) return;
    if (!isEditMode && !file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("address", address);
    formData.append("lat", lat || "0");
    formData.append("lng", lng || "0");
    if (file) formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${process.env.NEXT_PUBLIC_SPRING_URL}/admin/sites${isEditMode ? `/${siteId}` : ""}`,
        {
          method: isEditMode ? "PUT" : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      setMessage(isEditMode ? "수정되었습니다!" : "현장이 등록되었습니다!");
      setTimeout(() => router.push("/admin"), 1500);
    } catch {
      setMessage(isEditMode ? "수정에 실패했습니다." : "등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const token = localStorage.getItem("token");
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SPRING_URL}/admin/sites/${siteId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMessage("삭제되었습니다.");
      setTimeout(() => router.push("/admin"), 1500);
    } catch {
      setMessage("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white text-gray-800 p-4 flex items-center gap-3 border-b border-gray-200">
        <button onClick={() => router.back()} className="text-gray-600">
          ←
        </button>
        <h1 className="font-bold text-sm">
          {isEditMode ? "현장 수정" : "현장 등록"}
        </h1>
      </header>

      <div className="flex-1 p-4 flex justify-center items-start pt-8">
        <div className="bg-white rounded-xl p-6 flex flex-col gap-4 w-full max-w-md">
          <div>
            <label className="text-sm font-medium text-gray-700">
              현장명 *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="현장명을 입력하세요"
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              관리자 아이디 *
            </label>
            <input
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="관리자 아이디를 입력하세요"
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              관리자 비밀번호 *
            </label>
            <input
              value={adminPw}
              onChange={(e) => setAdminPw(e.target.value)}
              placeholder="관리자 비밀번호를 입력하세요"
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              현장 책임자 성함 *
            </label>
            <input
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              책임자 연락처 *
            </label>
            <input
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">주소</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="주소를 입력하세요"
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">위치</label>
            <p className="text-xs text-gray-400 mt-1">
              위도: {lat} / 경도: {lng}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              PDF 업로드 {!isEditMode && "*"}
            </label>
            {isEditMode && (
              <p className="text-xs text-gray-400 mt-1">
                파일 선택 시 PDF가 추가 등록됩니다
              </p>
            )}
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border rounded-lg p-2 mt-1 text-sm"
            />
          </div>
          <div className="flex justify-center gap-3">
            {isEditMode && (
              <button
                onClick={handleDelete}
                className="px-8 py-3 bg-red-500 text-white rounded-xl text-sm">
                삭제
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!name || (!isEditMode && !file) || loading}
              className="px-8 py-3 bg-blue-500 text-white rounded-xl text-sm">
              {loading ? "처리 중..." : isEditMode ? "수정하기" : "현장 등록"}
            </button>
          </div>
          {message && (
            <p className="text-center text-sm text-green-600">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SiteRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-gray-500">
          로딩 중...
        </div>
      }>
      <SiteRegisterForm />
    </Suspense>
  );
}
