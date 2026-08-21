'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 0. Supabase クライアント初期化
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ==========================================
// 1. 型定義 & マスターデータ
// ==========================================
export type ViewCategory = 'view' | 'gourmet' | 'rain';
export type DisplayScope = 'my' | 'friends' | 'world';
export type TabType = 'map' | 'home' | 'profile';

export interface Spot {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isOfficial?: boolean;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  thumbUrl: string;
  fileType: 'image' | 'video';
  lat: number;
  lon: number;
  countryCode: string;
  cityName: string;
  category: ViewCategory;
  scopes: DisplayScope[];
  createdAt: string;
}

export interface PendingUpload {
  id: string;
  file: File;
  fileUrl: string;
  thumbUrl?: string;
  fileType: 'image' | 'video';
  lat?: number;
  lon?: number;
  hasGps: boolean;
  dateTime?: string;
}

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
  JP: {
    name: '日本 (Japan)', flag: '🇯🇵', lang: 'ja', lat: 36.2048, lon: 138.2529, zoom: 5,
    dict: {
      step1Title: 'Step 1: 国籍・メインの国を選択',
      step1Desc: '選択した国に応じて、アプリ全体の言語と初期マップがローカライズされます。',
      step2Title: 'Step 2: プロフィール作成', step3Title: 'Step 3: 利用規約 (EULA) の確認',
      next: '次へ進む', back: '戻る', startApp: '🚀 WorldSnap をはじめる',
      eulaAgree: '利用規約およびコミュニティガイドラインに同意する',
      termsTitle: '📜 WorldSnap 利用規約 (EULA)',
      home: 'ホーム', map: 'マップ', profile: 'マイページ',
      addPhoto: '写真 / 動画を追加', exportMap: 'マップ保存',
      view: 'View', gourmet: 'グルメ', rain: '雨の日',
      myMap: 'マイマップ', friends: 'フレンド', world: 'ワールド',
      openGoogleMaps: '🧭 Googleマップで開く', saveSpot: '❤️ 行きたい', saved: '❤️ 保存済み',
      report: '⚠️ 通報', block: '🚫 ブロック', delete: '🗑️ 削除', edit: '✏️ 編集',
      visited: '訪問国', countriesUnit: 'カ国', posts: '投稿', friendCode: 'フレンドコード',
      searchPlaceholder: '🔍 スポットを検索（例: 東京 夜景、京都 カフェ）',
      cacheClear: '🧹 地図キャッシュ削除', deleteAccount: '⚠️ アカウントの削除 (退会処理)', logout: '🚪 ログアウト', close: '閉じる'
    },
  },
  CH: {
    name: 'Schweiz (スイス)', flag: '🇨🇭', lang: 'de', lat: 46.8182, lon: 8.2275, zoom: 8,
    dict: {
      step1Title: 'Schritt 1: Land wählen', step1Desc: 'Die App-Sprache wird auf Deutsch eingestellt.',
      step2Title: 'Schritt 2: Profil erstellen', step3Title: 'Schritt 3: Nutzungsbedingungen (EULA)',
      next: 'Weiter', back: 'Zurück', startApp: '🚀 WorldSnap Starten',
      eulaAgree: 'Ich stimme den Nutzungsbedingungen zu', termsTitle: '📜 Nutzungsbedingungen (EULA)',
      home: 'Start', map: 'Karte', profile: 'Profil', addPhoto: 'Medien hinzufügen', exportMap: 'Speichern',
      view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen', myMap: 'Meine Karte', friends: 'Freunde', world: 'Weltweit',
      openGoogleMaps: '🧭 In Google Maps öffnen', saveSpot: '❤️ Merken', saved: '❤️ Gemerkt',
      report: '⚠️ Melden', block: '🚫 Blockieren', delete: '🗑️ Löschen', edit: '✏️ Bearbeiten',
      visited: 'Besucht', countriesUnit: 'Länder', posts: 'Beiträge', friendCode: 'Freundescode',
      searchPlaceholder: '🔍 Suchen', cacheClear: '🧹 Cache leeren', deleteAccount: '⚠️ Konto löschen', logout: '🚪 Abmelden', close: 'Schließen'
    },
  },
  KR: {
    name: '대한민국 (韓国)', flag: '🇰🇷', lang: 'ko', lat: 35.9078, lon: 127.7669, zoom: 7,
    dict: {
      step1Title: 'Step 1: 국적 선택', step1Desc: '선택한 국가에 맞춰 앱 언어가 한국어로 표시됩니다.',
      step2Title: 'Step 2: 프로필 설정', step3Title: 'Step 3: 이용약관 (EULA) 동의',
      next: '다음', back: '뒤로', startApp: '🚀 WorldSnap 시작하기',
      eulaAgree: '이용약관 및 커뮤니티 가이드라인에 동의합니다', termsTitle: '📜 WorldSnap 이용약관 (EULA)',
      home: '홈', map: '지도', profile: '마이페이지', addPhoto: '사진/동영상 추가', exportMap: '지도 저장',
      view: '경치', gourmet: '맛집', rain: '비오는날', myMap: '내 지도', friends: '친구', world: '전체',
      openGoogleMaps: '🧭 Google 지도에서 길찾기', saveSpot: '❤️ 가고싶다', saved: '❤️ 저장됨',
      report: '⚠️ 신고', block: '🚫 차단', delete: '🗑️ 삭제', edit: '✏️ 수정',
      visited: '방문 국가', countriesUnit: '개국', posts: '게시물', friendCode: '친구 코드',
      searchPlaceholder: '🔍 명소 검색', cacheClear: '🧹 캐시 삭제', deleteAccount: '⚠️ 회원 탈퇴', logout: '🚪 로그아웃', close: '닫기'
    },
  },
  US: {
    name: 'USA (アメリカ)', flag: '🇺🇸', lang: 'en', lat: 37.0902, lon: -95.7129, zoom: 4,
    dict: {
      step1Title: 'Step 1: Select Nationality', step1Desc: 'The app UI and map view will be localized to English.',
      step2Title: 'Step 2: Create Profile', step3Title: 'Step 3: Terms of Service (EULA)',
      next: 'Next', back: 'Back', startApp: '🚀 Start WorldSnap',
      eulaAgree: 'I agree to the Terms of Service', termsTitle: '📜 Terms of Service (EULA)',
      home: 'Home', map: 'Map', profile: 'Profile', addPhoto: 'Add Media', exportMap: 'Save Map',
      view: 'View', gourmet: 'Gourmet', rain: 'Rainy Day', myMap: 'My Map', friends: 'Friends', world: 'World',
      openGoogleMaps: '🧭 開く', saveSpot: '❤️ 行きたい', saved: '❤️ 保存済み',
      report: '⚠️ Report', block: '🚫 Block', delete: '🗑️ Delete', edit: '✏️ Edit',
      visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Friend Code',
      searchPlaceholder: '🔍 Search spots', cacheClear: '🧹 Clear Cache', deleteAccount: '⚠️ Delete Account', logout: '🚪 Log Out', close: 'Close'
    },
  },
  FR: {
    name: 'France (フランス)', flag: '🇫🇷', lang: 'fr', lat: 46.2276, lon: 2.2137, zoom: 6,
    dict: {
      step1Title: 'Étape 1 : Pays', step1Desc: 'L’interface sera traduite en français.',
      step2Title: 'Étape 2 : Profil', step3Title: 'Étape 3 : Conditions',
      next: 'Suivant', back: 'Retour', startApp: '🚀 Démarrer WorldSnap',
      eulaAgree: 'J’accepte les conditions', termsTitle: '📜 Conditions (EULA)',
      home: 'Accueil', map: 'Carte', profile: 'Profil', addPhoto: 'Ajouter média', exportMap: 'Enregistrer',
      view: 'Paysage', gourmet: 'Gourmet', rain: 'Pluie', myMap: 'Ma carte', friends: 'Amis', world: 'Monde',
      openGoogleMaps: '🧭 Google Maps', saveSpot: '❤️ Enregistrer', saved: '❤️ Enregistré',
      report: '⚠️ Signaler', block: '🚫 Bloquer', delete: '🗑️ Supprimer', edit: '✏️ Modifier',
      visited: 'Pays visités', countriesUnit: 'pays', posts: 'Publications', friendCode: 'Code ami',
      searchPlaceholder: '🔍 Rechercher', cacheClear: '🧹 Vider le cache', deleteAccount: '⚠️ Supprimer le compte', logout: '🚪 Déconnexion', close: 'Fermer'
    },
  },
};

const INITIAL_SPOTS: Spot[] = [
  {
    id: 'spot-kyoto-1', userId: 'bot-curator-jp', userName: '京都公式キュレーター', isOfficial: true,
    title: '祇園 鴨川沿いの濃厚抹茶パフェ',
    description: '川床を眺めながらいただく最高峰の宇治抹茶。デートやひと休みに最適な特等席です🍵',
    fileName: 'matcha.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=900&auto=format&fit=crop',
    thumbUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=120&h=120&auto=format&fit=crop',
    fileType: 'image', lat: 35.0037, lon: 135.7712, countryCode: 'JP', cityName: 'Kyoto',
    category: 'gourmet', scopes: ['world', 'my'], createdAt: '2026/08/10',
  },
  {
    id: 'spot-tokyo-1', userId: 'bot-tokyo-guide', userName: '東京おすすめガイド', isOfficial: true,
    title: '渋谷スクランブル交差点＆SHIBUYA SKY',
    description: '地上229mから望む東京360度パノラマビュー。夕暮れのグラデーションが絶景です✨',
    fileName: 'shibuya.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=900&auto=format&fit=crop',
    thumbUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=120&h=120&auto=format&fit=crop',
    fileType: 'image', lat: 35.6595, lon: 139.7005, countryCode: 'JP', cityName: 'Tokyo',
    category: 'view', scopes: ['world', 'my'], createdAt: '2026/08/12',
  },
  {
    id: 'spot-ch-1', userId: 'bot-world-photo', userName: 'Worldフォト公式', isOfficial: true,
    title: 'マッターホルン 黄金の朝焼け',
    description: '早朝のツェルマットから眺める黄金色の山頂。展望台へは始発電車がおすすめです🏔️',
    fileName: 'matterhorn.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=900&auto=format&fit=crop',
    thumbUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=120&h=120&auto=format&fit=crop',
    fileType: 'image', lat: 45.9765, lon: 7.7491, countryCode: 'CH', cityName: 'Zermatt',
    category: 'view', scopes: ['world', 'my'], createdAt: '2026/08/14',
  },
];

const EULA_FULL_TEXT = `【WorldSnap 利用規約 (EULA)】

第1条（適用および同意）
本規約は、当サービスを利用するすべてのユーザーに適用されます。利用規約およびプライバシーポリシーに同意いただけない場合、投稿および共有機能はご利用いただけません。

第2条（ユーザー生成コンテンツの安全方針と禁止事項）
当サービスは、すべてのユーザーが安全かつ快適に旅の思い出を記録・共有できる環境を重視しています。ユーザーは以下のコンテンツの投稿および行為を行ってはなりません。
・性的、暴力的、過度にグロテスク、差別的、または他者に不快感を与える画像・動画・テキストの投稿
・特定の個人・団体への嫌がらせ、名誉毀損、脅迫、いじめ、ストーカー行為
・法令または公序良俗に反する行為、犯罪行為を助長する行為
・第三者の著作権、肖像権、商標権その他の権利を侵害する行為
・個人情報の無断開示、スパム目的の連投

第3条（不適切なコンテンツへの対処・モデレーション）
・通報機能（Report）：ユーザーは不適切な写真・ピンを通報できます。通報されたコンテンツは24時間以内にモデレーターが確認し、削除等の措置を行います。
・ブロック機能（Block）：ユーザーは特定の他ユーザーをブロックでき、ブロックされたユーザーの投稿やピンは即座に非表示となります。
・利用停止・削除：本規約に違反したユーザーに対し、運営側は事前の通知なく投稿の削除、アカウントの凍結、または強制退会処分を実施します。

第4条（位置情報およびコンテンツの権利）
投稿写真に含まれる位置情報の公開はユーザー自身の責任において管理するものとします。

第5条（アカウント削除・退会）
ユーザーは設定画面より、いつでもアカウントおよび投稿データを完全に削除（退会）することができます。`;

function convertDMSToDD(dms: number[], ref: string): number {
  if (!dms || dms.length < 3) return 0;
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') dd *= -1;
  return dd;
}

function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.currentTime = 0.5;

    video.onloadeddata = () => {
      setTimeout(() => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 120;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve('');
          }
        } catch {
          resolve('');
        }
      }, 200);
    };
    video.onerror = () => resolve('');
  });
}

// ==========================================
// 2. Leaflet CARTO Positron（白デザイン維持 ＋ 地名ラベル強調）
// ==========================================
const SafeMapComponent = dynamic(
  () =>
    Promise.resolve(
      ({
        spots,
        center,
        zoom,
        targetCenter,
        targetZoom,
        mode,
        onMoveEnd,
        onSelectSpot,
        onDoubleTap,
      }: {
        spots: Spot[];
        center: [number, number];
        zoom: number;
        targetCenter: [number, number] | null;
        targetZoom: number | null;
        mode: ViewCategory;
        onMoveEnd: (center: [number, number], zoom: number) => void;
        onSelectSpot: (s: Spot) => void;
        onDoubleTap: (lat: number, lon: number) => void;
      }) => {
        const { MapContainer, TileLayer, Marker, useMapEvents, useMap } = require('react-leaflet');
        const L = require('leaflet');
        require('leaflet/dist/leaflet.css');

        const MapController = ({ targetCenter, targetZoom }: { targetCenter: [number, number] | null; targetZoom: number | null }) => {
          const map = useMap();
          useEffect(() => {
            if (targetCenter && targetZoom) {
              map.flyTo(targetCenter, targetZoom, { duration: 0.8, easeLinearity: 0.25 });
            }
          }, [targetCenter, targetZoom, map]);
          return null;
        };

        const MapEventHandler = () => {
          const map = useMapEvents({
            dblclick(e: any) {
              onDoubleTap(e.latlng.lat, e.latlng.lng);
            },
            moveend() {
              const c = map.getCenter();
              onMoveEnd([c.lat, c.lng], map.getZoom());
            },
          });
          return null;
        };

        // CARTO Positron のベース地図
        const baseTileUrl =
          mode === 'rain'
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

        // 都道府県・州・主要地名をくっきり際立たせるラベルレイヤー
        const labelTileUrl =
          mode === 'rain'
            ? 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png';

        const createMarkerIcon = (spot: Spot) => {
          const rot = ((spot.lat * 10) % 6) - 3;
          const badgeHtml = spot.isOfficial
            ? `<div style="position:absolute;top:-4px;right:-4px;background:#0284c7;color:#fff;font-size:8px;font-weight:bold;border-radius:10px;padding:1px 4px;box-shadow:0 1px 3px rgba(0,0,0,0.3);">公式</div>`
            : '';

          return L.divIcon({
            className: 'ws-marker',
            html: `
              <div style="
                position: relative;
                width: 48px;
                height: 56px;
                background: #ffffff;
                border-radius: 6px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.22);
                padding: 4px 4px 14px 4px;
                cursor: pointer;
                transform: translateY(-50%) rotate(${rot}deg);
              ">
                ${badgeHtml}
                <div style="width: 100%; height: 38px; border-radius: 3px; overflow: hidden; background: #cbd5e1;">
                  <img src="${spot.thumbUrl || spot.fileUrl}" style="width:100%;height:100%;object-fit:cover;" loading="eager" />
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
            `,
            iconSize: [48, 56],
            iconAnchor: [24, 28],
          });
        };

        return (
          <MapContainer
            center={center}
            zoom={zoom}
            minZoom={2}
            maxZoom={18}
            zoomSnap={0.5}
            zoomDelta={1}
            touchZoom={true}
            scrollWheelZoom={true}
            dragging={true}
            doubleClickZoom={false}
            zoomControl={false}
            style={{ width: '100%', height: '100%', background: '#f8fafc' }}
          >
            <MapController targetCenter={targetCenter} targetZoom={targetZoom} />
            <MapEventHandler />
            
            {/* ベース地図 */}
            <TileLayer
              url={baseTileUrl}
              attribution='&copy; CARTO'
              maxNativeZoom={18}
              maxZoom={19}
              keepBuffer={4}
            />

            {/* 地名・都道府県・州名をくっきり際立たせるラベルレイヤー */}
            <TileLayer
              url={labelTileUrl}
              maxNativeZoom={18}
              maxZoom={19}
              keepBuffer={4}
              opacity={1.0}
            />

            {spots.map((spot) => (
              <Marker
                key={spot.id}
                position={[spot.lat, spot.lon]}
                icon={createMarkerIcon(spot)}
                eventHandlers={{
                  click: () => onSelectSpot(spot),
                }}
              />
            ))}
          </MapContainer>
        );
      }
    ),
  { ssr: false, loading: () => <div style={{ height: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>🗺️ マップを準備中...</div> }
);

// ==========================================
// 3. メインコンポーネント
// ==========================================
export default function WorldSnapApp() {
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [eulaChecked, setEulaChecked] = useState<boolean>(false);

  const [userCountry, setUserCountry] = useState<string>('JP');
  const [userName, setUserName] = useState<string>('taku_snap');
  const [userBio, setUserBio] = useState<string>('世界中を旅して記録中 🌏✈️');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [friendCode] = useState<string>('WS-8823-X9');

  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [viewMode, setViewMode] = useState<ViewCategory>('view');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('world');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const currentConfig = COUNTRIES[userCountry] || COUNTRIES.JP;

  const [currentMapCenter, setCurrentMapCenter] = useState<[number, number]>([currentConfig.lat, currentConfig.lon]);
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(currentConfig.zoom);

  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | null>(null);

  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>([]);

  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(0);
  const [postTitle, setPostTitle] = useState<string>('');
  const [postDesc, setPostDesc] = useState<string>('');
  const [postCategory, setPostCategory] = useState<ViewCategory>('view');
  const [selectedScopes, setSelectedScopes] = useState<DisplayScope[]>(['world', 'my']);
  
  const [addressSearchQuery, setAddressSearchQuery] = useState<string>('');
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLon, setManualLon] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isEulaModalOpen, setIsEulaModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('不適切な画像');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'saved' | 'friends'>('posts');
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; avatar: string }[]>([
    { id: 'user-yuki', name: 'Yuki_Traveler', avatar: '🌸' },
    { id: 'user-ken', name: 'Ken_Gourmet', avatar: '☕' },
  ]);
  const [inputFriendCode, setInputFriendCode] = useState('');

  const exportRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const t = currentConfig.dict;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const hasCompleted = localStorage.getItem('ws_onboarded');
    if (!hasCompleted) {
      setIsOnboarding(true);
    }
  }, []);

  const fetchSpots = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('spots').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const dbSpots: Spot[] = data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          userAvatar: d.user_avatar,
          isOfficial: d.is_official,
          title: d.title,
          description: d.description || '',
          fileName: d.file_name,
          fileUrl: d.file_url,
          thumbUrl: d.thumb_url || d.file_url,
          fileType: d.file_type || 'image',
          lat: Number(d.lat),
          lon: Number(d.lon),
          countryCode: d.country_code,
          cityName: d.city_name,
          category: d.category,
          scopes: d.scopes || ['world'],
          createdAt: new Date(d.created_at).toLocaleDateString(),
        }));
        
        setSpots(() => {
          const dbIds = new Set(dbSpots.map(s => s.id));
          const remainPresets = INITIAL_SPOTS.filter(p => !dbIds.has(p.id));
          return [...dbSpots, ...remainPresets];
        });
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  const handleMapMoveEnd = (center: [number, number], zoom: number) => {
    setCurrentMapCenter(center);
    setCurrentMapZoom(zoom);
    setTargetCenter(null);
    setTargetZoom(null);
  };

  const filteredSpots = useMemo(() => {
    return spots.filter((s) => {
      if (blockedUsers.includes(s.userId)) return false;
      if (s.category !== viewMode) return false;
      if (displayScope === 'my') {
        if (s.userId !== 'me' || !s.scopes.includes('my')) return false;
      }
      if (displayScope === 'friends') {
        if (s.userId === 'me') {
          if (!s.scopes.includes('my')) return false;
        } else {
          if (!s.scopes.includes('friends') || !friendsList.some((f) => f.id === s.userId)) return false;
        }
      }
      if (displayScope === 'world') {
        if (s.userId !== 'me' && !s.scopes.includes('world')) return false;
      }
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        return s.title.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw) || s.cityName.toLowerCase().includes(kw);
      }
      return true;
    });
  }, [spots, blockedUsers, viewMode, displayScope, friendsList, searchKeyword]);

  const visitedCountryCount = useMemo(() => {
    return new Set(spots.filter((s) => s.userId === 'me').map((s) => s.countryCode)).size;
  }, [spots]);

  const handleMapDoubleTap = (lat: number, lon: number) => {
    setTargetCenter([lat, lon]);
    setTargetZoom(Math.min(currentMapZoom + 2.5, 17));
  };

  const handleStepZoomOut = () => {
    if (currentMapZoom >= 12) {
      setTargetCenter(currentMapCenter);
      setTargetZoom(9);
      showToast('🏙️ 都道府県レベルへ戻しました');
    } else if (currentMapZoom >= 8) {
      setTargetCenter(currentMapCenter);
      setTargetZoom(6);
      showToast('🗺️ 地方エリアへ戻しました');
    } else if (currentMapZoom >= 4.5) {
      const conf = COUNTRIES[userCountry] || COUNTRIES.JP;
      setTargetCenter([conf.lat, conf.lon]);
      setTargetZoom(conf.zoom);
      showToast(`🇯🇵 ${conf.name} 全体へ戻しました`);
    } else {
      setTargetCenter([20.0, 0.0]);
      setTargetZoom(2);
      showToast('🌎 世界全体マップへ戻しました');
    }
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('ws_onboarded', 'true');
    setIsOnboarding(false);
    const target = COUNTRIES[userCountry] || COUNTRIES.JP;
    setTargetCenter([target.lat, target.lon]);
    setTargetZoom(target.zoom);
    showToast(`🌍 ${target.name} へようこそ！`);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setUserAvatar(url);
      showToast('🖼️ アイコン画像を変更しました！');
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const EXIFModule = await import('exif-js');
    const EXIF = EXIFModule.default || EXIFModule;

    const files = Array.from(e.target.files);
    const pendingList: PendingUpload[] = [];

    for (const file of files) {
      const fileUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const fileId = 'spot-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

      if (isVideo) {
        const thumbUrl = await generateVideoThumbnail(file);
        pendingList.push({ id: fileId, file, fileUrl, thumbUrl: thumbUrl || fileUrl, fileType: 'video', hasGps: false, dateTime: new Date().toLocaleDateString() });
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
            pendingList.push({ id: fileId, file, fileUrl, thumbUrl: fileUrl, fileType: 'image', lat: latDecimal, lon: lonDecimal, hasGps: true, dateTime: new Date().toLocaleDateString() });
          } else {
            pendingList.push({ id: fileId, file, fileUrl, thumbUrl: fileUrl, fileType: 'image', hasGps: false, dateTime: new Date().toLocaleDateString() });
          }
          resolve();
        });
      });
    }

    if (pendingList.length > 0) {
      setPendingUploads(pendingList);
      setCurrentUploadIndex(0);
      setPostTitle(pendingList[0].file.name.replace(/\.[^/.]+$/, ''));
      setPostDesc('');
      setPostCategory(viewMode);
      setSelectedScopes(['world', 'my']);
      setAddressSearchQuery('');
      if (!pendingList[0].hasGps) {
        setManualLat(currentMapCenter[0].toString());
        setManualLon(currentMapCenter[1].toString());
      }
    }
  };

  const handleSearchAddress = async () => {
    if (!addressSearchQuery.trim()) return;
    setIsSearchingAddress(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const found = data[0];
        setManualLat(found.lat);
        setManualLon(found.lon);
        showToast(`📍 位置を「${found.display_name.split(',')[0]}」に設定しました`);
      } else {
        showToast('⚠️ 住所が見つかりませんでした。別のキーワードでお試しください');
      }
    } catch {
      showToast('⚠️ 検索に失敗しました');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const toggleScopeSelection = (scope: DisplayScope) => {
    if (selectedScopes.includes(scope)) {
      if (selectedScopes.length === 1) {
        showToast('⚠️ 最低1つの反映先を選択してください');
        return;
      }
      setSelectedScopes((prev) => prev.filter((s) => s !== scope));
    } else {
      setSelectedScopes((prev) => [...prev, scope]);
    }
  };

  const handleConfirmPost = async () => {
    const current = pendingUploads[currentUploadIndex];
    if (!current || isSubmitting) return;

    setIsSubmitting(true);
    showToast('⏳ 写真/動画を保存中...');

    const finalLat = current.hasGps && current.lat ? current.lat : parseFloat(manualLat) || currentMapCenter[0];
    const finalLon = current.hasGps && current.lon ? current.lon : parseFloat(manualLon) || currentMapCenter[1];

    let uploadedUrl = current.fileUrl;
    let finalThumbUrl = current.thumbUrl || current.fileUrl;

    if (supabase) {
      try {
        const fileExt = current.file.name.split('.').pop() || (current.fileType === 'video' ? 'mp4' : 'jpg');
        const filePath = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('worldsnap-media').upload(filePath, current.file);
        
        if (!uploadError) {
          const { data: publicData } = supabase.storage.from('worldsnap-media').getPublicUrl(filePath);
          if (publicData?.publicUrl) {
            uploadedUrl = publicData.publicUrl;
            if (current.fileType === 'image') {
              finalThumbUrl = publicData.publicUrl;
            }
          }
        }

        const newSpotData = {
          id: current.id,
          user_id: 'me',
          user_name: userName,
          user_avatar: userAvatar || '',
          title: postTitle || current.file.name,
          description: postDesc || '旅の思い出',
          file_name: current.file.name,
          file_url: uploadedUrl,
          thumb_url: finalThumbUrl,
          file_type: current.fileType,
          lat: finalLat,
          lon: finalLon,
          country_code: userCountry,
          city_name: currentConfig.name.split(' ')[0],
          category: postCategory,
          scopes: selectedScopes,
        };

        await supabase.from('spots').insert([newSpotData]);
      } catch (err) {
        console.error('Save error:', err);
      }
    }

    const newSpot: Spot = {
      id: current.id,
      userId: 'me',
      userName,
      userAvatar,
      title: postTitle || current.file.name,
      description: postDesc || '旅の思い出',
      fileName: current.file.name,
      fileUrl: uploadedUrl,
      thumbUrl: finalThumbUrl,
      fileType: current.fileType,
      lat: finalLat,
      lon: finalLon,
      countryCode: userCountry,
      cityName: currentConfig.name.split(' ')[0],
      category: postCategory,
      scopes: selectedScopes,
      createdAt: new Date().toLocaleDateString(),
    };

    setSpots((prev) => [newSpot, ...prev]);
    setIsSubmitting(false);
    showToast(`📍 マップにピンを反映しました！🚀`);

    if (currentUploadIndex + 1 < pendingUploads.length) {
      const nextIndex = currentUploadIndex + 1;
      setCurrentUploadIndex(nextIndex);
      setPostTitle(pendingUploads[nextIndex].file.name.replace(/\.[^/.]+$/, ''));
      setPostDesc('');
      setAddressSearchQuery('');
      if (!pendingUploads[nextIndex].hasGps) {
        setManualLat(currentMapCenter[0].toString());
        setManualLon(currentMapCenter[1].toString());
      }
    } else {
      setPendingUploads([]);
      setCurrentUploadIndex(0);
    }
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
      a.download = `WorldSnap-Map-${userCountry}.png`;
      a.click();
      showToast('💾 マップを保存しました');
    } catch {
      showToast('❌ 保存に失敗しました');
    }
  };

  const toggleSaveSpot = async (spotId: string) => {
    if (savedSpotIds.includes(spotId)) {
      setSavedSpotIds((prev) => prev.filter((id) => id !== spotId));
      if (supabase) {
        await supabase.from('saved_spots').delete().match({ user_id: 'me', spot_id: spotId });
      }
      showToast('保存を解除しました');
    } else {
      setSavedSpotIds((prev) => [...prev, spotId]);
      if (supabase) {
        await supabase.from('saved_spots').insert([{ user_id: 'me', spot_id: spotId }]);
      }
      showToast('💛 行きたいリストに保存しました！');
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (confirm('このユーザーをブロックしますか？\n相手の投稿がすべて非表示になります。')) {
      setBlockedUsers((prev) => [...prev, userId]);
      if (supabase) {
        await supabase.from('blocked_users').insert([{ blocker_id: 'me', blocked_id: userId }]);
      }
      setSelectedSpot(null);
      showToast('🚫 ユーザーをブロックしました');
    }
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (confirm('このピンを削除しますか？')) {
      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      if (supabase) {
        await supabase.from('spots').delete().eq('id', spotId);
      }
      setSelectedSpot(null);
      showToast('🗑️ ピンを削除しました');
    }
  };

  const themeAccent = viewMode === 'rain' ? '#38bdf8' : viewMode === 'gourmet' ? '#ea580c' : '#0284c7';

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {toastMessage && (
        <div style={{ position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.94)', color: '#fff', padding: '10px 20px', borderRadius: '30px', zIndex: 99999, fontSize: '13px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }}>
          {toastMessage}
        </div>
      )}

      {/* ── 初回オンボーディング ── */}
      {isOnboarding && (
        <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #070d1e 0%, #0f172a 100%)', color: '#fff', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '440px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '4px' }}>🗺️</div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0284c7' }}>WorldSnap</h1>
            <p style={{ margin: '4px 0 16px 0', fontSize: '13px', color: '#64748b' }}>世界中を旅して、思い出をつなごう</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <span style={{ width: '28px', height: '6px', borderRadius: '3px', background: onboardingStep >= 1 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
              <span style={{ width: '28px', height: '6px', borderRadius: '3px', background: onboardingStep >= 2 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
              <span style={{ width: '28px', height: '6px', borderRadius: '3px', background: onboardingStep === 3 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
            </div>

            {onboardingStep === 1 && (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t.step1Title}</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>{t.step1Desc}</p>
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  {Object.entries(COUNTRIES).map(([code, c]) => (
                    <div
                      key={code}
                      onClick={() => setUserCountry(code)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `2px solid ${userCountry === code ? '#0284c7' : '#e2e8f0'}`,
                        background: userCountry === code ? '#f0f9ff' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{c.flag} {c.name}</span>
                      {userCountry === code && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setOnboardingStep(2)} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                  {t.next}
                </button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 14px 0' }}>{t.step2Title}</h3>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      width: '76px', height: '76px', borderRadius: '50%',
                      background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent,
                      color: '#fff', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 6px 16px rgba(2,132,199,0.3)', cursor: 'pointer', position: 'relative', overflow: 'hidden'
                    }}
                  >
                    {!userAvatar && <span>👤</span>}
                    <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.4)', fontSize: '10px', color: '#fff', textAlign: 'center', padding: '2px 0' }}>
                      📷 変更
                    </div>
                  </div>
                  <input type="file" ref={avatarInputRef} accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </div>

                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>ユーザー名</label>
                <input
                  type="text"
                  maxLength={20}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: '4px', marginBottom: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }}
                />
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>自己紹介</label>
                <input
                  type="text"
                  value={userBio}
                  onChange={(e) => setUserBio(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: '4px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setOnboardingStep(1)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                    {t.back}
                  </button>
                  <button onClick={() => setOnboardingStep(3)} style={{ flex: 2, padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                    {t.next}
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t.step3Title}</h3>
                <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '14px' }}>
                  {EULA_FULL_TEXT}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#0284c7', marginBottom: '20px' }}>
                  <input type="checkbox" checked={eulaChecked} onChange={(e) => setEulaChecked(e.target.checked)} />
                  <span>{t.eulaAgree}</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setOnboardingStep(2)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                    {t.back}
                  </button>
                  <button
                    disabled={!eulaChecked}
                    onClick={handleCompleteOnboarding}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: eulaChecked ? '#0284c7' : '#94a3b8',
                      color: '#fff',
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: eulaChecked ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {t.startApp}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ヘッダー ── */}
      <header style={{ height: '48px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
            ☰
          </button>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: themeAccent, letterSpacing: '-0.5px' }}>WorldSnap</h1>
          <select
            value={userCountry}
            onChange={(e) => {
              setUserCountry(e.target.value);
              const conf = COUNTRIES[e.target.value];
              if (conf) {
                setTargetCenter([conf.lat, conf.lon]);
                setTargetZoom(conf.zoom);
              }
            }}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '3px 6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {Object.entries(COUNTRIES).map(([code, c]) => (
              <option key={code} value={code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setCurrentTab('profile')}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent,
            color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {!userAvatar && '👤'}
        </button>
      </header>

      {/* ── メインマップ ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: currentTab === 'map' ? 'flex' : 'none', flexDirection: 'column', height: '100%', position: 'relative' }}>
          
          <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)', padding: '3px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.15)', pointerEvents: 'auto' }}>
              {(['view', 'gourmet', 'rain'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    background: viewMode === m ? themeAccent : 'transparent',
                    color: viewMode === m ? '#ffffff' : '#64748b',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {m === 'view' ? `🏔️ ${t.view}` : m === 'gourmet' ? `🍔 ${t.gourmet}` : `🌧️ ${t.rain}`}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)', padding: '3px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.15)', pointerEvents: 'auto' }}>
              <select
                value={displayScope}
                onChange={(e) => setDisplayScope(e.target.value as DisplayScope)}
                style={{ background: 'transparent', border: 'none', color: '#0f172a', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', padding: '4px 6px' }}
              >
                <option value="world">🌎 {t.world}</option>
                <option value="friends">👥 {t.friends}</option>
                <option value="my">📍 {t.myMap}</option>
              </select>
            </div>
          </div>

          <div ref={exportRef} style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
            <SafeMapComponent
              spots={filteredSpots}
              center={currentMapCenter}
              zoom={currentMapZoom}
              targetCenter={targetCenter}
              targetZoom={targetZoom}
              mode={viewMode}
              onMoveEnd={handleMapMoveEnd}
              onSelectSpot={setSelectedSpot}
              onDoubleTap={handleMapDoubleTap}
            />

            <div style={{ position: 'absolute', bottom: '65px', right: '14px', zIndex: 400, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                title="段階的に引き戻す"
                onClick={handleStepZoomOut}
                style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ffffff', border: `2px solid ${themeAccent}`, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🪟
              </button>
              <button
                title="マップを保存"
                onClick={handleExportMap}
                style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0f172a', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.2)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                💾
              </button>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', zIndex: 450 }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>📍 {currentConfig.flag} {currentConfig.name}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>表示中: {filteredSpots.length}件</div>
            </div>

            <label
              style={{
                padding: '8px 16px',
                background: themeAccent,
                color: '#fff',
                borderRadius: '24px',
                fontWeight: 'bold',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>📷＋</span>
              <span>{t.addPhoto}</span>
              <input type="file" accept="image/*,video/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* ── フィード ── */}
        <div style={{ display: currentTab === 'home' ? 'flex' : 'none', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '12px 12px 70px 12px', gap: '10px' }}>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px' }}
          />

          {spots.map((spot) => (
            <div
              key={spot.id}
              onClick={() => setSelectedSpot(spot)}
              style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', cursor: 'pointer' }}
            >
              <div style={{ height: '200px', background: '#000' }}>
                {spot.fileType === 'video' ? (
                  <video src={spot.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={spot.fileUrl} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                )}
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: themeAccent }}>📍 {COUNTRIES[spot.countryCode]?.flag} {spot.title}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{spot.createdAt}</span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{spot.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── マイページ ── */}
        <div style={{ display: currentTab === 'profile' ? 'flex' : 'none', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '12px 12px 70px 12px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div
                  onClick={() => setIsEditProfileOpen(true)}
                  style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent,
                    color: '#fff', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {!userAvatar && '👤'}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px' }}>{userName}</h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{userBio}</p>
                </div>
              </div>
              <button onClick={() => setIsEditProfileOpen(true)} style={{ padding: '5px 12px', background: '#f1f5f9', border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                編集
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '14px 0', textAlign: 'center' }}>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{spots.filter((s) => s.userId === 'me').length}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>📸 {t.posts}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{visitedCountryCount}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>🗺️ {t.visited}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{friendsList.length}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>👥 {t.friends}</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>🆔 {t.friendCode}: </span>
                <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{friendCode}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(friendCode);
                  showToast('📋 フレンドコードをコピーしました');
                }}
                style={{ padding: '4px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
              >
                コピー
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
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
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {tab === 'posts' ? `📸 ${t.posts}` : tab === 'saved' ? `💛 ${t.saved}` : `👥 ${t.friends}`}
              </button>
            ))}
          </div>

          {profileSubTab === 'posts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
              {spots
                .filter((s) => s.userId === 'me')
                .map((s) => (
                  <div key={s.id} onClick={() => setSelectedSpot(s)} style={{ height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000' }}>
                    <img src={s.thumbUrl || s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                ))}
            </div>
          )}

          {profileSubTab === 'saved' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
              {spots
                .filter((s) => savedSpotIds.includes(s.id))
                .map((s) => (
                  <div key={s.id} onClick={() => setSelectedSpot(s)} style={{ height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000' }}>
                    <img src={s.thumbUrl || s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
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
      </div>

      {/* ── 詳細モーダル ── */}
      {selectedSpot && (
        <div style={{ position: 'fixed', inset: 0, background: '#ffffff', zIndex: 2000, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ height: '48px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: '#ffffff', zIndex: 10 }}>
            <button onClick={() => setSelectedSpot(null)} style={{ background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              ← {t.back}
            </button>
            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '20px', background: themeAccent, color: '#fff' }}>
              {selectedSpot.category === 'view' ? '🏔️ VIEW' : selectedSpot.category === 'gourmet' ? '🍔 GOURMET' : '🌧️ RAIN'}
            </span>
          </div>

          <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div onClick={() => setIsLightboxOpen(true)} style={{ width: '100%', height: '280px', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px', cursor: selectedSpot.fileType === 'image' ? 'zoom-in' : 'default' }}>
              {selectedSpot.fileType === 'image' ? (
                <img src={selectedSpot.fileUrl} alt={selectedSpot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video src={selectedSpot.fileUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>{selectedSpot.title}</h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  📍 {selectedSpot.lat.toFixed(4)}, {selectedSpot.lon.toFixed(4)} ({COUNTRIES[selectedSpot.countryCode]?.flag} {selectedSpot.cityName}) · {selectedSpot.createdAt}
                </div>
              </div>
              <button
                onClick={() => toggleSaveSpot(selectedSpot.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: savedSpotIds.includes(selectedSpot.id) ? '#f43f5e' : '#f1f5f9',
                  color: savedSpotIds.includes(selectedSpot.id) ? '#fff' : '#0f172a',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {savedSpotIds.includes(selectedSpot.id) ? t.saved : t.saveSpot}
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', margin: '14px 0 20px 0' }}>{selectedSpot.description}</p>

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
                marginBottom: '20px',
              }}
            >
              {t.openGoogleMaps}
            </a>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: selectedSpot.userAvatar ? `url(${selectedSpot.userAvatar}) center/cover` : themeAccent,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px'
                  }}
                >
                  {!selectedSpot.userAvatar && '👤'}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{selectedSpot.userName}</span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {selectedSpot.userId === 'me' ? (
                  <button onClick={() => handleDeleteSpot(selectedSpot.id)} style={{ padding: '5px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {t.delete}
                  </button>
                ) : (
                  <>
                    <button onClick={() => setIsReportModalOpen(true)} style={{ padding: '5px 8px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      {t.report}
                    </button>
                    <button onClick={() => handleBlockUser(selectedSpot.userId)} style={{ padding: '5px 8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      {t.block}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 投稿モーダル ── */}
      {pendingUploads.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
              📷 投稿の作成 ({currentUploadIndex + 1}/{pendingUploads.length})
            </h3>

            <div style={{ width: '100%', height: '150px', borderRadius: '12px', overflow: 'hidden', background: '#000', marginBottom: '12px' }}>
              {pendingUploads[currentUploadIndex].fileType === 'image' ? (
                <img src={pendingUploads[currentUploadIndex].fileUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video src={pendingUploads[currentUploadIndex].fileUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              🌐 どのマップに反映させますか？（複数選択可能）
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              {(['my', 'friends', 'world'] as const).map((sc) => {
                const isSelected = selectedScopes.includes(sc);
                return (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => toggleScopeSelection(sc)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: `2px solid ${isSelected ? themeAccent : '#e2e8f0'}`,
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      color: isSelected ? themeAccent : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{isSelected ? '☑️' : '☐'}</span>
                    <span>{sc === 'my' ? 'マイマップ' : sc === 'friends' ? 'フレンド' : 'ワールド'}</span>
                  </button>
                );
              })}
            </div>

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              🏷️ 投稿カテゴリ
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              {(['view', 'gourmet', 'rain'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPostCategory(cat)}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '10px',
                    border: `2px solid ${postCategory === cat ? themeAccent : '#e2e8f0'}`,
                    background: postCategory === cat ? '#f0f9ff' : '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    color: postCategory === cat ? themeAccent : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  {cat === 'view' ? '🏔️ View' : cat === 'gourmet' ? '🍔 グルメ' : '🌧️ 雨の日'}
                </button>
              ))}
            </div>

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>スポット名</label>
            <input
              type="text"
              placeholder="例: 祇園 鴨川のカフェ"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: '3px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>思い出・メモ</label>
            <textarea
              placeholder="おすすめポイントや感想"
              rows={2}
              value={postDesc}
              onChange={(e) => setPostDesc(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: '3px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />

            {!pendingUploads[currentUploadIndex].hasGps && (
              <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '10px', border: '1px solid #fef3c7', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b45309', marginBottom: '6px' }}>📍 撮影場所を設定（地名・住所検索）</div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    placeholder="地名・住所（例: 東京タワー、京都駅）"
                    value={addressSearchQuery}
                    onChange={(e) => setAddressSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchAddress(); } }}
                    style={{ flex: 1, padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    disabled={isSearchingAddress}
                    style={{ padding: '7px 12px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {isSearchingAddress ? '検索中' : '検索'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number" step="any" placeholder="緯度"
                    value={manualLat} onChange={(e) => setManualLat(e.target.value)}
                    style={{ flex: 1, padding: '5px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '10px', background: '#ffffff' }}
                  />
                  <input
                    type="number" step="any" placeholder="経度"
                    value={manualLon} onChange={(e) => setManualLon(e.target.value)}
                    style={{ flex: 1, padding: '5px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '10px', background: '#ffffff' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setPendingUploads([]);
                  setCurrentUploadIndex(0);
                }}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '10px', color: '#0f172a', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmPost}
                style={{ flex: 2, padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? '保存中...' : 'マップに反映する 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── フルスクリーン Lightbox ── */}
      {isLightboxOpen && selectedSpot && (
        <div onClick={() => setIsLightboxOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          {selectedSpot.fileType === 'image' ? (
            <img src={selectedSpot.fileUrl} alt={selectedSpot.title} style={{ maxWidth: '100%', maxHeight: '90%', objectFit: 'contain' }} />
          ) : (
            <video src={selectedSpot.fileUrl} controls autoPlay playsInline style={{ maxWidth: '100%', maxHeight: '90%', objectFit: 'contain' }} />
          )}
          <button onClick={() => setIsLightboxOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {/* ── 設定モーダル ── */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '20px', padding: '20px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                  fetchSpots();
                  showToast('✨ 最新データを再読み込みしました');
                }}
                style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '6px', fontSize: '13px' }}
              >
                <span>{t.cacheClear}</span>
                <span style={{ color: themeAccent, fontWeight: 'bold' }}>再読込</span>
              </div>
              <div
                onClick={() => {
                  if (blockedUsers.length === 0) showToast('ブロック中のユーザーはいません');
                  else {
                    setBlockedUsers([]);
                    showToast('ブロックを解除しました');
                  }
                }}
                style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '6px', fontSize: '13px' }}
              >
                <span>🚫 ブロック管理</span>
                <span style={{ color: '#94a3b8' }}>{blockedUsers.length}人 &gt;</span>
              </div>
              <div
                onClick={() => setIsEulaModalOpen(true)}
                style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px' }}
              >
                <span>📜 {t.termsTitle}</span>
                <span style={{ color: themeAccent, fontWeight: 'bold' }}>開く</span>
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
                {t.logout}
              </button>
              <button
                onClick={() => {
                  if (prompt('退会する場合は「削除する」と入力してください:') === '削除する') {
                    localStorage.removeItem('ws_onboarded');
                    setSpots(INITIAL_SPOTS);
                    showToast('⚠️ アカウントを削除しました');
                    setIsSettingsOpen(false);
                    setIsOnboarding(true);
                    setOnboardingStep(1);
                  }
                }}
                style={{ width: '100%', padding: '10px', background: '#fee2e2', border: 'none', borderRadius: '10px', color: '#dc2626', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                {t.deleteAccount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── プロフィール編集モーダル ── */}
      {isEditProfileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>👤 プロフィール編集</h3>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent,
                  color: '#fff', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden'
                }}
              >
                {!userAvatar && <span>👤</span>}
                <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.4)', fontSize: '9px', color: '#fff', textAlign: 'center', padding: '1px 0' }}>
                  変更
                </div>
              </div>
            </div>

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

      {/* ── EULAモーダル ── */}
      {isEulaModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', maxWidth: '480px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>{t.termsTitle}</h3>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {EULA_FULL_TEXT}
            </div>
            <button
              onClick={() => setIsEulaModalOpen(false)}
              style={{ width: '100%', marginTop: '16px', padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* ── 通報モーダル ── */}
      {isReportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
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
              <option value="著作権侵害">無断転載・著作権侵害</option>
            </select>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setIsReportModalOpen(false)} style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                キャンセル
              </button>
              <button
                onClick={() => {
                  setIsReportModalOpen(false);
                  showToast('✅ 通報を受け付けました');
                }}
                style={{ flex: 1, padding: '8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                送信
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ボトムナビゲーション ── */}
      <nav
        style={{
          height: '56px',
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
              handleStepZoomOut();
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
