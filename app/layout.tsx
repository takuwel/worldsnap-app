"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Leaflet（地図）をSSRエラー回避のために動的インポート
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
  const [isClient, setIsClient] = useState(false);
  const [customIcon, setCustomIcon] = useState<any>(null);

  // 検索・フィルター用ステート
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("すべて");

  // 投稿モーダル用ステート
  const [showPostModal, setShowPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("観光");
  const [newMediaUrl, setNewMediaUrl] = useState<string | null>(null);

  // 現在地用ステート
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    setIsClient(true);
    import("leaflet").then((L) => {
      // Leafletアイコンのパス修正
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      setCustomIcon(icon);
    });
  }, []);

  // 📍 現在地（GPS）取得機能
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          alert(`現在地を取得しました！\n緯度: ${latitude}, 経度: ${longitude}`);
        },
        (error) => {
          alert("位置情報の取得に失敗しました。ブラウザの位置情報許可を確認してください。");
        }
      );
    } else {
      alert("お使いのブラウザは位置情報をサポートしていません。");
    }
  };

  // 📸 写真・動画の選択（ファイル読み込み）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewMediaUrl(url);
    }
  };

  // 📝 新規投稿機能
  const handleAddPost = () => {
    if (!newTitle || !newAuthor) {
      alert("タイトルと投稿者名を入力してください！");
      return;
    }

    // 現在地がある場合はその場所、ない場合はデフォルト（東京駅付近）に配置
    const lat = userLocation ? userLocation[0] : 35.6812 + (Math.random() - 0.5) * 0.05;
    const lng = userLocation ? userLocation[1] : 139.7671 + (Math.random() - 0.5) * 0.05;

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

    // フォームリセット
    setNewTitle("");
    setNewAuthor("");
    setNewMediaUrl(null);
    alert("マップに投稿が追加されました！");
  };

  // 🔍 検索・フィルター処理
  const filteredVideos = videoDb.filter((item) => {
    const matchesSearch = item.title.includes(searchQuery) || item.author.includes(searchQuery);
    const matchesCategory = selectedCategory === "すべて" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ fontFamily: "sans-serif", padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 1. ヘッダー ＆ コントロールエリア */}
      <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <h1 style={{ margin: 0, fontSize: "24px" }}>🌍 WorldSnap Live Map</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleGetLocation} style={{ padding: "8px 16px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            📍 現在地を取得
          </button>
          <button onClick={() => setShowPostModal(true)} style={{ padding: "8px 16px", backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            📸 投稿する
          </button>
        </div>
      </header>

      {/* 2. 検索・フィルターバー */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 タイトルや投稿者で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", backgroundColor: "white" }}
        >
          <option value="すべて">すべてのカテゴリー</option>
          <option value="観光">観光</option>
          <option value="グルメ">グルメ</option>
          <option value="歴史">歴史</option>
        </select>
      </div>

      {/* Leaflet専用CSSの読み込み */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* 3. メインマップ表示部 */}
      <div style={{ height: "500px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid #ddd" }}>
        {isClient && customIcon && (
          <MapContainer center={userLocation || [35.6595, 139.7004]} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* 投稿ピンの描画 */}
            {filteredVideos.map((item) => (
              <Marker key={item.id} position={[item.lat, item.lng]} icon={customIcon}>
                <Popup>
                  <div style={{ width: "180px" }}>
                    <span style={{ fontSize: "10px", background: "#eee", padding: "2px 6px", borderRadius: "4px" }}>{item.category}</span>
                    <h3 style={{ margin: "4px 0 2px 0", fontSize: "14px" }}>{item.title}</h3>
                    <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>By: {item.author}</p>
                    {item.mediaUrl && (
                      <div style={{ marginTop: "6px" }}>
                        <img src={item.mediaUrl} alt={item.title} style={{ width: "100%", borderRadius: "4px" }} />
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* 現在地ピンの描画（赤ピン風） */}
            {userLocation && (
              <Marker position={userLocation} icon={customIcon}>
                <Popup>📍 あなたの現在地</Popup>
              </Marker>
            )}
          </MapContainer>
        )}
      </div>

      {/* 4. 新規投稿モーダル（ポップアップ） */}
      {showPostModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", width: "90%", maxWidth: "400px" }}>
            <h2 style={{ marginTop: 0 }}>📸 新しいスポットを投稿</h2>
            
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>スポット名 / タイトル</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="例: 東京タワー" style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>投稿者名</label>
              <input type="text" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder="例: たく" style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>カテゴリー</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
                <option value="観光">観光</option>
                <option value="グルメ">グルメ</option>
                <option value="歴史">歴史</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>写真 / 動画ファイル</label>
              <input type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ width: "100%" }} />
            </div>

            <div style={{ display: "flex", justifyRight: "flex-end", gap: "8px" }}>
              <button onClick={() => setShowPostModal(false)} style={{ padding: "8px 16px", backgroundColor: "#ccc", border: "none", borderRadius: "6px", cursor: "pointer" }}>キャンセル</button>
              <button onClick={handleAddPost} style={{ padding: "8px 16px", backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>投稿する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
