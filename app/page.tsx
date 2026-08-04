"use client";

import React, { useState } from "react";
import { Search, Compass, MapPin, Plus, Bookmark, User, Map, Heart, Share2, Filter } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"map" | "search" | "saved" | "profile">("map");
  const [searchQuery, setSearchQuery] = useState("");

  // サンプル投稿データ
  const samplePosts = [
    {
      id: 1,
      title: "エッフェル塔前のオシャレカフェ",
      location: "パリ, フランス",
      category: "カフェ",
      likes: 124,
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "隠れ家イタリアンレストラン",
      location: "東京都 港区",
      category: "グルメ",
      likes: 89,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "夜景が綺麗な展望スポット",
      location: "横浜市",
      category: "観光",
      likes: 210,
      image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop",
    },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-white overflow-hidden font-sans">
      {/* 上部ヘッダー / 検索バー */}
      <header className="p-4 bg-slate-800/80 backdrop-blur border-b border-slate-700 z-10 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="場所や投稿を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-700/60 border border-slate-600 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button className="p-2 bg-slate-700 rounded-full text-slate-300 hover:text-white">
          <Filter className="w-5 h-5" />
        </button>
      </header>

      {/* メインコンテンツエリア（タブによって切り替え） */}
      <main className="flex-1 relative overflow-y-auto">
        {/* 1. マップ表示タブ */}
        {activeTab === "map" && (
          <div className="w-full h-full relative">
            {/* Googleマップ風埋め込みマップ（デフォルトで日本近郊表示） */}
            <iframe
              title="Map"
              src="https://maps.google.com/maps?q=35.6812,139.7671&z=12&output=embed"
              className="w-full h-full border-0 filter opacity-90 grayscale-[20%] contrast-[110%]"
              loading="lazy"
            ></iframe>

            {/* マップ上のフローティングカード（サンプルスポット情報） */}
            <div className="absolute bottom-6 left-4 right-4 bg-slate-800/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl flex items-center gap-4">
              <img
                src={samplePosts[0].image}
                alt="spot"
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                  {samplePosts[0].category}
                </span>
                <h3 className="text-sm font-bold text-white truncate mt-1">
                  {samplePosts[0].title}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-red-400" /> {samplePosts[0].location}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. 探す（タイムライン・カード一覧）タブ */}
        {activeTab === "search" && (
          <div className="p-4 space-y-4 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-200">話題のスポットを探す</h2>
            <div className="grid gap-4">
              {samplePosts.map((post) => (
                <div key={post.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                  <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          {post.category}
                        </span>
                        <h3 className="font-bold text-base mt-1">{post.title}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-red-400" /> {post.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <button className="flex items-center gap-1 text-xs hover:text-red-400">
                          <Heart className="w-4 h-4" /> {post.likes}
                        </button>
                        <button className="hover:text-blue-400">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. 保存済みタブ */}
        {activeTab === "saved" && (
          <div className="p-4 text-center text-slate-400 py-16">
            <Bookmark className="w-12 h-12 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">保存したスポットはまだありません</p>
            <p className="text-xs text-slate-500 mt-1">気になった投稿をブックマークしてみましょう</p>
          </div>
        )}

        {/* 4. マイページタブ */}
        {activeTab === "profile" && (
          <div className="p-6 max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold border-2 border-slate-700 shadow-xl">
              U
            </div>
            <h2 className="text-lg font-bold mt-3">ユーザーアカウント</h2>
            <p className="text-xs text-slate-400">@user_worldsnap</p>

            <div className="flex justify-center gap-6 my-6 border-y border-slate-800 py-4 text-center">
              <div>
                <p className="font-bold text-base">0</p>
                <p className="text-xs text-slate-400">投稿</p>
              </div>
              <div>
                <p className="font-bold text-base">12</p>
                <p className="text-xs text-slate-400">保存済み</p>
              </div>
              <div>
                <p className="font-bold text-base">5</p>
                <p className="text-xs text-slate-400">行った場所</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 下部ナビゲーションバー（タブ切り替え対応） */}
      <nav className="bg-slate-800/90 backdrop-blur border-t border-slate-700 p-2 flex justify-around items-center z-10">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
            activeTab === "map" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px]">マップ</span>
        </button>

        <button
          onClick={() => setActiveTab("search")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
            activeTab === "search" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">探す</span>
        </button>

        {/* 中央の新規投稿ボタン */}
        <button
          onClick={() => alert("投稿画面を開きます")}
          className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg shadow-blue-600/40 -mt-5 transition transform active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab("saved")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
            activeTab === "saved" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px]">保存</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
            activeTab === "profile" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">マイページ</span>
        </button>
      </nav>
    </div>
  );
}
