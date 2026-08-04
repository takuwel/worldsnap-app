"use client";

import React, { useState } from "react";
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
  Filter,
  X,
  Globe,
  CloudRain,
  Utensils,
  Users,
  Eye,
} from "lucide-react";

// 国籍・地域ごとの初期座標データ
const COUNTRY_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  JP: { lat: 35.6812, lng: 139.7671, name: "日本 (東京)" },
  US: { lat: 40.7128, lng: -74.006, name: "アメリカ (ニューヨーク)" },
  FR: { lat: 48.8566, lng: 2.3522, name: "フランス (パリ)" },
  KR: { lat: 37.5665, lng: 126.978, name: "韓国 (ソウル)" },
  UK: { lat: 51.5074, lng: -0.1278, name: "イギリス (ロンドン)" },
};

export default function Home() {
  // 国籍選択状態（初期選択モーダル用）
  const [selectedCountry, setSelectedCountry] = useState<string>("JP");
  const [hasSelectedCountry, setHasSelectedCountry] = useState<boolean>(false);

  // タブ状態
  const [activeTab, setActiveTab] = useState<"map" | "search" | "saved" | "profile">("map");

  // フィルター状態
  const [mode, setMode] = useState<"public" | "friends">("public");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 新規投稿モーダルの開閉
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // サンプル投稿データ
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
      saved: false,
    },
  ]);

  // 新規投稿フォーム用の状態
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newCategory, setNewCategory] = useState("gourmet");
  const [newIsRainy, setNewIsRainy] = useState(false);
  const [newIsFriendOnly, setNewIsFriendOnly] = useState(false);

  // フィルター処理後の投稿一覧
  const filteredPosts = posts.filter((post) => {
    if (mode === "friends" && !post.isFriendOnly) return false;
    if (selectedCategory === "gourmet" && post.category !== "gourmet") return false;
    if (selectedCategory === "rainy" && !post.isRainyOk) return false;
    if (
      searchQuery &&
      !post.title.includes(searchQuery) &&
      !post.location.includes(searchQuery)
    )
      return false;
    return true;
  });

  // 保存（ブックマーク）の切り替え
  const toggleSave = (id: number) => {
    setPosts(
      posts.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p))
    );
  };

  // 投稿追加処理
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newPostObj = {
      id: Date.now(),
      title: newTitle,
      location: newLocation || "位置情報なし",
      category: newCategory,
      isRainyOk: newIsRainy,
      isFriendOnly: newIsFriendOnly,
      likes: 0,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
      saved: false,
    };

    setPosts([newPostObj, ...posts]);
    setIsPostModalOpen(false);
    setNewTitle("");
    setNewLocation("");
  };

  const currentCoords = COUNTRY_COORDS[selectedCountry] || COUNTRY_COORDS["JP"];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* 1. 初回国籍選択モーダル */}
      {!hasSelectedCountry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <Globe className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">国籍・地域を選択</h2>
            <p className="text-xs text-slate-500 mb-6">
              選択した地域のマップからスタートします（後からマイページで変更可能です）。
            </p>

            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(COUNTRY_COORDS).map(([code, data]) => (
                <option key={code} value={code}>
                  {data.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setHasSelectedCountry(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition"
            >
              スタートする
            </button>
          </div>
        </div>
      )}

      {/* 2. 上部ヘッダー & トグルスイッチ */}
      <header className="bg-white border-b border-slate-200 z-10 p-3 space-y-2 shadow-sm">
        {/* 検索バー */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="場所やキーワードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* トグルスイッチ（横スクロールチップ） */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs font-semibold">
          {/* パブリック / フレンド切替 */}
          <button
            onClick={() => setMode(mode === "public" ? "friends" : "public")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition shrink-0 ${
              mode === "friends"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            {mode === "friends" ? <Users className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {mode === "friends" ? "フレンド限定" : "パブリック"}
          </button>

          <div className="h-4 w-[1px] bg-slate-300 shrink-0" />

          {/* ジャンルチップ */}
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-full border transition shrink-0 ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            すべて
          </button>

          <button
            onClick={() => setSelectedCategory(selectedCategory === "gourmet" ? "all" : "gourmet")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition shrink-0 ${
              selectedCategory === "gourmet"
                ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            グルメ
          </button>

          <button
            onClick={() => setSelectedCategory(selectedCategory === "rainy" ? "all" : "rainy")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition shrink-0 ${
              selectedCategory === "rainy"
                ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            雨の日OK
          </button>
        </div>
      </header>

      {/* 3. メインコンテンツエリア */}
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

            {/* スポット案内カード */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-2xl shadow-xl flex items-center gap-3">
              <img
                src={filteredPosts[0]?.image || "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop"}
                alt="spot"
                className="w-14 h-14 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                    注目スポット
                  </span>
                  {filteredPosts[0]?.isFriendOnly && (
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                      フレンド限定
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-800 truncate mt-0.5">
                  {filteredPosts[0]?.title || "周辺の注目スポット"}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-red-500" /> {filteredPosts[0]?.location || currentCoords.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 【探すタブ】 */}
        {activeTab === "search" && (
          <div className="p-4 space-y-4 max-w-md mx-auto pb-20">
            <h2 className="text-base font-bold text-slate-800 flex items-center justify-between">
              <span>投稿タイムライン</span>
              <span className="text-xs font-normal text-slate-500">{filteredPosts.length}件表示</span>
            </h2>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>条件に該当する投稿が見つかりませんでした。</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    <div className="relative">
                      <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                      <button
                        onClick={() => toggleSave(post.id)}
                        className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full shadow text-slate-700 hover:text-blue-600"
                      >
                        <Bookmark className={`w-4 h-4 ${post.saved ? "fill-blue-600 text-blue-600" : ""}`} />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex gap-2 mb-2">
                        {post.isFriendOnly && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">
                            フレンド限定
                          </span>
                        )}
                        {post.isRainyOk && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                            雨の日OK
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">{post.title}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" /> {post.location}
                      </p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-slate-500 text-xs">
                        <span className="flex items-center gap-1 text-red-500 font-medium">
                          <Heart className="w-4 h-4 fill-red-500" /> {post.likes}
                        </span>
                        <button className="hover:text-blue-600">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 【保存タブ】 */}
        {activeTab === "saved" && (
          <div className="p-4 max-w-md mx-auto pb-20">
            <h2 className="text-base font-bold text-slate-800 mb-4">保存したスポット</h2>
            {posts.filter((p) => p.saved).length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Bookmark className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">保存されたスポットはありません</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {posts
                  .filter((p) => p.saved)
                  .map((post) => (
                    <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-sm">
                      <img src={post.image} alt={post.title} className="w-20 h-20 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 truncate">{post.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" /> {post.location}
                        </p>
                        <button
                          onClick={() => toggleSave(post.id)}
                          className="mt-3 text-xs text-red-500 font-medium hover:underline"
                        >
                          保存解除
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 【マイページタブ】 */}
        {activeTab === "profile" && (
          <div className="p-6 max-w-md mx-auto text-center pb-20">
            <div className="w-20 h-20 bg-blue-600 text-white font-bold text-2xl rounded-full mx-auto flex items-center justify-center shadow-lg mb-3">
              U
            </div>
            <h2 className="text-lg font-bold text-slate-800">ユーザー設定</h2>
            <p className="text-xs text-slate-400">@user_worldsnap</p>

            <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700">エリア・国籍設定</h3>
              <div>
                <label className="text-xs text-slate-500 block mb-1">デフォルト表示地域</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* 4. 新規投稿モーダル */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-4">新しいスポットを共有</h3>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">スポット名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 表参道のカフェ"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">場所・エリア</label>
                <input
                  type="text"
                  placeholder="例: 東京都 渋谷区"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsRainy}
                    onChange={(e) => setNewIsRainy(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  雨の日OK
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsFriendOnly}
                    onChange={(e) => setNewIsFriendOnly(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  フレンド限定
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition mt-4"
              >
                投稿する
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. 下部ナビゲーションバー */}
      <nav className="bg-white border-t border-slate-200 p-2 flex justify-around items-center z-10 shadow-lg">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
            activeTab === "map" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px]">マップ</span>
        </button>

        <button
          onClick={() => setActiveTab("search")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
            activeTab === "search" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">探す</span>
        </button>

        {/* ＋投稿ボタン */}
        <button
          onClick={() => setIsPostModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg shadow-blue-500/30 -mt-5 transition transform active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab("saved")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
            activeTab === "saved" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px]">保存</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
            activeTab === "profile" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">マイページ</span>
        </button>
      </nav>
    </div>
  );
}
