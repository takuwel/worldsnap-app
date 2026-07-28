"use client";

import React, { useState } from "react";

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
  { id: "v_103", author: "Yuki", title: "大阪 道頓堀", lat: 34.6687, lng: 135.5013, category: "グルメ", mediaUrl: null }
];

export default function Home() {
  const [videoDb, setVideoDb] = useState<VideoRecord[]>(INITIAL_VIDEOS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("すべて");

  // 投稿モーダル用
  const [showPostModal, setShowPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("観光");
  const [newMediaUrl, setNewMediaUrl] = useState<string | null>(null);

  // 位置情報
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 📍 GPS現在地取得
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          alert(`現在地を取得しました！\n緯度: ${latitude.toFixed(4)}, 経度: ${longitude.toFixed(4)}`);
        },
        () => alert("位置情報の取得に失敗しました。")
      );
    } else {
      alert("お使いのブラウザは位置情報をサポートしていません。");
    }
  };

  // 📸 ファイル選択
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewMediaUrl(URL.createObjectURL(file));
    }
  };

  // 📝 投稿処理
  const handleAddPost = () => {
    if (!newTitle || !newAuthor) {
      alert("タイトルと投稿者名を入力してください！");
      return;
    }

    const lat = userLocation ? userLocation.lat : 35.6812 + (Math.random() - 0.5) * 0.05;
    const lng = userLocation ? userLocation.lng : 139.7671 + (Math.random() - 0.5) * 0.05;

    const newRecord: VideoRecord = {
      id: `v_${Date.now()}`,
      author: newAuthor,
      title: newTitle,
      category: newCategory,
      lat,
      lng,
      mediaUrl: newMediaUrl,
    };

    setVideoDb([newRecord, ...videoDb]);
    setShowPostModal(false);
    setNewTitle("");
    setNewAuthor("");
    setNewMediaUrl(null);
    alert("新しいスポットを投稿しました！");
  };

  const filteredVideos = videoDb.filter((item) => {
    const matchesSearch = item.title.includes(searchQuery) || item.author.includes(searchQuery);
    const matchesCategory = selectedCategory === "すべて" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h1 style={{ margin: 0 }}>🌍 WorldSnap Live Map</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleGetLocation} style={{ padding: "10px 16px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            📍 現在地を取得
          </button>
          <button onClick={() => setShowPostModal(true)} style={{ padding: "10px 16px", backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            📸 投稿する
          </button>
        </div>
      </header>

      {/* 検索・フィルター */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="🔍 タイトルや投稿者で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", backgroundColor: "white" }}
        >
          <option value="すべて">すべてのカテゴリー</option>
          <option value="観光">観光</option>
          <option value="グルメ">グルメ</option>
          <option value="歴史">歴史</option>
        </select>
      </div>

      {userLocation && (
        <div style={{ padding: "12px", backgroundColor: "#ECFDF5", color: "#065F46", borderRadius: "8px", marginBottom: "20px" }}>
          📍 取得した現在地: 緯度 {userLocation.lat.toFixed(4)}, 経度 {userLocation.lng.toFixed(4)}
        </div>
      )}

      {/* 投稿スポット一覧カード */}
      <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>📍 スポット一覧 ({filteredVideos.length}件)</h2>
      <div style={{ display: "grid", gap: "12px" }}>
        {filteredVideos.map((item) => (
          <div key={item.id} style={{ border: "1px solid #e5e7eb", padding: "16px", borderRadius: "12px", backgroundColor: "#f9fafb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", background: "#E0E7FF", color: "#3730A3", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>{item.category}</span>
              <span style={{ fontSize: "12px", color: "#6B7280" }}>位置: {item.lat}, {item.lng}</span>
            </div>
            <h3 style={{ margin: "8px 0 4px 0" }}>{item.title}</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#4B5563" }}>投稿者: {item.author}</p>
            {item.mediaUrl && (
              <div style={{ marginTop: "12px" }}>
                <img src={item.mediaUrl} alt={item.title} style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 投稿モーダル */}
      {showPostModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", width: "90%", maxWidth: "400px" }}>
            <h2 style={{ marginTop: 0 }}>📸 新しいスポットを投稿</h2>
            
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>タイトル</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="例: 東京タワー" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>投稿者名</label>
              <input type="text" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder="例: たく" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>カテゴリー</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}>
                <option value="観光">観光</option>
                <option value="グルメ">グルメ</option>
                <option value="歴史">歴史</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>写真 / 動画</label>
              <input type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ width: "100%" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setShowPostModal(false)} style={{ padding: "8px 16px", backgroundColor: "#eee", border: "none", borderRadius: "6px", cursor: "pointer" }}>キャンセル</button>
              <button onClick={handleAddPost} style={{ padding: "8px 16px", backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>投稿する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
