"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    kakao: any;
  }
}

interface Site {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
}

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);

  const [modalView, setModalView] = useState<
    "kakao" | "adminLogin" | "adminSignup"
  >("kakao");

  // 로그인용
  const [loginAdminId, setLoginAdminId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 회원가입용
  const [signupCompanyName, setSignupCompanyName] = useState("");
  const [signupAdminId, setSignupAdminId] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupBusinessNumber, setSignupBusinessNumber] = useState("");
  const [signupContact, setSignupContact] = useState("");

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    if (!token) {
      setShowLoginPopup(true);
    } else {
      setRole(savedRole);
    }

    const loadMap = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setMapLoaded(true);
          setPageReady(true);
        });
      } else {
        setTimeout(loadMap, 100);
      }
    };
    loadMap();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(latitude, longitude),
        level: 5,
      });

      new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(latitude, longitude),
      });

      const mockSites: Site[] = [
        {
          id: 1,
          name: "A현장",
          address: "부산광역시 부산진구",
          lat: latitude + 0.01,
          lng: longitude + 0.01,
          distance: 1.2,
        },
        {
          id: 2,
          name: "B현장",
          address: "부산광역시 금정구",
          lat: latitude + 0.02,
          lng: longitude - 0.01,
          distance: 2.5,
        },
      ];
      setSites(mockSites);

      mockSites.forEach((site) => {
        const marker = new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(site.lat, site.lng),
        });
        window.kakao.maps.event.addListener(marker, "click", () => {
          router.push(`/chat/${site.id}`);
        });
      });

      if (role === "admin") {
        window.kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
          const lat = mouseEvent.latLng.getLat();
          const lng = mouseEvent.latLng.getLng();
          setSelectedPos({ lat, lng });
          setShowRegisterPopup(true);
        });
      }
    });
  }, [mapLoaded, role]);

  const handleKakaoLogin = () => {
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = url;
  };

  const handleAdminLogin = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SPRING_URL}/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminId: loginAdminId,
            password: loginPassword,
          }),
        },
      );
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", "admin");
      setRole("admin");
      setShowLoginPopup(false);
    } catch {
      alert("로그인에 실패했습니다.");
    }
  };

  const handleAdminSignup = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SPRING_URL}/admin/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: signupCompanyName,
            businessNumber: signupBusinessNumber, // ✅ 사업자 번호 추가
            contact: signupContact,
            adminId: signupAdminId,
            password: signupPassword,
          }),
        },
      );
      if (res.ok) {
        alert("가입 완료! 로그인해주세요.");
        setSignupCompanyName("");
        setSignupAdminId("");
        setSignupPassword("");
        setModalView("adminLogin");
      }
    } catch {
      alert("회원가입에 실패했습니다.");
    }
  };

  if (!pageReady)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">지도 불러오는 중...</p>
        </div>
      </div>
    );

  return (
    <div className="relative w-full h-screen">
      <div ref={mapRef} className="w-full h-full" />

      {showLoginPopup && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
          <div className="bg-white rounded-2xl p-8 w-80 flex flex-col items-center gap-4 shadow-2xl">
            {modalView === "kakao" && (
              <>
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl">
                  🏗️
                </div>
                <h1 className="text-xl font-bold text-gray-800">
                  현장 AI 에이전트
                </h1>
                <p className="text-sm text-gray-500 text-center leading-relaxed">
                  현장 정보를 확인하려면
                  <br />
                  카카오 로그인이 필요합니다
                </p>
                <button
                  onClick={handleKakaoLogin}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: "#FEE500", color: "#000000" }}>
                  <img
                    src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png"
                    className="w-6 h-6"
                  />
                  카카오로 로그인
                </button>
                <p className="text-xs text-gray-400">
                  관리자이신가요?{" "}
                  <span
                    onClick={() => setModalView("adminLogin")}
                    className="text-blue-500 cursor-pointer underline">
                    관리자 로그인
                  </span>
                </p>
              </>
            )}

            {modalView === "adminLogin" && (
              <>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
                  🔐
                </div>
                <h1 className="text-xl font-bold text-gray-800">
                  관리자 로그인
                </h1>
                <input
                  value={loginAdminId}
                  onChange={(e) => setLoginAdminId(e.target.value)}
                  placeholder="아이디"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                />
                <input
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="비밀번호"
                  type="password"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={handleAdminLogin}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-sm">
                  로그인
                </button>
                <p className="text-xs text-gray-400">
                  계정이 없으신가요?{" "}
                  <span
                    onClick={() => setModalView("adminSignup")}
                    className="text-blue-500 cursor-pointer underline">
                    회원가입
                  </span>
                </p>
                <span
                  onClick={() => {
                    setModalView("kakao");
                    setLoginAdminId("");
                    setLoginPassword("");
                  }}
                  className="text-xs text-gray-400 cursor-pointer">
                  ← 뒤로
                </span>
              </>
            )}

            {modalView === "adminSignup" && (
              <>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
                  🏢
                </div>
                <h1 className="text-xl font-bold text-gray-800">회사 가입</h1>
                <input
                  value={signupCompanyName}
                  onChange={(e) => setSignupCompanyName(e.target.value)}
                  placeholder="회사명"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                />
                <input
                  value={signupBusinessNumber}
                  onChange={(e) => setSignupBusinessNumber(e.target.value)}
                  placeholder="사업자 등록번호"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                />
                <input
                  value={signupContact}
                  onChange={(e) => setSignupContact(e.target.value)}
                  placeholder="회사 연락처"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                />
                <input
                  value={signupAdminId}
                  onChange={(e) => setSignupAdminId(e.target.value)}
                  placeholder="아이디"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                />
                <input
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="비밀번호"
                  type="password"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={handleAdminSignup}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-sm">
                  가입하기
                </button>
                <span
                  onClick={() => setModalView("adminLogin")}
                  className="text-xs text-gray-400 cursor-pointer">
                  ← 뒤로
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {showRegisterPopup && selectedPos && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
          <div className="bg-white rounded-2xl p-6 w-72 flex flex-col gap-4">
            <p className="text-center font-semibold">
              이 위치에 현장을 등록하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRegisterPopup(false)}
                className="flex-1 border py-2 rounded-xl text-sm">
                취소
              </button>
              <button
                onClick={() => {
                  setShowRegisterPopup(false);
                  router.push(
                    `/admin/sites/register?lat=${selectedPos.lat}&lng=${selectedPos.lng}`,
                  );
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm">
                예
              </button>
            </div>
          </div>
        </div>
      )}

      {!showLoginPopup && sites.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 shadow-xl z-10 max-h-48 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-gray-400">
              근처 현장 ({sites.length}개)
            </p>
            {role === "admin" && (
              <button
                onClick={() => router.push("/admin/chatlogs")}
                className="text-xs text-blue-500">
                대화 조회 →
              </button>
            )}
          </div>
          {sites.map((site) => (
            <div
              key={site.id}
              onClick={() => router.push(`/chat/${site.id}`)}
              className="flex justify-between items-center py-3 border-b last:border-0 cursor-pointer">
              <div>
                <p className="font-semibold text-sm">{site.name}</p>
                <p className="text-xs text-gray-400">{site.address}</p>
              </div>
              <span className="text-xs text-blue-500">{site.distance}km</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
