"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, MessageCircle } from "lucide-react";
import Link from "next/link";

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
  distance: String;
}

const getDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): string => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

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
  const [loginAdminId, setLoginAdminId] = useState("hyundai_admin");
  const [loginPassword, setLoginPassword] = useState("password123");

  // 회원가입용
  const [signupCompanyName, setSignupCompanyName] = useState("");
  const [signupAdminId, setSignupAdminId] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupSiteAdminId, setSignupSiteAdminId] = useState("");
  const [signupSiteAdminPassword, setSignupSiteAdminPassword] = useState("");
  const [signupBusinessNumber, setSignupBusinessNumber] = useState("");
  const [signupContact, setSignupContact] = useState("");

  // 관리자 아이디 중복체크
  const [idCheckMessage, setIdCheckMessage] = useState("");
  const [isIdAvailable, setIsIdAvailable] = useState(false);

  // 현장관리자 아이디 중복체크
  const [siteIdCheckMessage, setSiteIdCheckMessage] = useState("");
  const [isSiteIdAvailable, setIsSiteIdAvailable] = useState(false);

  const checkAdminId = async (adminId: string) => {
    if (!adminId) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SPRING_URL}/admin/check-id?loginId=${adminId}`,
    );
    const isDuplicate = await res.json();
    if (isDuplicate) {
      setIdCheckMessage("이미 사용중인 아이디입니다.");
      setIsIdAvailable(false);
    } else {
      setIdCheckMessage("사용 가능한 아이디입니다.");
      setIsIdAvailable(true);
    }
  };

  const checkSiteAdminId = async (siteAdminId: string) => {
    if (!siteAdminId) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SPRING_URL}/admin/check-site-id?loginId=${siteAdminId}`,
    );
    const isDuplicate = await res.json();
    if (isDuplicate) {
      setSiteIdCheckMessage("이미 사용중인 아이디입니다.");
      setIsSiteIdAvailable(false);
    } else {
      setSiteIdCheckMessage("사용 가능한 아이디입니다.");
      setIsSiteIdAvailable(true);
    }
  };

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

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(latitude, longitude),
          level: 5,
        });

        // 내 위치 마커
        new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(latitude, longitude),
        });

        const token = localStorage.getItem("token");
        if (!token) return;
        const role = localStorage.getItem("role");

        const url =
          role === "USER"
            ? `${process.env.NEXT_PUBLIC_SPRING_URL}/user/sites`
            : `${process.env.NEXT_PUBLIC_SPRING_URL}/admin/sites`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const siteList = Array.isArray(data)
          ? data
          : (data.data ?? data.content ?? []);

        // 내 위치 기준으로 거리 계산 (카카오맵 내장 함수)
        const sitesWithDistance: Site[] = siteList.map((site: Site) => ({
          ...site,
          distance: getDistance(latitude, longitude, site.lat, site.lng),
        }));

        // 거리순 정렬
        sitesWithDistance.sort(
          (a, b) =>
            parseFloat(a.distance as string) - parseFloat(b.distance as string),
        );
        setSites(sitesWithDistance);

        // 현장 마커 표시
        sitesWithDistance.forEach((site) => {
          const marker = new window.kakao.maps.Marker({
            map,
            position: new window.kakao.maps.LatLng(site.lat, site.lng),
          });
          window.kakao.maps.event.addListener(marker, "click", () => {
            router.push(`/chat/${site.id}`);
          });
        });

        if (role === "SUPER_ADMIN") {
          window.kakao.maps.event.addListener(
            map,
            "click",
            (mouseEvent: any) => {
              const lat = mouseEvent.latLng.getLat();
              const lng = mouseEvent.latLng.getLng();
              setSelectedPos({ lat, lng });
              setShowRegisterPopup(true);
            },
          );
        }
      },
      (error) => {
        // 위치 권한 거부 시
        alert(
          "위치 권한이 필요합니다. 브라우저 설정에서 위치 권한을 허용해주세요.",
        );
        // 기본 위치(부산)로 지도 표시
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(35.1796, 129.0756),
          level: 5,
        });
      },
    );
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
            loginId: loginAdminId,
            password: loginPassword,
          }),
        },
      );

      if (!res.ok) {
        const msg = await res.text();
        return alert(msg);
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("id", data.id);
      localStorage.setItem("companyName", data.companyName);
      window.dispatchEvent(new Event("loginStatusChanged"));
      setRole(data.role);
      alert(`${data.companyName} 로그인 성공!`);
      setShowLoginPopup(false);
    } catch {
      alert("로그인에 실패했습니다.");
    }
  };

  const handleAdminSignup = async () => {
    if (!isIdAvailable) return alert("관리자 아이디 중복체크를 해주세요.");
    if (!isSiteIdAvailable)
      return alert("현장관리자 아이디 중복체크를 해주세요.");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SPRING_URL}/admin/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: signupCompanyName,
            businessNumber: signupBusinessNumber,
            phone: signupContact,
            adminId: signupAdminId,
            adminPassword: signupPassword,
            siteAdminId: signupSiteAdminId,
            siteAdminPassword: signupSiteAdminPassword,
          }),
        },
      );
      if (res.ok) {
        alert("가입 완료! 로그인해주세요.");
        setSignupCompanyName("");
        setSignupAdminId("");
        setSignupPassword("");
        setSignupSiteAdminId("");
        setSignupSiteAdminPassword("");
        setSignupBusinessNumber("");
        setSignupContact("");
        setIdCheckMessage("");
        setSiteIdCheckMessage("");
        setIsIdAvailable(false);
        setIsSiteIdAvailable(false);
        setModalView("adminLogin");
      } else {
        const msg = await res.text();
        alert(msg);
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

                <p className="text-xs text-gray-400 self-start font-semibold">
                  회사 관리자 계정
                </p>
                <input
                  value={signupAdminId}
                  onChange={(e) => {
                    setSignupAdminId(e.target.value);
                    checkAdminId(e.target.value);
                  }}
                  placeholder="관리자 아이디"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                />
                {idCheckMessage && (
                  <span
                    className={`text-xs self-start ${isIdAvailable ? "text-blue-500" : "text-red-500"}`}>
                    {idCheckMessage}
                  </span>
                )}
                <input
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="관리자 비밀번호"
                  type="password"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                />

                <p className="text-xs text-gray-400 self-start font-semibold">
                  현장 관리자 계정
                </p>
                <input
                  value={signupSiteAdminId}
                  onChange={(e) => {
                    setSignupSiteAdminId(e.target.value);
                    checkSiteAdminId(e.target.value);
                  }}
                  placeholder="현장관리자 아이디"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                />
                {siteIdCheckMessage && (
                  <span
                    className={`text-xs self-start ${isSiteIdAvailable ? "text-blue-500" : "text-red-500"}`}>
                    {siteIdCheckMessage}
                  </span>
                )}
                <input
                  value={signupSiteAdminPassword}
                  onChange={(e) => setSignupSiteAdminPassword(e.target.value)}
                  placeholder="현장관리자 비밀번호"
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
                    `/admin/sites?lat=${selectedPos.lat}&lng=${selectedPos.lng}`,
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
            {role === "SUPER_ADMIN" && (
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
              className="flex justify-between items-center py-3 border-b last:border-0">
              <Link
                href={`/admin/sites?siteId=${site.id}`}
                className="flex-1 cursor-pointer">
                <p className="font-semibold text-sm">{site.name}</p>
                <p className="text-xs text-gray-400">{site.address}</p>
              </Link>

              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-500">{site.distance}km</span>
                {(role === "SUPER_ADMIN" || role === "SITE_ADMIN") && (
                  <button
                    onClick={() =>
                      router.push(`/admin/sites?siteId=${site.id}`)
                    }>
                    <Settings size={16} />
                  </button>
                )}
                <button onClick={() => router.push(`/chat/${site.id}`)}>
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
