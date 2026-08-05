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
  Camera,
  Video,
  Image as ImageIcon,
  RotateCcw,
  Timer,
  ExternalLink,
  CheckSquare,
  Square,
  UserPlus,
  Check,
  Lock,
  Sparkles,
  ArrowUpDown,
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
  // 初回プロフィール
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

  // メインナビゲーション & モード
  const [activeTab, setActiveTab] = useState<"map" | "search" | "saved" | "profile">("map");
  const [mainMode, setMainMode] = useState<"public" | "friends" | "private">("public");
  const [publicSubCategory, setPublicSubCategory] = useState<"normal" | "rainy" | "food">("normal");
  const [searchQuery, setSearchQuery] = useState("");

  // サンプル投稿データ（マップピン・サムネイル用）
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "エッフェル塔前の絶景スポット",
      location: "パリ, フランス",
      category: "normal",
      modes: ["public", "normal"],
      views: 15400,
      likes: 1240,
      createdAt: "2026-08-01",
      mediaType: "video",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop",
      author: "Takuya",
      saved: false,
    },
    {
      id: 2,
      title: "絶品和牛ランチイタリアン",
      location: "東京都 港区",
      category: "food",
      modes: ["public", "food", "friends"],
      views: 8900,
      likes: 890,
      createdAt: "2026-08-04",
      mediaType: "video",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop",
      author: "Ken",
      saved: true,
    },
    {
      id: 3,
      title: "雨の日でも楽しめる癒しの水族館",
      location: "東京都 江東区",
      category: "rainy",
      modes: ["public", "rainy"],
      views: 21000,
      likes: 3100,
      createdAt: "2026-08-05",
      mediaType: "photo",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop",
      author: "Yuki",
      saved: false,
    },
  ]);

  // ピン選択 & 詳細モーダル
  const [selectedSpotPin, setSelectedSpotPin] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<"video" | "photo">("video");
  const [sortBy, setSortBy] = useState<"views" | "newest" | "likes">("views");

  // 投稿フロー（カメラ ➔ フォーム ➔ AI審査）
  const [isPostFlowOpen, setIsPostFlowOpen] = useState(false);
  const [postStep, setPostStep] = useState<"camera" | "form" | "ai_check">("camera");

  // カメラ状態
  const [cameraType, setCameraType] = useState<"video" | "photo">("video");
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [zoomLevel, setZoomLevel] = useState<"0.5x" | "1x" | "2x">("1x");
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 10>(0);

  // 投稿フォーム状態
  const [newTitle, setNewTitle] = useState("");
  const [selectedModes, setSelectedModes] = useState<string[]>(["public", "normal"]);

  // フレンド申請モーダル
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [friendRequests, setFriendRequests] = useState([
    { id: 101, name: "サトシ", code: "FRIEND-8821" },
  ]);

  // フィルター
  const filteredPosts = posts.filter((post) => {
    if (!post.modes.includes(mainMode)) return false;
    if (mainMode === "public" && !post.modes.includes(publicSubCategory)) return false;
    if (searchQuery && !post.title.includes(searchQuery) && !post.location.includes(searchQuery)) return false;
    return true;
  });

  const toggleSave = (id: number) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)));
  };

  // モードチェックの切り替え
  const toggleModeSelection = (modeKey: string) => {
    if (selectedModes.includes(modeKey)) {
      setSelectedModes(selectedModes.filter((m) => m !== modeKey));
    } else {
      setSelectedModes([...selectedModes, modeKey]);
    }
  };

  // 投稿実行（AI審査シミュレーション）
  const handleStartPostCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || selectedModes.length === 0) return;
    setPostStep("ai_check");

    setTimeout(() => {
      const newPostObj = {
        id: Date.now(),
        title: newTitle,
        location: `${COUNTRY_COORDS[selectedCountry]?.name || "指定地"} (エイム位置)`,
        category: selectedModes.includes("food") ? "food" : selectedModes.includes("rainy") ? "rainy" : "normal",
        modes: selectedModes,
        views: 1,
        likes: 0,
        createdAt: "2026-08-05",
        mediaType: cameraType,
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
        author: username,
        saved: false,
      };

      setPosts([newPostObj, ...posts]);
      setPostStep("camera");
      setIsPostFlowOpen(false);
      setNewTitle("");
      setSelectedModes(["public", "normal"]);
    }, 2000);
  };

  const currentCoords = COUNTRY_COORDS[selectedCountry] || COUNTRY_COORDS["JP"];

  // 並び替え処理
  const getSortedDetailPosts = () => {
    let list = [...posts].filter((p) => p.mediaType === activeMediaTab);
    if (sortBy === "views") list.sort((a, b) => b.views - a.views);
    if (sortBy === "likes") list.sort((a, b) => b.likes - a.likes);
    if (sortBy === "newest") list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return list;
  };

  // 広告バナーコンポーネント（最下部固定ナビの上に常時設置）
  const PermanentAdBanner = () => (
    <div className="w-full bg-slate-200/80 border-t border-slate-300 py-1 px-3 text-center">
      <span className="text-[8px] font-bold text-slate-400 block tracking-wider uppercase">
        スポンサーリンク / ADVERTISEMENT
      </span>
      <div className="h-9 bg-slate-300/80 rounded flex items-center justify-center text-slate-600 text-[11px] font-medium border border-dashed border-slate-400">
        Google AdSense 広告枠スペース (320x50)
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* 1. 初回設定モーダル */}
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

      {/* 2. 最上部ヘッダー（中央モード切替・右上パブリックサブメニュー） */}
      <header className="bg-white border-b border-slate-200 z-10 p-2 shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* 検索バー */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="場所・キーワード..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-800"
            />
          </div>

          {/* 右上：パブリックモード時のサブカテゴリ切替（ノーマル/景色、雨の日、フード） */}
          {mainMode === "public" && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-[11px] font-bold">
              <button
                onClick={() => setPublicSubCategory("normal")}
                className={`px-2 py-1 rounded-full transition ${publicSubCategory === "normal" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                景色
              </button>
              <button
                onClick={() => setPublicSubCategory("rainy")}
                className={`px-2 py-1 rounded-full transition ${publicSubCategory === "rainy" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                雨の日
              </button>
              <button
                onClick={() => setPublicSubCategory("food")}
                className={`px-2 py-1 rounded-full transition ${publicSubCategory === "food" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"}`}
              >
                フード
              </button>
            </div>
          )}
        </div>

        {/* 最上部中央：モード切替（パブリック / フレンド / プライベート） */}
        <div className="flex justify-center border-t border-slate-100 pt-1">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setMainMode("public")}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-lg transition ${
                mainMode === "public" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> パブリック
            </button>
            <button
              onClick={() => setMainMode("friends")}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-lg transition ${
                mainMode === "friends" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> フレンド
            </button>
            <button
              onClick={() => setMainMode("private")}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-lg transition ${
                mainMode === "private" ? "bg-slate-800 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> プライベート
            </button>
          </div>
        </div>
      </header>

      {/* 3. メインコンテンツ */}
      <main className="flex-1 relative overflow-y-auto bg-slate-100">
        {/* 【マップタブ】 */}
        {activeTab === "map" && (
          <div className="w-full h-full relative">
            {/* Googleマップ風画面 */}
            <iframe
              title="Map"
              src={`https://maps.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}&z=14&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
            ></iframe>

            {/* 中央のエイム（照準） */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <Crosshair className="w-10 h-10 text-red-500 animate-pulse" />
                <div className="w-2 h-2 bg-red-600 rounded-full absolute" />
              </div>
            </div>

            {/* マップ上のインタラクティブ・ピン（投稿スポット） */}
            <div className="absolute top-3 left-3 right-3 flex gap-2 overflow-x-auto p-2 bg-white/90 backdrop-blur rounded-2xl shadow border border-slate-200">
              <span className="text-xs font-bold text-slate-600 self-center whitespace-nowrap pl-1">
                📍 ピン一覧:
              </span>
              {filteredPosts.map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => setSelectedSpotPin(spot)}
                  className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    selectedSpotPin?.id === spot.id
                      ? "bg-red-50 border-red-500 text-red-600 scale-105 shadow-md"
                      : "bg-white border-slate-300 text-slate-700 hover:border-blue-500"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  {spot.title}
                </button>
              ))}
            </div>

            {/* ピンを押した時の膨らむサムネイル＆詳細ボタン */}
            {selectedSpotPin && (
              <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-2xl border-2 border-blue-500 animate-in zoom-in-95 duration-200">
                <button
                  onClick={() => setSelectedSpotPin(null)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex gap-3 items-center">
                  <div className="relative group cursor-pointer" onClick={() => setIsDetailModalOpen(true)}>
                    <img
                      src={selectedSpotPin.image}
                      alt={selectedSpotPin.title}
                      className="w-24 h-24 rounded-xl object-cover shadow-md border-2 border-blue-400 transition transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      再生数最多
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      投稿者: {selectedSpotPin.author}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 truncate">{selectedSpotPin.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedSpotPin.location}</p>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setIsDetailModalOpen(true)}
                        className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-blue-700 transition"
                      >
                        動画・写真を見る
                      </button>
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              selectedSpotPin.title + " " + selectedSpotPin.location
                            )}`,
                            "_blank"
                          )
                        }
                        className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1 hover:bg-slate-200"
                      >
                        <ExternalLink className="w-3 h-3" /> Googleマップ
                      </button>
                    </div>
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
                    <button
                      onClick={() => toggleSave(post.id)}
                      className="absolute top-3 right-3 p-2 bg-white/80 rounded-full shadow"
                    >
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
          </div>
        )}

        {/* 【保存タブ】 */}
        {activeTab === "saved" && (
          <div className="p-4 max-w-md mx-auto pb-20">
            <h2 className="text-base font-bold text-slate-800 mb-4">保存したスポット・動画</h2>
            <div className="grid gap-3">
              {posts.filter((p) => p.saved).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">保存された投稿はありません</p>
              ) : (
                posts
                  .filter((p) => p.saved)
                  .map((post) => (
                    <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-sm">
                      <img src={post.image} alt={post.title} className="w-20 h-20 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 truncate">{post.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{post.location}</p>
                        <button
                          onClick={() => toggleSave(post.id)}
                          className="mt-2 text-xs text-red-500 font-bold hover:underline"
                        >
                          保存解除
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* 【マイページタブ】（フレンド申請機能含む） */}
        {activeTab === "profile" && (
          <div className="p-6 max-w-md mx-auto text-center pb-20">
            <div className="w-20 h-20 bg-blue-600 text-white font-bold text-2xl rounded-full mx-auto flex items-center justify-center shadow-lg mb-3">
              {username[0] || "U"}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{username}</h2>
            <p className="text-xs text-slate-400">@worldsnap_user</p>

            {/* フレンドを探すボタン */}
            <button
              onClick={() => setIsFriendModalOpen(true)}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 text-xs transition"
            >
              <UserPlus className="w-4 h-4" /> フレンドを探す・承認
              {friendRequests.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {friendRequests.length}
                </span>
              )}
            </button>

            <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700">アカウント設定</h3>
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
          </div>
        )}
      </main>

      {/* 4. 動画・写真一覧モーダル（並び替え・Googleマップボタン・保存機能付き） */}
      {isDetailModalOpen && selectedSpotPin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* モーダルヘッダー */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedSpotPin.title}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-red-500" /> {selectedSpotPin.location}
                </p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Googleマップリンク & メディア切り替え */}
            <div className="p-3 bg-slate-100 flex items-center justify-between gap-2 border-b border-slate-200">
              {/* 動画 / 写真 切替（ベースは動画） */}
              <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveMediaTab("video")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                    activeMediaTab === "video" ? "bg-white text-blue-600 shadow" : "text-slate-600"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" /> 動画
                </button>
                <button
                  onClick={() => setActiveMediaTab("photo")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                    activeMediaTab === "photo" ? "bg-white text-blue-600 shadow" : "text-slate-600"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> 写真
                </button>
              </div>

              {/* 並び替えボタン */}
              <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                >
                  <option value="views">再生回数順</option>
                  <option value="newest">新着順</option>
                  <option value="likes">いいね数順</option>
                </select>
              </div>
            </div>

            {/* 投稿グリッド表示 */}
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 gap-3">
              {getSortedDetailPosts().map((item) => (
                <div key={item.id} className="bg-slate-900 rounded-xl overflow-hidden relative shadow group">
                  <img src={item.image} alt={item.title} className="w-full h-36 object-cover opacity-90" />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => toggleSave(item.id)}
                      className="p-1.5 bg-black/60 backdrop-blur rounded-full text-white"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${item.saved ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </button>
                  </div>
                  <div className="p-2 bg-slate-900 text-white text-[11px]">
                    <p className="font-bold truncate">{item.title}</p>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>再生: {item.views.toLocaleString()}</span>
                      <span>❤️ {item.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* モーダル最下部：Googleマップ直行ボタン */}
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      selectedSpotPin.title + " " + selectedSpotPin.location
                    )}`,
                    "_blank"
                  )
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 text-xs transition"
              >
                <ExternalLink className="w-4 h-4" /> Googleマップアプリでこの場所を開く
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. iPhone風フル機能カメラ & 投稿フロー */}
      {isPostFlowOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 text-white">
          {/* カメラ画面トップヘッダー */}
          {postStep === "camera" && (
            <>
              <div className="flex justify-between items-center z-10">
                <button
                  onClick={() => setTimerSeconds(timerSeconds === 0 ? 3 : timerSeconds === 3 ? 10 : 0)}
                  className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1.5 rounded-full backdrop-blur"
                >
                  <Timer className="w-4 h-4" />
                  {timerSeconds === 0 ? "タイマーOFF" : `${timerSeconds}秒`}
                </button>

                <button
                  onClick={() => setIsPostFlowOpen(false)}
                  className="p-2 bg-white/20 rounded-full backdrop-blur"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* カメラファインダー中央 */}
              <div className="relative flex-1 my-4 bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center border border-slate-800">
                <p className="text-slate-500 text-xs text-center px-4">
                  iPhoneカメラ起動中 ({cameraFacing === "environment" ? "外カメラ" : "内カメラ"})<br />
                  ズーム: {zoomLevel}
                </p>
                {/* ズーム選択ボタン */}
                <div className="absolute bottom-4 flex gap-3 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur text-xs font-bold">
                  {(["0.5x", "1x", "2x"] as const).map((z) => (
                    <button
                      key={z}
                      onClick={() => setZoomLevel(z)}
                      className={zoomLevel === z ? "text-yellow-400 font-extrabold" : "text-slate-300"}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              {/* 下部カメラコントロール */}
              <div className="space-y-4 pb-4">
                {/* モード切替（動画 / 写真） */}
                <div className="flex justify-center gap-6 text-xs font-bold tracking-widest">
                  <button
                    onClick={() => setCameraType("video")}
                    className={cameraType === "video" ? "text-yellow-400 font-extrabold" : "text-slate-500"}
                  >
                    ビデオ
                  </button>
                  <button
                    onClick={() => setCameraType("photo")}
                    className={cameraType === "photo" ? "text-yellow-400 font-extrabold" : "text-slate-500"}
                  >
                    写真
                  </button>
                </div>

                {/* シャッター＆サイドボタン */}
                <div className="flex justify-around items-center">
                  {/* 左下：写真フォルダ（アクセス許可風動作） */}
                  <button
                    onClick={() => alert("「WorldSnap」が写真ライブラリへのアクセスを求めています ➔ 許可されました")}
                    className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center"
                  >
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  </button>

                  {/* シャッターボタン */}
                  <button
                    onClick={() => setPostStep("form")}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-95 transition"
                  >
                    <div className={`w-full h-full rounded-full ${cameraType === "video" ? "bg-red-600" : "bg-white"}`} />
                  </button>

                  {/* 右下：イン/アウトカメラ切り替え */}
                  <button
                    onClick={() => setCameraFacing(cameraFacing === "environment" ? "user" : "environment")}
                    className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center"
                  >
                    <RotateCcw className="w-5 h-5 text-slate-300" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 投稿設定フォームステップ */}
          {postStep === "form" && (
            <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-md w-full mx-auto my-auto shadow-2xl space-y-4">
              <h3 className="font-bold text-lg text-slate-900 border-b pb-2">投稿情報の入力</h3>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">タイトル・スポット名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 表参道の隠れ家カフェ"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 投稿先マップモード（✅複数選択可能） */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">
                  投稿先のマップを選択（※1つ以上✅が必要）
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {[
                    { key: "public", label: "パブリック" },
                    { key: "normal", label: "景色（ノーマル）" },
                    { key: "rainy", label: "雨の日OK" },
                    { key: "food", label: "フード" },
                    { key: "friends", label: "フレンド限定" },
                    { key: "private", label: "プライベート" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleModeSelection(item.key)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                        selectedModes.includes(item.key)
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {selectedModes.includes(item.key) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setPostStep("camera")}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
                >
                  やり直す
                </button>
                <button
                  onClick={handleStartPostCheck}
                  disabled={!newTitle || selectedModes.length === 0}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl shadow text-xs transition"
                >
                  AI審査へ進む
                </button>
              </div>
            </div>
          )}

          {/* AIコンプライアンス審査中ステップ */}
          {postStep === "ai_check" && (
            <div className="bg-white text-slate-800 rounded-3xl p-8 max-w-sm w-full mx-auto my-auto shadow-2xl text-center space-y-4">
              <Sparkles className="w-12 h-12 text-purple-600 mx-auto animate-spin" />
              <h3 className="font-bold text-lg text-slate-900">AIコンプライアンス自動審査中</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                動画・写真の安全性をチェックしています。<br />
                不適切なコンテンツが含まれていないかAIが検証中です...
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full w-3/4 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. フレンド申請・承認モーダル */}
      {isFriendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsFriendModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">フレンド検索・承認</h3>

            {/* フレンドコード入力 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">フレンドコードを入力して申請</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="例: FRIEND-1234"
                  value={friendCodeInput}
                  onChange={(e) => setFriendCodeInput(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs uppercase"
                />
                <button
                  onClick={() => {
                    if (friendCodeInput) {
                      alert(`フレンドコード「${friendCodeInput}」へ申請を送信しました！`);
                      setFriendCodeInput("");
                    }
                  }}
                  className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                >
                  申請
                </button>
              </div>
            </div>

            {/* 届いている申請一覧 */}
            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-700 mb-2">届いている申請 ({friendRequests.length}件)</h4>
              {friendRequests.map((req) => (
                <div key={req.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-xs text-slate-800">{req.name}</p>
                    <p className="text-[10px] text-slate-400">{req.code}</p>
                  </div>
                  <button
                    onClick={() => {
                      alert(`${req.name} さんとフレンドになりました！フレンドマップで共有可能です。`);
                      setFriendRequests(friendRequests.filter((r) => r.id !== req.id));
                    }}
                    className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow"
                  >
                    <Check className="w-3.5 h-3.5" /> 承認する
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. 最下部固定広告バナー（ナビの上） */}
      <PermanentAdBanner />

      {/* 8. 下部メインナビゲーション（真ん中はエイム投稿ボタン） */}
      <nav className="bg-white border-t border-slate-200 p-2 flex justify-around items-center z-10 shadow-lg">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            activeTab === "map" ? "text-blue-600 font-bold" : "text-slate-400"
          }`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px]">マップ</span>
        </button>

        <button
          onClick={() => setActiveTab("search")}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            activeTab === "search" ? "text-blue-600 font-bold" : "text-slate-400"
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">探す</span>
        </button>

        {/* 中央の＋ボタン（エイム指定位置にカメラ投稿） */}
        <button
          onClick={() => {
            setPostStep("camera");
            setIsPostFlowOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-lg shadow-blue-500/40 -mt-6 transition transform active:scale-95 border-2 border-white"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab("saved")}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            activeTab === "saved" ? "text-blue-600 font-bold" : "text-slate-400"
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px]">保存</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            activeTab === "profile" ? "text-blue-600 font-bold" : "text-slate-400"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">マイページ</span>
        </button>
      </nav>
    </div>
  );
}
