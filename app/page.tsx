'use client';

import React, { useState, useEffect, useRef } from 'react';

// ==============================================================================
// 1. 型定義 & 定数
// ==============================================================================
export type SpotCategory = 'view' | 'gourmet' | 'rainy';
export type VisibilityMode = 'world' | 'friends' | 'my';
export type ActiveTab = 'home' | 'map' | 'profile';
export type ProfileSubTab = 'posts' | 'saved' | 'friends' | 'achievements';

export interface Spot {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  lat: number;
  lng: number;
  country: string;
  countryFlag: string;
  category: SpotCategory;
  visibility: 'public' | 'friends' | 'private';
  dateTime?: string;
}

export interface Friend {
  id: string;
  name: string;
  code: string;
  avatar: string;
  visitedCountries: number;
  status: 'friend' | 'pending';
}

export interface CountryConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  coords: [number, number];
  zoom: number;
  dict: {
    viewMode: string;
    gourmetMode: string;
    rainyMode: string;
    addPhoto: string;
    saveMap: string;
    visited: string;
    countries: string;
  };
}

export const COUNTRIES: CountryConfig[] = [
  { code: 'WORLD', name: 'World Wide', nativeName: '世界全体', flag: '🌐', coords: [20, 0], zoom: 2, dict: { viewMode: '絶景', gourmetMode: 'グルメ', rainyMode: '雨の日', addPhoto: '写真を追加', saveMap: 'マップ保存', visited: '訪問国数', countries: 'カ国' } },
  { code: 'JP', name: 'Japan', nativeName: '日本', flag: '🇯🇵', coords: [36.2048, 138.2529], zoom: 5, dict: { viewMode: '絶景', gourmetMode: 'グルメ', rainyMode: '雨の日', addPhoto: '写真を追加', saveMap: 'マップ保存', visited: '訪問国数', countries: 'カ国' } },
  { code: 'CH', name: 'Switzerland', nativeName: 'Schweiz', flag: '🇨🇭', coords: [46.8182, 8.2275], zoom: 8, dict: { viewMode: 'Aussicht', gourmetMode: 'Gourmet', rainyMode: 'Regentag', addPhoto: 'Foto hinzufügen', saveMap: 'Karte speichern', visited: 'Besucht', countries: 'Länder' } },
  { code: 'US', name: 'United States', nativeName: 'United States', flag: '🇺🇸', coords: [37.0902, -95.7129], zoom: 4, dict: { viewMode: 'View', gourmetMode: 'Gourmet', rainyMode: 'Rainy Day', addPhoto: 'Add Memory', saveMap: 'Save Map', visited: 'Visited', countries: 'Countries' } },
  { code: 'FR', name: 'France', nativeName: 'France', flag: '🇫🇷', coords: [46.2276, 2.2137], zoom: 6, dict: { viewMode: 'Vue', gourmetMode: 'Gourmet', rainyMode: 'Jour de pluie', addPhoto: 'Ajouter photo', saveMap: 'Enregistrer', visited: 'Visités', countries: 'Pays' } },
  { code: 'KR', name: 'South Korea', nativeName: '대한민국', flag: '🇰🇷', coords: [35.9078, 127.7669], zoom: 7, dict: { viewMode: '풍경', gourmetMode: '맛집', rainyMode: '비오는날', addPhoto: '사진 추가', saveMap: '지도 저장', visited: '방문 국가', countries: '개国' } },
  { code: 'DE', name: 'Germany', nativeName: 'Deutschland', flag: '🇩🇪', coords: [51.1657, 10.4515], zoom: 6, dict: { viewMode: 'Aussicht', gourmetMode: 'Gourmet', rainyMode: 'Regentag', addPhoto: 'Foto hinzufügen', saveMap: 'Karte speichern', visited: 'Besucht', countries: 'Länder' } },
  { code: 'IT', name: 'Italy', nativeName: 'Italia', flag: '🇮🇹', coords: [41.8719, 12.5674], zoom: 6, dict: { viewMode: 'Panorama', gourmetMode: 'Gourmet', rainyMode: 'Giorno di pioggia', addPhoto: 'Aggiungi foto', saveMap: 'Salva mappa', visited: 'Visitati', countries: 'Paesi' } },
  { code: 'ES', name: 'Spain', nativeName: 'España', flag: '🇪🇸', coords: [40.4637, -3.7492], zoom: 6, dict: { viewMode: 'Vistas', gourmetMode: 'Gourmet', rainyMode: 'Día de lluvia', addPhoto: 'Añadir foto', saveMap: 'Guardar mapa', visited: 'Visitados', countries: 'Países' } },
  { code: 'TH', name: 'Thailand', nativeName: 'ประเทศไทย', flag: '🇹🇭', coords: [15.8700, 100.9925], zoom: 6, dict: { viewMode: 'วิวสวย', gourmetMode: 'ของกิน', rainyMode: 'วันฝนตก', addPhoto: 'เพิ่มรูปภาพ', saveMap: 'บันทึกแผนที่', visited: 'ประเทศที่ไป', countries: 'ประเทศ' } },
  { code: 'GB', name: 'United Kingdom', nativeName: 'United Kingdom', flag: '🇬🇧', coords: [55.3781, -3.4360], zoom: 6, dict: { viewMode: 'View', gourmetMode: 'Gourmet', rainyMode: 'Rainy Day', addPhoto: 'Add Memory', saveMap: 'Save Map', visited: 'Visited', countries: 'Countries' } },
  { code: 'AU', name: 'Australia', nativeName: 'Australia', flag: '🇦🇺', coords: [-25.2744, 133.7751], zoom: 4, dict: { viewMode: 'View', gourmetMode: 'Gourmet', rainyMode: 'Rainy Day', addPhoto: 'Add Memory', saveMap: 'Save Map', visited: 'Visited', countries: 'Countries' } },
  { code: 'NZ', name: 'New Zealand', nativeName: 'New Zealand', flag: '🇳🇿', coords: [-40.9006, 174.8860], zoom: 5, dict: { viewMode: 'View', gourmetMode: 'Gourmet', rainyMode: 'Rainy Day', addPhoto: 'Add Memory', saveMap: 'Save Map', visited: 'Visited', countries: 'Countries' } },
  { code: 'AT', name: 'Austria', nativeName: 'Österreich', flag: '🇦🇹', coords: [47.5162, 14.5501], zoom: 7, dict: { viewMode: 'Aussicht', gourmetMode: 'Gourmet', rainyMode: 'Regentag', addPhoto: 'Foto hinzufügen', saveMap: 'Karte speichern', visited: 'Besucht', countries: 'Länder' } },
  { code: 'SG', name: 'Singapore', nativeName: 'Singapore', flag: '🇸🇬', coords: [1.3521, 103.8198], zoom: 11, dict: { viewMode: 'View', gourmetMode: 'Gourmet', rainyMode: 'Rainy Day', addPhoto: 'Add Memory', saveMap: 'Save Map', visited: 'Visited', countries: 'Countries' } },
  { code: 'CA', name: 'Canada', nativeName: 'Canada', flag: '🇨🇦', coords: [56.1304, -106.3468], zoom: 4, dict: { viewMode: 'View', gourmetMode: 'Gourmet', rainyMode: 'Rainy Day', addPhoto: 'Add Memory', saveMap: 'Save Map', visited: 'Visited', countries: 'Countries' } },
  { code: 'AE', name: 'UAE (Dubai)', nativeName: 'الإمارات', flag: '🇦🇪', coords: [23.4241, 53.8478], zoom: 7, dict: { viewMode: 'مناظر', gourmetMode: 'مطاعم', rainyMode: 'يوم ممطر', addPhoto: 'إضافة صورة', saveMap: 'حفظ الخريطة', visited: 'الدول التي زرتها', countries: 'دول' } },
  { code: 'MV', name: 'Maldives', nativeName: 'Dhivehi Raajje', flag: '🇲🇻', coords: [3.2028, 73.2207], zoom: 7, dict: { viewMode: 'View', gourmetMode: 'Gourmet', rainyMode: 'Rainy Day', addPhoto: 'Add Photo', saveMap: 'Save Map', visited: 'Visited', countries: 'Atolls' } }
];

const INITIAL_SPOTS: Spot[] = [
  {
    id: 's1',
    userId: 'user_yuki',
    userName: 'Yuki_Traveler',
    title: 'マッターホルンの絶景朝焼け',
    description: '早朝のツェルマットから眺める黄金色の山頂。息をのむ美しさでした！展望台へは始発電車がおすすめ。',
    fileUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    fileType: 'image',
    lat: 45.9765,
    lng: 7.7491,
    country: 'スイス',
    countryFlag: '🇨🇭',
    category: 'view',
    visibility: 'public',
    dateTime: '2026/08/14',
  },
  {
    id: 's2',
    userId: 'my_user_id',
    userName: 'MyTraveler',
    title: '京都 祇園の極上抹茶パフェ',
    description: '雨の日の古都散策で立ち寄った風情ある甘味処。濃厚な抹茶アイスと白玉の組み合わせが絶品。',
    fileUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
    fileType: 'image',
    lat: 35.0037,
    lng: 135.7772,
    country: '日本',
    countryFlag: '🇯🇵',
    category: 'gourmet',
    visibility: 'public',
    dateTime: '2026/08/10',
  },
  {
    id: 's3',
    userId: 'my_user_id',
    userName: 'MyTraveler',
    title: '東京・お台場の夜景クルーズ',
    description: 'レインボーブリッジと東京タワーが一望できるロマンチックなデートスポット。',
    fileUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    fileType: 'image',
    lat: 35.6298,
    lng: 139.7745,
    country: '日本',
    countryFlag: '🇯🇵',
    category: 'view',
    visibility: 'public',
    dateTime: '2026/08/05',
  },
  {
    id: 's4',
    userId: 'user_rainy',
    userName: 'RainyArtLover',
    title: '雨の日も楽しめる国立新美術館',
    description: '建築美と静けさが魅力的な雨の日のオアシス。館内カフェの居心地も抜群です。',
    fileUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    fileType: 'image',
    lat: 35.6653,
    lng: 139.7264,
    country: '日本',
    countryFlag: '🇯🇵',
    category: 'rainy',
    visibility: 'public',
    dateTime: '2026/08/02',
  },
];

const INITIAL_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Yuki_Traveler', code: 'WS-1122-CH', avatar: '❄️', visitedCountries: 12, status: 'friend' },
  { id: 'f2', name: 'Ken_Gourmet', code: 'WS-3344-JP', avatar: '🍵', visitedCountries: 5, status: 'friend' },
  { id: 'f3', name: 'Sarah_World', code: 'WS-5566-US', avatar: '🗽', visitedCountries: 9, status: 'pending' },
];

// ==============================================================================
// 2. メインコンポーネント
// ==============================================================================
export default function WorldSnapApp() {
  const currentUserId = 'my_user_id';
  const myFriendCode = 'WS-8823-X9';

  // 状態管理
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [eulaAccepted, setEulaAccepted] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(COUNTRIES[0]);
  const [categoryMode, setCategoryMode] = useState<SpotCategory>('view');
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('world');
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>(['s1']);
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('posts');

  // モーダル・画面遷移状態
  const [focusedSpot, setFocusedSpot] = useState<Spot | null>(null); // ピンタップ時のフルスクリーン投稿画面
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [friendInputCode, setFriendInputCode] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // マップDOM・Leaflet参照
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const feedScrollRef = useRef<HTMLDivElement>(null);

  // 表示スポット抽出
  const displaySpots = spots.filter((spot) => {
    if (blockedUserIds.includes(spot.userId)) return false;
    if (spot.category !== categoryMode) return false;
    if (visibilityMode === 'my') return spot.userId === currentUserId;
    return true;
  });

  const mySpots = spots.filter((s) => s.userId === currentUserId);
  const savedSpots = spots.filter((s) => savedSpotIds.includes(s.id));
  const visitedCount = new Set(mySpots.map((s) => s.country)).size;
  const activeFriends = friends.filter((f) => f.status === 'friend');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  // ----------------------------------------------------------------------------
  // Leaflet 地図初期化（世界全体広域ズーム ＆ ダブルタップ地域ズーム）
  // ----------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (leafletMapRef.current) return;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        doubleClickZoom: false,
      });

      // ダブルタップでその地域付近へスムーズにズームアップ
      map.on('dblclick', (e: any) => {
        const nextZoom = Math.min(map.getZoom() + 4, 15);
        map.flyTo(e.latlng, nextZoom, { duration: 0.8 });
      });

      leafletMapRef.current = map;
    }

    initMap();
    return () => {
      isMounted = false;
    };
  }, []);

  // ----------------------------------------------------------------------------
  // マップスタイル切り替え (3大モード連動) & 国籍フォーカス
  // ----------------------------------------------------------------------------
  useEffect(() => {
    async function updateMapTiles() {
      if (!leafletMapRef.current) return;
      const L = (await import('leaflet')).default;
      const map = leafletMapRef.current;

      map.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      let tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'; // View
      if (categoryMode === 'gourmet') {
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // グルメ
      } else if (categoryMode === 'rainy') {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'; // 雨の日
      }

      L.tileLayer(tileUrl, { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
      map.flyTo(selectedCountry.coords, selectedCountry.zoom, { duration: 1.2 });
    }

    updateMapTiles();
  }, [categoryMode, selectedCountry]);

  // ----------------------------------------------------------------------------
  // マーカー & アーク線の再描画
  // ----------------------------------------------------------------------------
  useEffect(() => {
    async function renderMarkers() {
      if (!leafletMapRef.current) return;
      const L = (await import('leaflet')).default;
      const map = leafletMapRef.current;

      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      const borderColor =
        categoryMode === 'view' ? '#0ea5e9' : categoryMode === 'gourmet' ? '#f59e0b' : '#a855f7';

      displaySpots.forEach((spot) => {
        const customIcon = L.divIcon({
          className: 'custom-pin-wrapper',
          html: `
            <div style="width:44px; height:44px; border-radius:50%; border:3px solid ${borderColor}; box-shadow:0 6px 14px rgba(0,0,0,0.3); overflow:hidden; background:#fff; cursor:pointer; transform:scale(1); transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
              <img src="${spot.fileUrl}" style="width:100%; height:100%; object-fit:cover;" />
            </div>
            <div style="width:8px; height:8px; background:#1e293b; border-radius:50%; margin:-3px auto 0; box-shadow:0 2px 4px rgba(0,0,0,0.4);"></div>
          `,
          iconSize: [44, 48],
          iconAnchor: [22, 48],
        });

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(map);

        // ★ ピンを押した時：マップの表示を消して投稿画面（フルスクリーン）へとぶ
        marker.on('click', () => {
          triggerHaptic();
          setFocusedSpot(spot);
        });

        markersRef.current.push(marker);
      });

      if (displaySpots.length > 1) {
        const latlngs: [number, number][] = displaySpots.map((s) => [s.lat, s.lng]);
        polylineRef.current = L.polyline(latlngs, {
          color: borderColor,
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.85,
        }).addTo(map);
      }
    }

    renderMarkers();
  }, [displaySpots, categoryMode]);

  // ----------------------------------------------------------------------------
  // マップ画像保存 (html2canvas)
  // ----------------------------------------------------------------------------
  const handleSaveMap = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (!mapContainerRef.current) return;
      const canvas = await html2canvas(mapContainerRef.current, { useCORS: true });
      const link = document.createElement('a');
      link.download = `WorldSnap_${selectedCountry.code}_${categoryMode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('📸 マップ画像を保存しました！');
    } catch {
      alert('マップの保存に失敗しました');
    }
  };

  // ----------------------------------------------------------------------------
  // ボトムナビゲーション タップ＆リタップギミック
  // ----------------------------------------------------------------------------
  const handleTabClick = (tab: ActiveTab) => {
    triggerHaptic();
    setFocusedSpot(null); // タブ切り替え時は詳細を閉じる

    if (activeTab === tab) {
      if (tab === 'home' && feedScrollRef.current) {
        feedScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('🔄 タイムラインを更新しました');
      } else if (tab === 'map' && leafletMapRef.current) {
        leafletMapRef.current.flyTo(selectedCountry.coords, selectedCountry.zoom, { duration: 1 });
      }
    } else {
      setActiveTab(tab);
    }
  };

  const handleMapLongPress = () => {
    triggerHaptic();
    if (navigator.geolocation && leafletMapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          leafletMapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 12, { duration: 1.5 });
          showToast('📍 現在地に移動しました');
        },
        () => showToast('位置情報の取得に失敗しました')
      );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-sans select-none text-slate-800 relative">
      {/* トースト通知 */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl border border-slate-700 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* ヘッダー */}
      <header className="h-14 bg-white/95 backdrop-blur-md border-b flex items-center justify-between px-4 z-20 shadow-xs shrink-0">
        <div className="flex items-center space-x-2">
          <button className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg text-lg">☰</button>
          <span className="font-black text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            🗺️ WorldSnap
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
            {selectedCountry.dict.visited}: {visitedCount} {selectedCountry.dict.countries}
          </div>
          <button
            onClick={() => handleTabClick('profile')}
            className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow active:scale-95 transition"
          >
            Me
          </button>
        </div>
      </header>

      {/* 国籍フォーカス & 3大モード & 表示対象切替バー (マップ表示時のみ) */}
      {!focusedSpot && activeTab === 'map' && (
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 border-b z-20 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 animate-in fade-in">
          {/* 国籍選択 */}
          <select
            value={selectedCountry.code}
            onChange={(e) => {
              const c = COUNTRIES.find((item) => item.code === e.target.value);
              if (c) setSelectedCountry(c);
            }}
            className="font-semibold bg-gray-100 border-0 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.nativeName} ({c.name})
              </option>
            ))}
          </select>

          {/* 3つの表示モード */}
          <div className="flex bg-gray-200/80 p-0.5 rounded-lg font-bold">
            <button
              onClick={() => {
                triggerHaptic();
                setCategoryMode('view');
              }}
              className={`px-3 py-1 rounded-md transition ${categoryMode === 'view' ? 'bg-sky-500 text-white shadow-xs' : 'text-gray-600'}`}
            >
              🏔️ {selectedCountry.dict.viewMode}
            </button>
            <button
              onClick={() => {
                triggerHaptic();
                setCategoryMode('gourmet');
              }}
              className={`px-3 py-1 rounded-md transition ${categoryMode === 'gourmet' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600'}`}
            >
              🍔 {selectedCountry.dict.gourmetMode}
            </button>
            <button
              onClick={() => {
                triggerHaptic();
                setCategoryMode('rainy');
              }}
              className={`px-3 py-1 rounded-md transition ${categoryMode === 'rainy' ? 'bg-slate-800 text-white shadow-xs' : 'text-gray-600'}`}
            >
              🌧️ {selectedCountry.dict.rainyMode}
            </button>
          </div>

          {/* 表示対象切替 */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg font-semibold text-gray-600">
            <button
              onClick={() => setVisibilityMode('world')}
              className={`px-2.5 py-1 rounded ${visibilityMode === 'world' ? 'bg-white text-indigo-600 shadow-xs' : ''}`}
            >
              🌐 ワールド
            </button>
            <button
              onClick={() => setVisibilityMode('friends')}
              className={`px-2.5 py-1 rounded ${visibilityMode === 'friends' ? 'bg-white text-indigo-600 shadow-xs' : ''}`}
            >
              👥 フレンド
            </button>
            <button
              onClick={() => setVisibilityMode('my')}
              className={`px-2.5 py-1 rounded ${visibilityMode === 'my' ? 'bg-white text-indigo-600 shadow-xs' : ''}`}
            >
              🔒 マイ
            </button>
          </div>
        </div>
      )}

      {/* メインコンテンツエリア */}
      <div className="flex-1 relative overflow-hidden">
        {/* ★ 1. ピンを押した時の全画面・投稿詳細スクリーン (マップを隠して遷移) */}
        {focusedSpot ? (
          <FullSpotDetailView
            spot={focusedSpot}
            currentUserId={currentUserId}
            isBookmarked={savedSpotIds.includes(focusedSpot.id)}
            onBack={() => setFocusedSpot(null)}
            onToggleBookmark={() => {
              triggerHaptic();
              const isSaved = savedSpotIds.includes(focusedSpot.id);
              setSavedSpotIds((prev) =>
                isSaved ? prev.filter((id) => id !== focusedSpot.id) : [...prev, focusedSpot.id]
              );
              showToast(isSaved ? 'ブックマークを解除しました' : '💛 行きたいリストに保存しました！');
            }}
            onReport={() => setIsReportModalOpen(true)}
            onBlockUser={(targetUserId) => {
              if (confirm('このユーザーをブロックしますか？相手の投稿がすべて非表示になります。')) {
                setBlockedUserIds((prev) => [...prev, targetUserId]);
                setFocusedSpot(null);
                showToast('🚫 ユーザーをブロックしました');
              }
            }}
            onDeleteSpot={(spotId) => {
              if (confirm('このピンを完全に削除しますか？')) {
                setSpots((prev) => prev.filter((s) => s.id !== spotId));
                setFocusedSpot(null);
                showToast('🗑️ ピンを削除しました');
              }
            }}
          />
        ) : (
          <>
            {/* 2. 地図画面 (メモリ保持) */}
            <div className={`w-full h-full ${activeTab === 'map' ? 'block' : 'hidden'}`}>
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* フローティングアクションボタン */}
              <div className="absolute right-4 bottom-28 z-20 flex flex-col space-y-3">
                <button
                  onClick={handleSaveMap}
                  className="w-12 h-12 bg-white text-gray-800 rounded-full shadow-xl flex items-center justify-center font-bold hover:bg-gray-50 active:scale-95 transition border"
                  title={selectedCountry.dict.saveMap}
                >
                  💾
                </button>
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-full shadow-xl flex items-center gap-2 font-bold hover:opacity-95 active:scale-95 transition text-xs"
                >
                  📷＋ {selectedCountry.dict.addPhoto}
                </button>
              </div>
            </div>

            {/* 3. ホーム（タイムライン・フィード） */}
            {activeTab === 'home' && (
              <div ref={feedScrollRef} className="w-full h-full bg-slate-50 overflow-y-auto p-4 space-y-4 pb-28">
                <h2 className="font-extrabold text-base text-slate-800">✨ 世界の最新フォトジャーナル</h2>
                {displaySpots.map((spot) => (
                  <div
                    key={spot.id}
                    onClick={() => {
                      triggerHaptic();
                      setFocusedSpot(spot);
                    }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer active:scale-98 transition"
                  >
                    <div className="aspect-16/9 bg-slate-900 relative">
                      <img src={spot.fileUrl} alt={spot.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2.5 py-1 bg-black/60 text-white text-[10px] font-bold rounded-full backdrop-blur-xs">
                        {spot.country} {spot.countryFlag}
                      </span>
                    </div>
                    <div className="p-3.5 space-y-1">
                      <h3 className="font-bold text-sm text-slate-900">{spot.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{spot.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. 👤 マイページ画面（完全仕様） */}
            {activeTab === 'profile' && (
              <div className="w-full h-full bg-slate-50 overflow-y-auto p-4 pb-28 space-y-4">
                {/* プロフィールヘッダー */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-extrabold text-lg shadow-md">
                        Me
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">MyTraveler (@taku_snap)</h3>
                        <p className="text-xs text-slate-500">世界中を旅して記録中 🌏✈️</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold"
                    >
                      ⚙️ 設定
                    </button>
                  </div>

                  {/* 投稿・訪問国・フレンドカウンター */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs font-bold text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-normal">📸 投稿</span>
                      {mySpots.length}
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-normal">🗺️ 訪問国</span>
                      {visitedCount} カ国
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-normal">👥 フレンド</span>
                      {activeFriends.length} 人
                    </div>
                  </div>

                  {/* 🆔 フレンドコードバナー */}
                  <div className="p-3 bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-indigo-500 font-bold block">🆔 マイ フレンドコード</span>
                      <span className="font-mono font-extrabold text-xs text-indigo-900">{myFriendCode}</span>
                    </div>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(myFriendCode);
                          showToast('📋 フレンドコードをコピーしました！');
                        }}
                        className="px-2.5 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold border shadow-2xs hover:bg-indigo-50"
                      >
                        コピー
                      </button>
                      <button
                        onClick={() => setIsQrModalOpen(true)}
                        className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-2xs hover:bg-indigo-700"
                      >
                        QR表示
                      </button>
                    </div>
                  </div>
                </div>

                {/* マイページ内 サブタブ ([📸 記録] [💛 保存] [👥 フレンド] [🏆 実績]) */}
                <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setProfileSubTab('posts')}
                    className={`flex-1 py-2 rounded-lg transition ${profileSubTab === 'posts' ? 'bg-white text-indigo-600 shadow-xs' : ''}`}
                  >
                    📸 記録
                  </button>
                  <button
                    onClick={() => setProfileSubTab('saved')}
                    className={`flex-1 py-2 rounded-lg transition ${profileSubTab === 'saved' ? 'bg-white text-rose-500 shadow-xs' : ''}`}
                  >
                    💛 保存
                  </button>
                  <button
                    onClick={() => setProfileSubTab('friends')}
                    className={`flex-1 py-2 rounded-lg transition ${profileSubTab === 'friends' ? 'bg-white text-indigo-600 shadow-xs' : ''}`}
                  >
                    👥 フレンド
                  </button>
                  <button
                    onClick={() => setProfileSubTab('achievements')}
                    className={`flex-1 py-2 rounded-lg transition ${profileSubTab === 'achievements' ? 'bg-white text-amber-600 shadow-xs' : ''}`}
                  >
                    🏆 実績
                  </button>
                </div>

                {/* 1. 記録タブ */}
                {profileSubTab === 'posts' && (
                  <div className="grid grid-cols-2 gap-3">
                    {mySpots.map((spot) => (
                      <div
                        key={spot.id}
                        onClick={() => {
                          triggerHaptic();
                          setFocusedSpot(spot);
                        }}
                        className="bg-white rounded-xl overflow-hidden shadow-2xs border border-slate-100 cursor-pointer group"
                      >
                        <div className="aspect-4/3 bg-slate-900 relative">
                          <img src={spot.fileUrl} alt={spot.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <span className="absolute bottom-1 right-1 text-xs">{spot.countryFlag}</span>
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-bold text-slate-800 truncate">{spot.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. 保存タブ */}
                {profileSubTab === 'saved' && (
                  <div className="space-y-2">
                    {savedSpots.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-10">まだ保存されたスポットがありません 💛</p>
                    ) : (
                      savedSpots.map((spot) => (
                        <div
                          key={spot.id}
                          onClick={() => {
                            triggerHaptic();
                            setFocusedSpot(spot);
                          }}
                          className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <img src={spot.fileUrl} alt={spot.title} className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">{spot.title}</p>
                              <p className="text-[10px] text-slate-400">📍 {spot.country} {spot.countryFlag}</p>
                            </div>
                          </div>
                          <span className="text-rose-500 text-sm">💛</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 3. フレンドタブ */}
                {profileSubTab === 'friends' && (
                  <div className="space-y-4 text-xs">
                    {/* フレンド追加入力 */}
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs space-y-2">
                      <h4 className="font-bold text-slate-900">➕ 友達を追加する</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="相手のフレンドコード (例: WS-1122-CH)"
                          value={friendInputCode}
                          onChange={(e) => setFriendInputCode(e.target.value)}
                          className="flex-1 p-2 border rounded-lg uppercase font-mono text-xs"
                        />
                        <button
                          onClick={() => {
                            if (!friendInputCode) return;
                            setFriends((prev) => [
                              ...prev,
                              { id: Date.now().toString(), name: `Traveler_${friendInputCode.slice(-4)}`, code: friendInputCode, avatar: '✈️', visitedCountries: 1, status: 'friend' },
                            ]);
                            setFriendInputCode('');
                            showToast('🎉 フレンドを追加しました！');
                          }}
                          className="px-3 bg-indigo-600 text-white rounded-lg font-bold shrink-0"
                        >
                          申請/追加
                        </button>
                      </div>
                    </div>

                    {/* フレンド一覧 */}
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs space-y-2">
                      <h4 className="font-bold text-slate-900">👥 相互フォロー中の友達 ({activeFriends.length})</h4>
                      <div className="space-y-2">
                        {activeFriends.map((f) => (
                          <div key={f.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{f.avatar}</span>
                              <div>
                                <span className="font-bold text-slate-800 block">{f.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{f.code} · {f.visitedCountries}カ国訪問</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                handleTabClick('map');
                                setVisibilityMode('friends');
                                showToast(`🗺️ ${f.name} のマップにフォーカスしました`);
                              }}
                              className="px-2.5 py-1 bg-white border border-slate-200 text-indigo-600 rounded-md font-bold text-[11px] hover:bg-indigo-50"
                            >
                              マップを見る
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. 実績タブ */}
                {profileSubTab === 'achievements' && (
                  <div className="space-y-3 text-xs">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-3">
                      <h4 className="font-bold text-slate-900">🏆 旅の称号 & 実績コレクション</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2">
                          <span className="text-2xl">🌍</span>
                          <div>
                            <span className="font-bold text-amber-900 block">ワールドワンダラー</span>
                            <span className="text-[10px] text-amber-700">訪問国 {visitedCount}カ国達成</span>
                          </div>
                        </div>
                        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center space-x-2">
                          <span className="text-2xl">🏔️</span>
                          <div>
                            <span className="font-bold text-sky-900 block">絶景マイスター</span>
                            <span className="text-[10px] text-sky-700">View投稿 {mySpots.filter(s => s.category === 'view').length}件</span>
                          </div>
                        </div>
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center space-x-2">
                          <span className="text-2xl">☕</span>
                          <div>
                            <span className="font-bold text-orange-900 block">グルメトラベラー</span>
                            <span className="text-[10px] text-orange-700">グルメ投稿 {mySpots.filter(s => s.category === 'gourmet').length}件</span>
                          </div>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center space-x-2">
                          <span className="text-2xl">🌧️</span>
                          <div>
                            <span className="font-bold text-purple-900 block">雨の日エキスパート</span>
                            <span className="text-[10px] text-purple-700">雨天スポット {mySpots.filter(s => s.category === 'rainy').length}件</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 📢 目立たない広告バナー枠（最下部に配置） */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md bg-white/85 hover:bg-white backdrop-blur-md border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-md flex items-center justify-between text-[11px] text-slate-600 transition">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[9px]">PR</span>
                <span className="truncate font-medium">🏨 次の旅をお得に予約｜厳選ホテル・航空券比較</span>
              </div>
              <button
                onClick={() => window.open('https://www.google.com/travel', '_blank')}
                className="text-indigo-600 font-bold hover:underline shrink-0 ml-2"
              >
                見る ›
              </button>
            </div>
          </>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 📱 ボトムナビゲーション (ホーム / マップ / マイページ) */}
      {/* ==================================================================== */}
      <nav className="h-14 bg-white border-t flex items-center justify-around z-30 text-gray-500 text-xs shrink-0 shadow-lg relative">
        <button
          onClick={() => handleTabClick('home')}
          className={`flex-1 py-1 flex flex-col items-center gap-0.5 transition-transform duration-150 active:scale-90 ${
            activeTab === 'home' && !focusedSpot ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <span className="text-base">🏠</span> ホーム
        </button>

        <button
          onClick={() => handleTabClick('map')}
          onContextMenu={(e) => {
            e.preventDefault();
            handleMapLongPress();
          }}
          className={`flex-1 py-1 flex flex-col items-center gap-0.5 transition-transform duration-150 active:scale-90 ${
            activeTab === 'map' && !focusedSpot ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <span className="text-base">🗺️</span> マップ
        </button>

        <button
          onClick={() => handleTabClick('profile')}
          className={`flex-1 py-1 flex flex-col items-center gap-0.5 transition-transform duration-150 active:scale-90 ${
            activeTab === 'profile' && !focusedSpot ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <span className="text-base">👤</span> マイページ
        </button>
      </nav>

      {/* ==================================================================== */}
      {/* モーダル群 (EULA / QRコード / 設定 / 投稿 / 通報) */}
      {/* ==================================================================== */}

      {/* QRコードモーダル */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={() => setIsQrModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 text-center space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold text-slate-900 text-sm">📱 マイQRコード</h4>
            <div className="w-44 h-44 bg-slate-100 border-2 border-dashed border-indigo-300 rounded-xl mx-auto flex items-center justify-center font-mono text-xs text-indigo-600 font-bold p-4">
              [QR CODE: {myFriendCode}]
            </div>
            <p className="text-xs text-slate-500 font-mono font-bold">{myFriendCode}</p>
            <button onClick={() => setIsQrModalOpen(false)} className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs">
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 設定・アカウント削除モーダル */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={() => setIsSettingsModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-xs" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900">⚙️ 設定・アカウント管理</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 font-bold text-sm">✕</button>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                <span>利用規約 (EULA) を確認</span>
                <button onClick={() => setEulaAccepted(false)} className="text-indigo-600 font-bold">表示</button>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="font-bold text-red-600">アカウント削除 (Apple Guideline)</h4>
              <p className="text-[11px] text-slate-500">アカウントおよびすべての写真ピン、フレンド情報が消去されます。</p>
              <button
                onClick={() => {
                  if (confirm('【警告】アカウントおよび全データを完全に削除しますか？')) {
                    setSpots((prev) => prev.filter((s) => s.userId !== currentUserId));
                    setIsSettingsModalOpen(false);
                    showToast('アカウントを完全に削除しました');
                  }
                }}
                className="w-full py-2.5 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-100"
              >
                アカウントと全データを削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EULA同意ダイアログ */}
      {!eulaAccepted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-indigo-600">🛡️ 利用規約 (EULA) への同意</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              WorldSnapでは安心・安全な旅行コミュニティのため、不快なコンテンツ・誹謗中傷・ハラスメントを固く禁止しています。違反した場合はアカウントが即座に停止されます。
            </p>
            <button
              onClick={() => setEulaAccepted(true)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md"
            >
              利用規約に同意して始める
            </button>
          </div>
        </div>
      )}

      {/* 写真投稿モーダル */}
      {isPostModalOpen && (
        <PostUploadModal
          onClose={() => setIsPostModalOpen(false)}
          onSubmit={(newSpotData) => {
            const newSpot: Spot = {
              id: Date.now().toString(),
              userId: currentUserId,
              userName: 'MyTraveler',
              ...newSpotData,
            };
            setSpots((prev) => [newSpot, ...prev]);
            setIsPostModalOpen(false);
            showToast('📍 新しい思い出をピン留めしました！');
          }}
        />
      )}

      {/* 通報モーダル */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 space-y-3 text-xs shadow-2xl">
            <h4 className="font-bold text-gray-900 text-sm">⚠️ 投稿を通報する</h4>
            <p className="text-[11px] text-gray-500">該当する通報理由を選択してください：</p>
            <select className="w-full p-2 border rounded-lg bg-gray-50 font-medium">
              <option>不適切な写真・公序良俗に反する内容</option>
              <option>嫌がらせ・ハラスメント</option>
              <option>スパム・商業目的の無断宣伝</option>
              <option>著作権侵害・無断転載</option>
            </select>
            <div className="flex space-x-2 pt-2">
              <button onClick={() => setIsReportModalOpen(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-semibold">
                キャンセル
              </button>
              <button
                onClick={() => {
                  setIsReportModalOpen(false);
                  showToast('✅ 通報を受理しました。24時間以内に審査します。');
                }}
                className="flex-1 py-2 bg-amber-600 text-white rounded-lg font-bold shadow-md"
              >
                送信する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// 3. ★ フルスクリーン投稿詳細画面 (ピンタップ時にマップを隠して遷移)
// ==============================================================================
function FullSpotDetailView({
  spot,
  currentUserId,
  isBookmarked,
  onBack,
  onToggleBookmark,
  onReport,
  onBlockUser,
  onDeleteSpot,
}: {
  spot: Spot;
  currentUserId: string;
  isBookmarked: boolean;
  onBack: () => void;
  onToggleBookmark: () => void;
  onReport: () => void;
  onBlockUser: (userId: string) => void;
  onDeleteSpot: (spotId: string) => void;
}) {
  const [bounce, setBounce] = useState(false);
  const isOwner = spot.userId === currentUserId;

  const handleBookmarkClick = () => {
    setBounce(true);
    setTimeout(() => setBounce(false), 400);
    onToggleBookmark();
  };

  const handleOpenGoogleMaps = () => {
    const googleMapUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
    window.open(googleMapUrl, '_blank');
  };

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col overflow-y-auto z-40 text-white pb-20 animate-in slide-in-from-right duration-200">
      {/* 上部ナビゲーションバー */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 px-3 py-1.5 rounded-full"
        >
          ‹ マップへ戻る
        </button>
        <span className="text-xs font-bold text-slate-400">
          {spot.category === 'view' ? '🏔️ VIEW' : spot.category === 'gourmet' ? '🍔 GOURMET' : '🌧️ RAINY'}
        </span>
      </div>

      {/* メインメディア（写真・動画） */}
      <div className="w-full aspect-4/3 bg-black relative shrink-0">
        <img src={spot.fileUrl} alt={spot.title} className="w-full h-full object-cover" />
        <span className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20">
          {spot.country} {spot.countryFlag}
        </span>
      </div>

      {/* 投稿コンテンツ詳細 */}
      <div className="p-5 space-y-4 bg-slate-950 flex-1">
        {/* タイトル & いいね保存 */}
        <div className="flex justify-between items-start gap-3">
          <div>
            <h2 className="font-extrabold text-xl text-white leading-tight">{spot.title}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
              📍 {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)} · 撮影日時: {spot.dateTime || '2026/08'}
            </p>
          </div>

          <button
            onClick={handleBookmarkClick}
            className={`p-3 rounded-full border shadow-sm transition-all duration-200 ${
              bounce ? 'scale-125' : 'scale-100'
            } ${
              isBookmarked
                ? 'bg-rose-500/20 border-rose-500 text-rose-500'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-500'
            }`}
          >
            <span className="text-xl leading-none">{isBookmarked ? '💛' : '🤍'}</span>
          </button>
        </div>

        {/* 説明文・思い出テキスト */}
        {spot.description && (
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-900 p-4 rounded-2xl border border-slate-800">
            {spot.description}
          </p>
        )}

        {/* 🧭 Googleマップ ルート案内ボタン (CTA) */}
        <button
          onClick={handleOpenGoogleMaps}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/30 transition duration-150"
        >
          <span>🧭</span>
          Googleマップでルート案内を開く
        </button>

        {/* フッター（投稿者情報・UGC安全機能） */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">👤 投稿者: {spot.userName}</span>

          {isOwner ? (
            <button
              onClick={() => onDeleteSpot(spot.id)}
              className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 hover:underline"
            >
              🗑️ このピンを削除
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={onReport}
                className="text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-0.5 hover:underline"
              >
                ⚠️ 通報
              </button>
              <button
                onClick={() => onBlockUser(spot.userId)}
                className="text-slate-500 hover:text-red-400 font-semibold flex items-center gap-0.5 hover:underline"
              >
                🚫 ブロック
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 4. 写真アップロード & Exif動的抽出モーダル
// ==============================================================================
function PostUploadModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SpotCategory>('view');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 35.6895, lng: 139.6917 });
  const [isManual, setIsManual] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUrl(URL.createObjectURL(file));

    try {
      const EXIF = (await import('exif-js')).default;
      EXIF.getData(file as any, function (this: any) {
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
        const lng = EXIF.getTag(this, 'GPSLongitude');
        const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');

        if (lat && lng && latRef && lngRef) {
          const latDec = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === 'N' ? 1 : -1);
          const lngDec = (lng[0] + lng[1] / 60 + lng[2] / 3600) * (lngRef === 'E' ? 1 : -1);
          setCoords({ lat: latDec, lng: lngDec });
          setIsManual(false);
        } else {
          setIsManual(true);
        }
      });
    } catch {
      setIsManual(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 text-xs shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-900">思い出の写真を追加</h3>
          <button onClick={onClose} className="text-gray-400 font-bold text-sm">✕</button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center cursor-pointer hover:border-indigo-400">
          {fileUrl ? (
            <img src={fileUrl} alt="Preview" className="h-32 w-full object-cover rounded-lg" />
          ) : (
            <label className="cursor-pointer block py-4">
              <span className="text-indigo-600 font-bold">📷 写真を選択</span>
              <input type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
            </label>
          )}
        </div>

        <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
          📍 {isManual ? '位置情報を手動設定中 (東京)' : 'Exif位置情報を自動検出'}
          <div className="text-[10px] text-gray-400">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</div>
        </div>

        <div className="grid grid-cols-3 gap-1 font-bold">
          {(['view', 'gourmet', 'rainy'] as SpotCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`py-1.5 rounded-lg border transition ${category === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600'}`}
            >
              {c === 'view' ? '🏔️ 絶景' : c === 'gourmet' ? '🍔 グルメ' : '🌧️ 雨の日'}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="スポット名 (例: 富士山 忍野八海)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-lg"
          required
        />
        <textarea
          placeholder="旅の思い出やおすすめポイント..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full p-2 border rounded-lg"
        />

        <button
          onClick={() => {
            if (!fileUrl || !title) return;
            onSubmit({
              title,
              description,
              fileUrl,
              fileType: 'image',
              lat: coords.lat,
              lng: coords.lng,
              country: '日本',
              countryFlag: '🇯🇵',
              category,
              visibility: 'public',
              dateTime: '2026/08/14',
            });
          }}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 active:scale-98 transition"
        >
          マップにピン留めする
        </button>
      </div>
    </div>
  );
}
