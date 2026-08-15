'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// ==========================================
// 1. 型定義 & 言語・国籍マスターデータ
// ==========================================
export type ViewCategory = 'view' | 'gourmet' | 'rain';
export type DisplayScope = 'my' | 'friends' | 'world';
export type TabType = 'home' | 'map' | 'profile';

export interface Spot {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  lat: number;
  lon: number;
  countryCode: string;
  category: ViewCategory;
  createdAt: string;
  isSaved?: boolean;
}

export interface PendingFile {
  id: string;
  file: File;
  fileUrl: string;
  fileType: 'image' | 'video';
  dateTime?: string;
}

// 18カ国の国籍・中心座標・言語リソース定義
export const COUNTRIES: Record<
  string,
  {
    name: string;
    flag: string;
    lang: string;
    lat: number;
    lon: number;
    zoom: number;
    dict: Record<string, string>;
  }
> = {
  CH: {
    name: 'スイス (Schweiz)',
    flag: '🇨🇭',
    lang: 'de',
    lat: 46.8182,
    lon: 8.2275,
    zoom: 8,
    dict: { home: 'Start', map: 'Karte', profile: 'Profil', addPhoto: 'Foto hinzufügen', exportMap: 'Karte speichern', view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen', openGoogleMaps: 'In Google Maps öffnen', saveSpot: 'Merken', report: 'Melden', block: 'Blockieren', visited: 'Besucht', countriesUnit: 'Länder' },
  },
  JP: {
    name: '日本 (Japan)',
    flag: '🇯🇵',
    lang: 'ja',
    lat: 36.2048,
    lon: 138.2529,
    zoom: 5,
    dict: { home: 'ホーム', map: 'マップ', profile: 'マイページ', addPhoto: '写真/動画を追加', exportMap: 'マップ保存', view: 'View', gourmet: 'グルメ', rain: '雨の日', openGoogleMaps: 'Googleマップでルート案内を開く', saveSpot: '行きたい保存', report: '通報', block: 'ブロック', visited: '訪問', countriesUnit: 'カ国' },
  },
  KR: {
    name: '韓国 (대한민국)',
    flag: '🇰🇷',
    lang: 'ko',
    lat: 35.9078,
    lon: 127.7669,
    zoom: 7,
    dict: { home: '홈', map: '지도', profile: '프로필', addPhoto: '사진/동영상 추가', exportMap: '지도 저장', view: '경치', gourmet: '맛집', rain: '비오는날', openGoogleMaps: 'Google 지도에서 길찾기', saveSpot: '저장', report: '신고', block: '차단', visited: '방문', countriesUnit: '개국' },
  },
  AU: {
    name: 'オーストラリア (Australia)',
    flag: '🇦🇺',
    lang: 'en',
    lat: -25.2744,
    lon: 133.7751,
    zoom: 4,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Media', exportMap: 'Save Map', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  DE: {
    name: 'ドイツ (Deutschland)',
    flag: '🇩🇪',
    lang: 'de',
    lat: 51.1657,
    lon: 10.4515,
    zoom: 6,
    dict: { home: 'Start', map: 'Karte', profile: 'Profil', addPhoto: 'Medien hinzufügen', exportMap: 'Karte speichern', view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen', openGoogleMaps: 'In Google Maps öffnen', saveSpot: 'Speichern', report: 'Melden', block: 'Blockieren', visited: 'Besucht', countriesUnit: 'Länder' },
  },
  US: {
    name: 'アメリカ (USA)',
    flag: '🇺🇸',
    lang: 'en',
    lat: 37.0902,
    lon: -95.7129,
    zoom: 4,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Media', exportMap: 'Save Map', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  FR: {
    name: 'フランス (France)',
    flag: '🇫🇷',
    lang: 'fr',
    lat: 46.2276,
    lon: 2.2137,
    zoom: 6,
    dict: { home: 'Accueil', map: 'Carte', profile: 'Profil', addPhoto: 'Ajouter média', exportMap: 'Enregistrer la carte', view: 'Paysage', gourmet: 'Gourmet', rain: 'Pluie', openGoogleMaps: 'Ouvrir dans Google Maps', saveSpot: 'Enregistrer', report: 'Signaler', block: 'Bloquer', visited: 'Visité', countriesUnit: 'pays' },
  },
  TH: {
    name: 'タイ (ไทย)',
    flag: '🇹🇭',
    lang: 'th',
    lat: 15.87,
    lon: 100.9925,
    zoom: 6,
    dict: { home: 'หน้าแรก', map: 'แผนที่', profile: 'โปรไฟล์', addPhoto: 'เพิ่มรูปภาพ', exportMap: 'บันทึกแผนที่', view: 'วิว', gourmet: 'ของกิน', rain: 'วันฝนตก', openGoogleMaps: 'เปิดใน Google Maps', saveSpot: 'บันทึก', report: 'รายงาน', block: 'บล็อก', visited: 'เยือนแล้ว', countriesUnit: 'ประเทศ' },
  },
  IT: {
    name: 'イタリア (Italia)',
    flag: '🇮🇹',
    lang: 'it',
    lat: 41.8719,
    lon: 12.5674,
    zoom: 6,
    dict: { home: 'Home', map: 'Mappa', profile: 'Profilo', addPhoto: 'Aggiungi foto', exportMap: 'Salva mappa', view: 'Panorama', gourmet: 'Gourmet', rain: 'Pioggia', openGoogleMaps: 'Apri su Google Maps', saveSpot: 'Salva', report: 'Segnala', block: 'Blocca', visited: 'Visitati', countriesUnit: 'paesi' },
  },
  GB: {
    name: 'イギリス (UK)',
    flag: '🇬🇧',
    lang: 'en',
    lat: 55.3781,
    lon: -3.436,
    zoom: 5,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Media', exportMap: 'Save Map', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  ES: {
    name: 'スペイン (España)',
    flag: '🇪🇸',
    lang: 'es',
    lat: 40.4637,
    lon: -3.7492,
    zoom: 6,
    dict: { home: 'Inicio', map: 'Mapa', profile: 'Perfil', addPhoto: 'Añadir foto', exportMap: 'Guardar mapa', view: 'Vistas', gourmet: 'Gourmet', rain: 'Lluvia', openGoogleMaps: 'Abrir en Google Maps', saveSpot: 'Guardar', report: 'Denunciar', block: 'Bloquear', visited: 'Visitados', countriesUnit: 'países' },
  },
  NZ: {
    name: 'ニュージーランド (NZ)',
    flag: '🇳🇿',
    lang: 'en',
    lat: -40.9006,
    lon: 174.886,
    zoom: 5,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Media', exportMap: 'Save Map', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  AT: {
    name: 'オーストリア (Österreich)',
    flag: '🇦🇹',
    lang: 'de',
    lat: 47.5162,
    lon: 14.5501,
    zoom: 7,
    dict: { home: 'Start', map: 'Karte', profile: 'Profil', addPhoto: 'Medien hinzufügen', exportMap: 'Karte speichern', view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen', openGoogleMaps: 'In Google Maps öffnen', saveSpot: 'Speichern', report: 'Melden', block: 'Blockieren', visited: 'Besucht', countriesUnit: 'Länder' },
  },
  SG: {
    name: 'シンガポール (Singapore)',
    flag: '🇸🇬',
    lang: 'en',
    lat: 1.3521,
    lon: 103.8198,
    zoom: 11,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Media', exportMap: 'Save Map', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  CA: {
    name: 'カナダ (Canada)',
    flag: '🇨🇦',
    lang: 'en',
    lat: 56.1304,
    lon: -106.3468,
    zoom: 4,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Media', exportMap: 'Save Map', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  AE: {
    name: 'UAE ドバイ (Dubai)',
    flag: '🇦🇪',
    lang: 'ar',
    lat: 25.2048,
    lon: 55.2708,
    zoom: 9,
    dict: { home: 'الرئيسية', map: 'الخريطة', profile: 'الملف الشخصي', addPhoto: 'إضافة وسائط', exportMap: 'حفظ الخريطة', view: 'إطلالة', gourmet: 'مطاعم', rain: 'ممطر', openGoogleMaps: 'فتح في خرائط Google', saveSpot: 'حفظ', report: 'إبلاغ', block: 'حظر', visited: 'الدول التي زرتها', countriesUnit: 'دولة' },
  },
  MV: {
    name: 'モルディブ (Maldives)',
    flag: '🇲🇻',
    lang: 'en',
    lat: 3.2028,
    lon: 73.2207,
    zoom: 7,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Media', exportMap: 'Save Map', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  TW: {
    name: '台湾 (Taiwan)',
    flag: '🇹🇼',
    lang: 'zh',
    lat: 23.6978,
    lon: 120.9605,
    zoom: 7,
    dict: { home: '首頁', map: '地圖', profile: '個人主頁', addPhoto: '新增照片', exportMap: '儲存地圖', view: '景觀', gourmet: '美食', rain: '雨天', openGoogleMaps: '在 Google 地圖中開啟', saveSpot: '收藏', report: '檢舉', block: '封鎖', visited: '造訪過', countriesUnit: '個國家' },
  },
};

// 初期サンプル投稿（世界・フレンドのモックデータ）
const INITIAL_SPOTS: Spot[] = [
  {
    id: 'mock-1',
    userId: 'user-yuki',
    userName: 'Yuki_Traveler',
    title: 'マッターホルンの絶景朝焼け',
    description: '早朝のツェルマットから眺める黄金色の山頂。展望台へは始発電車がおすすめ！',
    fileName: 'matterhorn.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&auto=format&fit=crop',
    fileType: 'image',
    lat: 45.9765,
    lon: 7.7491,
    countryCode: 'CH',
    category: 'view',
    createdAt: '2026-08-14',
  },
  {
    id: 'mock-2',
    userId: 'user-ken',
    userName: 'Ken_Gourmet',
    title: '京都 鴨川沿いの絶品抹茶パフェ',
    description: '川床を眺めながらいただく濃厚な宇治抹茶。デートにも最高です。',
    fileName: 'matcha.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop',
    fileType: 'image',
    lat: 35.0037,
    lon: 135.7712,
    countryCode: 'JP',
    category: 'gourmet',
    createdAt: '2026-08-10',
  },
  {
    id: 'mock-3',
    userId: 'user-lisa',
    userName: 'Lisa_Rain',
    title: '雨のルーヴル美術館とガラスのピラミッド',
    description: '雨の日は幻想的な光に包まれます。地下入口から入ると混雑回避できます！',
    fileName: 'louvre.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop',
    fileType: 'image',
    lat: 48.8606,
    lon: 2.3376,
    countryCode: 'FR',
    category: 'rain',
    createdAt: '2026-08-01',
  },
];

function convertDMSToDD(dms: number[], ref: string): number {
  if (!dms || dms.length < 3) return 0;
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') dd *= -1;
  return dd;
}

// ==========================================
// 2. Leaflet 動的読み込みコンポーネント (SSR回避)
// ==========================================
const MapComponent = dynamic(
  () =>
    Promise.resolve(
      ({
        spots,
        center,
        zoom,
        mode,
        onSelectSpot,
        onDoubleTap,
      }: {
        spots: Spot[];
        center: [number, number];
        zoom: number;
        mode: ViewCategory;
        onSelectSpot: (s: Spot) => void;
        onDoubleTap: (lat: number, lon: number) => void;
      }) => {
        const { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } = require('react-leaflet');
        const L = require('leaflet');
        require('leaflet/dist/leaflet.css');

        // 地図移動用
        const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
          const map = useMap();
          useEffect(() => {
            map.flyTo(center, zoom, { duration: 1.2 });
          }, [center, zoom, map]);
          return null;
        };

        // ダブルクリック/タップで周辺ズーム
        const MapEventHandler = () => {
          useMapEvents({
            dblclick(e: any) {
              onDoubleTap(e.latlng.lat, e.latlng.lng);
            },
          });
          return null;
        };

        const tileUrl =
          mode === 'rain'
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : mode === 'gourmet'
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        const polylineCoords = spots.map((s) => [s.lat, s.lon] as [number, number]);

        return (
          <MapContainer
            center={center}
            zoom={zoom}
            minZoom={2}
            maxBounds={[[-90, -180], [90, 180]]}
            maxBoundsViscosity={1.0}
            doubleClickZoom={false}
            style={{ width: '100%', height: '100%', minHeight: '480px', borderRadius: '16px', background: '#070d1e' }}
            scrollWheelZoom={true}
          >
            <MapController center={center} zoom={zoom} />
            <MapEventHandler />
            <TileLayer url={tileUrl} attribution='&copy; CARTO' />

            {/* ルートライン (アーク破線) */}
            {polylineCoords.length > 1 && (
              <Polyline
                positions={polylineCoords}
                pathOptions={{
                  color: mode === 'gourmet' ? '#ea580c' : mode === 'rain' ? '#38bdf8' : '#0284c7',
                  weight: 3,
                  dashArray: '6, 8',
                  opacity: 0.85,
                }}
              />
            )}

            {/* 写真ピン */}
            {spots.map((spot) => {
              const borderCol = mode === 'gourmet' ? '#ea580c' : mode === 'rain' ? '#38bdf8' : '#0284c7';
              const iconHtml = `
                <div style="
                  position: relative;
                  width: 48px;
                  height: 48px;
                  border-radius: 50%;
                  border: 3px solid ${borderCol};
                  box-shadow: 0 4px 14px rgba(0,0,0,0.35);
                  overflow: hidden;
                  background: #111;
                  cursor: pointer;
                  transform: scale(1);
                  transition: transform 0.2s ease;
                ">
                  <img src="${spot.fileUrl}" style="width:100%;height:100%;object-fit:cover;" />
                </div>
              `;
              const customIcon = L.divIcon({
                className: 'ws-marker-pin',
                html: iconHtml,
                iconSize: [48, 48],
                iconAnchor: [24, 24],
              });

              return (
                <Marker
                  key={spot.id}
                  position={[spot.lat, spot.lon]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => onSelectSpot(spot),
                  }}
                />
              );
            })}
          </MapContainer>
        );
      }
    ),
  { ssr: false, loading: () => <div style={{ height: '480px', background: '#0f172a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>🗺️ マップを読み込み中...</div> }
);

// ==========================================
// 3. メインコンポーネント (WorldSnap)
// ==========================================
export default function WorldSnapApp() {
  // ユーザー・設定ステート
  const [userCountry, setUserCountry] = useState<string>('JP');
  const [userName, setUserName] = useState<string>('taku_snap');
  const [userBio, setUserBio] = useState<string>('世界中を旅して記録中 🌏✈️');
  const [friendCode] = useState<string>('WS-8823-X9');

  // タブ・表示モード・公開範囲
  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [viewMode, setViewMode] = useState<ViewCategory>('view');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('world');

  // 地図状態
  const currentConfig = COUNTRIES[userCountry] || COUNTRIES.JP;
  const [mapCenter, setMapCenter] = useState<[number, number]>([currentConfig.lat, currentConfig.lon]);
  const [mapZoom, setMapZoom] = useState<number>(currentConfig.zoom);

  // コンテンツ・データステート
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>([]);

  // UGC・安全対策・設定モーダル
  const [hasAgreedEULA, setHasAgreedEULA] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('不適切な画像');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // アップロード・位置未設定ファイルキュー
  const [unlocatedFiles, setUnlocatedFiles] = useState<PendingFile[]>([]);
  const [currentPendingIndex, setCurrentPendingIndex] = useState<number>(0);
  const [uploadCategory, setUploadCategory] = useState<ViewCategory>('view');
  const [manualTitle, setManualTitle] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  // マイページ内サブタブ
  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'saved' | 'friends'>('posts');
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; avatar: string }[]>([
    { id: 'user-yuki', name: 'Yuki_Traveler', avatar: '🌸' },
    { id: 'user-ken', name: 'Ken_Gourmet', avatar: '☕' },
  ]);
  const [inputFriendCode, setInputFriendCode] = useState('');

  const exportRef = useRef<HTMLDivElement>(null);
  const t = currentConfig.dict;

  // 国籍変更時の地図自動フォーカス
  useEffect(() => {
    const target = COUNTRIES[userCountry];
    if (target) {
      setMapCenter([target.lat, target.lon]);
      setMapZoom(target.zoom);
    }
  }, [userCountry]);

  // トースト通知表示関数
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // フィルタリング後のスポット一覧
  const filteredSpots = spots.filter((s) => {
    if (blockedUsers.includes(s.userId)) return false;
    if (s.category !== viewMode) return false;
    if (displayScope === 'my') return s.userId === 'me';
    if (displayScope === 'friends') return s.userId === 'me' || friendsList.some((f) => f.id === s.userId);
    return true;
  });

  // 訪問国数（ユニーク数）
  const visitedCountryCount = new Set(spots.filter((s) => s.userId === 'me').map((s) => s.countryCode)).size;

  // ダブルタップでの周辺ズームイン
  const handleMapDoubleTap = (lat: number, lon: number) => {
    setMapCenter([lat, lon]);
    setMapZoom((prev) => Math.min(prev + 3, 14));
  };

  // 写真・動画のアップロード
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const EXIFModule = await import('exif-js');
    const EXIF = EXIFModule.default || EXIFModule;

    const files = Array.from(e.target.files);
    const newSpots: Spot[] = [];
    const pendingList: PendingFile[] = [];

    for (const file of files) {
      const fileUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const fileId = 'spot-' + Math.random().toString(36).substring(2, 9);

      if (isVideo) {
        pendingList.push({ id: fileId, file, fileUrl, fileType: 'video', dateTime: new Date().toLocaleDateString() });
        continue;
      }

      await new Promise<void>((resolve) => {
        EXIF.getData(file as any, function (this: any) {
          const lat = EXIF.getTag(this, 'GPSLatitude');
          const lon = EXIF.getTag(this, 'GPSLongitude');
          const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
          const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');

          if (lat && lon) {
            const latDecimal = convertDMSToDD(lat, latRef);
            const lonDecimal = convertDMSToDD(lon, lonRef);
            newSpots.push({
              id: fileId,
              userId: 'me',
              userName,
              title: file.name.replace(/\.[^/.]+$/, ''),
              description: '旅の思い出',
              fileName: file.name,
              fileUrl,
              fileType: 'image',
              lat: latDecimal,
              lon: lonDecimal,
              countryCode: userCountry,
              category: uploadCategory,
              createdAt: new Date().toLocaleDateString(),
            });
          } else {
            pendingList.push({ id: fileId, file, fileUrl, fileType: 'image', dateTime: new Date().toLocaleDateString() });
          }
          resolve();
        });
      });
    }

    if (newSpots.length > 0) {
      setSpots((prev) => [...newSpots, ...prev]);
      showToast(`📸 ${newSpots.length}件のスポットを追加しました`);
    }
    if (pendingList.length > 0) {
      setUnlocatedFiles((prev) => [...prev, ...pendingList]);
      setCurrentPendingIndex(0);
    }
  };

  // 手動で位置情報を割り当て
  const handleAssignLocation = (latVal: number, lonVal: number, titleVal?: string) => {
    if (unlocatedFiles.length === 0) return;
    const current = unlocatedFiles[currentPendingIndex];
    if (!current) return;

    const newSpot: Spot = {
      id: current.id,
      userId: 'me',
      userName,
      title: titleVal || manualTitle || current.file.name,
      description: '旅の思い出（手動設定）',
      fileName: current.file.name,
      fileUrl: current.fileUrl,
      fileType: current.fileType,
      lat: latVal,
      lon: lonVal,
      countryCode: userCountry,
      category: uploadCategory,
      createdAt: current.dateTime || new Date().toLocaleDateString(),
    };

    setSpots((prev) => [newSpot, ...prev]);
    const rem = unlocatedFiles.filter((_, idx) => idx !== currentPendingIndex);
    setUnlocatedFiles(rem);
    setManualTitle('');
    setManualLat('');
    setManualLon('');
    showToast('📍 スポットをマップに配置しました');
  };

  // マップ画像保存 (PNG)
  const handleExportMap = async () => {
    if (!exportRef.current) return;
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const canvas = await html2canvas(exportRef.current, { useCORS: true, scale: 2 });
      const img = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = img;
      a.download = `WorldSnap-${userCountry}.png`;
      a.click();
      showToast('💾 マップ画像を保存しました');
    } catch (e) {
      showToast('❌ 保存に失敗しました');
    }
  };

  // ブックマーク（行きたい保存）
  const toggleSaveSpot = (spotId: string) => {
    if (savedSpotIds.includes(spotId)) {
      setSavedSpotIds((prev) => prev.filter((id) => id !== spotId));
      showToast('行きたいリストから解除しました');
    } else {
      setSavedSpotIds((prev) => [...prev, spotId]);
      showToast('💛 行きたいリストに保存しました！');
    }
  };

  // ユーザーブロック
  const handleBlockUser = (userId: string) => {
    if (confirm('このユーザーをブロックしますか？\n相手の投稿がすべて非表示になります。')) {
      setBlockedUsers((prev) => [...prev, userId]);
      setSelectedSpot(null);
      showToast('🚫 ユーザーをブロックしました');
    }
  };

  // 投稿通報
  const handleSubmitReport = () => {
    setIsReportModalOpen(false);
    showToast('✅ 通報を受け付けました。調査いたします。');
  };

  // 自分の投稿削除
  const handleDeleteSpot = (spotId: string) => {
    if (confirm('このピンを削除しますか？')) {
      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      setSelectedSpot(null);
      showToast('🗑️ ピンを削除しました');
    }
  };

  // テーマ別スタイル
  const themeBg = viewMode === 'rain' ? '#0a0f1d' : viewMode === 'gourmet' ? '#fff7ed' : '#f8fafc';
  const themeCard = viewMode === 'rain' ? '#131c31' : '#ffffff';
  const themeText = viewMode === 'rain' ? '#f8fafc' : '#0f172a';
  const themeSubText = viewMode === 'rain' ? '#94a3b8' : '#64748b';
  const themeAccent = viewMode === 'rain' ? '#38bdf8' : viewMode === 'gourmet' ? '#ea580c' : '#0284c7';

  return (
    <div style={{ background: themeBg, color: themeText, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '90px' }}>
      {/* ── トースト通知 ── */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.92)', color: '#fff', padding: '10px 20px', borderRadius: '30px', zIndex: 9999, fontSize: '13px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }}>
          {toastMessage}
        </div>
      )}

      {/* ── 初回EULA同意モーダル ── */}
      {!hasAgreedEULA && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#1e293b', color: '#fff', padding: '24px', borderRadius: '20px', maxWidth: '440px', width: '100%' }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#38bdf8' }}>利用規約 (EULA) の同意</h2>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              WorldSnapでは、嫌がらせ、誹謗中傷、不適切な写真・動画の投稿を固く禁じています。違反者は即時アカウント停止となります。
            </p>
            <button onClick={() => setHasAgreedEULA(true)} style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              利用規約に同意して始める
            </button>
          </div>
        </div>
      )}

      {/* ── ヘッダー ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: themeCard, borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🗺️</span>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: themeAccent, letterSpacing: '-0.5px' }}>WorldSnap</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '6px' }}>
            ⚙️
          </button>
        </div>
      </header>

      {/* ── メインコンテンツ ── */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '16px 14px' }}>
        {/* ==================================================== */}
        {/* TAB 1: 🗺️ メインマップ画面 */}
        {/* ==================================================== */}
        {currentTab === 'map' && (
          <div>
            {/* ユーザー＆国籍・言語フォーカスバナー */}
            <section style={{ marginBottom: '14px', padding: '14px 18px', background: themeCard, borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: themeAccent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{userName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '12px', color: themeSubText }}>フォーカス:</span>
                    <select
                      value={userCountry}
                      onChange={(e) => setUserCountry(e.target.value)}
                      style={{ background: 'transparent', color: themeText, border: '1px solid rgba(128,128,128,0.3)', borderRadius: '6px', padding: '2px 6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {Object.entries(COUNTRIES).map(([code, c]) => (
                        <option key={code} value={code} style={{ background: '#1e293b', color: '#fff' }}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: themeSubText }}>{t.visited}</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: themeAccent }}>
                  {visitedCountryCount} <span style={{ fontSize: '12px', color: themeSubText }}>{t.countriesUnit}</span>
                </div>
              </div>
            </section>

            {/* モード切替タブ (View / グルメ / 雨の日) & 公開スコープ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: themeCard, padding: '4px', borderRadius: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {(['view', 'gourmet', 'rain'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: 'none',
                      background: viewMode === m ? themeAccent : 'transparent',
                      color: viewMode === m ? '#fff' : themeSubText,
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: '0.2s ease',
                    }}
                  >
                    {m === 'view' ? `🏔️ ${t.view}` : m === 'gourmet' ? `🍔 ${t.gourmet}` : `🌧️ ${t.rain}`}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', background: themeCard, padding: '4px', borderRadius: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {(['world', 'friends', 'my'] as const).map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setDisplayScope(scope)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: 'none',
                      background: displayScope === scope ? (viewMode === 'rain' ? '#334155' : '#0f172a') : 'transparent',
                      color: displayScope === scope ? '#fff' : themeSubText,
                      fontWeight: 'bold',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {scope === 'world' ? '🌐 全体' : scope === 'friends' ? '👥 フレンド' : '👤 自分'}
                  </button>
                ))}
              </div>
            </div>

            {/* インタラクティブ・マップ本体 */}
            <div ref={exportRef} style={{ position: 'relative', height: '500px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
              <MapComponent
                spots={filteredSpots}
                center={mapCenter}
                zoom={mapZoom}
                mode={viewMode}
                onSelectSpot={setSelectedSpot}
                onDoubleTap={handleMapDoubleTap}
              />

              {/* 地図上のフローティング操作ボタン */}
              <div style={{ position: 'absolute', bottom: '20px', right: '16px', zIndex: 400, display: 'flex', gap: '10px' }}>
                <label
                  style={{
                    padding: '10px 18px',
                    background: themeAccent,
                    color: '#fff',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📷＋</span>
                  <span>{t.addPhoto}</span>
                  <input type="file" accept="image/*,video/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>

                <button
                  onClick={handleExportMap}
                  style={{
                    padding: '10px 16px',
                    background: '#0f172a',
                    color: '#fff',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    cursor: 'pointer',
                  }}
                >
                  💾 {t.exportMap}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: 🏠 おすすめ旅フィード */}
        {/* ==================================================== */}
        {currentTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 4px 0' }}>✨ おすすめ旅フィード</h2>
            {spots.map((spot) => (
              <div
                key={spot.id}
                onClick={() => setSelectedSpot(spot)}
                style={{
                  background: themeCard,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ height: '220px', background: '#000' }}>
                  <img src={spot.fileUrl} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: themeAccent }}>📍 {COUNTRIES[spot.countryCode]?.flag} {spot.title}</span>
                    <span style={{ fontSize: '11px', color: themeSubText }}>{spot.createdAt}</span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: themeSubText }}>{spot.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: 👤 マイページ */}
        {/* ==================================================== */}
        {currentTab === 'profile' && (
          <div>
            <div style={{ background: themeCard, borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: themeAccent, color: '#fff', fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    👤
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>{userName}</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: themeSubText }}>{userBio}</p>
                  </div>
                </div>
                <button onClick={() => setIsEditProfileOpen(true)} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${themeSubText}`, borderRadius: '20px', fontSize: '12px', color: themeText, cursor: 'pointer' }}>
                  編集
                </button>
              </div>

              {/* 統計バナー */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '20px 0', textAlign: 'center' }}>
                <div style={{ background: themeBg, padding: '10px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{spots.filter((s) => s.userId === 'me').length}</div>
                  <div style={{ fontSize: '11px', color: themeSubText }}>📸 投稿</div>
                </div>
                <div style={{ background: themeBg, padding: '10px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{visitedCountryCount}</div>
                  <div style={{ fontSize: '11px', color: themeSubText }}>🗺️ 訪問国</div>
                </div>
                <div style={{ background: themeBg, padding: '10px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{friendsList.length}</div>
                  <div style={{ fontSize: '11px', color: themeSubText }}>👥 友達</div>
                </div>
              </div>

              {/* フレンドコード枠 */}
              <div style={{ background: themeBg, padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: themeSubText }}>🆔 フレンドコード: </span>
                  <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{friendCode}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(friendCode);
                    showToast('📋 フレンドコードをコピーしました！');
                  }}
                  style={{ padding: '4px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                >
                  コピー
                </button>
              </div>
            </div>

            {/* サブタブ (記録 / 保存 / フレンド) */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {(['posts', 'saved', 'friends'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProfileSubTab(tab)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    border: 'none',
                    background: profileSubTab === tab ? themeAccent : themeCard,
                    color: profileSubTab === tab ? '#fff' : themeSubText,
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {tab === 'posts' ? '📸 記録' : tab === 'saved' ? '💛 保存' : '👥 フレンド'}
                </button>
              ))}
            </div>

            {/* サブタブ内容 */}
            {profileSubTab === 'posts' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                {spots
                  .filter((s) => s.userId === 'me')
                  .map((s) => (
                    <div key={s.id} onClick={() => setSelectedSpot(s)} style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', background: '#000' }}>
                      <img src={s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
              </div>
            )}

            {profileSubTab === 'saved' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                {spots
                  .filter((s) => savedSpotIds.includes(s.id))
                  .map((s) => (
                    <div key={s.id} onClick={() => setSelectedSpot(s)} style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', background: '#000' }}>
                      <img src={s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
              </div>
            )}

            {profileSubTab === 'friends' && (
              <div style={{ background: themeCard, borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="友達のコード (例: WS-XXXX-XX)"
                    value={inputFriendCode}
                    onChange={(e) => setInputFriendCode(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.3)', background: themeBg, color: themeText }}
                  />
                  <button
                    onClick={() => {
                      if (!inputFriendCode) return;
                      setFriendsList((prev) => [...prev, { id: 'user-' + Date.now(), name: 'Travel_Buddy', avatar: '✈️' }]);
                      setInputFriendCode('');
                      showToast('👥 フレンドを追加しました！');
                    }}
                    style={{ padding: '8px 16px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    追加
                  </button>
                </div>

                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: themeSubText }}>相互フォロー中の友達</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {friendsList.map((f) => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(128,128,128,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{f.avatar}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{f.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentTab('map');
                          setDisplayScope('friends');
                        }}
                        style={{ padding: '4px 10px', background: themeBg, color: themeAccent, border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        マップを見る
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 目立たない広告バナースペース ── */}
        <div style={{ marginTop: '24px', padding: '12px', background: themeCard, borderRadius: '12px', textAlign: 'center', border: '1px dashed rgba(128,128,128,0.3)' }}>
          <span style={{ fontSize: '10px', color: themeSubText, letterSpacing: '1px' }}>SPONSORED</span>
          <div style={{ fontSize: '12px', color: themeSubText, marginTop: '2px' }}>✈️ Booking.com / Klook で世界中のホテルとツアーをお得に予約</div>
        </div>
      </main>

      {/* ==================================================== */}
      {/* 4. ピン詳細バナー (スライドイン / モーダル) */}
      {/* ==================================================== */}
      {selectedSpot && (
        <div
          onClick={() => setSelectedSpot(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: themeCard,
              width: '100%',
              maxWidth: '540px',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '20px 24px 32px 24px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* スワイプバー */}
            <div style={{ width: '40px', height: '4px', background: 'rgba(128,128,128,0.4)', borderRadius: '2px', margin: '0 auto 16px auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', background: themeAccent, color: '#fff' }}>
                {selectedSpot.category === 'view' ? '🏔️ VIEW' : selectedSpot.category === 'gourmet' ? '🍔 GOURMET' : '🌧️ RAIN'}
              </span>
              <button onClick={() => setSelectedSpot(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', color: themeSubText, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {/* メディア枠 */}
            <div style={{ width: '100%', height: '240px', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px' }}>
              {selectedSpot.fileType === 'image' ? (
                <img src={selectedSpot.fileUrl} alt={selectedSpot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video src={selectedSpot.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{selectedSpot.title}</h3>
                <div style={{ fontSize: '12px', color: themeSubText }}>
                  📍 {selectedSpot.lat.toFixed(4)}, {selectedSpot.lon.toFixed(4)} ({COUNTRIES[selectedSpot.countryCode]?.name || selectedSpot.countryCode}) · {selectedSpot.createdAt}
                </div>
              </div>
              <button
                onClick={() => toggleSaveSpot(selectedSpot.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: savedSpotIds.includes(selectedSpot.id) ? '#f43f5e' : themeBg,
                  color: savedSpotIds.includes(selectedSpot.id) ? '#fff' : themeText,
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {savedSpotIds.includes(selectedSpot.id) ? '❤️ 保存済み' : `💛 ${t.saveSpot}`}
              </button>
            </div>

            <p style={{ fontSize: '14px', color: themeSubText, lineHeight: '1.6', margin: '14px 0' }}>{selectedSpot.description}</p>

            {/* Googleマップ連携ボタン (最重要CTA) */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedSpot.lat},${selectedSpot.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '14px',
                borderRadius: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                marginBottom: '16px',
              }}
            >
              🧭 {t.openGoogleMaps}
            </a>

            <hr style={{ borderColor: 'rgba(128,128,128,0.2)', margin: '16px 0' }} />

            {/* 投稿者情報 & UGC安全機能 (通報・ブロック・削除) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: themeAccent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  👤
                </div>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{selectedSpot.userName}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedSpot.userId === 'me' ? (
                  <button onClick={() => handleDeleteSpot(selectedSpot.id)} style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🗑️ ピンを削除
                  </button>
                ) : (
                  <>
                    <button onClick={() => setIsReportModalOpen(true)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      ⚠️ {t.report}
                    </button>
                    <button onClick={() => handleBlockUser(selectedSpot.userId)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      🚫 {t.block}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. 位置情報未設定ダイアログ */}
      {/* ==================================================== */}
      {unlocatedFiles.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: themeCard, padding: '24px', borderRadius: '20px', maxWidth: '440px', width: '100%' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#f59e0b' }}>⚠️ 位置情報のないファイル ({currentPendingIndex + 1}/{unlocatedFiles.length})</h3>
            <p style={{ fontSize: '12px', color: themeSubText, margin: '0 0 14px 0' }}>主要都市を選ぶか、スポット名・緯度経度を入力してマップに配置してください。</p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <button onClick={() => handleAssignLocation(35.6812, 139.7671, '東京')} style={{ padding: '6px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                📍 東京
              </button>
              <button onClick={() => handleAssignLocation(35.0116, 135.7681, '京都')} style={{ padding: '6px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                📍 京都
              </button>
              <button onClick={() => handleAssignLocation(47.3769, 8.5417, 'チューリッヒ')} style={{ padding: '6px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                📍 チューリッヒ
              </button>
              <button onClick={() => handleAssignLocation(37.5665, 126.978, 'ソウル')} style={{ padding: '6px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                📍 ソウル
              </button>
            </div>

            <input
              type="text"
              placeholder="スポット名 (例: エッフェル塔)"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', marginBottom: '8px', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.3)', background: themeBg, color: themeText }}
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="number"
                step="any"
                placeholder="緯度 (例: 48.8584)"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.3)', background: themeBg, color: themeText }}
              />
              <input
                type="number"
                step="any"
                placeholder="経度 (例: 2.2945)"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.3)', background: themeBg, color: themeText }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setUnlocatedFiles((prev) => prev.filter((_, i) => i !== currentPendingIndex))}
                style={{ flex: 1, padding: '10px', background: themeBg, border: 'none', borderRadius: '8px', color: themeText, cursor: 'pointer' }}
              >
                スキップ
              </button>
              <button
                onClick={() => handleAssignLocation(parseFloat(manualLat) || currentConfig.lat, parseFloat(manualLon) || currentConfig.lon, manualTitle)}
                style={{ flex: 1, padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                配置する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. 通報モーダル (UGC安全対策) */}
      {/* ==================================================== */}
      {isReportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: themeCard, padding: '24px', borderRadius: '20px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>⚠️ 投稿の通報</h3>
            <p style={{ fontSize: '12px', color: themeSubText, margin: '0 0 12px 0' }}>通報理由を選択してください。24時間以内にモデレーターが確認します。</p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.3)', background: themeBg, color: themeText, marginBottom: '16px' }}
            >
              <option value="不適切な画像">不適切な画像・ポルノ</option>
              <option value="スパム・広告">スパム・宣伝行為</option>
              <option value="誹謗中傷・嫌がらせ">誹謗中傷・ハラスメント</option>
              <option value="著作権侵害">無断転載・著作権侵害</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsReportModalOpen(false)} style={{ flex: 1, padding: '10px', background: themeBg, border: 'none', borderRadius: '8px', color: themeText, cursor: 'pointer' }}>
                キャンセル
              </button>
              <button onClick={handleSubmitReport} style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                送信する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. 設定画面 (Settings モーダル) */}
      {/* ==================================================== */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <div style={{ background: themeCard, width: '100%', maxWidth: '480px', borderRadius: '24px', padding: '24px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>⚙️ 設定 (Settings)</h2>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '18px', color: themeSubText, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {/* アカウント設定 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: themeSubText, marginBottom: '8px' }}>▼ アカウント設定</div>
              <div onClick={() => setIsEditProfileOpen(true)} style={{ padding: '12px', background: themeBg, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '6px' }}>
                <span>👤 プロフィール編集</span>
                <span style={{ color: themeSubText }}>&gt;</span>
              </div>
              <div style={{ padding: '12px', background: themeBg, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🌐 言語 / 国籍の初期設定</span>
                <select value={userCountry} onChange={(e) => setUserCountry(e.target.value)} style={{ background: 'transparent', color: themeText, border: 'none', fontWeight: 'bold' }}>
                  {Object.entries(COUNTRIES).map(([code, c]) => (
                    <option key={code} value={code} style={{ background: '#1e293b', color: '#fff' }}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* マップ設定 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: themeSubText, marginBottom: '8px' }}>▼ マップカスタマイズ</div>
              <div
                onClick={() => {
                  showToast('🧹 地図キャッシュをクリアしました (約12MB)');
                }}
                style={{ padding: '12px', background: themeBg, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <span>🧹 地図キャッシュのクリア</span>
                <span style={{ color: themeAccent, fontWeight: 'bold' }}>実行</span>
              </div>
            </div>

            {/* 安全対策 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: themeSubText, marginBottom: '8px' }}>▼ プライバシー & UGC安全対策</div>
              <div
                onClick={() => {
                  if (blockedUsers.length === 0) {
                    showToast('現在ブロック中のユーザーはいません');
                  } else {
                    setBlockedUsers([]);
                    showToast('ブロックをすべて解除しました');
                  }
                }}
                style={{ padding: '12px', background: themeBg, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '6px' }}
              >
                <span>🚫 ブロック中ユーザーの管理</span>
                <span style={{ color: themeSubText }}>{blockedUsers.length}人 &gt;</span>
              </div>
              <div
                onClick={() => alert('WorldSnap 利用規約 (EULA):\n1. 不適切な投稿は即時削除されます。\n2. 他ユーザーへの嫌がらせは禁止です。')}
                style={{ padding: '12px', background: themeBg, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <span>📜 利用規約 (EULA) の確認</span>
                <span style={{ color: themeAccent }}>開く</span>
              </div>
            </div>

            {/* 危険操作 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  if (confirm('ログアウトしますか？')) {
                    showToast('🚪 ログアウトしました');
                    setIsSettingsOpen(false);
                  }
                }}
                style={{ width: '100%', padding: '12px', background: themeBg, border: 'none', borderRadius: '12px', color: themeText, fontWeight: 'bold', cursor: 'pointer' }}
              >
                🚪 ログアウト
              </button>
              <button
                onClick={() => {
                  const check = prompt('アカウントを完全削除する場合は「削除する」と入力してください:');
                  if (check === '削除する') {
                    setSpots([]);
                    showToast('⚠️ アカウントと全データを削除しました');
                    setIsSettingsOpen(false);
                  }
                }}
                style={{ width: '100%', padding: '12px', background: '#fee2e2', border: 'none', borderRadius: '12px', color: '#dc2626', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ⚠️ アカウントの削除 (退会処理)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 8. プロフィール編集モーダル */}
      {/* ==================================================== */}
      {isEditProfileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: themeCard, padding: '24px', borderRadius: '20px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>👤 プロフィール編集</h3>
            <label style={{ fontSize: '12px', color: themeSubText }}>表示名</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{ width: '100%', padding: '10px', margin: '4px 0 12px 0', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.3)', background: themeBg, color: themeText }}
            />
            <label style={{ fontSize: '12px', color: themeSubText }}>自己紹介文</label>
            <textarea
              value={userBio}
              onChange={(e) => setUserBio(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px', margin: '4px 0 16px 0', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.3)', background: themeBg, color: themeText }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsEditProfileOpen(false)} style={{ flex: 1, padding: '10px', background: themeBg, border: 'none', borderRadius: '8px', color: themeText, cursor: 'pointer' }}>
                キャンセル
              </button>
              <button
                onClick={() => {
                  setIsEditProfileOpen(false);
                  showToast('✨ プロフィールを更新しました');
                }}
                style={{ flex: 1, padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 9. ボトムナビゲーション (画面最下部固定) */}
      {/* ==================================================== */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: themeCard,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 500,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <button
          onClick={() => setCurrentTab('home')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentTab === 'home' ? themeAccent : themeSubText,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'home' ? 'bold' : 'normal' }}>{t.home}</span>
        </button>

        <button
          onClick={() => {
            if (currentTab === 'map') {
              const target = COUNTRIES[userCountry];
              if (target) {
                setMapCenter([target.lat, target.lon]);
                setMapZoom(target.zoom);
              }
            } else {
              setCurrentTab('map');
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentTab === 'map' ? themeAccent : themeSubText,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '20px' }}>🗺️</span>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'map' ? 'bold' : 'normal' }}>{t.map}</span>
        </button>

        <button
          onClick={() => setCurrentTab('profile')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentTab === 'profile' ? themeAccent : themeSubText,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '20px' }}>👤</span>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'profile' ? 'bold' : 'normal' }}>{t.profile}</span>
        </button>
      </nav>
    </div>
  );
}
