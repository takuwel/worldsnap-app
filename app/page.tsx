'use client';

import React, { useState, useEffect, useRef } from 'react';

// ==============================================================================
// 1. 型定義 & 定数
// ==============================================================================
export type SpotCategory = 'view' | 'gourmet' | 'rainy';
export type VisibilityMode = 'world' | 'friends' | 'my';
export type ActiveTab = 'home' | 'map' | 'gallery';

export interface Spot {
  id: string;
  userId: string;
  userName: string;
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
  { code: 'KR', name: 'South Korea', nativeName: '대한민국', flag: '🇰🇷', coords: [35.9078, 127.7669], zoom: 7, dict: { viewMode: '풍경', gourmetMode: '맛집', rainyMode: '비오는날', addPhoto: '사진 추가', saveMap: '지도 저장', visited: '방문 국가', countries: '개국' } },
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
    userId: 'user_ken',
    userName: 'Ken_Gourmet',
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
    userId: 'user_sarah',
    userName: 'Sarah_Tokyo',
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

// ==============================================================================
// 2. メインコンポーネント
// ==============================================================================
export default function WorldSnapApp() {
  const currentUserId = 'my_current_user_id';

  // 状態管理
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [eulaAccepted, setEulaAccepted] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(COUNTRIES[0]); // デフォルト: 世界全体
  const [categoryMode, setCategoryMode] = useState<SpotCategory>('view');
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('world');
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>([]);
  const [galleryViewMode, setGalleryViewMode] = useState<'grid' | 'folder'>('grid');

  // モーダル・バナー
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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

  const visitedCount = new Set(spots.map((s) => s.country)).size;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 触覚フィードバック（Web Haptics API）
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  // ----------------------------------------------------------------------------
  // Leaflet 地図の初期化 (世界全体が見える広域ズーム & ダブルタップ地域拡大)
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

      // 世界地図全体を表示できる設定 (minZoom: 2, 世界ラップ有効)
      const map = L.map(mapContainerRef.current, {
        center: [20, 0], // 世界中央
        zoom: 2,         // 全世界が見渡せるズーム
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        doubleClickZoom: false, // カスタムのダブルタップズームを適用
      });

      // ダブルタップ / ダブルクリックでその地域付近へスムーズにズームアップ（例: 関東へ拡大）
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
  // マップタイル切り替え (3大モード連動) & 国籍フォーカス移動
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
        marker.on('click', () => {
          triggerHaptic();
          setSelectedSpot(spot);
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
  // ボトムナビゲーション タップ & リタップギミック
  // ----------------------------------------------------------------------------
  const handleTabClick = (tab: ActiveTab) => {
    triggerHaptic();
    if (activeTab === tab) {
      // 同一タブ再タップ（リタップ）ギミック
      if (tab === 'home' && feedScrollRef.current) {
        feedScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('🔄 タイムラインを更新しました');
      } else if (tab === 'map' && leafletMapRef.current) {
        leafletMapRef.current.flyTo(selectedCountry.coords, selectedCountry.zoom, { duration: 1 });
      } else if (tab === 'gallery') {
        setGalleryViewMode((prev) => (prev === 'grid' ? 'folder' : 'grid'));
        showToast(galleryViewMode === 'grid' ? '📁 国別フォルダー表示' : '📸 写真グリッド表示');
      }
    } else {
      setActiveTab(tab);
    }
  };

  // マップ長押しで現在地へ移動
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
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow">
            Me
          </div>
        </div>
      </header>

      {/* 国籍フォーカス & 3大モード & 表示対象切替バー */}
      <div className="bg-white/90 backdrop-blur-md px-4 py-2 border-b z-20 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
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

      {/* メインコンテンツエリア */}
      <div className="flex-1 relative overflow-hidden">
        {/* 1. 地図画面 (常にメモリ保持して高速切替) */}
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

        {/* 2. ホーム（フィード・タイムライン） */}
        {activeTab === 'home' && (
          <div ref={feedScrollRef} className="w-full h-full bg-slate-50 overflow-y-auto p-4 space-y-4 pb-28">
            <h2 className="font-extrabold text-base text-slate-800">✨ 世界の最新フォトジャーナル</h2>
            {displaySpots.map((spot) => (
              <div
                key={spot.id}
                onClick={() => setSelectedSpot(spot)}
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

        {/* 3. ギャラリー（国別アルバム / グリッド） */}
        {activeTab === 'gallery' && (
          <div className="w-full h-full bg-slate-50 overflow-y-auto p-4 pb-28 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-base text-slate-800">🖼️ 旅のアルバム ({displaySpots.length}枚)</h2>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md">
                {galleryViewMode === 'grid' ? '📸 グリッド' : '📁 国別フォルダー'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {displaySpots.map((spot) => (
                <div
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  className="aspect-square bg-slate-200 rounded-xl overflow-hidden shadow-2xs relative cursor-pointer group"
                >
                  <img src={spot.fileUrl} alt={spot.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <span className="absolute bottom-1 right-1 text-xs">{spot.countryFlag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📢 目立たない広告バナー枠（UXを邪魔しないネイティブスポンサー枠） */}
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
      </div>

      {/* ==================================================================== */}
      {/* 📱 ボトムナビゲーション (スプリングインジケーター & リタップ連動) */}
      {/* ==================================================================== */}
      <nav className="h-14 bg-white border-t flex items-center justify-around z-30 text-gray-500 text-xs shrink-0 shadow-lg relative">
        <button
          onClick={() => handleTabClick('home')}
          className={`flex-1 py-1 flex flex-col items-center gap-0.5 transition-transform duration-150 active:scale-90 ${
            activeTab === 'home' ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400'
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
            activeTab === 'map' ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <span className="text-base">🗺️</span> マップ
        </button>

        <button
          onClick={() => handleTabClick('gallery')}
          className={`flex-1 py-1 flex flex-col items-center gap-0.5 transition-transform duration-150 active:scale-90 ${
            activeTab === 'gallery' ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <span className="text-base">🖼️</span> ギャラリー
        </button>
      </nav>

      {/* ==================================================================== */}
      {/* 📱 ピン詳細ボトムバナー (ギミック完全実装) */}
      {/* ==================================================================== */}
      {selectedSpot && (
        <SpotDetailBanner
          spot={selectedSpot}
          currentUserId={currentUserId}
          isBookmarked={savedSpotIds.includes(selectedSpot.id)}
          onClose={() => setSelectedSpot(null)}
          onOpenMedia={() => setIsLightboxOpen(true)}
          onToggleBookmark={() => {
            triggerHaptic();
            const isSaved = savedSpotIds.includes(selectedSpot.id);
            setSavedSpotIds((prev) =>
              isSaved ? prev.filter((id) => id !== selectedSpot.id) : [...prev, selectedSpot.id]
            );
            showToast(isSaved ? 'ブックマークを解除しました' : '💛 行きたいリストに保存しました！');
          }}
          onReport={() => setIsReportModalOpen(true)}
          onBlockUser={(targetUserId) => {
            if (confirm('このユーザーをブロックしますか？相手の投稿がすべて非表示になります。')) {
              setBlockedUserIds((prev) => [...prev, targetUserId]);
              setSelectedSpot(null);
              showToast('🚫 ユーザーをブロックしました');
            }
          }}
          onDeleteSpot={(spotId) => {
            if (confirm('このピンを完全に削除しますか？')) {
              setSpots((prev) => prev.filter((s) => s.id !== spotId));
              setSelectedSpot(null);
              showToast('🗑️ ピンを削除しました');
            }
          }}
        />
      )}

      {/* フルスクリーン拡大 (Lightbox) */}
      {isLightboxOpen && selectedSpot && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-screen">
            <img src={selectedSpot.fileUrl} alt={selectedSpot.title} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            <p className="text-white text-center mt-3 text-sm font-semibold">{selectedSpot.title}</p>
            <span className="absolute top-4 right-4 text-white text-xl bg-black/50 w-8 h-8 rounded-full flex items-center justify-center">✕</span>
          </div>
        </div>
      )}

      {/* 規約同意 (EULA) */}
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
// 3. 詳細ボトムバナー (ギミック完全実装)
// ==============================================================================
function SpotDetailBanner({
  spot,
  currentUserId,
  isBookmarked,
  onClose,
  onOpenMedia,
  onToggleBookmark,
  onReport,
  onBlockUser,
  onDeleteSpot,
}: {
  spot: Spot;
  currentUserId: string;
  isBookmarked: boolean;
  onClose: () => void;
  onOpenMedia: () => void;
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
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-2xs" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 border-t border-gray-100 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 上部ドラッグバー */}
        <div className="w-full flex justify-center pt-2.5 pb-1 cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition" />
        </div>

        {/* 📸 写真 / メディア枠 */}
        <div className="relative mx-4 mt-1 aspect-16/9 bg-slate-900 rounded-2xl overflow-hidden cursor-zoom-in group shadow-inner" onClick={onOpenMedia}>
          <img src={spot.fileUrl} alt={spot.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold rounded-full border border-white/20">
            {spot.category === 'view' ? '🏔️ VIEW' : spot.category === 'gourmet' ? '🍔 GOURMET' : '🌧️ RAINY'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-2.5 right-2.5 w-7 h-7 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white rounded-full flex items-center justify-center font-bold text-xs transition"
          >
            ✕
          </button>
        </div>

        {/* 詳細テキスト & アクション */}
        <div className="p-5 overflow-y-auto space-y-3.5">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 leading-tight">{spot.title}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                📍 {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)} ({spot.country} {spot.countryFlag}) · {spot.dateTime || '2026'}
              </p>
            </div>

            <button
              onClick={handleBookmarkClick}
              className={`p-2.5 rounded-full border shadow-xs transition-all duration-200 ${
                bounce ? 'scale-125' : 'scale-100'
              } ${
                isBookmarked
                  ? 'bg-rose-50 border-rose-300 text-rose-500 shadow-rose-100'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500'
              }`}
            >
              <span className="text-xl leading-none">{isBookmarked ? '💛' : '🤍'}</span>
            </button>
          </div>

          {spot.description && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {spot.description}
            </p>
          )}

          <button
            onClick={handleOpenGoogleMaps}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow-lg shadow-blue-500/30 transition duration-150"
          >
            <span className="text-sm">🧭</span>
            Googleマップでルート案内を開く
          </button>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">👤 {spot.userName}</span>

            {isOwner ? (
              <button
                onClick={() => onDeleteSpot(spot.id)}
                className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 hover:underline"
              >
                🗑️ ピンを削除
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={onReport}
                  className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-0.5 hover:underline"
                >
                  ⚠️ 通報
                </button>
                <button
                  onClick={() => onBlockUser(spot.userId)}
                  className="text-slate-400 hover:text-red-500 font-semibold flex items-center gap-0.5 hover:underline"
                >
                  🚫 ブロック
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 4. 写真投稿 & Exif動的解析モーダル
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
