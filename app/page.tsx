"use client";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fczjqbzolxbldkqvflhe.supabase.co';
const supabaseAnonKey = 'さっきコピーしたsb_publishable_から始まるキー';
const supabase = createClient(supabaseUrl, supabaseAnonKey);import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Compass,
  MapPin,
  Bookmark,
  User,
  Map as MapIcon,
  X,
  Globe,
  Eye,
  ImageIcon,
  RotateCcw,
  Timer,
  ExternalLink,
  Users,
  Lock,
  Sparkles,
  ArrowUpDown,
  AlertTriangle,
  Video,
  Check,
  UserPlus,
  Scissors,
  Play,
  Pause,
  Navigation,
  Smile,
  Film,
  Heart,
  Plus,
  Crosshair,
  HelpCircle,
  MessageSquare,
  Send,
} from "lucide-react";

// 国籍・地域初期座標
const COUNTRY_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  JP: { lat: 35.6812, lng: 139.7671, name: "日本 (東京)" },
  US: { lat: 40.7128, lng: -74.006, name: "アメリカ (ニューヨーク)" },
  FR: { lat: 48.8566, lng: 2.3522, name: "フランス (パリ)" },
  KR: { lat: 37.5665, lng: 126.978, name: "韓国 (ソウル)" },
  UK: { lat: 51.5074, lng: -0.1278, name: "イギリス (ロンドン)" },
};

export default function Home() {
  const [username, setUsername] = useState("ゲストユーザー");
  const [selectedCountry, setSelectedCountry] = useState("JP");
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // GPS現在地
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("worldsnap_username");
    const savedCountry = localStorage.getItem("worldsnap_country");
    if (savedName && savedCountry) {
      setUsername(savedName);
      setSelectedCountry(savedCountry);
      setIsFirstVisit(false);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.warn("GPSエラー:", error)
      );
    }
  }, []);

  const handleSaveInitialProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("worldsnap_username", username);
    localStorage.setItem("worldsnap_country", selectedCountry);
    setIsFirstVisit(false);
  };

  const [activeTab, setActiveTab] = useState<"map" | "search" | "saved" | "profile">("map");
  const [mainMode, setMainMode] = useState<"public" | "friends" | "private">("public");
  const [publicSubCategory, setPublicSubCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [friendsList] = useState([
    { id: 1, name: "サトシ", code: "@satoshi_88", status: "オンライン", authorName: "Ken" },
    { id: 2, name: "ケンタ", code: "@kenta_tokyo", status: "オフライン", authorName: "Yuki" },
  ]);

  // マップ上の投稿スポット
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "表参道のオープンカフェ",
      location: "東京都 渋谷区",
      lat: 35.6652,
      lng: 139.7123,
      category: "food",
      mode: "public",
      views: 15400,
      likes: 1240,
      createdAt: "2026-08-01",
      mediaType: "video",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop",
      author: "Takuya",
      saved: false,
    },
    {
      id: 2,
      title: "雨の日でも映える水族館",
      location: "東京都 江東区",
      lat: 35.6308,
      lng: 139.793,
      category: "rainy",
      mode: "public",
      views: 21000,
      likes: 3100,
      createdAt: "2026-08-05",
      mediaType: "photo",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop",
      author: "Yuki",
      saved: false,
    },
    {
      id: 3,
      title: "エッフェル塔前の絶景スポット",
      location: "パリ, フランス",
      lat: 48.8584,
      lng: 2.2945,
      category: "view",
      mode: "public",
      views: 8900,
      likes: 890,
      createdAt: "2026-08-04",
      mediaType: "video",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop",
      author: "Ken",
      saved: true,
    },
  ]);

  const [selectedSpotPin, setSelectedSpotPin] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<"video" | "photo">("video");
  const [sortBy, setSortBy] = useState<"views" | "newest" | "likes">("views");
  const [unsaveConfirmId, setUnsaveConfirmId] = useState<number | null>(null);

  // 投稿・撮影・プレビュー管理
  const [isPostFlowOpen, setIsPostFlowOpen] = useState(false);
  const [postStep, setPostStep] = useState<"camera" | "recording" | "preview" | "form" | "ai_check">("camera");

  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);
  const [trimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [cropAspectRatio, setCropAspectRatio] = useState<"9:16" | "1:1" | "4:3">("9:16");

  // カメラ機能
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraType, setCameraType] = useState<"video" | "photo">("video");
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [zoomLevel, setZoomLevel] = useState<"0.5x" | "1x" | "2x">("1x");
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 10>(0);

  const [capturedMediaUrl, setCapturedMediaUrl] = useState<string>("");

  const [newTitle, setNewTitle] = useState("");
  const [postTargetMode, setPostTargetMode] = useState<"public" | "friends" | "private">("public");
  const [postTargetCategory, setPostTargetCategory] = useState<string>("view");

  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [friendRequests, setFriendRequests] = useState([
    { id: 101, name: "サトシ", code: "FRIEND-8821" },
  ]);

  // AI問合せモーダル
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "こんにちは！WorldSnap AIサポートです。アプリの使い方や不具合についてご質問をどうぞ！" },
  ]);
  const [chatInput, setChatInput] = useState("");

  // 地図（Leaflet）リファレンス
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const filteredPosts = posts.filter((post) => {
    if (post.mode !== mainMode) return false;
    if (mainMode === "public" && publicSubCategory !== "all" && post.category !== publicSubCategory) return false;
    if (searchQuery && !post.title.includes(searchQuery) && !post.location.includes(searchQuery)) return false;
    return true;
  });

  const currentCoords = currentLocation || COUNTRY_COORDS[selectedCountry] || COUNTRY_COORDS["JP"];

  // 1. 地図（Leaflet.js）安全化レンダリング処理
  useEffect(() => {
    if (activeTab !== "map" || !mapContainerRef.current) return;

    // CSSの動的読み込み
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = (L: any) => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [currentCoords.lat, currentCoords.lng],
          zoom: 14,
          zoomControl: false,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
          subdomains: "abcd",
        }).addTo(map);

        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView([currentCoords.lat, currentCoords.lng]);
      }

      // 既存マーカークリア
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // ピンを地球上の絶対座標（緯度・経度）へプロット
      filteredPosts.forEach((spot) => {
        const customHtml = `
          <div style="cursor: pointer; transform: translate(-50%, -100%);">
            <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(236,72,153,0.4); border: 2.5px solid #ffffff;">
              <div style="transform: rotate(45deg); font-size: 20px; line-height: 1;">💖</div>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: customHtml,
          className: "",
          iconSize: [44, 44],
          iconAnchor: [22, 44],
        });

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(mapInstanceRef.current);

        marker.on("click", () => {
          setSelectedSpotPin(spot);
        });

        markersRef.current.push(marker);
      });
    };

    if ((window as any).L) {
      initMap((window as any).L);
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => initMap((window as any).L);
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, mainMode, publicSubCategory, selectedCountry, currentLocation, posts]);

  // GPS現在地へカメラを復帰させる
  const handleRecenterGPS = () => {
    if (mapInstanceRef.current && currentLocation) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 15, {
        animate: true,
      });
    } else {
      alert("GPS現在地を取得中か、位置情報がオフになっています");
    }
  };

  // カメラ起動・停止管理
  useEffect(() => {
    if (isPostFlowOpen && (postStep === "camera" || postStep === "recording")) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isPostFlowOpen, postStep, cameraFacing]);

  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
        audio: cameraType === "video",
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("カメラアクセスエラー:", err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const captureFrameFromVideo = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (cameraFacing === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setCapturedMediaUrl(canvas.toDataURL("image/jpeg"));
        return;
      }
    }
    setCapturedMediaUrl("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop");
  };

  const handleStartRecording = () => {
    captureFrameFromVideo();
    if (cameraType === "photo") {
      stopCamera();
      setPostStep("preview");
      return;
    }

    setPostStep("recording");
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    stopCamera();
    setPostStep("preview");
  };

  const handleToggleSaveClick = (id: number, currentSaved: boolean) => {
    if (currentSaved) {
      setUnsaveConfirmId(id);
    } else {
      setPosts(posts.map((p) => (p.id === id ? { ...p, saved: true } : p)));
    }
  };

  const confirmUnsave = () => {
    if (unsaveConfirmId !== null) {
      setPosts(posts.map((p) => (p.id === unsaveConfirmId ? { ...p, saved: false } : p)));
      setUnsaveConfirmId(null);
    }
  };

  const handleStartPostCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setPostStep("ai_check");

    setTimeout(() => {
      const baseCoords = currentLocation || COUNTRY_COORDS[selectedCountry] || COUNTRY_COORDS["JP"];

      const newPostObj = {
        id: Date.now(),
        title: newTitle,
        location: currentLocation ? "現在地周辺 (固定ピン)" : `${COUNTRY_COORDS[selectedCountry]?.name} (固定ピン)`,
        lat: baseCoords.lat + (Math.random() - 0.5) * 0.012,
        lng: baseCoords.lng + (Math.random() - 0.5) * 0.012,
        category: postTargetCategory,
        mode: postTargetMode,
        views: 1,
        likes: 0,
        createdAt: "2026-08-10",
        mediaType: cameraType,
        image: capturedMediaUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
        author: username,
        saved: false,
      };

      setPosts((prevPosts) => [newPostObj, ...prevPosts]);
      setMainMode(postTargetMode);
      if (postTargetMode === "public") setPublicSubCategory(postTargetCategory);

      setSelectedSpotPin(newPostObj);
      setPostStep("camera");
      setIsPostFlowOpen(false);
      setNewTitle("");
    }, 2000);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");

    setTimeout(() => {
      let aiResponse = "ご質問ありがとうございます！よくある操作方法はマイページの設定やFAQからご確認いただけます。";
      if (userText.includes("投稿") || userText.includes("撮影")) {
        aiResponse = "画面下中央の「＋」ボタンを押すとカメラが起動します。撮影後に動画のトリミングやジャンル設定をして投稿できますよ！";
      } else if (userText.includes("保存")) {
        aiResponse = "気になるスポットのカードにある「リボン（保存）アイコン」をタップすると、下部の『保存』タブからいつでも見返せます！";
      } else if (userText.includes("フレンド")) {
        aiResponse = "マイページの「フレンドを探す・承認」ボタンから友達のコードを入力して申請できます！";
      }

      setChatMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);
    }, 1000);
  };

  const getSortedDetailPosts = () => {
    let list = [...posts].filter((p) => p.mediaType === activeMediaTab);
    if (sortBy === "views") list.sort((a, b) => b.views - a.views);
    if (sortBy === "likes") list.sort((a, b) => b.likes - a.likes);
    if (sortBy === "newest") list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return list;
  };

  // 画面最下部：永久固定広告枠
  const PermanentAdBanner = () => (
    <div className="w-full bg-slate-200/80 border-t border-slate-300 py-1 px-3 text-center shrink-0">
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
      {/* 1. 初回訪問モーダル */}
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

      {/* 2. ヘッダー */}
      <header className="bg-white border-b border-slate-200 z-10 p-2 shadow-sm flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="場所・キーワードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-800"
            />
          </div>

          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition shrink-0"
            title="ヘルプ・AIサポート"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* モード切替 */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold flex-1 justify-around">
            <button
              onClick={() => setMainMode("public")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                mainMode === "public" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> パブリック
            </button>
            <button
              onClick={() => setMainMode("friends")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                mainMode === "friends" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> フレンド限定
            </button>
            <button
              onClick={() => setMainMode("private")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                mainMode === "private" ? "bg-slate-800 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> プライベート
            </button>
          </div>
        </div>

        {/* 横スクロールジャンルチップ */}
        {mainMode === "public" && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-[11px] font-bold [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "all", label: "すべて" },
              { id: "view", label: "絶景・view 🌄" },
              { id: "rainy", label: "雨の日 ☔" },
              { id: "food", label: "フード 🍔" },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setPublicSubCategory(chip.id)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                  publicSubCategory === chip.id
                    ? "bg-pink-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 3. メインエリア */}
      <main className="flex-1 relative overflow-y-auto bg-slate-100">
        {activeTab === "map" && (
          <div className="w-full h-full relative overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* エイムポインター */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-dashed flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
              </div>
            </div>

            {/* GPSステータス */}
            {currentLocation && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur border border-slate-200 px-2.5 py-1 rounded-full shadow text-[10px] font-bold text-emerald-600 flex items-center gap-1 z-10">
                <Navigation className="w-3 h-3 fill-emerald-600 animate-pulse" />
                GPS現在地オン
              </div>
            )}

            {/* 現在地復帰ボタン */}
            <button
              onClick={handleRecenterGPS}
              className="absolute bottom-6 right-4 z-20 w-12 h-12 bg-white text-blue-600 rounded-full shadow-2xl border border-slate-200 flex items-center justify-center active:scale-95 transition"
              title="現在地に戻る"
            >
              <Crosshair className="w-6 h-6" />
            </button>

            {/* スポットカード */}
            {selectedSpotPin && (
              <div className="absolute bottom-4 left-4 right-16 bg-white p-4 rounded-2xl shadow-2xl border-2 border-pink-500 animate-in zoom-in-95 duration-200 z-30">
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
                      className="w-20 h-20 rounded-xl object-cover shadow-md border-2 border-pink-400"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded">
                      投稿者: {selectedSpotPin.author}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 truncate">{selectedSpotPin.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedSpotPin.location}</p>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setIsDetailModalOpen(true)}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:opacity-90 transition"
                      >
                        動画を見る
                      </button>
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${selectedSpotPin.lat},${selectedSpotPin.lng}`,
                            "_blank"
                          )
                        }
                        className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1 hover:bg-slate-200"
                      >
                        <ExternalLink className="w-3 h-3" /> Map
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
                      onClick={() => handleToggleSaveClick(post.id, post.saved)}
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
                          onClick={() => handleToggleSaveClick(post.id, true)}
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

        {/* 【マイページタブ】 */}
        {activeTab === "profile" && (
          <div className="p-6 max-w-md mx-auto text-center pb-20">
            <div className="w-20 h-20 bg-blue-600 text-white font-bold text-2xl rounded-full mx-auto flex items-center justify-center shadow-lg mb-3">
              {username[0] || "U"}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{username}</h2>
            <p className="text-xs text-slate-400">@worldsnap_user</p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsFriendModalOpen(true)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 text-xs transition"
              >
                <UserPlus className="w-4 h-4" /> フレンド申請
                {friendRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {friendRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 text-xs transition"
              >
                <HelpCircle className="w-4 h-4" /> AIサポート
              </button>
            </div>

            <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" /> フレンドリスト ({friendsList.length}人)
              </h3>
              <div className="grid gap-2">
                {friendsList.map((friend) => (
                  <div key={friend.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Smile className="w-6 h-6 text-indigo-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{friend.name}</p>
                        <p className="text-[10px] text-slate-400">{friend.code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const targetPost = posts.find((p) => p.author === friend.authorName) || posts[0];
                        setSelectedSpotPin(targetPost);
                        setIsDetailModalOpen(true);
                      }}
                      className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow transition"
                    >
                      投稿を見る ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm space-y-4">
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

      {/* 4. 保存解除確認 */}
      {unsaveConfirmId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full text-center shadow-2xl space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm">本当に保存を解除しますか？</h3>
            <p className="text-xs text-slate-500">保存一覧からこの投稿が削除されます。</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setUnsaveConfirmId(null)}
                className="w-1/2 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl"
              >
                キャンセル
              </button>
              <button
                onClick={confirmUnsave}
                className="w-1/2 bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl shadow"
              >
                解除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 動画・写真詳細モーダル */}
      {isDetailModalOpen && selectedSpotPin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
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

            <div className="p-3 bg-slate-100 flex items-center justify-between gap-2 border-b border-slate-200">
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

              <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                >
                  {activeMediaTab === "video" && <option value="views">再生回数順</option>}
                  <option value="newest">新着順</option>
                  <option value="likes">いいね数順</option>
                </select>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 gap-3">
              {getSortedDetailPosts().map((item) => (
                <div key={item.id} className="bg-slate-900 rounded-xl overflow-hidden relative shadow group">
                  <img src={item.image} alt={item.title} className="w-full h-36 object-cover opacity-90" />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleToggleSaveClick(item.id, item.saved)}
                      className="p-1.5 bg-black/60 backdrop-blur rounded-full text-white"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${item.saved ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </button>
                  </div>
                  <div className="p-2 bg-slate-900 text-white text-[11px]">
                    <p className="font-bold truncate">{item.title}</p>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      {item.mediaType === "video" && <span>再生: {item.views.toLocaleString()}</span>}
                      <span>❤️ {item.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${selectedSpotPin.lat},${selectedSpotPin.lng}`,
                    "_blank"
                  )
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 text-xs transition"
              >
                <ExternalLink className="w-4 h-4" /> Googleマップアプリで開く
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. 投稿フロー */}
      {isPostFlowOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 text-white">
          {(postStep === "camera" || postStep === "recording") && (
            <>
              <div className="flex justify-between items-center z-10">
                <button
                  onClick={() => setTimerSeconds(timerSeconds === 0 ? 3 : timerSeconds === 3 ? 10 : 0)}
                  className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1.5 rounded-full backdrop-blur"
                >
                  <Timer className="w-4 h-4" />
                  {timerSeconds === 0 ? "タイマーOFF" : `${timerSeconds}秒`}
                </button>

                {postStep === "recording" && (
                  <div className="flex items-center gap-1.5 bg-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    REC: {recordingSeconds}s
                  </div>
                )}

                <button onClick={() => setIsPostFlowOpen(false)} className="p-2 bg-white/20 rounded-full backdrop-blur">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative flex-1 my-4 bg-black rounded-3xl overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    transform: cameraFacing === "user" ? "scaleX(-1)" : "none",
                  }}
                  className="w-full h-full object-cover"
                />
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

              <div className="space-y-4 pb-4">
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

                <div className="flex justify-around items-center">
                  <button
                    onClick={() => alert("「WorldSnap」が写真ライブラリへのアクセスを許可しました")}
                    className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center"
                  >
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  </button>

                  {postStep === "camera" ? (
                    <button
                      onClick={handleStartRecording}
                      className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-95 transition"
                    >
                      <div className={`w-full h-full rounded-full ${cameraType === "video" ? "bg-red-600" : "bg-white"}`} />
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center p-1 active:scale-95 transition"
                    >
                      <div className="w-8 h-8 bg-red-600 rounded-sm" />
                    </button>
                  )}

                  <button
                    onClick={() => setCameraFacing(cameraFacing === "user" ? "environment" : "user")}
                    className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center"
                  >
                    <RotateCcw className="w-5 h-5 text-slate-300" />
                  </button>
                </div>
              </div>
            </>
          )}

          {postStep === "preview" && (
            <div className="flex flex-col h-full justify-between max-w-md w-full mx-auto space-y-3">
              <div className="flex justify-between items-center p-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-yellow-400" /> 編集・トリミング (CapCut風)
                </h3>
                <button
                  onClick={() => setPostStep("camera")}
                  className="text-xs bg-slate-800 px-3 py-1.5 rounded-full text-slate-300"
                >
                  撮り直す
                </button>
              </div>

              <div className="flex-1 my-1 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center relative p-2">
                <div
                  className={`relative overflow-hidden transition-all duration-300 border-2 border-yellow-400 rounded-2xl shadow-2xl ${
                    cropAspectRatio === "1:1"
                      ? "w-72 h-72"
                      : cropAspectRatio === "4:3"
                      ? "w-80 h-60"
                      : "w-64 h-96"
                  }`}
                >
                  <img src={capturedMediaUrl} alt="preview" className="w-full h-full object-cover" />

                  {cameraType === "video" && (
                    <button
                      onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 text-white"
                    >
                      {isPlayingPreview ? (
                        <Pause className="w-10 h-10 opacity-80" />
                      ) : (
                        <Play className="w-10 h-10 opacity-80" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {cameraType === "video" && (
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-yellow-400 flex items-center gap-1">
                      <Film className="w-3.5 h-3.5" /> タイムラインカット
                    </span>
                    <span className="text-slate-400 text-[10px]">{trimStart}s - {trimEnd}%</span>
                  </div>

                  <div className="relative h-10 bg-slate-800 rounded-xl overflow-hidden border border-yellow-400/50 flex items-center px-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={trimEnd}
                      onChange={(e) => setTrimEnd(parseInt(e.target.value))}
                      className="w-full accent-yellow-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-2 bg-slate-900 p-2 rounded-xl text-xs font-bold border border-slate-800">
                <span className="text-slate-400 text-[11px] self-center mr-2">サイズ:</span>
                {(["9:16", "1:1", "4:3"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setCropAspectRatio(ratio)}
                    className={`px-3 py-1 rounded-lg transition ${
                      cropAspectRatio === ratio ? "bg-yellow-400 text-black font-extrabold" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPostStep("form")}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold py-3.5 rounded-xl shadow text-sm transition"
              >
                この映像で投稿へ進む ➔
              </button>
            </div>
          )}

          {postStep === "form" && (
            <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-md w-full mx-auto my-auto shadow-2xl space-y-4">
              <h3 className="font-bold text-lg text-slate-900 border-b pb-2">投稿情報の入力</h3>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">タイトル・スポット名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 表参道のオープンカフェ"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">① 投稿先のモードを選択</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {[
                    { key: "public", label: "パブリック" },
                    { key: "friends", label: "フレンド限定" },
                    { key: "private", label: "プライベート" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPostTargetMode(item.key as any)}
                      className={`py-2 px-2 rounded-xl border text-center transition ${
                        postTargetMode === item.key
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-bold border-2"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">② ジャンルを選択</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {[
                    { key: "view", label: "絶景・view" },
                    { key: "rainy", label: "雨の日" },
                    { key: "food", label: "フード" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPostTargetCategory(item.key)}
                      className={`py-2 px-2 rounded-xl border text-center transition ${
                        postTargetCategory === item.key
                          ? "border-pink-500 bg-pink-50 text-pink-600 font-bold border-2"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPostStep("preview")}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
                >
                  戻る
                </button>
                <button
                  onClick={handleStartPostCheck}
                  disabled={!newTitle}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl shadow text-xs transition"
                >
                  AI審査へ進む
                </button>
              </div>
            </div>
          )}

          {postStep === "ai_check" && (
            <div className="bg-white text-slate-800 rounded-3xl p-8 max-w-sm w-full mx-auto my-auto shadow-2xl text-center space-y-4">
              <Sparkles className="w-12 h-12 text-purple-600 mx-auto animate-spin" />
              <h3 className="font-bold text-lg text-slate-900">AIコンプライアンス自動審査中</h3>
              <p className="text-xs text-slate-500 leading-relaxed">不適切なコンテンツが含まれていないかAIがチェックしています...</p>
            </div>
          )}
        </div>
      )}

      {/* 7. フレンド申請 */}
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
                      alert(`${req.name} さんとフレンドになりました！`);
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

      {/* 8. AIお問い合わせモーダル */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">WorldSnap AIサポート</h3>
              </div>
              <button onClick={() => setIsHelpModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl leading-relaxed ${
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

            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                placeholder="質問を入力..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white p-2.5 rounded-xl shadow hover:bg-blue-700 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. 広告バナー */}
      <PermanentAdBanner />

      {/* 10. ボトムナビゲーション */}
      <nav className="bg-white border-t border-slate-200 p-2 flex justify-around items-center z-10 shadow-lg shrink-0">
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
