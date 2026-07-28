"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

// Leaflet（地図）コンポーネントをSSR無効（ssr: false）で動的インポート
// ※もし Leaflet コンポーネントのファイルパスが異なる場合は "@/components/Map" などを適宜変更してください
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
