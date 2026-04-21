import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import LogoutButton from "./components/LogoutButton";

export const metadata: Metadata = {
  title: "현장 AI 에이전트",
  description: "현장 근무자를 위한 AI 가이드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
          strategy="afterInteractive"
        />
      </head>
      <body suppressHydrationWarning={true}>
        {" "}
        <LogoutButton /> {children}
      </body>
    </html>
  );
}
