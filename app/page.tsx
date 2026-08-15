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

// 18カ国の定義（全世界俯瞰初期位置付き）
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
  ALL: {
    name: '世界地図 (World)',
    flag: '🌍',
    lang: 'ja',
    lat: 20.0,
    lon: 0.0,
    zoom: 2,
    dict: { home: 'ホーム', map: 'マップ', profile: 'マイページ', addPhoto: '写真を追加', exportMap: '保存', view: 'View', gourmet: 'グルメ', rain: '雨の日', openGoogleMaps: 'Googleマップで開く', saveSpot: '保存', report: '通報', block: 'ブロック', visited: '訪問', countriesUnit: 'カ国' },
  },
  JP: {
    name: '日本 (Japan)',
    flag: '🇯🇵',
    lang: 'ja',
    lat: 36.2048,
    lon: 138.2529,
    zoom: 5,
    dict: { home: 'ホーム', map: 'マップ', profile: 'マイページ', addPhoto: '写真を追加', exportMap: '保存', view: 'View', gourmet: 'グルメ', rain: '雨の日', openGoogleMaps: 'Googleマップでルート案内', saveSpot: '保存', report: '通報', block: 'ブロック', visited: '訪問', countriesUnit: 'カ国' },
  },
  CH: {
    name: 'スイス (Schweiz)',
    flag: '🇨🇭',
    lang: 'de',
    lat: 46.8182,
    lon: 8.2275,
    zoom: 8,
    dict: { home: 'Start', map: 'Karte', profile: 'Profil', addPhoto: 'Foto', exportMap: 'Speichern', view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen', openGoogleMaps: 'In Google Maps öffnen', saveSpot: 'Merken', report: 'Melden', block: 'Blockieren', visited: 'Besucht', countriesUnit: 'Länder' },
  },
  KR: {
    name: '韓国 (대한민국)',
    flag: '🇰🇷',
    lang: 'ko',
    lat: 35.9078,
    lon: 127.7669,
    zoom: 7,
    dict: { home: '홈', map: '지도', profile: '프로필', addPhoto: '사진 추가', exportMap: '저장', view: '경치', gourmet: '맛집', rain: '비오는날', openGoogleMaps: 'Google 지도에서 길찾기', saveSpot: '저장', report: '신고', block: '차단', visited: '방문', countriesUnit: '개국' },
  },
  US: {
    name: 'アメリカ (USA)',
    flag: '🇺🇸',
    lang: 'en',
    lat: 37.0902,
    lon: -95.7129,
    zoom: 4,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Photo', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  FR: {
    name: 'フランス (France)',
    flag: '🇫🇷',
    lang: 'fr',
    lat: 46.2276,
    lon: 2.2137,
    zoom: 6,
    dict: { home: 'Accueil', map: 'Carte', profile: 'Profil', addPhoto: 'Photo', exportMap: 'Sauvegarder', view: 'Paysage', gourmet: 'Gourmet', rain: 'Pluie', openGoogleMaps: 'Ouvrir dans Google Maps', saveSpot: 'Enregistrer', report: 'Signaler', block: 'Bloquer', visited: 'Visité', countriesUnit: 'pays' },
  },
  TH: {
    name: 'タイ (ไทย)',
    flag: '🇹🇭',
    lang: 'th',
    lat: 15.87,
    lon: 100.9925,
    zoom: 6,
    dict: { home: 'หน้าแรก', map: 'แผนที่', profile: 'โปรไฟล์', addPhoto: 'เพิ่มรูป', exportMap: 'บันทึก', view: 'วิว', gourmet: 'ของกิน', rain: 'วันฝนตก', openGoogleMaps: 'เปิดใน Google Maps', saveSpot: 'บันทึก', report: 'รายงาน', block: 'บล็อก', visited: 'เยือนแล้ว', countriesUnit: 'ประเทศ' },
  },
  IT: {
    name: 'イタリア (Italia)',
    flag: '🇮🇹',
    lang: 'it',
    lat: 41.8719,
    lon: 12.5674,
    zoom: 6,
    dict: { home: 'Home', map: 'Mappa', profile: 'Profilo', addPhoto: 'Foto', exportMap: 'Salva', view: 'Panorama', gourmet: 'Gourmet', rain: 'Pioggia', openGoogleMaps: 'Apri su Google Maps', saveSpot: 'Salva', report: 'Segnala', block: 'Blocca', visited: 'Visitati', countriesUnit: 'paesi' },
  },
  GB: {
    name: 'イギリス (UK)',
    flag: '🇬🇧',
    lang: 'en',
    lat: 55.3781,
    lon: -3.436,
    zoom: 5,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Photo', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  DE: {
    name: 'ドイツ (Deutschland)',
    flag: '🇩🇪',
    lang: 'de',
    lat: 51.1657,
    lon: 10.4515,
    zoom: 6,
    dict: { home: 'Start', map: 'Karte', profile: 'Profil', addPhoto: 'Foto', exportMap: 'Speichern', view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen', openGoogleMaps: 'In Google Maps öffnen', saveSpot: 'Speichern', report: 'Melden', block: 'Blockieren', visited: 'Besucht', countriesUnit: 'Länder' },
  },
  AU: {
    name: 'オーストラリア (Australia)',
    flag: '🇦🇺',
    lang: 'en',
    lat: -25.2744,
    lon: 133.7751,
    zoom: 4,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Photo', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  ES: {
    name: 'スペイン (España)',
    flag: '🇪🇸',
    lang: 'es',
    lat: 40.4637,
    lon: -3.7492,
    zoom: 6,
    dict: { home: 'Inicio', map: 'Mapa', profile: 'Perfil', addPhoto: 'Foto', exportMap: 'Guardar', view: 'Vistas', gourmet: 'Gourmet', rain: 'Lluvia', openGoogleMaps: 'Abrir en Google Maps', saveSpot: 'Guardar', report: 'Denunciar', block: 'Bloquear', visited: 'Visitados', countriesUnit: 'países' },
  },
  NZ: {
    name: 'NZ (New Zealand)',
    flag: '🇳🇿',
    lang: 'en',
    lat: -40.9006,
    lon: 174.886,
    zoom: 5,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Photo', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  AT: {
    name: 'オーストリア (Österreich)',
    flag: '🇦🇹',
    lang: 'de',
    lat: 47.5162,
    lon: 14.5501,
    zoom: 7,
    dict: { home: 'Start', map: 'Karte', profile: 'Profil', addPhoto: 'Foto', exportMap: 'Speichern', view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen', openGoogleMaps: 'In Google Maps öffnen', saveSpot: 'Speichern', report: 'Melden', block: 'Blockieren', visited: 'Besucht', countriesUnit: 'Länder' },
  },
  SG: {
    name: 'シンガポール (Singapore)',
    flag: '🇸🇬',
    lang: 'en',
    lat: 1.3521,
    lon: 103.8198,
    zoom: 11,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Photo', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  CA: {
    name: 'カナダ (Canada)',
    flag: '🇨🇦',
    lang: 'en',
    lat: 56.1304,
    lon: -106.3468,
    zoom: 4,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Photo', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  AE: {
    name: 'ドバイ (Dubai)',
    flag: '🇦🇪',
    lang: 'ar',
    lat: 25.2048,
    lon: 55.2708,
    zoom: 9,
    dict: { home: 'الرئيسية', map: 'الخريطة', profile: 'الملف', addPhoto: 'إضافة', exportMap: 'حفظ', view: 'إطلالة', gourmet: 'مطاعم', rain: 'ممطر', openGoogleMaps: 'خرائط Google', saveSpot: 'حفظ', report: 'إبلاغ', block: 'حظر', visited: 'الدول', countriesUnit: 'دولة' },
  },
  MV: {
    name: 'モルディブ (Maldives)',
    flag: '🇲🇻',
    lang: 'en',
    lat: 3.2028,
    lon: 73.2207,
    zoom: 7,
    dict: { home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Photo', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rainy', openGoogleMaps: 'Open in Google Maps', saveSpot: 'Save', report: 'Report', block: 'Block', visited: 'Visited', countriesUnit: 'countries' },
  },
  TW: {
    name: '台湾 (Taiwan)',
    flag: '🇹🇼',
    lang: 'zh',
    lat: 23.6978,
    lon: 120.9605,
    zoom: 7,
    dict: { home: '首頁', map: '地圖', profile: '個人主頁', addPhoto: '新增照片', exportMap: '儲存', view: '景觀', gourmet: '美食', rain: '雨天', openGoogleMaps: 'Google 地圖', saveSpot: '收藏', report: '檢舉', block: '封鎖', visited: '造訪過', countriesUnit: '個國家' },
  },
};

const INITIAL_SPOTS: Spot[] = [
  {
    id: 'mock-1',
    userId: 'user-yuki',
    userName: 'Yuki_Traveler',
    title: 'ツェルマット マッターホルン',
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
    title: '京都 鴨川カフェ',
    description: '川床を眺めながらいただく濃厚な宇治抹茶パフェ。',
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
    title: '雨のルーヴル美術館',
    description: '雨の日は幻想的な光に包まれます。地下入口から入ると快適です。',
    fileName: 'louvre.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop',
    fileType: 'image',
    lat: 48.8606,
    lon: 2.3376,
    countryCode: 'FR',
    category: 'rain',
    createdAt: '2026-08-01',
  },
  {
    id: 'mock-4',
    userId: 'user-ny',
    userName: 'Alex_NYC',
    title: 'ニューヨーク タイムズスクエア',
    description: '夜景とネオンが輝く街。活気あふれる世界最高のストリート！',
    fileName: 'nyc.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop',
    fileType: 'image',
    lat: 40.758,
    lon: -73.9855,
    countryCode: 'US',
    category: 'view',
    createdAt: '2026-08-05',
  },
];

function convertDMSToDD(dms: number[], ref: string): number {
  if (!dms || dms.length < 3) return 0;
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') dd *= -1;
  return dd;
}

// ==========================================
// 2. Leaflet 動的マップ（白基調世界地図・ポラロイドピン・線なし）
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
        const { MapContainer, TileLayer, Marker, useMapEvents, useMap } = require('react-leaflet');
        const L = require('leaflet');
        require('leaflet/dist/leaflet.css');

        const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
          const map = useMap();
          useEffect(() => {
            map.flyTo(center, zoom, { duration: 1.2 });
          }, [center, zoom, map]);
          return null;
        };

        const MapEventHandler = () => {
          useMapEvents({
            dblclick(e: any) {
              onDoubleTap(e.latlng.lat, e.latlng.lng);
            },
          });
          return null;
        };

        // 写真のような美しい白・淡いグレー基調のCartoDB Positronタイル (雨の日はDarkMatter)
        const tileUrl =
          mode === 'rain'
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

        return (
          <MapContainer
            center={center}
            zoom={zoom}
            minZoom={2}
            maxBounds={[[-85, -180], [85, 180]]}
            maxBoundsViscosity={1.0}
            doubleClickZoom={false}
            zoomControl={false}
            style={{ width: '100%', height: '100%', background: '#e0e7f1' }}
            scrollWheelZoom={true}
          >
            <MapController center={center} zoom={zoom} />
            <MapEventHandler />
            <TileLayer url={tileUrl} attribution='&copy; CARTO' />

            {/* 写真ピン（ポラロイド風カードピン） */}
            {spots.map((spot) => {
              const iconHtml = `
                <div style="
                  position: relative;
                  width: 46px;
                  height: 52px;
                  background: #ffffff;
                  border-radius: 6px;
                  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
                  padding: 3px 3px 12px 3px;
                  cursor: pointer;
                  transform: translateY(-50%) rotate(${(spot.lat % 6) - 3}deg);
                  transition: transform 0.2s ease;
                ">
                  <div style="width: 100%; height: 34px; border-radius: 3px; overflow: hidden; background: #eee;">
                    <img src="${spot.fileUrl}" style="width:100%;height:100%;object-fit:cover;" />
                  </div>
                  <div style="
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 6px solid #ffffff;
                  "></div>
                </div>
              `;
              const customIcon = L.divIcon({
                className: 'polaroid-marker',
                html: iconHtml,
                iconSize: [46, 52],
                iconAnchor: [23, 26],
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
  { ssr: false, loading: () => <div style={{ height: '100%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>🗺️ ワールドマップを読み込み中...</div> }
);

// ==========================================
// 3. メインコンポーネント (7:3 黄金比率レイアウト)
// ==========================================
export default function WorldSnapApp() {
  const [userCountry, setUserCountry] = useState<string>('ALL');
  const [userName, setUserName] = useState<string>('taku_snap');
  const [userBio, setUserBio] = useState<string>('世界中を旅して記録中 🌏✈️');
  const [friendCode] = useState<string>('WS-8823-X9');

  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [viewMode, setViewMode] = useState<ViewCategory>('view');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('world');

  const currentConfig = COUNTRIES[userCountry] || COUNTRIES.ALL;
  const [mapCenter, setMapCenter] = useState<[number, number]>([currentConfig.lat, currentConfig.lon]);
  const [mapZoom, setMapZoom] = useState<number>(currentConfig.zoom);

  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>([]);

  const [hasAgreedEULA, setHasAgreedEULA] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('不適切な画像');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [unlocatedFiles, setUnlocatedFiles] = useState<PendingFile[]>([]);
  const [currentPendingIndex, setCurrentPendingIndex] = useState<number>(0);
  const [manualTitle, setManualTitle] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'saved' | 'friends'>('posts');
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; avatar: string }[]>([
    { id: 'user-yuki', name: 'Yuki_Traveler', avatar: '🌸' },
    { id: 'user-ken', name: 'Ken_Gourmet', avatar: '☕' },
  ]);
  const [inputFriendCode, setInputFriendCode] = useState('');

  const exportRef = useRef<HTMLDivElement>(null);
  const t = currentConfig.dict;

  useEffect(() => {
    const target = COUNTRIES[userCountry];
    if (target) {
      setMapCenter([target.lat, target.lon]);
      setMapZoom(target.zoom);
    }
  }, [userCountry]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredSpots = spots.filter((s) => {
    if (blockedUsers.includes(s.userId)) return false;
    if (s.category !== viewMode) return false;
    if (displayScope === 'my') return s.userId === 'me';
    if (displayScope === 'friends') return s.userId === 'me' || friendsList.some((f) => f.id === s.userId);
    return true;
  });

  const visitedCountryCount = new Set(spots.filter((s) => s.userId === 'me').map((s) => s.countryCode)).size;

  const handleMapDoubleTap = (lat: number, lon: number) => {
    setMapCenter([lat, lon]);
    setMapZoom((prev) => Math.min(prev + 3, 13));
  };

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
              countryCode: userCountry === 'ALL' ? 'JP' : userCountry,
              category: viewMode,
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
      showToast(`📸 ${newSpots.length}件のスポットを配置しました`);
    }
    if (pendingList.length > 0) {
      setUnlocatedFiles((prev) => [...prev, ...pendingList]);
      setCurrentPendingIndex(0);
    }
  };

  const handleAssignLocation = (latVal: number, lonVal: number, titleVal?: string) => {
    if (unlocatedFiles.length === 0) return;
    const current = unlocatedFiles[currentPendingIndex];
    if (!current) return;

    const newSpot: Spot = {
      id: current.id,
      userId: 'me',
      userName,
      title: titleVal || manualTitle || current.file.name,
      description: '旅の思い出（手動配置）',
      fileName: current.file.name,
      fileUrl: current.fileUrl,
      fileType: current.fileType,
      lat: latVal,
      lon: lonVal,
      countryCode: userCountry === 'ALL' ? 'JP' : userCountry,
      category: viewMode,
      createdAt: current.dateTime || new Date().toLocaleDateString(),
    };

    setSpots((prev) => [newSpot, ...prev]);
    const rem = unlocatedFiles.filter((_, idx) => idx !== currentPendingIndex);
    setUnlocatedFiles(rem);
    setManualTitle('');
    setManualLat('');
    setManualLon('');
    showToast('📍 スポットを配置しました');
  };

  const handleExportMap = async () => {
    if (!exportRef.current) return;
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const canvas = await html2canvas(exportRef.current, { useCORS: true, scale: 2 });
      const img = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = img;
      a.download = `WorldSnap-Map.png`;
      a.click();
      showToast('💾 マップを保存しました');
    } catch (e) {
      showToast('❌ 保存に失敗しました');
    }
  };

  const toggleSaveSpot = (spotId: string) => {
    if (savedSpotIds.includes(spotId)) {
      setSavedSpotIds((prev) => prev.filter((id) => id !== spotId));
      showToast('行きたい保存を解除しました');
    } else {
      setSavedSpotIds((prev) => [...prev, spotId]);
      showToast('💛 行きたいリストに保存しました');
    }
  };

  const handleBlockUser = (userId: string) => {
    if (confirm('このユーザーをブロックしますか？\n相手の投稿がすべて非表示になります。')) {
      setBlockedUsers((prev) => [...prev, userId]);
      setSelectedSpot(null);
      showToast('🚫 ユーザーをブロックしました');
    }
  };

  const handleDeleteSpot = (spotId: string) => {
    if (confirm('このピンを削除しますか？')) {
      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      setSelectedSpot(null);
      showToast('🗑️ ピンを削除しました');
    }
  };

  const themeAccent = viewMode === 'rain' ? '#38bdf8' : viewMode === 'gourmet' ? '#ea580c' : '#0284c7';

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ── トースト通知 ── */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.92)', color: '#fff', padding: '8px 18px', borderRadius: '30px', zIndex: 9999, fontSize: '12px', fontWeight: 'bold', boxShadow: '0 6px 20px rgba(0,0,0,0.25)', backdropFilter: 'blur(6px)' }}>
          {toastMessage}
        </div>
      )}

      {/* ── 初回EULA同意 ── */}
      {!hasAgreedEULA && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#1e293b', color: '#fff', padding: '24px', borderRadius: '20px', maxWidth: '400px', width: '100%' }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#38bdf8' }}>WorldSnap 利用規約 (EULA)</h2>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              不適切な画像や誹謗中傷の投稿は禁止されています。違反した場合は即時アカウント停止処置となります。
            </p>
            <button onClick={() => setHasAgreedEULA(true)} style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              同意してはじめる
            </button>
          </div>
        </div>
      )}

      {/* ── ヘッダー（コンパクト設計） ── */}
      <header style={{ height: '52px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: themeAccent, letterSpacing: '-0.5px' }}>WorldSnap</h1>
          <select
            value={userCountry}
            onChange={(e) => setUserCountry(e.target.value)}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {Object.entries(COUNTRIES).map(([code, c]) => (
              <option key={code} value={code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '6px' }}>
          ⚙️
        </button>
      </header>

      {/* ── メイン画面（タブ切替） ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* ==================================================== */}
        {/* TAB 1: 🗺️ メインマップ (画面の約7割を専有) */}
        {/* ==================================================== */}
        {currentTab === 'map' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* 上部フィルターバー（フロート式） */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
              {/* モード選択 (View / グルメ / 雨の日) */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', padding: '4px', borderRadius: '30px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', pointerEvents: 'auto' }}>
                {(['view', 'gourmet', 'rain'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: 'none',
                      background: viewMode === m ? themeAccent : 'transparent',
                      color: viewMode === m ? '#fff' : '#64748b',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: '0.2s',
                    }}
                  >
                    {m === 'view' ? '🏔️ View' : m === 'gourmet' ? '🍔 グルメ' : '🌧️ 雨の日'}
                  </button>
                ))}
              </div>

              {/* 表示スコープ (全体 / フレンド / 自分) */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', padding: '4px', borderRadius: '30px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', pointerEvents: 'auto' }}>
                {(['world', 'friends', 'my'] as const).map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setDisplayScope(scope)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '20px',
                      border: 'none',
                      background: displayScope === scope ? '#0f172a' : 'transparent',
                      color: displayScope === scope ? '#fff' : '#64748b',
                      fontWeight: 'bold',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    {scope === 'world' ? '🌐 全体' : scope === 'friends' ? '👥 友達' : '👤 自分'}
                  </button>
                ))}
              </div>
            </div>

            {/* 7割以上を占める広大なマップ本体 */}
            <div ref={exportRef} style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
              <MapComponent
                spots={filteredSpots}
                center={mapCenter}
                zoom={mapZoom}
                mode={viewMode}
                onSelectSpot={setSelectedSpot}
                onDoubleTap={handleMapDoubleTap}
              />

              {/* 地図上の右下アクションボタン */}
              <div style={{ position: 'absolute', bottom: '80px', right: '16px', zIndex: 400, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label
                  style={{
                    padding: '12px 18px',
                    background: themeAccent,
                    color: '#fff',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
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
                    padding: '10px 14px',
                    background: 'rgba(15,23,42,0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#fff',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  💾 {t.exportMap}
                </button>
              </div>

              {/* 控えめなスポンサーバナー */}
              <div style={{ position: 'absolute', bottom: '80px', left: '16px', zIndex: 400, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(6px)', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                ✈️ Booking.com / Klook 提携中
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: 🏠 フィード画面 */}
        {/* ==================================================== */}
        {currentTab === 'home' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 90px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 4px 0' }}>✨ おすすめ旅フィード</h2>
            {spots.map((spot) => (
              <div
                key={spot.id}
                onClick={() => setSelectedSpot(spot)}
                style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.05)', cursor: 'pointer' }}
              >
                <div style={{ height: '200px', background: '#000' }}>
                  <img src={spot.fileUrl} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: themeAccent }}>📍 {COUNTRIES[spot.countryCode]?.flag} {spot.title}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{spot.createdAt}</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{spot.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: 👤 マイページ */}
        {/* ==================================================== */}
        {currentTab === 'profile' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 90px 14px' }}>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: themeAccent, color: '#fff', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    👤
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '16px' }}>{userName}</h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{userBio}</p>
                  </div>
                </div>
                <button onClick={() => setIsEditProfileOpen(true)} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                  編集
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '16px 0', textAlign: 'center' }}>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{spots.filter((s) => s.userId === 'me').length}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>📸 投稿</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{visitedCountryCount}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>🗺️ 訪問国</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{friendsList.length}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>👥 友達</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>🆔 友達コード: </span>
                  <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{friendCode}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(friendCode);
                    showToast('📋 コードをコピーしました');
                  }}
                  style={{ padding: '4px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                >
                  コピー
                </button>
              </div>
            </div>

            {/* サブタブ */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {(['posts', 'saved', 'friends'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProfileSubTab(tab)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: profileSubTab === tab ? themeAccent : '#ffffff',
                    color: profileSubTab === tab ? '#fff' : '#64748b',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {tab === 'posts' ? '📸 記録' : tab === 'saved' ? '💛 保存' : '👥 友達'}
                </button>
              ))}
            </div>

            {profileSubTab === 'posts' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                {spots
                  .filter((s) => s.userId === 'me')
                  .map((s) => (
                    <div key={s.id} onClick={() => setSelectedSpot(s)} style={{ height: '110px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000' }}>
                      <img src={s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
              </div>
            )}

            {profileSubTab === 'saved' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                {spots
                  .filter((s) => savedSpotIds.includes(s.id))
                  .map((s) => (
                    <div key={s.id} onClick={() => setSelectedSpot(s)} style={{ height: '110px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000' }}>
                      <img src={s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
              </div>
            )}

            {profileSubTab === 'friends' && (
              <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="友達コードを入力"
                    value={inputFriendCode}
                    onChange={(e) => setInputFriendCode(e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px' }}
                  />
                  <button
                    onClick={() => {
                      if (!inputFriendCode) return;
                      setFriendsList((prev) => [...prev, { id: 'user-' + Date.now(), name: 'Traveler_Buddy', avatar: '✈️' }]);
                      setInputFriendCode('');
                      showToast('👥 友達を追加しました！');
                    }}
                    style={{ padding: '8px 14px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                  >
                    追加
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {friendsList.map((f) => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{f.avatar}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{f.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentTab('map');
                          setDisplayScope('friends');
                        }}
                        style={{ padding: '4px 8px', background: '#f1f5f9', color: themeAccent, border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        マップ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 4. ピン詳細バナー (スライドアップ) */}
      {/* ==================================================== */}
      {selectedSpot && (
        <div
          onClick={() => setSelectedSpot(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
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
              background: '#ffffff',
              width: '100%',
              maxWidth: '520px',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '16px 20px 28px 20px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ width: '36px', height: '4px', background: '#cbd5e1', borderRadius: '2px', margin: '0 auto 12px auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', background: themeAccent, color: '#fff' }}>
                {selectedSpot.category === 'view' ? '🏔️ VIEW' : selectedSpot.category === 'gourmet' ? '🍔 GOURMET' : '🌧️ RAIN'}
              </span>
              <button onClick={() => setSelectedSpot(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ width: '100%', height: '210px', background: '#000', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
              {selectedSpot.fileType === 'image' ? (
                <img src={selectedSpot.fileUrl} alt={selectedSpot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video src={selectedSpot.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '16px' }}>{selectedSpot.title}</h3>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  📍 {selectedSpot.lat.toFixed(4)}, {selectedSpot.lon.toFixed(4)} ({COUNTRIES[selectedSpot.countryCode]?.flag} {selectedSpot.countryCode}) · {selectedSpot.createdAt}
                </div>
              </div>
              <button
                onClick={() => toggleSaveSpot(selectedSpot.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  background: savedSpotIds.includes(selectedSpot.id) ? '#f43f5e' : '#f1f5f9',
                  color: savedSpotIds.includes(selectedSpot.id) ? '#fff' : '#0f172a',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {savedSpotIds.includes(selectedSpot.id) ? '❤️ 保存済み' : `💛 ${t.saveSpot}`}
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '10px 0 14px 0' }}>{selectedSpot.description}</p>

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
                padding: '12px',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '13px',
                borderRadius: '12px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                marginBottom: '14px',
              }}
            >
              🧭 {t.openGoogleMaps}
            </a>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: themeAccent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                  👤
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{selectedSpot.userName}</span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {selectedSpot.userId === 'me' ? (
                  <button onClick={() => handleDeleteSpot(selectedSpot.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🗑️ 削除
                  </button>
                ) : (
                  <>
                    <button onClick={() => setIsReportModalOpen(true)} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>
                      ⚠️ {t.report}
                    </button>
                    <button onClick={() => handleBlockUser(selectedSpot.userId)} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>
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
      {/* 5. 位置未設定ファイル補完ダイアログ */}
      {/* ==================================================== */}
      {unlocatedFiles.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#f59e0b' }}>⚠️ 位置情報なし ({currentPendingIndex + 1}/{unlocatedFiles.length})</h3>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>主要都市を選択するか、直接座標を入力して配置してください。</p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button onClick={() => handleAssignLocation(35.6812, 139.7671, '東京')} style={{ padding: '4px 8px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                📍 東京
              </button>
              <button onClick={() => handleAssignLocation(35.0116, 135.7681, '京都')} style={{ padding: '4px 8px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                📍 京都
              </button>
              <button onClick={() => handleAssignLocation(47.3769, 8.5417, 'チューリッヒ')} style={{ padding: '4px 8px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                📍 チューリッヒ
              </button>
              <button onClick={() => handleAssignLocation(40.7128, -74.006, 'ニューヨーク')} style={{ padding: '4px 8px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                📍 NY
              </button>
            </div>

            <input
              type="text"
              placeholder="スポット名"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <input
                type="number"
                step="any"
                placeholder="緯度 (例: 35.68)"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
              <input
                type="number"
                step="any"
                placeholder="経度 (例: 139.76)"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setUnlocatedFiles((prev) => prev.filter((_, i) => i !== currentPendingIndex))}
                style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                スキップ
              </button>
              <button
                onClick={() => handleAssignLocation(parseFloat(manualLat) || currentConfig.lat, parseFloat(manualLon) || currentConfig.lon, manualTitle)}
                style={{ flex: 1, padding: '8px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                配置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. 設定画面 (Settings モーダル) */}
      {/* ==================================================== */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '20px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px' }}>⚙️ 設定</h2>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '16px', color: '#94a3b8', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>▼ アカウント & 言語</div>
              <div onClick={() => setIsEditProfileOpen(true)} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '6px', fontSize: '13px' }}>
                <span>👤 プロフィール編集</span>
                <span style={{ color: '#94a3b8' }}>&gt;</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>▼ 安全対策 & キャッシュ</div>
              <div
                onClick={() => {
                  showToast('✨ キャッシュをクリアしました');
                }}
                style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '6px', fontSize: '13px' }}
              >
                <span>🧹 地図キャッシュのクリア</span>
                <span style={{ color: themeAccent, fontWeight: 'bold' }}>実行</span>
              </div>
              <div
                onClick={() => {
                  if (blockedUsers.length === 0) showToast('ブロック中のユーザーはいません');
                  else {
                    setBlockedUsers([]);
                    showToast('ブロックを解除しました');
                  }
                }}
                style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px' }}
              >
                <span>🚫 ブロック管理</span>
                <span style={{ color: '#94a3b8' }}>{blockedUsers.length}人 &gt;</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  showToast('🚪 ログアウトしました');
                  setIsSettingsOpen(false);
                }}
                style={{ width: '100%', padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                ログアウト
              </button>
              <button
                onClick={() => {
                  if (prompt('退会する場合は「削除する」と入力してください:') === '削除する') {
                    setSpots([]);
                    showToast('⚠️ アカウントを削除しました');
                    setIsSettingsOpen(false);
                  }
                }}
                style={{ width: '100%', padding: '10px', background: '#fee2e2', border: 'none', borderRadius: '10px', color: '#dc2626', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                アカウント削除 (退会)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. プロフィール編集モーダル */}
      {/* ==================================================== */}
      {isEditProfileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>👤 プロフィール編集</h3>
            <label style={{ fontSize: '11px', color: '#64748b' }}>名前</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{ width: '100%', padding: '8px', margin: '4px 0 10px 0', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />
            <label style={{ fontSize: '11px', color: '#64748b' }}>紹介文</label>
            <textarea
              value={userBio}
              onChange={(e) => setUserBio(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '8px', margin: '4px 0 14px 0', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setIsEditProfileOpen(false)} style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                キャンセル
              </button>
              <button
                onClick={() => {
                  setIsEditProfileOpen(false);
                  showToast('✨ 更新しました');
                }}
                style={{ flex: 1, padding: '8px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 8. 通報モーダル */}
      {/* ==================================================== */}
      {isReportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>⚠️ 投稿の通報</h3>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '14px', fontSize: '12px' }}
            >
              <option value="不適切な画像">不適切な画像・ポルノ</option>
              <option value="スパム・広告">スパム・宣伝行為</option>
              <option value="誹謗中傷">誹謗中傷・ハラスメント</option>
            </select>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setIsReportModalOpen(false)} style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                キャンセル
              </button>
              <button
                onClick={() => {
                  setIsReportModalOpen(false);
                  showToast('✅ 通報を受理しました');
                }}
                style={{ flex: 1, padding: '8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                送信
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 9. ボトムナビゲーション (固定) */}
      {/* ==================================================== */}
      <nav
        style={{
          height: '60px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexShrink: 0,
          zIndex: 500,
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
            gap: '2px',
            color: currentTab === 'home' ? themeAccent : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '18px' }}>🏠</span>
          <span style={{ fontSize: '10px', fontWeight: currentTab === 'home' ? 'bold' : 'normal' }}>{t.home}</span>
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
            gap: '2px',
            color: currentTab === 'map' ? themeAccent : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '18px' }}>🗺️</span>
          <span style={{ fontSize: '10px', fontWeight: currentTab === 'map' ? 'bold' : 'normal' }}>{t.map}</span>
        </button>

        <button
          onClick={() => setCurrentTab('profile')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: currentTab === 'profile' ? themeAccent : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '18px' }}>👤</span>
          <span style={{ fontSize: '10px', fontWeight: currentTab === 'profile' ? 'bold' : 'normal' }}>{t.profile}</span>
        </button>
      </nav>
    </div>
  );
}
