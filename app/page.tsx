'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 0. Supabase クライアント初期化
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const GOOGLE_MAPS_API_KEY = 'AIzaSyCYqbNfMr77hi-gvKwo1by9xSdADgUaN7I';

// ==========================================
// 1. 型定義 & グローバル多言語辞書 / 厳選140カ国マスターデータ
// ==========================================
export type ViewCategory = 'view' | 'gourmet' | 'rain';
export type DisplayScope = 'my' | 'friends' | 'world';
export type TabType = 'map' | 'ranking' | 'profile';
export type MapThemeType = 'light' | 'dark' | 'pastel';

export interface CommentItem {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface FriendUser {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  postsCount: number;
}

export interface MediaItem {
  fileUrl: string;
  thumbUrl: string;
  fileType: 'image' | 'video';
  fileName: string;
}

export interface Spot {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isOfficial?: boolean;
  isFeatured?: boolean;
  isFirstExplorer?: boolean;
  viewsCount: number;
  savedCount: number;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  thumbUrl: string;
  fileType: 'image' | 'video';
  mediaList?: MediaItem[];
  lat: number;
  lon: number;
  countryCode: string;
  cityName: string;
  category: ViewCategory;
  scopes: DisplayScope[];
  tags?: string[];
  comments?: CommentItem[];
  reportCount?: number;
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

export interface PlaceSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const NG_PATTERNS = [
  '死ね', 'しね', '殺す', 'ころす', '殺してやる', '消えろ', 'きえろ', '消え失せろ',
  'バカ', 'ばか', 'アホ', 'あほ', 'クズ', 'くず', 'カス', 'かす', 'ゴミ', 'ごみ', 'クソ', 'くそ',
  'fuck', 'shit', 'bitch', 'asshole', 'idiot', 'stupid'
];

function checkInappropriateContent(text: string): { isViolating: boolean; matchedWord: string } {
  if (!text) return { isViolating: false, matchedWord: '' };
  const lower = text.toLowerCase().replace(/[\s\-_]/g, '');
  for (const word of NG_PATTERNS) {
    if (lower.includes(word.toLowerCase())) {
      return { isViolating: true, matchedWord: word };
    }
  }
  return { isViolating: false, matchedWord: '' };
}

function getUserTitle(count: number) {
  if (count >= 100) return { title: '👑 百景の覇者', color: '#eab308' };
  if (count >= 50) return { title: '🏔️ 五十景の開拓者', color: '#8b5cf6' };
  if (count >= 10) return { title: '🎒 十景のトラベラー', color: '#38bdf8' };
  if (count >= 1) return { title: '🌱 見習い探検家', color: '#22c55e' };
  return { title: '🐣 旅のビギナー', color: '#94a3b8' };
}

export const LANGUAGES: Record<string, { name: string; nativeName: string; flag: string }> = {
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' }
};

export const DICTIONaries: Record<string, Record<string, string>> = {
  ja: {
    step1Title: 'Step 1: 表示言語を選択',
    step1Desc: 'お好みの言語を選択してください。',
    step2Title: 'Step 2: ベースの国（初期マップ）を選択',
    step2Desc: '初期表示位置となるメインの国を選んでください。',
    step3Title: 'Step 3: プロフィール作成',
    step3TitleEula: 'Step 4: 利用規約 & 位置情報ポリシーの確認',
    next: '次へ進む',
    back: '戻る',
    startApp: '🚀 wap をはじめる',
    eulaAgree: '利用規約および位置情報の利用方針に同意する',
    map: 'Map',
    ranking: 'Ranking',
    profile: 'Profile',
    addPhoto: 'Add Media',
    view: 'View',
    gourmet: 'Gourmet',
    rain: 'Rainy',
    myMap: 'My Map',
    friends: 'Friends',
    world: 'World',
    openGoogleMaps: 'Googleマップで経路案内',
    translate: '🌐 翻訳する',
    close: '閉じる',
    posts: 'Posts',
    visited: 'Visited',
    searchPlaceholder: 'Search city, #tag...',
    settings: '⚙️ 設定メニュー',
    langSetting: '🌐 表示言語',
    baseCountrySetting: '📍 ベースの国',
    guideTitle: '📖 アプリの操作説明',
    eulaTitle: '📜 利用規約',
    blockListTitle: '🚫 ブロック中ユーザー管理'
  },
  en: {
    step1Title: 'Step 1: Select Language',
    step1Desc: 'Choose your preferred language.',
    step2Title: 'Step 2: Select Base Country',
    step2Desc: 'Choose your initial country.',
    step3Title: 'Step 3: Create Profile',
    step3TitleEula: 'Step 4: Terms of Service & Location Policy',
    next: 'Next',
    back: 'Back',
    startApp: '🚀 Start wap',
    eulaAgree: 'I agree to the Terms & Policy',
    map: 'Map',
    ranking: 'Ranking',
    profile: 'Profile',
    addPhoto: 'Add Media',
    view: 'View',
    gourmet: 'Gourmet',
    rain: 'Rainy',
    myMap: 'My Map',
    friends: 'Friends',
    world: 'World',
    openGoogleMaps: 'Navigate with Google Maps',
    translate: '🌐 Translate',
    close: 'Close',
    posts: 'Posts',
    visited: 'Visited',
    searchPlaceholder: 'Search city, #tag...',
    settings: '⚙️ Settings',
    langSetting: '🌐 Language',
    baseCountrySetting: '📍 Base Country',
    guideTitle: '📖 App Guide',
    eulaTitle: '📜 Terms of Service',
    blockListTitle: '🚫 Blocked Users'
  },
  ko: {
    step1Title: 'Step 1: 언어 선택',
    step1Desc: '앱에서 사용할 언어를 선택하세요.',
    step2Title: 'Step 2: 기본 국가 선택',
    step2Desc: '지도의 중심이 될 기본 국가를 선택하세요.',
    step3Title: 'Step 3: 프로필 설정',
    step3TitleEula: 'Step 4: 이용약관 및 위치정보 정책',
    next: '다음',
    back: '뒤로',
    startApp: '🚀 wap 시작하기',
    eulaAgree: '이용약관 및 위치정보 정책에 동의합니다',
    map: 'Map',
    ranking: 'Ranking',
    profile: 'Profile',
    addPhoto: 'Add Media',
    view: 'View',
    gourmet: 'Gourmet',
    rain: 'Rainy',
    myMap: '내 지도',
    friends: '친구',
    world: 'World',
    openGoogleMaps: 'Google 지도 길찾기',
    translate: '🌐 번역하기',
    close: '닫기',
    posts: '게시물',
    visited: '방문 국가',
    searchPlaceholder: 'Search city, #tag...',
    settings: '⚙️ 설정',
    langSetting: '🌐 앱 언어',
    baseCountrySetting: '📍 기본 국가',
    guideTitle: '📖 앱 가이드',
    eulaTitle: '📜 이용약관',
    blockListTitle: '🚫 차단된 사용자'
  },
  zh: {
    step1Title: '步骤 1: 选择语言',
    step1Desc: '请选择您的首选应用语言。',
    step2Title: 'Step 2: 选择基础国家',
    step2Desc: '请选择地图初始显示的国家。',
    step3Title: 'Step 3: 创建个人资料',
    step3TitleEula: 'Step 4: 服务条款与位置政策',
    next: '下一步',
    back: '返回',
    startApp: '🚀 开始使用 wap',
    eulaAgree: '同意服务条款与位置政策',
    map: 'Map',
    ranking: 'Ranking',
    profile: 'Profile',
    addPhoto: 'Add Media',
    view: 'View',
    gourmet: 'Gourmet',
    rain: 'Rainy',
    myMap: '我的地图',
    friends: '好友',
    world: 'World',
    openGoogleMaps: '谷歌地图导航',
    translate: '🌐 翻译',
    close: '关闭',
    posts: '动态',
    visited: '已访问',
    searchPlaceholder: 'Search city, #tag...',
    settings: '⚙️ 设置',
    langSetting: '🌐 应用语言',
    baseCountrySetting: '📍 基础国家',
    guideTitle: '📜 服务条款',
    eulaTitle: '📜 服务条款',
    blockListTitle: '🚫 已屏蔽用户'
  }
};

export const COUNTRIES: Record<string, { names: Record<string, string>; flag: string; region: string; lat: number; lon: number; zoom: number }> = {
  JP: { names: { ja: '日本', en: 'Japan', ko: '일본', zh: '日本' }, flag: '🇯🇵', region: '🌏 アジア', lat: 36.2048, lon: 138.2529, zoom: 5 },
  KR: { names: { ja: '韓国', en: 'South Korea', ko: '한국', zh: '韩国' }, flag: '🇰🇷', region: '🌏 アジア', lat: 35.9078, lon: 127.7669, zoom: 7 },
  CN: { names: { ja: '中国', en: 'China', ko: '중국', zh: '中国' }, flag: '🇨🇳', region: '🌏 アジア', lat: 35.8617, lon: 104.1954, zoom: 4 },
  TW: { names: { ja: '台湾', en: 'Taiwan', ko: '대만', zh: '台湾' }, flag: '🇹🇼', region: '🌏 アジア', lat: 23.6978, lon: 120.9605, zoom: 7 },
  US: { names: { ja: 'アメリカ', en: 'USA', ko: '미국', zh: '美国' }, flag: '🇺🇸', region: '🗽 北米', lat: 37.0902, lon: -95.7129, zoom: 4 },
  FR: { names: { ja: 'フランス', en: 'France', ko: '프랑스', zh: '法国' }, flag: '🇫🇷', region: '🇪🇺 ヨーロッパ', lat: 46.6034, lon: 1.8883, zoom: 5 },
  GB: { names: { ja: 'イギリス', en: 'UK', ko: '영국', zh: '英国' }, flag: '🇬🇧', region: '🇪🇺 ヨーロッパ', lat: 55.3781, lon: -3.4360, zoom: 5 }
};

const INITIAL_SPOTS: Spot[] = [
  {
    id: 'spot-tokyo-1',
    userId: 'user-official',
    userName: 'WorldSnap 公式',
    userAvatar: '',
    isOfficial: true,
    isFeatured: true,
    viewsCount: 1250,
    savedCount: 430,
    title: '渋谷スクランブル交差点＆SHIBUYA SKY',
    description: 'WorldSnap公式がおすすめする東京の代表的スポット✨ #東京 #公式スポット',
    fileName: 'shibuya.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=900&auto=format&fit=crop',
    thumbUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=120&h=120&auto=format&fit=crop',
    fileType: 'image',
    mediaList: [
      { fileUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=900&auto=format&fit=crop', thumbUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=120&h=120&auto=format&fit=crop', fileType: 'image', fileName: 'shibuya.jpg' }
    ],
    lat: 35.6595,
    lon: 139.7005,
    countryCode: 'JP',
    cityName: '東京',
    category: 'view',
    scopes: ['world', 'friends', 'my'],
    tags: ['東京', '公式スポット'],
    comments: [],
    reportCount: 0,
    createdAt: '2026/08/12',
  },
];

const EULA_FULL_TEXT = `【WorldSnap 利用規約および位置情報ポリシー】
第1条 目的
本規約はWorldSnapの利用条件を定めるものです。

第2条 位置情報
現在地取得時にGPSを利用します。

第3条 禁止事項
不適切な投稿や誹謗中傷を禁止します。`;

function extractHashtags(text: string): string[] {
  const matches = text.match(/#([^\s#]+)/g);
  return matches ? matches.map((tag) => tag.replace('#', '')) : [];
}

function convertDMSToDD(dms: number[], ref: string): number {
  if (!dms || dms.length < 3) return 0;
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') dd *= -1;
  return dd;
}

// ==========================================
// 2. Google Maps API コンポーネント
// ==========================================
const GoogleMapComponent = ({
  spots,
  center,
  zoom,
  targetCenter,
  targetZoom,
  theme,
  userLang,
  onMoveEnd,
  onSelectSpot,
  onDoubleTap,
}: {
  spots: Spot[];
  center: [number, number];
  zoom: number;
  targetCenter: [number, number] | null;
  targetZoom: number | null;
  theme: MapThemeType;
  userLang: string;
  onMoveEnd: (center: [number, number], zoom: number) => void;
  onSelectSpot: (s: Spot) => void;
  onDoubleTap: (lat: number, lon: number) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current || !window.google || !window.google.maps) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: zoom,
        minZoom: 3,
        maxZoom: 18,
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: 'greedy',
        backgroundColor: '#ffffff',
      });

      mapInstanceRef.current = map;
      window.google.maps.event.trigger(map, 'resize');

      map.addListener('idle', () => {
        const c = map.getCenter();
        const z = map.getZoom();
        if (c && z) {
          onMoveEnd([c.lat(), c.lng()], z);
        }
      });

      map.addListener('dblclick', (e: any) => {
        if (e.latLng) {
          onDoubleTap(e.latLng.lat(), e.latLng.lng());
        }
      });
    };

    if (!window.google || !window.google.maps) {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&language=${userLang}&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            initMap();
          }
        }, 15);
      }
    } else {
      initMap();
    }
  }, [userLang]);

  useEffect(() => {
    if (mapInstanceRef.current && targetCenter && targetZoom) {
      mapInstanceRef.current.panTo({ lat: targetCenter[0], lng: targetCenter[1] });
      mapInstanceRef.current.setZoom(targetZoom);
    }
  }, [targetCenter, targetZoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const map = mapInstanceRef.current;

    spots.forEach((spot) => {
      const marker = new window.google.maps.Marker({
        position: { lat: spot.lat, lng: spot.lon },
        map: map,
        title: spot.title,
      });

      marker.addListener('click', () => {
        onSelectSpot(spot);
      });

      markersRef.current.push(marker);
    });
  }, [spots]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: '#ffffff' }} />;
};

// ==========================================
// 3. メインコンポーネント
// ==========================================
export default function WapApp() {
  const [isOnboarding, setIsOnboarding] = useState<boolean>(true);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4>(1);

  const [userLangCode, setUserLangCode] = useState<string>('ja');
  const [userCountry, setUserCountry] = useState<string>('JP');

  const [userName, setUserName] = useState<string>('namesnap');
  const [userBio, setUserBio] = useState<string>('世界中を旅して記録中 🌏✈️');
  const [userAvatar, setUserAvatar] = useState<string>('');

  const [eulaChecked, setEulaChecked] = useState<boolean>(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(true);

  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [selectedCategories, setSelectedCategories] = useState<ViewCategory[]>(['view', 'gourmet', 'rain']);
  const [mapTheme, setMapTheme] = useState<MapThemeType>('light');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('world');
  
  const [mapSearchKeyword, setMapSearchKeyword] = useState<string>('');
  const [isSearchingLocation] = useState<boolean>(false);
  const [mapSearchSuggestions, setMapSearchSuggestions] = useState<PlaceSuggestion[]>([]);

  const [isAdVisible, setIsAdVisible] = useState<boolean>(true);
  const [isLocationGuideOpen, setIsLocationGuideOpen] = useState<boolean>(false);

  const currentConfig = COUNTRIES[userCountry] || COUNTRIES.JP;
  const dict = DICTIONaries[userLangCode] || DICTIONaries.ja;
  const t = (key: string) => dict[key] || DICTIONaries.ja[key] || key;

  const [currentMapCenter, setCurrentMapCenter] = useState<[number, number]>([currentConfig.lat, currentConfig.lon]);
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(currentConfig.zoom);

  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | null>(null);

  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [likedSpotIds, setLikedSpotIds] = useState<string[]>([]);

  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'timeline' | 'saved' | 'badges' | 'friends'>('posts');

  const [newCommentText, setNewCommentText] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(0);
  const [postTitle, setPostTitle] = useState<string>('');
  const [postDesc, setPostDesc] = useState<string>('');
  const [postCategory, setPostCategory] = useState<ViewCategory>('view');
  const [selectedScopes, setSelectedScopes] = useState<DisplayScope[]>(['world', 'friends', 'my']);
  
  const [addressSearchQuery, setAddressSearchQuery] = useState<string>('');
  const [addressSuggestions, setAddressSuggestions] = useState<PlaceSuggestion[]>([]);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLon, setManualLon] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isEulaModalOpen, setIsEulaModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [translatedDescriptions, setTranslatedDescriptions] = useState<Record<string, string>>({});

  const exportRef = useRef<HTMLDivElement>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement>(null);
  const onboardingAvatarInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 5000);
  };

  useEffect(() => {
    const hasCompleted = localStorage.getItem('wap_onboarded_v1');
    if (hasCompleted) {
      setIsOnboarding(false);
    }
  }, []);

  const handleMapMoveEnd = (center: [number, number], zoom: number) => {
    setCurrentMapCenter(center);
    setCurrentMapZoom(zoom);
    setTargetCenter(null);
    setTargetZoom(null);
  };

  const toggleCategoryFilter = (cat: ViewCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        showToast('⚠️ 最低1つのカテゴリを選択する必要があります');
        return;
      }
      setSelectedCategories((prev) => prev.filter((c) => c !== cat));
    } else {
      setSelectedCategories((prev) => [...prev, cat]);
    }
  };

  const handleOpenSpot = (spot: Spot) => {
    setSpots(prev => prev.map(s => s.id === spot.id ? { ...s, viewsCount: s.viewsCount + 1 } : s));
    setSelectedSpot({ ...spot, viewsCount: spot.viewsCount + 1 });
    setActiveMediaIndex(0);
  };

  const handleToggleLike = (spotId: string) => {
    const isLiked = likedSpotIds.includes(spotId);
    if (isLiked) {
      setLikedSpotIds(prev => prev.filter(id => id !== spotId));
      setSpots(prev => prev.map(s => s.id === spotId ? { ...s, savedCount: Math.max(0, s.savedCount - 1) } : s));
      showToast('いいねを解除しました');
    } else {
      setLikedSpotIds(prev => [...prev, spotId]);
      setSpots(prev => prev.map(s => s.id === spotId ? { ...s, savedCount: s.savedCount + 1 } : s));
      showToast('❤️ いいねしました！');
    }
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('wap_onboarded_v1', 'true');
    setIsOnboarding(false);
    const target = COUNTRIES[userCountry] || COUNTRIES.JP;
    setTargetCenter([target.lat, target.lon]);
    setTargetZoom(target.zoom);
    showToast(`🌍 ${target.names[userLangCode] || target.names.en} へようこそ！`);
  };

  const themeAccent = mapTheme === 'dark' ? '#38bdf8' : mapTheme === 'pastel' ? '#d97706' : '#0284c7';
  const navBarBg = '#ffffff';
  const navBarText = '#0f172a';

  return (
    <div style={{ background: '#ffffff', color: '#0f172a', height: '100dvh', maxHeight: '100dvh', width: '100vw', maxWidth: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', inset: 0, paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', touchAction: 'manipulation', userSelect: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}>
      
      {warningMessage && (
        <div style={{ position: 'fixed', top: 0, insetInline: 0, background: '#ef4444', color: '#fff', padding: '12px 16px', zIndex: 999999, fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>
          {warningMessage}
        </div>
      )}

      {toastMessage && (
        <div style={{ position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.94)', color: '#fff', padding: '10px 20px', borderRadius: '30px', zIndex: 99999, fontSize: '13px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }}>
          {toastMessage}
        </div>
      )}

      {/* 初回オンボーディング画面 */}
      {isOnboarding && (
        <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #070d1e 0%, #0f172a 100%)', color: '#fff', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '440px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center', boxSizing: 'border-box', margin: '0 auto' }}>
            <div style={{ fontSize: '36px', marginBottom: '4px' }}>🗺️</div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0284c7' }}>WorldSnap</h1>
            <p style={{ margin: '4px 0 16px 0', fontSize: '13px', color: '#64748b' }}>世界中を旅して、思い出をつなごう</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 1 ? '#0284c7' : '#e2e8f0' }}></span>
              <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 2 ? '#0284c7' : '#e2e8f0' }}></span>
              <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 3 ? '#0284c7' : '#e2e8f0' }}></span>
              <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep === 4 ? '#0284c7' : '#e2e8f0' }}></span>
            </div>

            {onboardingStep === 1 && (
              <div style={{ textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t('step1Title')}</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>{t('step1Desc')}</p>
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', boxSizing: 'border-box' }}>
                  {Object.entries(LANGUAGES).map(([code, lang]) => (
                    <div
                      key={code}
                      onClick={() => setUserLangCode(code)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `2px solid ${userLangCode === code ? '#0284c7' : '#e2e8f0'}`,
                        background: userLangCode === code ? '#f0f9ff' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{lang.flag} {lang.nativeName} ({lang.name})</span>
                      {userLangCode === code && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setOnboardingStep(2)} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer', boxSizing: 'border-box' }}>
                  {t('next')}
                </button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div style={{ textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t('step2Title')}</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>{t('step2Desc')}</p>
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', boxSizing: 'border-box' }}>
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
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{c.flag} {c.names[userLangCode] || c.names.en} <span style={{ fontSize: '11px', color: '#64748b' }}>({c.region})</span></span>
                      {userCountry === code && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                  <button onClick={() => setOnboardingStep(1)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer', boxSizing: 'border-box' }}>
                    {t('back')}
                  </button>
                  <button onClick={() => setOnboardingStep(3)} style={{ flex: 2, padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer', boxSizing: 'border-box' }}>
                    {t('next')}
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div style={{ textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 14px 0' }}>{t('step3Title')}</h3>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', boxSizing: 'border-box' }}>
                  <div
                    onClick={() => onboardingAvatarInputRef.current?.click()}
                    style={{
                      width: '76px', height: '76px', borderRadius: '50%',
                      background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent,
                      color: '#fff', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 6px 16px rgba(2,132,199,0.3)', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxSizing: 'border-box'
                    }}
                  >
                    {!userAvatar && <span>👤</span>}
                    <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.4)', fontSize: '10px', color: '#fff', textAlign: 'center', padding: '2px 0', boxSizing: 'border-box' }}>
                      📷 変更
                    </div>
                  </div>
                </div>

                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', width: '100%', boxSizing: 'border-box' }}>ユーザー名</label>
                <input
                  type="text"
                  maxLength={20}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: '4px', marginBottom: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold', boxSizing: 'border-box' }}
                />
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', width: '100%', boxSizing: 'border-box' }}>自己紹介</label>
                <input
                  type="text"
                  value={userBio}
                  onChange={(e) => setUserBio(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: '4px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                  <button onClick={() => setOnboardingStep(2)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer', boxSizing: 'border-box' }}>
                    {t('back')}
                  </button>
                  <button onClick={() => setOnboardingStep(4)} style={{ flex: 2, padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer', boxSizing: 'border-box' }}>
                    {t('next')}
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 4 && (
              <div style={{ textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t('step3TitleEula')}</h3>
                <div
                  style={{ maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '10px', boxSizing: 'border-box' }}
                >
                  {EULA_FULL_TEXT}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#0284c7', marginBottom: '16px', boxSizing: 'border-box' }}>
                  <input type="checkbox" checked={eulaChecked} onChange={(e) => setEulaChecked(e.target.checked)} />
                  <span>{t('eulaAgree')}</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                  <button onClick={() => setOnboardingStep(3)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer', boxSizing: 'border-box' }}>
                    {t('back')}
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
                      boxSizing: 'border-box',
                    }}
                  >
                    {t('startApp')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))', minHeight: 'calc(48px + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)', paddingInline: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: navBarBg, color: navBarText, borderBottom: '1px solid #e2e8f0', flexShrink: 0, zIndex: 100, touchAction: 'none', margin: 0, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, paddingTop: 'env(safe-area-inset-top, 0px)', boxSizing: 'border-box' }}>
          <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px', flexShrink: 0, color: navBarText }}>
            ☰
          </button>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0284c7', letterSpacing: '-0.5px', flexShrink: 0 }}>WorldSnap</h1>
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
            style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '3px 4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', maxWidth: '140px', textOverflow: 'ellipsis' }}
          >
            {Object.entries(COUNTRIES).map(([code, c]) => (
              <option key={code} value={code}>
                {c.flag} {c.names[userLangCode] || c.names.en} ({c.region})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setCurrentTab('profile')}
          style={{
            width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', borderRadius: '50%',
            background: userAvatar ? `url(${userAvatar}) center/cover` : '#0284c7',
            color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', marginTop: 'env(safe-area-inset-top, 0px)', boxSizing: 'border-box'
          }}
        >
          {!userAvatar && '👤'}
        </button>
      </header>

      {/* ── メインコンテンツエリア ── */}
      <div style={{ flex: 1, minHeight: 0, maxHeight: 'calc(100dvh - 48px - 58px - env(safe-area-inset-top, 0px))', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#ffffff', padding: 0, margin: 0, boxSizing: 'border-box' }}>
        
        {/* マップタブ */}
        <div style={{ display: currentTab === 'map' ? 'flex' : 'none', flexDirection: 'column', height: '100%', width: '100%', position: 'relative', background: '#ffffff', border: 'none', boxSizing: 'border-box' }}>
          
          {/* 写真の写真撮影位置・検索バーとカテゴリー・スコープボタン配置（写真の通りの配置） */}
          <div style={{ position: 'absolute', top: '10px', left: '12px', right: '12px', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', boxSizing: 'border-box' }}>
            
            {/* 1段目: 検索バー */}
            <div style={{ position: 'relative', pointerEvents: 'auto', boxSizing: 'border-box' }}>
              <form onSubmit={handleJumpLocationSearch} style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.95)', color: '#000', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={mapSearchKeyword}
                  onChange={(e) => setMapSearchKeyword(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#000', fontSize: '13px', fontWeight: '500', padding: '2px 6px', boxSizing: 'border-box' }}
                />
                <button
                  type="submit"
                  disabled={isSearchingLocation}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '20px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box', flexShrink: 0 }}
                >
                  {isSearchingLocation ? '...' : '🔍'}
                </button>
              </form>
            </div>

            {/* 2段目: カテゴリーボタン（View, Gourmet, Rainy）とワールド選択 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none', gap: '8px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.95)', padding: '4px 8px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.1)', pointerEvents: 'auto', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                {(['view', 'gourmet', 'rain'] as const).map((cat) => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategoryFilter(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: 'none',
                        background: isChecked ? '#0284c7' : '#f1f5f9',
                        color: isChecked ? '#ffffff' : '#64748b',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box',
                      }}
                    >
                      {isChecked ? '✓ ' : ''}
                      {cat === 'view' ? '🏔️️ View' : cat === 'gourmet' ? `🍔 Gourmet` : `🌧️ Rainy`}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.95)', padding: '4px 10px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.1)', pointerEvents: 'auto', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                <select
                  value={displayScope}
                  onChange={(e) => setDisplayScope(e.target.value as DisplayScope)}
                  style={{ background: 'transparent', border: 'none', color: '#0f172a', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', padding: '2px 4px', outline: 'none' }}
                >
                  <option value="world">🌎 World</option>
                  <option value="friends">👥 Friends</option>
                  <option value="my">📍 My Map</option>
                </select>
              </div>
            </div>
          </div>

          <div ref={exportRef} style={{ flex: 1, width: '100%', height: '100%', position: 'relative', boxSizing: 'border-box' }}>
            <GoogleMapComponent
              spots={filteredSpots}
              center={currentMapCenter}
              zoom={currentMapZoom}
              targetCenter={targetCenter}
              targetZoom={targetZoom}
              theme={mapTheme}
              userLang={userLangCode}
              onMoveEnd={handleMapMoveEnd}
              onSelectSpot={handleOpenSpot}
              onDoubleTap={handleMapDoubleTap}
            />

            {/* 右下の丸いボタン群（写真の配置通り） */}
            <div style={{ position: 'absolute', bottom: '75px', right: '16px', zIndex: 400, display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' }}>
              <button
                title="現在地へ移動"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setTargetCenter([pos.coords.latitude, pos.coords.longitude]);
                        setTargetZoom(15);
                        showToast('🎯 現在地に移動しました');
                      },
                      (err) => {
                        console.error(err);
                        setIsLocationGuideOpen(true);
                      },
                      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
                    );
                  } else {
                    showWarning('⚠️ お使いのブラウザは位置情報に対応していません。');
                  }
                }}
                style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#ffffff', border: `2px solid ${themeAccent}`, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
              >
                🎯
              </button>
              <button
                title="引き戻す"
                onClick={handleStepZoomOut}
                style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#ffffff', border: `2px solid ${themeAccent}`, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
              >
                🪟
              </button>
              <button
                title="マップを保存"
                onClick={handleSaveMyMap}
                style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#0f172a', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
              >
                💾
              </button>
            </div>
          </div>

          {isAdVisible && (
            <div style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '36px', maxHeight: '36px', zIndex: 440, touchAction: 'none', flexShrink: 0, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '380px', height: '26px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', cursor: 'pointer', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                  📢 <span style={{ color: themeAccent }}>WorldSnap PR</span>: 写真や動画で世界をつなごう！
                </span>
              </div>
              <button onClick={() => setIsAdVisible(false)} style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', padding: '2px', boxSizing: 'border-box' }}>✕</button>
            </div>
          )}

          {/* 下部「Add Media」ボタンと国名表示（写真の配置通り） */}
          <div style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 450, touchAction: 'none', height: '56px', minHeight: '56px', maxHeight: '56px', flexShrink: '0', boxSizing: 'border-box' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>📍 {currentConfig.flag} {currentConfig.names[userLangCode] || currentConfig.names.en}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{filteredSpots.length} spots</div>
            </div>

            <label
              style={{
                flex: 1,
                maxWidth: '240px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                borderRadius: '30px',
                fontWeight: '900',
                fontSize: '13px',
                boxShadow: '0 4px 16px rgba(2,132,199,0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <span>📷＋</span>
              <span>Add Media</span>
              <input type="file" accept="image/*,video/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* トレンド・ランキングタブ */}
        <div style={{ display: currentTab === 'ranking' ? 'flex' : 'none', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px', gap: '12px', background: '#ffffff', boxSizing: 'border-box' }}>
          <div style={{ padding: '6px 0', fontSize: '16px', fontWeight: '900', color: themeAccent }}>
            🏆 Ranking
          </div>
          {rankingSpots.map((spot, idx) => (
            <div
              key={spot.id}
              onClick={() => handleOpenSpot(spot)}
              style={{ background: '#f8fafc', borderRadius: '14px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', cursor: 'pointer', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
            >
              <div style={{ fontSize: '18px', fontWeight: '900', width: '28px', textAlign: 'center', color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#cbd5e1' }}>
                {idx + 1}
              </div>
              <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', background: '#000', flexShrink: 0, position: 'relative' }}>
                <img src={spot.thumbUrl || spot.fileUrl} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.title}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>📍 {spot.cityName} | 👀 {spot.viewsCount}</div>
              </div>
            </div>
          ))}
        </div>

        {/* マイページタブ */}
        <div style={{ display: currentTab === 'profile' ? 'flex' : 'none', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px', background: '#ffffff', boxSizing: 'border-box' }}>
          <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', marginBottom: '14px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', boxSizing: 'border-box' }}>
                <div
                  onClick={() => profileAvatarInputRef.current?.click()}
                  style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent,
                    border: `3px solid ${userRank.color}`,
                    color: '#fff', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', boxSizing: 'border-box'
                  }}
                >
                  {!userAvatar && <span>👤</span>}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h2 style={{ margin: 0, fontSize: '16px' }}>{userName}</h2>
                    <span style={{ fontSize: '10px', background: userRank.color, color: '#fff', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold' }}>{userRank.title}</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{userBio}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ボトムナビゲーション ── */}
      <nav
        style={{
          height: 'calc(54px + env(safe-area-inset-bottom, 0px))',
          minHeight: 'calc(54px + env(safe-area-inset-bottom, 0px))',
          maxHeight: 'calc(54px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: navBarBg,
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexShrink: 0,
          zIndex: 1000,
          touchAction: 'none',
          margin: 0,
          boxSizing: 'border-box',
        }}
      >
        <button
          onClick={() => setCurrentTab('map')}
          style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: currentTab === 'map' ? themeAccent : '#94a3b8', cursor: 'pointer', padding: '4px 16px', boxSizing: 'border-box' }}
        >
          <span style={{ fontSize: '18px' }}>🗺️</span>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'map' ? 'bold' : 'normal' }}>Map</span>
        </button>

        <button
          onClick={() => setCurrentTab('ranking')}
          style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: currentTab === 'ranking' ? themeAccent : '#94a3b8', cursor: 'pointer', padding: '4px 16px', boxSizing: 'border-box' }}
        >
          <span style={{ fontSize: '18px' }}>🏆</span>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'ranking' ? 'bold' : 'normal' }}>Ranking</span>
        </button>

        <button
          onClick={() => setCurrentTab('profile')}
          style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: currentTab === 'profile' ? themeAccent : '#94a3b8', cursor: 'pointer', padding: '4px 16px', boxSizing: 'border-box' }}
        >
          <span style={{ fontSize: '18px' }}>👤</span>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'profile' ? 'bold' : 'normal' }}>Profile</span>
        </button>
      </nav>
    </div>
  );
}
