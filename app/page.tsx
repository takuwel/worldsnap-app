"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Compass,
  MapPin,
  Plus,
  Bookmark,
  User,
  Map as MapIcon,
  Heart,
  Share2,
  X,
  Globe,
  CloudRain,
  Utensils,
  Users,
  Eye,
  Bot,
  Crosshair,
} from "lucide-react";

// 国籍・地域データ
const COUNTRY_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  JP: { lat: 35.6812, lng: 139.7671, name: "日本 (東京)" },
  US: { lat: 40.7128, lng: -74.006, name: "アメリカ (ニューヨーク)" },
  FR: { lat: 48.8566, lng: 2.3522, name: "フランス (パリ)" },
  KR: { lat: 37.5665, lng: 126.978, name: "韓国 (ソウル)" },
  UK: { lat: 51.5074, lng: -0.1278, name: "イギリス (ロンドン)" },
};

export default function Home() {
  // 初回プロフィール設定
  const [username, setUsername] = useState("ゲストユーザー");
  const [selectedCountry, setSelectedCountry] = useState("JP");
  const [isFirstVisit, setIsFirstVisit] = useState(true);

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

  // タブ & フィルター状態（AIモード追加）
  const [activeTab, setActiveTab] = useState<"map" | "search" | "saved" | "profile">("map");
  const [mode, setMode] = useState<"public" | "friends" | "ai">("public");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // マップ選択スポット
  const [selectedSpot, setSelectedSpot] = useState<any>(null);

  // 投稿データ
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "エッフェル塔前のオシャレカフェ",
      location: "パリ, フランス",
      category: "gourmet",
      isRainyOk: true,
      isFriendOnly: false,
      likes: 124,
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop",
      author: "Takuya",
      saved: false,
    },
    {
      id: 2,
      title: "隠れ家イタリアンレストラン",
      location: "東京都 港区",
      category: "gourmet",
      isRainyOk: false,
      isFriendOnly: true,
      likes: 89,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop",
      author: "Ken",
      saved: true,
    },
    {
      id: 3,
      title: "雨の日でも楽しめる水族館",
      location: "東京都 江東区",
      category: "spot",
      isRainyOk: true,
      isFriendOnly: false,
      likes: 210,
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop",
      author: "Yuki",
      saved: false,
    },
  ]);

  // 新規投稿モーダル
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postMethod, setPostMethod] = useState<"current" | "map">("current");
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newIsRainy, setNewIsRainy] = useState(false);
  const [newIsFriendOnly, setNewIsFriendOnly] = useState(false);

  // フィルター
  const filteredPosts = posts.filter((post) => {
    if (mode === "friends" && !post.isFriendOnly) return false;
    if (selectedCategory === "gourmet" && post.category !== "gourmet") return false;
    if (selectedCategory === "rainy" && !post.isRainyOk) return false;
    if (searchQuery && !post.title.includes(searchQuery) && !post.location.includes(searchQuery)) return false;
    return true;
  });

  const toggleSave = (id: number) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newPostObj = {
      id: Date.now(),
      title: newTitle,
      location: newLocation || (postMethod === "current" ? "現在地周辺" : "ピンで指定した場所"),
      category: "gourmet",
      isRainyOk: newIsRainy,
      isFriendOnly: newIsFriendOnly,
      likes: 0,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
      author: username,
      saved: false,
    };

    setPosts([newPostObj, ...posts]);
    setIsPostModalOpen(false);
    setNewTitle("");
    setNewLocation("");
  };

  const currentCoords = COUNTRY_COORDS[selectedCountry] || COUNTRY_COORDS["JP"];

  // 広告バナーコンポーネント
  const AdBanner = () => (
    <div className="my-6 p-3 bg-slate-200/60 border border-slate-300 rounded-xl text-center">
      <span className="text-[9px] font-semibold text-slate-400 block tracking-wider uppercase mb-1">
        スポンサーリンク / 広告
      </span>
      <div className="h-14 bg-slate-300/70 rounded-lg flex items-center justify-center text-slate-500 text-xs font-medium border border-dashed border-slate-400">
        Google AdSense / 広告枠スペース (320x50)
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* 1. 初回起動モーダル */}
      {isFirstVisit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveInitialProfile}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
          >
            <Globe className="w-12 h-12 text-blue-600 mx-auto" />
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
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-left space-y-1">
              <label className="text-xs font-bold text-slate-600">国籍・初期エリア</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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

      {/* 2. 上部ヘッダー & モード・フィルター切替 */}
      <header className="bg-white border-b border-slate-200 z-10 p-3 space-y-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="場所やキーワードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* AIモード / パブリック / フレンド モード切替 ＆ カテゴリ */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs font-semibold">
          {/* モードトグル */}
          <button
            onClick={() => setMode("public")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition shrink-0 ${
              mode === "public" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> パブリック
          </button>

          <button
            onClick={() => setMode("friends")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition shrink-0 ${
              mode === "friends" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-300"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> フレンド
          </button>

          <button
            onClick={() => setMode("ai")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition shrink-0 ${
              mode === "ai" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-slate-700 border-slate-300"
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> AIモード
          </button>

          <div className="h-4 w-[1px] bg-slate-300 shrink-0" />

          {/* シチュエーションカテゴリ */}
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-full border transition shrink-0 ${
              selectedCategory === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300"
            }`}
          >
            すべて
          </button>

          <button
            onClick={() => setSelectedCategory(selectedCategory === "gourmet" ? "all" : "gourmet")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition shrink-0 ${
              selectedCategory === "gourmet" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-700 border-slate-300"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" /> グルメ
          </button>

          <button
            onClick={() => setSelectedCategory(selectedCategory === "rainy" ? "all" : "rainy")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition shrink-0 ${
              selectedCategory === "rainy" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-slate-700 border-slate-300"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" /> 雨の日OK
          </button>
        </div>
      </header>

      {/* 3. メインエリア */}
      <main className="flex-1 relative overflow-y-auto bg-slate-100">
        {/* 【マップタブ】 */}
        {activeTab === "map" && (
          <div className="w-full h-full relative">
            <iframe
              title="Map"
              src={`https://maps.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}&z=12&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
            ></iframe>

            {/* AIモード表示時のAIおすすめメッセージ */}
            {mode === "ai" && (
              <div className="absolute top-3 left-4 right-4 bg-purple-900/90 text-purple-100 backdrop-blur p-3 rounded-2xl shadow-xl text-xs flex items-center gap-2 border border-purple-500/30">
                <Bot className="w-5 h-5 text-purple-300 shrink-0" />
                <span>AIがあなたのお好み（{selectedCountry}周辺）に合わせて最適スポットを推薦中！</span>
              </div>
            )}

            {/* 行った場所のピンリスト */}
            <div className={`absolute left-4 right-4 flex gap-2 overflow-x-auto p-2 bg-white/80 backdrop-blur rounded-2xl shadow border border-slate-200 ${mode === "ai" ? "top-16" : "top-3"}`}>
              <span className="text-xs font-bold text-slate-600 self-center whitespace-nowrap pl-2">
                📍 行った場所:
              </span>
              {filteredPosts.map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  className="flex items-center gap-1.5 bg-white border border-slate-300 hover:border-blue-500 px-3 py-1.5 rounded-xl shadow-sm transition shrink-0 text-xs font-bold text-slate-700"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  {spot.title}
                </button>
              ))}
            </div>

            {/* ポップアップ */}
            {selectedSpot && (
              <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-2xl border border-slate-200">
                <button
                  onClick={() => setSelectedSpot(null)}
                  className="absolute top-3 right-3 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex gap-3">
                  <img src={selectedSpot.image} alt={selectedSpot.title} className="w-24 h-24 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      投稿者: {selectedSpot.author}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-1 truncate">{selectedSpot.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500" /> {selectedSpot.location}
                    </p>
                    <button
                      onClick={() => toggleSave(selectedSpot.id)}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                    >
                      {selectedSpot.saved ? "★ 保存済み" : "+ 保存する"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 【探すタブ】 */}
        {activeTab === "search" && (
          <div className="p-4 space-y-4 max-w-md mx-auto pb-20">
            <h2 className="text-base font-bold text-slate-800">投稿タイムライン</h2>
            <div className="grid gap-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="relative">
                    <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                    <button onClick={() => toggleSave(post.id)} className="absolute top-3 right-3 p-2 bg-white/80 rounded-full shadow">
                      <Bookmark className={`w-4 h-4 ${post.saved ? "fill-blue-600 text-blue-600" : ""}`} />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 text-base">{post.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" /> {post.location} （投稿者: {post.author}）
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <AdBanner />
          </div>
        )}

        {/* 【保存タブ】 */}
        {activeTab === "saved" && (
          <div className="p-4 max-w-md mx-auto pb-20">
            <h2 className="text-base font-bold text-slate-800 mb-4">保存したスポット</h2>
            <div className="grid gap-3">
              {posts.filter((p) => p.saved).map((post) => (
                <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-sm">
                  <img src={post.image} alt={post.title} className="w-20 h-20 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{post.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{post.location}</p>
                  </div>
                </div>
              ))}
            </div>
            <AdBanner />
          </div>
        )}

        {/* 【マイページタブ】 */}
        {activeTab === "profile" && (
          <div className="p-6 max-w-md mx-auto text-center pb-20">
            <div className="w-20 h-20 bg-blue-600 text-white font-bold text-2xl rounded-full mx-auto flex items-center justify-center shadow-lg mb-3">
              {username[0] || "U"}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{username}</h2>
            <p className="text-xs text-slate-400">@worldsnap_user</p>

            <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700">アカウント設定（変更可能）</h3>

              <div>
                <label className="text-xs text-slate-500 block mb-1">ユーザー名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    localStorage.setItem("worldsnap_username", e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">国籍・デフォルト地域</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    localStorage.setItem("worldsnap_country", e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800"
                >
                  {Object.entries(COUNTRY_COORDS).map(([code, data]) => (
                    <option key={code} value={code}>
                      {data.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <AdBanner />
          </div>
        )}
      </main>

      {/* 4. 新規投稿モーダル */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsPostModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-4">新しいスポットを投稿</h3>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setPostMethod("current")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold ${
                  postMethod === "current" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Crosshair className="w-4 h-4" /> その場で投稿
              </button>
              <button
                type="button"
                onClick={() => setPostMethod("map")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold ${
                  postMethod === "map" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-600"
                }`}
              >
                <MapPin className="w-4 h-4" /> マップのピン指定
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <input
                type="text"
                required
                placeholder="スポット名"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm"
              />
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg mt-4">
                投稿を共有する
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. 下部ナビゲーション */}
      <nav className="bg-white border-t border-slate-200 p-2 flex justify-around items-center z-10 shadow-lg">
        <button onClick={() => setActiveTab("map")} className={`flex flex-col items-center gap-1 py-1 px-3 ${activeTab === "map" ? "text-blue-600 font-bold" : "text-slate-400"}`}>
          <MapIcon className="w-5 h-5" /><span className="text-[10px]">マップ</span>
        </button>
        <button onClick={() => setActiveTab("search")} className={`flex flex-col items-center gap-1 py-1 px-3 ${activeTab === "search" ? "text-blue-600 font-bold" : "text-slate-400"}`}>
          <Compass className="w-5 h-5" /><span className="text-[10px]">探す</span>
        </button>
        <button onClick={() => setIsPostModalOpen(true)} className="bg-blue-600 text-white p-3 rounded-full shadow-lg -mt-5">
          <Plus className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab("saved")} className={`flex flex-col items-center gap-1 py-1 px-3 ${activeTab === "saved" ? "text-blue-600 font-bold" : "text-slate-400"}`}>
          <Bookmark className="w-5 h-5" /><span className="text-[10px]">保存</span>
        </button>
        <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center gap-1 py-1 px-3 ${activeTab === "profile" ? "text-blue-600 font-bold" : "text-slate-400"}`}>
          <User className="w-5 h-5" /><span className="text-[10px]">マイページ</span>
        </button>
      </nav>
    </div>
  );
}
