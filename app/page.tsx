"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

// Leaflet（地図）コンポーネントをSSR無効で動的インポート
const MapComponent = dynamic(() => import("../components/Map"), {
  ssr: false,
});

interface VideoRecord {
  id: string;
  author: string;
  title: string;
  lat: number;
  lng: number;
  category: string;
  mediaUrl: string | null;
}

const INITIAL_VIDEOS: VideoRecord[] = [
  { id: "v_101", author: "Taro", title: "渋谷スクランブル交差点", lat: 35.6595, lng: 139.7004, category: "観光", mediaUrl: null },
  { id: "v_102", author: "Ken", title: "京都 清水寺", lat: 34.9949, lng: 135.7850, category: "歴史", mediaUrl: null },
  { id: "v_103", author: "Yuki", title: "大阪 道頓堀", lat: 34.6687, lng: 135.5013, category: "グルメ", mediaUrl: null },
];

export default function Home() {
  const [videoDb, setVideoDb] = useState<VideoRecord[]>(INITIAL_VIDEOS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("すべて");

  // 投稿モーダル用
  const [showPostModal, setShowPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  return (
    <main style={{ padding: "20px" }}>
      <h1>WorldSnap App</h1>

      {/* 地図コンポーネントの表示 */}
      <div style={{ width: "100%", height: "400px", marginBottom: "20px" }}>
        <MapComponent />
      </div>

      {/* 簡易的な動画リスト表示 */}
      <h2>投稿一覧</h2>
      <ul>
        {videoDb.map((video) => (
          <li key={video.id}>
            <strong>{video.title}</strong> （{video.author}） - {video.category}
          </li>
        ))}
      </ul>
    </main>
  );
}
"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("../components/Map"), {
  ssr: false,
});

interface VideoRecord {
  id: string;
  author: string;
  title: string;
  lat: number;
  lng: number;
  category: string;
  mediaUrl: string | null;
}

const INITIAL_VIDEOS: VideoRecord[] = [
  { id: "v_101", author: "Taro", title: "渋谷スクランブル交差点", lat: 35.6595, lng: 139.7004, category: "観光", mediaUrl: null },
  { id: "v_102", author: "Ken", title: "京都 清水寺", lat: 34.9949, lng: 135.7850, category: "歴史", mediaUrl: null },
  { id: "v_103", author: "Yuki", title: "大阪 道頓堀", lat: 34.6687, lng: 135.5013, category: "グルメ", mediaUrl: null },
];

export default function Home() {
  const [videoDb, setVideoDb] = useState<VideoRecord[]>(INITIAL_VIDEOS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("すべて");

  // モーダルと入力フォームの状態
  const [showPostModal, setShowPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("観光");

  // 検索とカテゴリでの絞り込み
  const filteredVideos = videoDb.filter((video) => {
    const matchesSearch = video.title.includes(searchQuery) || video.author.includes(searchQuery);
    const matchesCategory = selectedCategory === "すべて" || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 新しい投稿を追加する処理
  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor) return;

    const newRecord: VideoRecord = {
      id: `v_${Date.now()}`,
      author: newAuthor,
      title: newTitle,
      lat: 35.6812, // デフォルト値（東京駅付近）
      lng: 139.7671,
      category: newCategory,
      mediaUrl: null,
    };

    setVideoDb([newRecord, ...videoDb]);
    setNewTitle("");
    setNewAuthor("");
    setShowPostModal(false); // モーダルを閉じる
  };

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>WorldSnap App</h1>

      {/* 1. 新規投稿ボタン */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => setShowPostModal(true)}
          style={{ padding: "10px 20px", backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          ＋ 新規投稿を作成
        </button>
      </div>

      {/* 2. 地図表示 */}
      <div style={{ width: "100%", height: "300px", marginBottom: "20px", border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" }}>
        <MapComponent />
      </div>

      {/* 3. 検索バーとカテゴリ切り替えボタン */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="タイトルや投稿者で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", flex: 1 }}
        />
        {["すべて", "観光", "歴史", "グルメ"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #0070f3",
              backgroundColor: selectedCategory === cat ? "#0070f3" : "#fff",
              color: selectedCategory === cat ? "#fff" : "#0070f3",
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. 投稿リスト */}
      <h2>投稿一覧 ({filteredVideos.length}件)</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredVideos.map((video) => (
          <li key={video.id} style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
            <strong>{video.title}</strong>
            <span style={{ color: "#666", fontSize: "0.9em", marginLeft: "10px" }}>
              投稿者: {video.author} | カテゴリ: {video.category}
            </span>
          </li>
        ))}
      </ul>

      {/* 5. 投稿モーダル（ボタンを押すと表示される画面） */}
      {showPostModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", width: "300px" }}>
            <h3>新しいスポットを投稿</h3>
            <form onSubmit={handleAddPost}>
              <div style={{ marginBottom: "10px" }}>
                <label>タイトル:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                  required
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>投稿者名:</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                  required
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label>カテゴリ:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                >
                  <option value="観光">観光</option>
                  <option value="歴史">歴史</option>
                  <option value="グルメ">グルメ</option>
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowPostModal(false)}>キャンセル</button>
                <button type="submit" style={{ backgroundColor: "#0070f3", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px" }}>追加</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
