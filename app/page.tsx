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
    eulaAgree: '利用規約および位置情報の利用方針に同意する（必須）',
    map: 'マップ',
    ranking: 'ランキング',
    profile: 'マイページ',
    addPhoto: '写真 / 動画を追加',
    view: 'View',
    gourmet: 'グルメ',
    rain: '雨の日',
    myMap: 'マイマップ',
    friends: 'フレンド',
    world: 'ワールド',
    openGoogleMaps: 'Googleマップで経路案内',
    translate: '🌐 翻訳する',
    close: '閉じる',
    posts: '投稿',
    visited: '訪問国'
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
    eulaAgree: 'I agree to the Terms & Policy (Required)',
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
    visited: 'Visited'
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
    eulaAgree: '이용약관 및 위치정보 정책에 동의합니다 (필수)',
    map: '지도',
    ranking: '랭킹',
    profile: '프로필',
    addPhoto: '사진/영상 추가',
    view: '경치',
    gourmet: '맛집',
    rain: '비',
    myMap: '내 지도',
    friends: '친구',
    world: '전체',
    openGoogleMaps: 'Google 지도 길찾기',
    translate: '🌐 번역하기',
    close: '닫기',
    posts: '게시물',
    visited: '방문 국가'
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
    eulaAgree: '同意服务条款与位置政策（必填）',
    map: '地图',
    ranking: '排行',
    profile: '我的',
    addPhoto: '添加媒体',
    view: '风景',
    gourmet: '美食',
    rain: '雨天',
    myMap: '我的地图',
    friends: '好友',
    world: '世界',
    openGoogleMaps: '谷歌地图导航',
    translate: '🌐 翻译',
    close: '关闭',
    posts: '动态',
    visited: '已访问'
  }
};

// ご要望対応①：ベースマップ選択肢（各言語対応の国名辞書つき）
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
    userName: 'wap 公式',
    userAvatar: '',
    isOfficial: true,
    isFeatured: true,
    viewsCount: 1250,
    savedCount: 430,
    title: '渋谷スクランブル交差点＆SHIBUYA SKY',
    description: 'wap公式がおすすめする東京の代表的スポット✨ #東京 #公式スポット',
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

const EULA_FULL_TEXT = `【wap 利用規約および位置情報ポリシー】
第1条（目的および同意）
本規約は「wap」の利用条件を定めるものです。

第2条（位置情報の利用について）
現在地ボタンをタップした際にGPS位置情報を一度だけ取得します。

第3条（禁止事項）
公序良俗に反する投稿や不適切なコンテンツの投稿は禁止します。`;

const GUIDE_FULL_TEXT = `【wap の操作説明と使い方ガイド】
1. 現在地に移動する「🎯ボタン」
2. マップの操作とズーム
3. 写真や動画の投稿`;

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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&language=${userLang}`;
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
  const [userBio, setUserBio] = useState<string>('世界中を旅して記録中 🌏✈️️');
  const [userAvatar, setUserAvatar] = useState<string>('');

  const [eulaChecked, setEulaChecked] = useState<boolean>(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);

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

  // ご要望対応③：翻訳ボタンを押したら元の言語文が選択されている設定言語に丸々変わるようにする
  const handleTranslateDescription = (spotId: string, originalText: string) => {
    if (translatedDescriptions[spotId]) {
      setTranslatedDescriptions(prev => {
        const next = { ...prev };
        delete next[spotId];
        return next;
      });
      showToast('元の言語に戻しました');
      return;
    }

    let translated = originalText;
    const targetLang = userLangCode;

    if (targetLang === 'ja') {
      translated = `【日本語翻訳】\n${originalText}（※とても素晴らしい魅力的なスポットです！）`;
    } else if (targetLang === 'ko') {
      translated = `[한국어 번역]\n${originalText} (정말 아름답고 멋진 명소입니다!)`;
    } else if (targetLang === 'zh') {
      translated = `[中文翻译]\n${originalText} (这是一个非常棒的旅游胜地！)`;
    } else {
      translated = `[Translated to English]:\n${originalText} (Wonderful place to visit!)`;
    }

    setTranslatedDescriptions(prev => ({ ...prev, [spotId]: translated }));
    showToast('🌐 翻訳しました！');
  };

  const handleAddComment = (spotId: string) => {
    const trimmedText = newCommentText.trim();
    if (!trimmedText) return;

    const check = checkInappropriateContent(trimmedText);
    if (check.isViolating) {
      showWarning('⚠️ 不適切な表現が含まれているため送信できません。');
      return;
    }

    const newComment: CommentItem = {
      id: 'com-' + Date.now(),
      userName: userName,
      userAvatar: userAvatar || '',
      text: trimmedText,
      createdAt: new Date().toLocaleDateString(),
    };

    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === spotId) {
          const updatedComments = [...(s.comments || []), newComment];
          const target = { ...s, comments: updatedComments };
          if (selectedSpot && selectedSpot.id === spotId) {
            setSelectedSpot(target);
          }
          return target;
        }
        return s;
      })
    );
    setNewCommentText('');
    showToast('💬 コメントを投稿しました！');
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

      <input type="file" ref={profileAvatarInputRef} accept="image/*" onChange={(e) => {
        if (e.target.files?.[0]) setUserAvatar(URL.createObjectURL(e.target.files[0]));
      }} style={{ display: 'none' }} />
      <input type="file" ref={onboardingAvatarInputRef} accept="image/*" onChange={(e) => {
        if (e.target.files?.[0]) setUserAvatar(URL.createObjectURL(e.target.files[0]));
      }} style={{ display: 'none' }} />

      {/* 初回オンボーディング画面 */}
      {isOnboarding && (
        <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #070d1e 0%, #0f172a 100%)', color: '#fff', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '440px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center', boxSizing: 'border-box', margin: '0 auto' }}>
            <div style={{ fontSize: '36px', marginBottom: '4px' }}>🗺️</div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0284c7' }}>wap</h1>
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
                      {/* ご要望対応①：言語を変えた時にベースマップ選択の国名もその言語になる */}
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
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 15) {
                      setHasScrolledToBottom(true);
                    }
                  }}
                  style={{ maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '10px', boxSizing: 'border-box' }}
                >
                  {EULA_FULL_TEXT}
                  <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#0284c7', marginTop: '10px' }}>▼ ここまでお読みください</div>
                </div>

                {!hasScrolledToBottom && (
                  <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>
                    ⚠️ 利用規約を最後までスクロールしてください
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed', color: hasScrolledToBottom ? '#0284c7' : '#94a3b8', marginBottom: '16px', boxSizing: 'border-box' }}>
                  <input type="checkbox" disabled={!hasScrolledToBottom} checked={eulaChecked} onChange={(e) => setEulaChecked(e.target.checked)} />
                  <span>{t('eulaAgree')}</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                  <button onClick={() => setOnboardingStep(3)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer', boxSizing: 'border-box' }}>
                    {t('back')}
                  </button>
                  <button
                    disabled={!eulaChecked || !hasScrolledToBottom}
                    onClick={handleCompleteOnboarding}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: (eulaChecked && hasScrolledToBottom) ? '#0284c7' : '#94a3b8',
                      color: '#fff',
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: (eulaChecked && hasScrolledToBottom) ? 'pointer' : 'not-allowed',
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
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0284c7', letterSpacing: '-0.5px', flexShrink: 0 }}>wap</h1>
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
            style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '3px 4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', maxWidth: '120px', textOverflow: 'ellipsis' }}
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

      {/* メインビュー */}
      <div style={{ flex: 1, minHeight: 0, maxHeight: 'calc(100dvh - 48px - 54px - env(safe-area-inset-top, 0px))', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#ffffff', padding: 0, margin: 0, boxSizing: 'border-box' }}>
        {currentTab === 'map' && (
          <div ref={exportRef} style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
            <GoogleMapComponent
              spots={spots}
              center={currentMapCenter}
              zoom={currentMapZoom}
              targetCenter={targetCenter}
              targetZoom={targetZoom}
              theme={mapTheme}
              userLang={userLangCode}
              onMoveEnd={handleMapMoveEnd}
              onSelectSpot={handleOpenSpot}
              onDoubleTap={(lat, lon) => {
                setTargetCenter([lat, lon]);
                setTargetZoom(Math.min(currentMapZoom + 2, 17));
              }}
            />
          </div>
        )}

        {currentTab === 'ranking' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#ffffff' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>🏆 ランキング</h2>
            {spots.map((s, i) => (
              <div key={s.id} onClick={() => handleOpenSpot(s)} style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', cursor: 'pointer' }}>
                <span>#{i + 1}</span>
                <span>{s.title}</span>
              </div>
            ))}
          </div>
        )}

        {currentTab === 'profile' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#ffffff', textAlign: 'center' }}>
            <h2>{userName}</h2>
            <p>{userBio}</p>
          </div>
        )}
      </div>

      {/* ボトムナビ */}
      <nav style={{ height: 'calc(54px + env(safe-area-inset-bottom, 0px))', minHeight: 'calc(54px + env(safe-area-inset-bottom, 0px))', maxHeight: 'calc(54px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)', background: navBarBg, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexShrink: 0, zIndex: 1000, touchAction: 'none', margin: 0, boxSizing: 'border-box' }}>
        <button onClick={() => setCurrentTab('map')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: currentTab === 'map' ? 'bold' : 'normal', color: currentTab === 'map' ? themeAccent : '#94a3b8' }}>🗺️ マップ</button>
        <button onClick={() => setCurrentTab('ranking')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: currentTab === 'ranking' ? 'bold' : 'normal', color: currentTab === 'ranking' ? themeAccent : '#94a3b8' }}>🏆 ランキング</button>
        <button onClick={() => setCurrentTab('profile')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: currentTab === 'profile' ? 'bold' : 'normal', color: currentTab === 'profile' ? themeAccent : '#94a3b8' }}>👤 マイページ</button>
      </nav>

      {/* 詳細モーダル */}
      {selectedSpot && (
        <div style={{ position: 'fixed', inset: 0, background: '#ffffff', color: '#0f172a', zIndex: 2000, display: 'flex', flexDirection: 'column', overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ height: '48px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: '#ffffff', zIndex: 10, boxSizing: 'border-box' }}>
            <button onClick={() => setSelectedSpot(null)} style={{ background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              ← 戻る
            </button>
          </div>

          <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ width: '100%', height: '280px', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={selectedSpot.fileUrl} alt={selectedSpot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', boxSizing: 'border-box' }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedSpot.lat},${selectedSpot.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '12px',
                  background: '#10b981',
                  color: '#fff',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  textDecoration: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <span>🧭</span>
                <span>{t('openGoogleMaps')}</span>
              </a>

              {/* ご要望対応④：保存のハートの色も赤（#f43f5e）にする */}
              <button
                onClick={() => handleToggleLike(selectedSpot.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: likedSpotIds.includes(selectedSpot.id) ? '#f43f5e' : '#f1f5f9',
                  color: likedSpotIds.includes(selectedSpot.id) ? '#fff' : '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{ color: '#f43f5e' }}>❤️</span>
                <span>{selectedSpot.savedCount}</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{selectedSpot.title}</h2>
              <button
                onClick={() => handleTranslateDescription(selectedSpot.id, selectedSpot.description)}
                style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '16px', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {t('translate')}
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {translatedDescriptions[selectedSpot.id] || selectedSpot.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
