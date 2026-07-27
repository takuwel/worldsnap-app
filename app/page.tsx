"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// SSR（サーバーサイドレンダリング）エラーを回避するために動的インポート
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface VideoRecord {
  id: string;
  author: string;
  title: string;
  lat: number;
  lng: number;
  thumbnail: string;
  mediaUrl: string | null;
  mediaType: "image" | "video";
  status: "published" | "pending";
}

const INITIAL_VIDEOS: VideoRecord[] = [
  { id: "v_101", author: "Taro", title: "渋谷スクランブル交差点", lat: 35.6595, lng: 139.7004, thumbnail: "⚡", mediaUrl: null, mediaType: "image", status: "published" },
  { id: "v_102", author: "Ken", title: "京都 清水寺", lat: 34.9949, lng: 135.7850, thumbnail: "🌸", mediaUrl: null, mediaType: "image", status: "published" },
  { id: "v_103", author: "Yuki", title: "大阪 道頓堀", lat: 34.6687, lng: 135.5013, thumbnail: "🐙", mediaUrl: null, mediaType: "image", status: "published" }
];

export default function Home() {
  const [videoDb, setVideoDb] = useState<VideoRecord[]>(INITIAL_VIDEOS);
  const [isClient, setIsClient] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [customIcon, setCustomIcon] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Leafletのデフォルトアイコンバグ修正
    import("leaflet").then((L) => {
      const defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      setCustomIcon(defaultIcon);
      setLeafletLoaded(true);
    });
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-900 text-white overflow-hidden select-none">
      {/* ヘッダー */}
      <header className="absolute top-0 left-0 right-0 p-4 z-[1000] flex items-center justify-between bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <h1 className="text-lg font-bold text-sky-400 flex items-center gap-2">
          🌍 WorldSnap <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Live Map</span>
        </h1>
      </header>

      {/* 本物の地図エリア */}
      {isClient && leafletLoaded && customIcon ? (
        <MapContainer 
          center={[35.6595, 139.7004]} // 初期位置：東京（渋谷）
          zoom={6}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          {/* オープンマップタイル */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 地図上のピン */}
          {videoDb.map((pin) => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={customIcon}>
              <Popup className="custom-popup">
                <div className="p-1 text-slate-900">
                  <h3 className="font-bold text-sm">{pin.title}</h3>
                  <p className="text-xs text-slate-500">投稿者: @{pin.author}</p>
                  <p className="text-[10px] text-slate-400 mt-1">📍 {pin.lat}, {pin.lng}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400">
          🗺️ 地図を読み込み中...
        </div>
      )}

      {/* ナビゲーション */}
      <nav className="absolute bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 z-[1000] flex items-center justify-around text-xs text-slate-400">
        <div className="text-sky-400 font-bold">🗺️ マップ</div>
        <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-slate-950 font-bold text-xl -mt-6 shadow-lg border-4 border-slate-900 cursor-pointer">
          📸
        </div>
        <div>👤 マイ</div>
      </nav>
    </div>
  );
} a a 
