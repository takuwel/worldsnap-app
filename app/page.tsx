'use client';

import React, { useState, useEffect, useRef } from 'react';

// ==============================================================================
// 1. 型定義 & 定数
// ==============================================================================
export type SpotCategory = 'view' | 'gourmet' | 'rainy';
export type VisibilityMode = 'world' | 'friends' | 'my';

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
    userId: 'user_sample_1',
    userName: 'GlobalTraveler',
    title: 'マッターホルンのモルゲンロート',
    description: '早朝のツェルマットから眺める黄金色の山頂。息をのむ絶景です！',
    fileUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80',
    fileType: 'image',
    lat: 45.9765,
    lng: 7.7491,
    country: 'CH',
    category: 'view',
    visibility: 'public',
  },
  {
    id: 's2',
    userId: 'user_sample_2',
    userName: 'TokyoFoodie',
    title: '京都 祇園の抹茶パフェ',
    description: '雨の日の古都散策で立ち寄った風情ある甘味処。濃厚な抹茶が絶品。',
    fileUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    fileType: 'image',
    lat: 35.0037,
    lng: 135.7772,
    country: 'JP',
    category: 'gourmet',
    visibility: 'public',
  }
];

// ==============================================================================
// 2. メインコンポーネント
// ==============================================================================
export default function WorldSnapApp() {
  const currentUserId = 'my_current_user_id';

  // 状態管理
  const [eulaAccepted, setEulaAccepted] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(COUNTRIES[0]);
  const [categoryMode, setCategoryMode] = useState<SpotCategory>('view');
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('world');
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  // モーダル管理
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 地図DOMとLeafletインスタンスの参照
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // 表示対象のスポット一覧（フィルタリング）
  const displaySpots = spots.filter((spot) => {
    if (blockedUserIds.includes(spot.userId)) return false;
    if (spot.category !== categoryMode) return false;
    if (visibilityMode === 'my') return spot.userId === currentUserId;
    return true;
  });

  const visitedCount = new Set(spots.map((s) => s.country)).size;

  // ----------------------------------------------------------------------------
  // Leaflet 地図の動的初期化 (SSR ReferenceError回避)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (leafletMapRef.current) return; // 既に初期化済み

      // Leaflet CSS 動的ロード
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
        center: selectedCountry.coords,
        zoom: selectedCountry.zoom,
        zoomControl: false,
      });

      leafletMapRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // ----------------------------------------------------------------------------
  // マップタイル切り替え (3大モード連動) & 視点移動
  // ----------------------------------------------------------------------------
  useEffect(() => {
    async function updateMapTiles() {
      if (!leafletMapRef.current) return;
      const L = (await import('leaflet')).default;
      const map = leafletMapRef.current;

      // 既存タイルレイヤーをクリア
      map.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      // モードに応じたタイルURL
      let tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'; // View (ライト)
      if (categoryMode === 'gourmet') {
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // グルメ (ウォーム)
      } else if (categoryMode === 'rainy') {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'; // 雨の日 (ダーク)
      }

      L.tileLayer(tileUrl, { attribution: '&copy; OpenStreetMap contributors &copy; CARTO' }).addTo(map);
      map.flyTo(selectedCountry.coords, selectedCountry.zoom, { duration: 1.2 });
    }

    updateMapTiles();
  }, [categoryMode, selectedCountry]);

  // ----------------------------------------------------------------------------
  // マーカー & アーク線（破線ルート）の再描画
  // ----------------------------------------------------------------------------
  useEffect(() => {
    async function renderMarkers() {
      if (!leafletMapRef.current) return;
      const L = (await import('leaflet')).default;
      const map = leafletMapRef.current;

      // 既存ピン削除
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      // ピンの枠色
      const borderColor =
        categoryMode === 'view' ? '#38bdf8' : categoryMode === 'gourmet' ? '#f59e0b' : '#a855f7';

      // マーカー配置
      displaySpots.forEach((spot) => {
        const customIcon = L.divIcon({
          className: 'custom-pin',
          html: `
            <div style="width:44px; height:44px; border-radius:50%; border:3px solid ${borderColor}; box-shadow:0 4px 10px rgba(0,0,0,0.3); overflow:hidden; background:#fff; cursor:pointer;">
              <img src="${spot.fileUrl}" style="width:100%; height:100%; object-fit:cover;" />
            </div>
            <div style="width:8px; height:8px; background:#1e293b; border-radius:50%; margin:-3px auto 0; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>
          `,
          iconSize: [44, 48],
          iconAnchor: [22, 48],
        });

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => setSelectedSpot(spot));
        markersRef.current.push(marker);
      });

      // 移動アーク破線
      if (displaySpots.length > 1) {
        const latlngs: [number, number][] = displaySpots.map((s) => [s.lat, s.lng]);
        polylineRef.current = L.polyline(latlngs, {
          color: borderColor,
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.8,
        }).addTo(map);
      }
    }

    renderMarkers();
  }, [displaySpots, categoryMode]);

  // ----------------------------------------------------------------------------
  // マップ画像保存 (html2canvas 動的ロード)
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
    } catch {
      alert('マップの保存に失敗しました');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden font-sans select-none text-slate-800">
      {/* ヘッダー */}
      <header className="h-14 bg-white/95 backdrop-blur-md border-b flex items-center justify-between px-4 z-20 shadow-sm">
        <div className="flex items-center space-x-2">
          <button className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg text-lg">☰</button>
          <span className="font-black text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            🗺️ WorldSnap
          </span>
        </div>

        {/* 訪問国数カウンター */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
            {selectedCountry.dict.visited}: {visitedCount} {selectedCountry.dict.countries}
          </div>
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow">
            Me
          </div>
        </div>
      </header>

      {/* 国籍フォーカス & 3大モード & 表示対象切替バー */}
      <div className="bg-white/90 backdrop-blur-md px-4 py-2 border-b z-20 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* 国籍選択 */}
        <select
          value={selectedCountry.code}
          onChange={(e) => {
            const c = COUNTRIES.find((item) => item.code === e.target.value);
            if (c) setSelectedCountry(c);
          }}
          className="font-semibold bg-gray-100 border-0 rounded-lg px-2.5 py-1.5"
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
            onClick={() => setCategoryMode('view')}
            className={`px-3 py-1 rounded-md transition ${categoryMode === 'view' ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-600'}`}
          >
            🏔️ {selectedCountry.dict.viewMode}
          </button>
          <button
            onClick={() => setCategoryMode('gourmet')}
            className={`px-3 py-1 rounded-md transition ${categoryMode === 'gourmet' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600'}`}
          >
            🍔 {selectedCountry.dict.gourmetMode}
          </button>
          <button
            onClick={() => setCategoryMode('rainy')}
            className={`px-3 py-1 rounded-md transition ${categoryMode === 'rainy' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600'}`}
          >
            🌧️ {selectedCountry.dict.rainyMode}
          </button>
        </div>

        {/* 表示対象切替 */}
        <div className="flex bg-gray-100 p-0.5 rounded-lg font-semibold text-gray-600">
          <button
            onClick={() => setVisibilityMode('world')}
            className={`px-2 py-1 rounded ${visibilityMode === 'world' ? 'bg-white text-indigo-600 shadow-xs' : ''}`}
          >
            🌐 ワールド
          </button>
          <button
            onClick={() => setVisibilityMode('friends')}
            className={`px-2 py-1 rounded ${visibilityMode === 'friends' ? 'bg-white text-indigo-600 shadow-xs' : ''}`}
          >
            👥 フレンド
          </button>
          <button
            onClick={() => setVisibilityMode('my')}
            className={`px-2 py-1 rounded ${visibilityMode === 'my' ? 'bg-white text-indigo-600 shadow-xs' : ''}`}
          >
            🔒 マイ
          </button>
        </div>
      </div>

      {/* メイン地図 */}
      <main className="flex-1 relative">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* フローティング・アクションボタン */}
        <div className="absolute right-4 bottom-20 z-20 flex flex-col space-y-3">
          <button
            onClick={handleSaveMap}
            className="w-12 h-12 bg-white text-gray-800 rounded-full shadow-lg flex items-center justify-center font-bold hover:bg-gray-50 transition border"
            title={selectedCountry.dict.saveMap}
          >
            💾
          </button>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-full shadow-xl flex items-center gap-2 font-bold hover:opacity-95 transition text-xs"
          >
            📷＋ {selectedCountry.dict.addPhoto}
          </button>
        </div>
      </main>

      {/* ボトムナビゲーション */}
      <nav className="h-14 bg-white border-t flex items-center justify-around z-20 text-gray-500 text-xs">
        <button className="flex flex-col items-center gap-0.5 text-gray-400">🏠 ホーム</button>
        <button className="flex flex-col items-center gap-0.5 text-indigo-600 font-bold">🗺️ マップ</button>
        <button className="flex flex-col items-center gap-0.5 text-gray-400">🖼️ ギャラリー</button>
      </nav>

      {/* ==================================================================== */}
      {/* モーダル群 (EULA / 写真詳細 / 投稿 / 通報) */}
      {/* ==================================================================== */}

      {/* 1. EULA同意モーダル */}
      {!eulaAccepted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-indigo-600">🛡️ 利用規約への同意</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              当アプリではハラスメント、不適切な画像の投稿を固く禁じています。違反者は即座に利用停止となります。
            </p>
            <button
              onClick={() => setEulaAccepted(true)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm"
            >
              同意してはじめる
            </button>
          </div>
        </div>
      )}

      {/* 2. 写真ピン詳細 & Googleマップ連携モーダル */}
      {selectedSpot && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="relative aspect-4/3 bg-black">
              <img src={selectedSpot.fileUrl} alt={selectedSpot.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedSpot(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-base text-gray-900">{selectedSpot.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    📍 {selectedSpot.lat.toFixed(4)}, {selectedSpot.lng.toFixed(4)} ({selectedSpot.country})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSavedSpotIds((prev) =>
                      prev.includes(selectedSpot.id) ? prev.filter((id) => id !== selectedSpot.id) : [...prev, selectedSpot.id]
                    );
                  }}
                  className={`text-lg p-1.5 rounded-full border ${savedSpotIds.includes(selectedSpot.id) ? 'bg-rose-50 border-rose-300 text-rose-500' : 'text-gray-400'}`}
                >
                  💛
                </button>
              </div>

              {selectedSpot.description && <p className="text-xs text-gray-600">{selectedSpot.description}</p>}

              {/* Googleマップ起動 */}
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedSpot.lat},${selectedSpot.lng}`, '_blank')}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs shadow"
              >
                🧭 Googleマップでルート案内を開く
              </button>

              {/* オーナー削除 / 他人通報・ブロック */}
              <div className="pt-2 border-t flex justify-between items-center text-xs">
                <span className="text-gray-400">投稿者: {selectedSpot.userName}</span>
                {selectedSpot.userId === currentUserId ? (
                  <button
                    onClick={() => {
                      setSpots((prev) => prev.filter((s) => s.id !== selectedSpot.id));
                      setSelectedSpot(null);
                    }}
                    className="text-red-500 font-bold"
                  >
                    🗑️ ピンを削除
                  </button>
                ) : (
                  <div className="space-x-3">
                    <button onClick={() => setIsReportModalOpen(true)} className="text-amber-600 font-medium">⚠️ 通報</button>
                    <button
                      onClick={() => {
                        setBlockedUserIds((prev) => [...prev, selectedSpot.userId]);
                        setSelectedSpot(null);
                      }}
                      className="text-red-500 font-medium"
                    >
                      🚫 ブロック
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 新規写真追加 & Exif解析モーダル */}
      {isPostModalOpen && (
        <PostUploadModal
          onClose={() => setIsPostModalOpen(false)}
          onSubmit={(newSpotData) => {
            const newSpot: Spot = {
              id: Date.now().toString(),
              userId: currentUserId,
              userName: 'MyUser',
              ...newSpotData,
            };
            setSpots((prev) => [newSpot, ...prev]);
            setIsPostModalOpen(false);
          }}
        />
      )}

      {/* 4. 通報ダイアログ */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 space-y-3 text-xs">
            <h4 className="font-bold text-gray-900 text-sm">⚠️ 投稿を通報する</h4>
            <select className="w-full p-2 border rounded-lg bg-gray-50">
              <option>不適切な写真・コンテンツ</option>
              <option>嫌がらせ・ハラスメント</option>
              <option>スパム・宣伝</option>
            </select>
            <div className="flex space-x-2 pt-1">
              <button onClick={() => setIsReportModalOpen(false)} className="flex-1 py-2 bg-gray-100 rounded-lg">キャンセル</button>
              <button
                onClick={() => {
                  alert('通報を受理しました');
                  setIsReportModalOpen(false);
                }}
                className="flex-1 py-2 bg-amber-600 text-white rounded-lg font-bold"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// 3. 写真アップロード & Exif動的読み込みモーダル
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 text-xs shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-900">思い出の写真を追加</h3>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center cursor-pointer">
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
          📍 {isManual ? '位置情報を手動指定中 (東京)' : 'Exif位置情報を自動検出'}
          <div className="text-[10px] text-gray-400">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</div>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {(['view', 'gourmet', 'rainy'] as SpotCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`py-1.5 rounded-lg border font-bold ${category === c ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-600'}`}
            >
              {c === 'view' ? '🏔️ 絶景' : c === 'gourmet' ? '🍔 グルメ' : '🌧️ 雨の日'}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="スポット名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-lg"
          required
        />
        <textarea
          placeholder="思い出のメモ..."
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
              country: 'JP',
              category,
              visibility: 'public',
            });
          }}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold"
        >
          ピン留めする
        </button>
      </div>
    </div>
  );
}
