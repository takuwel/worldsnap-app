"use client";

import React, { useState } from "react";
import {
  Search,
  Settings,
  MapPin,
  Compass,
  Map as MapIcon,
  Globe,
  Lock,
  Users,
  CloudRain,
  Utensils,
  PlusCircle,
  Bookmark,
  User,
  X,
} from "lucide-react";

// --- 型定義 ---
type ModeType = "public" | "private" | "friends" | "rainy" | "gourmet";

interface SpotPin {
  id: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  mode: ModeType[];
  imageUrl: string;
  description: string;
}

// --- デモ用ピンデータ ---
const MOCK_PINS: SpotPin[] = [
  {
    id: "1",
    title: "エッフェル塔前のカフェ",
    category: "カフェ",
    lat: 48.8584,
    lng: 2.2945,
    mode: ["public", "rainy", "gourmet"],
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&auto=format&fit=crop",
    description: "雨の日でもゆっくり過ごせるテラス席がある最高のカフェ！",
  },
  {
    id: "2",
    title: "隠れ家イタリアン",
    category: "レストラン",
    lat: 35.6812,
    lng: 139.7671,
    mode: ["public", "private", "gourmet"],
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop",
    description: "自分だけのお気に入りパスタスポット。絶品です。",
  },
  {
    id: "3",
    title: "友人と行った水族館",
    category: "屋内施設",
    lat: 34.6545,
    lng: 135.4289,
    mode: ["public", "friends", "rainy"],
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&auto=format&fit=crop",
    description: "雨の日のデートや友達とのお出かけにぴったり！",
  },
];

export default function WorldSnapApp() {
  const [activeMode, setActiveMode] = useState<ModeType>("public");
  const [activeTab, setActiveTab] = useState<string>("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPin, setSelectedPin] = useState<SpotPin | null>(null);

  // 選択されたモードに応じてピンをフィルタリング
  const filteredPins = MOCK_PINS.filter((pin) => pin.mode.includes(activeMode));

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-white font-sans select-none">
      
      {/* 1. マップ背景（サテライト風ダークマップ） */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop')`,
        }}
      >
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
      </div>

      {/* 2. 上部ヘッダー（検索バー ＋ モード切替 ＋ 設定アイコン） */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex flex-col gap-3 max-w-md mx-auto">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-2 shadow-2xl">
          {/* 検索バー */}
          <div className="flex items-center flex-1 bg-slate-800/60 rounded-xl px-3 py-1.5 border border-slate-700/30">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="場所や投稿を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent w-full text-xs text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* モード切り替えドロップダウン */}
          <div className="relative flex items-center bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-2 py-1">
            <select
              value={activeMode}
              onChange={(e) => setActiveMode(e.target.value as ModeType)}
              className="bg-transparent text-xs font-semibold text-[#00FF87] focus:outline-none cursor-pointer pr-1"
            >
              <option value="public" className="bg-slate-900 text-white">🌐 パブリック</option>
              <option value="private" className="bg-slate-900 text-white">🔒 プライベート</option>
              <option value="friends" className="bg-slate-900 text-white">👥 フレンド</option>
              <option value="rainy" className="bg-slate-900 text-white">☔ 雨の日</option>
              <option value="gourmet" className="bg-slate-900 text-white">🍕 グルメ</option>
            </select>
          </div>

          {/* 設定ボタン */}
          <button className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/30 text-slate-300 transition">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. マップ上の動的ピン表示 */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {filteredPins.map((pin, index) => (
          <div
            key={pin.id}
            onClick={() => setSelectedPin(pin)}
            style={{
              top: `${35 + index * 15}%`,
              left: `${25 + index * 25}%`,
            }}
            className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/90 border-2 border-[#00FF87] shadow-[0_0_15px_rgba(0,255,135,0.4)] transition-transform duration-300 group-hover:scale-110">
              {activeMode === "gourmet" ? (
                <Utensils className="w-5 h-5 text-[#00FF87]" />
              ) : activeMode === "rainy" ? (
                <CloudRain className="w-5 h-5 text-[#00FF87]" />
              ) : activeMode === "friends" ? (
                <Users className="w-5 h-5 text-[#00FF87]" />
              ) : activeMode === "private" ? (
                <Lock className="w-5 h-5 text-[#00FF87]" />
              ) : (
                <Globe className="w-5 h-5 text-[#00FF87]" />
              )}
            </div>
            <span className="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 border border-slate-700 text-[10px] text-slate-200 px-2 py-0.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              {pin.title}
            </span>
          </div>
        ))}
      </div>

      {/* 4. 右下アクションボタン（📍現在地 / 🧭方位リセット のみ） */}
      <div className="absolute right-4 bottom-20 z-20 flex flex-col gap-3">
        <button 
          onClick={() => alert("方位を北に固定しました")}
          className="w-11 h-11 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-slate-200 shadow-lg hover:border-[#00FF87] hover:text-[#00FF87] transition"
        >
          <Compass className="w-5 h-5" />
        </button>

        <button 
          onClick={() => alert("現在地へジャンプします")}
          className="w-11 h-11 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-slate-200 shadow-lg hover:border-[#00FF87] hover:text-[#00FF87] transition"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {/* 5. ピン詳細モーダル（プレビュー） */}
      {selectedPin && (
        <div className="absolute inset-x-4 bottom-24 z-30 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-2xl p-4 shadow-2xl animation-fade-in">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-bold text-[#00FF87] uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {selectedPin.category}
              </span>
              <h3 className="text-base font-bold text-white mt-1">{selectedPin.title}</h3>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <img
            src={selectedPin.imageUrl}
            alt={selectedPin.title}
            className="w-full h-32 object-cover rounded-xl mb-2"
          />
          <p className="text-xs text-slate-300 leading-relaxed">{selectedPin.description}</p>
        </div>
      )}

      {/* 6. 下部ナビゲーション（5つの固定タブ） */}
      <nav className="absolute bottom-0 left-0 right-0 z-20 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("map")}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === "map" ? "text-[#00FF87]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">マップ</span>
          </button>

          <button
            onClick={() => setActiveTab("search")}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === "search" ? "text-[#00FF87]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">探す</span>
          </button>

          <button
            onClick={() => setActiveTab("post")}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition -mt-3"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-[#00FF87] flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <PlusCircle className="w-7 h-7 stroke-[2.5]" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === "saved" ? "text-[#00FF87]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bookmark className="w-5 h-5" />
            <span className="text-[10px] font-medium">保存</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === "profile" ? "text-[#00FF87]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">マイページ</span>
          </button>
        </div>
      </nav>

    </div>
  );
}
