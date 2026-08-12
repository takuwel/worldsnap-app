"use client";

import React, { useState, useEffect } from 'react';

const COUNTRY_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  JP: { lat: 35.6812, lng: 139.7671, name: "日本" },
  US: { lat: 37.0902, lng: -95.7129, name: "アメリカ" },
  KR: { lat: 35.9078, lng: 127.7669, name: "韓国" },
  UK: { lat: 55.3781, lng: -3.436, name: "イギリス" },
  FR: { lat: 46.2276, lng: 2.2137, name: "フランス" },
};

export default function Home() {
  const [username, setUsername] = useState("ゲストユーザー");
  const [selectedCountry, setSelectedCountry] = useState("JP");
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [activeTab, setActiveTab] = useState<"map" | "search" | "saved" | "profile">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpotPin, setSelectedSpotPin] = useState<{ lat: number; lng: number; title: string } | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string }>>([
    { sender: "assistant", text: "こんにちは！旅の思い出やスポットについて何でも質問してください。" }
  ]);

  useEffect(() => {
    const savedName = localStorage.getItem("worldsnap_username");
    const savedCountry = localStorage.getItem("worldsnap_country");
    if (savedName && savedCountry) {
      setUsername(savedName);
      setSelectedCountry(savedCountry);
      setIsFirstVisit(false);
    }
  }, []);

  const handleSaveInitialProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("worldsnap_username", username);
    localStorage.setItem("worldsnap_country", selectedCountry);
    setIsFirstVisit(false);
  };

  const handleExifUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    alert(`${files.length}件のファイルを選択しました。`);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userQ = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userQ }]);
    setChatInput("");
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: "assistant", text: `「${userQ}」についてですね！おすすめのスポットやルートを検索できます。` }
      ]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* 1. 初回訪問モーダル */}
      {isFirstVisit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveInitialProfile}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
          >
            <div className="text-4xl">🌐</div>
            <h2 className="text-xl font-bold text-slate-900">WorldSnap へようこそ！</h2>
            <p className="text-xs text-slate-500">プロフィールと初期エリアを設定してください。</p>

            <div className="text-left space-y-1">
              <label className="text-xs font-bold text-slate-600">ユーザー名</label>
              <input
                type="text"
                required
                placeholder="例: たろう"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="text-left space-y-1">
              <label className="text-xs font-bold text-slate-600">国籍・初期エリア</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.entries(COUNTRY_COORDS).map(([code, data]) => (
                  <option key={code} value={code}>
                    {data.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition mt-2"
            >
              始める
            </button>
          </form>
        </div>
      )}

      {/* 2. ヘッダー */}
      <header className="bg-white border-b border-slate-200 z-10 p-2 shadow-sm flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 場所・キーワードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer shadow flex items-center gap-1.5 shrink-0 transition">
            <span>📷 写真追加</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleExifUpload}
              className="hidden"
            />
          </label>
        </div>
      </header>

      {/* 3. メインマップエリア */}
      <main className="flex-1 relative overflow-hidden bg-slate-200 flex items-center justify-center">
        <div className="text-center p-6 bg-white/80 backdrop-blur rounded-2xl shadow-lg max-w-sm">
          <div className="text-4xl mb-2 animate-bounce">📍</div>
          <h3 className="font-bold text-slate-800 text-base">ワールドマップエリア</h3>
          <p className="text-xs text-slate-500 mt-1">選択中の地域: {COUNTRY_COORDS[selectedCountry]?.name || "日本"}</p>
          <p className="text-xs text-slate-400 mt-2">ログイン中: {username}</p>
        </div>

        {selectedSpotPin && (
          <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-xl z-20 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-slate-800">{selectedSpotPin.title || "スポット詳細"}</h4>
              <button onClick={() => setSelectedSpotPin(null)} className="p-1 rounded-full hover:bg-slate-100 text-xs">
                ✖
              </button>
            </div>
            <button
              onClick={() => {
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${selectedSpotPin.lat},${selectedSpotPin.lng}`,
                  "_blank"
                );
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
            >
              🔗 Googleマップアプリで開く
            </button>
          </div>
        )}
      </main>

      {/* 4. ボトムナビゲーション */}
      <nav className="bg-white border-t border-slate-200 z-10 px-4 py-2 flex justify-around items-center shrink-0">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center text-xs ${activeTab === "map" ? "text-blue-600 font-bold" : "text-slate-400"}`}
        >
          <span className="text-base">🧭</span>
          マップ
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`flex flex-col items-center text-xs ${activeTab === "search" ? "text-blue-600 font-bold" : "text-slate-400"}`}
        >
          <span className="text-base">🔍</span>
          検索
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex flex-col items-center text-xs ${activeTab === "saved" ? "text-blue-600 font-bold" : "text-slate-400"}`}
        >
          <span className="text-base">🔖</span>
          保存
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center text-xs ${activeTab === "profile" ? "text-blue-600 font-bold" : "text-slate-400"}`}
        >
          <span className="text-base">👤</span>
          マイページ
        </button>
      </nav>

      {/* 5. チャットアシスタント */}
      <div className="bg-white border-t border-slate-200 flex flex-col max-h-48 shrink-0">
        <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs bg-slate-50">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-2.5 rounded-2xl leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendChatMessage} className="p-2 border-t border-slate-200 bg-white flex gap-2">
          <input
            type="text"
            placeholder="質問を入力..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 shadow"
          >
            送信
          </button>
        </form>
      </div>

    </div>
  );
}
