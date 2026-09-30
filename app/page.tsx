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
  'ブス', 'ぶす', 'デブ', 'でぶ', 'キモい', 'きもい', 'きもちわるい', 'ブサイク', 'うざい',
  'レイプ', 'れいぷ', '強姦', '売春', 'ばいしゅん', '買春', '援交', 'パパ活', '児童ポルノ',
  'ドラッグ', 'どらっぐ', '覚醒剤', '大麻', 'たいま', 'コカイン', 'ヘロイン', '違法薬物',
  '暴力', '暴行', '殴る', '蹴る', 'いじめ', 'いじめる', '自殺', 'じさつ', '死にたい',
  'ホモ', 'ほも', 'オカマ', 'おかま', '差別', 'さべつ', '中国人差別', '韓国人差別', '外国人差別',
  'セックス', 'せっくす', 'エロ', 'えろ', 'ちんこ', 'まんこ', 'おっぱい', 'オナニー', 'おなにー',
  'fuck', 'shit', 'bitch', 'asshole', 'idiot', 'stupid', 'cunt', 'dick', 'pussy', 'whore', 'slut',
  'nigger', 'faggot', 'retard', 'suicide', 'kill', 'rape', 'cocaine', 'heroin', 'nazi', 'hitler',
  '去死', '混蛋', '白痴', '傻逼', '贱人', '垃圾', '强奸', '卖淫', '吸毒', '自杀', '支那', '翻墙',
  '죽어', '꺼져', '바보', '쓰레기', '병신', '개새끼', '창녀', '강간', '자살', '마약',
  'merde', 'connard', 'salope', 'pute', 'enculé', 'suicide', 'viole', 'drogue',
  'puta', 'mierda', 'cabrón', 'estúpido', 'idiota', 'suicidio', 'violación', 'droga',
  'scheiße', 'arschloch', 'hure', 'schlampe', 'selbstmord', 'vergewaltigung', 'droge'
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
  if (count >= 90) return { title: '🏆 九十景の巨匠', color: '#f97316' };
  if (count >= 80) return { title: '🌟 八十景の探求者', color: '#f59e0b' };
  if (count >= 70) return { title: '⭐ 七十景の旅人', color: '#f43f5e' };
  if (count >= 60) return { title: '💎 六十景の語り部', color: '#06b6d4' };
  if (count >= 50) return { title: '🏔️ 五十景の開拓者', color: '#8b5cf6' };
  if (count >= 40) return { title: '🧭 四十景のナビゲーター', color: '#6366f1' };
  if (count >= 30) return { title: '✈️ 三十景のボイジャー', color: '#3b82f6' };
  if (count >= 20) return { title: '🗺️ 二十景のエキスパート', color: '#0284c7' };
  if (count >= 10) return { title: '🎒 十景のトラベラー', color: '#38bdf8' };
  if (count >= 5) return { title: '📷 五景のハンター', color: '#0ea5e9' };
  if (count >= 1) return { title: '🌱 見習い探検家', color: '#22c55e' };
  return { title: '🐣 旅のビギナー', color: '#94a3b8' };
}

export const LANGUAGES: Record<string, { name: string; nativeName: string; flag: string }> = {
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  th: { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' }
};

const DICTIONaries: Record<string, Record<string, string>> = {
  ja: {
    step1Title: 'Step 1: 表示言語を選択',
    step1Desc: '世界中の人々が使えるよう、お好みの言語を選択してください。',
    step2Title: 'Step 2: ベースの国（初期マップ）を選択',
    step2Desc: 'マップの初期表示位置となるメインの国を選んでください（厳選140カ国）。',
    step3Title: 'Step 3: プロフィール作成',
    step3TitleEula: 'Step 4: 利用規約 & 位置情報ポリシーの確認',
    next: '次へ進む',
    back: '戻る',
    startApp: '🚀 wap をはじめる',
    eulaAgree: '利用規約および位置情報の利用方針に同意する（Apple審査対応）',
    map: 'マップ',
    ranking: 'ランキング',
    profile: 'マイページ',
    addPhoto: '写真 / 動画を追加',
    exportMap: 'マップ保存',
    view: 'View',
    gourmet: 'グルメ',
    rain: '雨の日',
    myMap: 'マイマップ',
    friends: 'フレンド',
    world: 'ワールド',
    openGoogleMaps: '🧭 Googleマップで経路案内',
    likeSpot: '❤️ いいね',
    likedSpot: '❤️ いいね済み',
    report: '⚠️ 通報',
    block: '🚫 ブロック',
    delete: '🗑️ 削除',
    edit: '✏️ 編集',
    visited: '訪問国',
    posts: '投稿',
    friendCode: 'フレンドコード',
    searchPlaceholder: '🔍 地域・都市・#タグを検索（例: 京都、#絶景）',
    settings: '⚙️ 設定メニュー',
    langSetting: '🌐 表示言語 (Language)',
    baseCountrySetting: '📍 ベースの国 (初期マップ)',
    blockListTitle: '🚫 ブロック中ユーザー管理',
    eulaTitle: '📜 利用規約 (EULA)',
    guideTitle: '📖 アプリの操作説明',
    translate: '🌐 翻訳する',
    close: '閉じる',
    tabPosts: '📸 投稿',
    tabTimeline: '📅 ログ',
    tabSaved: '💛 保存',
    tabBadges: '🏅 バッジ',
    tabFriends: '👥 フレンド'
  },
  en: {
    step1Title: 'Step 1: Select Language',
    step1Desc: 'Choose your preferred language for the application.',
    step2Title: 'Step 2: Select Base Country',
    step2Desc: 'Choose your initial country for the map view.',
    step3Title: 'Step 3: Create Profile',
    step3TitleEula: 'Step 4: Terms of Service & Location Policy',
    next: 'Next',
    back: 'Back',
    startApp: '🚀 Start wap',
    eulaAgree: 'I agree to the Terms of Service & Location Policy',
    map: 'Map',
    ranking: 'Ranking',
    profile: 'Profile',
    addPhoto: 'Add Media',
    exportMap: 'Save Map',
    view: 'View',
    gourmet: 'Gourmet',
    rain: 'Rainy',
    myMap: 'My Map',
    friends: 'Friends',
    world: 'World',
    openGoogleMaps: '🧭 Navigate with Google Maps',
    likeSpot: '❤️ Like',
    likedSpot: '❤️ Liked',
    report: '⚠️ Report',
    block: '🚫 Block',
    delete: '🗑️ Delete',
    edit: '✏️ Edit',
    visited: 'Visited',
    posts: 'Posts',
    friendCode: 'Friend Code',
    searchPlaceholder: '🔍 Search city, #tag...',
    settings: '⚙️ Settings',
    langSetting: '🌐 Language',
    baseCountrySetting: '📍 Base Country',
    blockListTitle: '🚫 Blocked Users',
    eulaTitle: '📜 Terms of Service',
    guideTitle: '📖 App Guide',
    translate: '🌐 Translate',
    close: 'Close',
    tabPosts: '📸 Posts',
    tabTimeline: '📅 Log',
    tabSaved: '💛 Saved',
    tabBadges: '🏅 Badges',
    tabFriends: '👥 Friends'
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
    map: '지도',
    ranking: '랭킹',
    profile: '프로필',
    addPhoto: '사진/영상 추가',
    exportMap: '지도 저장',
    view: '경치',
    gourmet: '맛집',
    rain: '비',
    myMap: '내 지도',
    friends: '친구',
    world: '전체',
    openGoogleMaps: '🧭 Google 지도 길찾기',
    likeSpot: '❤️ 좋아요',
    likedSpot: '❤️ 좋아요 취소',
    report: '⚠️ 신고',
    block: '🚫 차단',
    delete: '🗑️ 삭제',
    edit: '✏️ 수정',
    visited: '방문 국가',
    posts: '게시물',
    friendCode: '친구 코드',
    searchPlaceholder: '🔍 도시 / #태그 검색',
    settings: '⚙️ 설정',
    langSetting: '🌐 앱 언어',
    baseCountrySetting: '📍 기본 국가',
    blockListTitle: '🚫 차단된 사용자',
    eulaTitle: '📜 이용약관',
    guideTitle: '📖 앱 가이드',
    translate: '🌐 번역하기',
    close: '닫기',
    tabPosts: '📸 게시물',
    tabTimeline: '📅 로그',
    tabSaved: '💛 저장',
    tabBadges: '🏅 배지',
    tabFriends: '👥 친구'
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
    map: '地图',
    ranking: '排行',
    profile: '我的',
    addPhoto: '添加媒体',
    exportMap: '保存地图',
    view: '风景',
    gourmet: '美食',
    rain: '雨天',
    myMap: '我的地图',
    friends: '好友',
    world: '世界',
    openGoogleMaps: '🧭 谷歌地图导航',
    likeSpot: '❤️ 赞',
    likedSpot: '❤️ 已赞',
    report: '⚠️ 举报',
    block: '🚫 拉黑',
    delete: '🗑️ 删除',
    edit: '编辑',
    visited: '已访问',
    posts: '动态',
    friendCode: '好友码',
    searchPlaceholder: '🔍 搜索城市 / #标签...',
    settings: '⚙️ 设置',
    langSetting: '🌐 应用语言',
    baseCountrySetting: '📍 基础国家',
    blockListTitle: '🚫 已屏蔽用户',
    eulaTitle: '📜 服务条款',
    guideTitle: '📖 操作指南',
    translate: '🌐 翻译',
    close: '关闭',
    tabPosts: '📸 动态',
    tabTimeline: '📅 日志',
    tabSaved: '💛 收藏',
    tabBadges: '🏅 徽章',
    tabFriends: '👥 好友'
  }
};

export const COUNTRIES: Record<
  string,
  {
    name: string;
    flag: string;
    region: string;
    lat: number;
    lon: number;
    zoom: number;
  }
> = {
  JP: { name: '日本 (Japan)', flag: '🇯🇵', region: '🌏 アジア', lat: 36.2048, lon: 138.2529, zoom: 5 },
  KR: { name: '韓国 (South Korea)', flag: '🇰🇷', region: '🌏 アジア', lat: 35.9078, lon: 127.7669, zoom: 7 },
  CN: { name: '中国 (China)', flag: '🇨🇳', region: '🌏 アジア', lat: 35.8617, lon: 104.1954, zoom: 4 },
  TW: { name: '台湾 (Taiwan)', flag: '🇹🇼', region: '🌏 アジア', lat: 23.6978, lon: 120.9605, zoom: 7 },
  HK: { name: '香港 (Hong Kong)', flag: '🇭🇰', region: '🌏 アジア', lat: 22.3193, lon: 114.1694, zoom: 11 },
  MO: { name: 'マカオ (Macau)', flag: '🇲🇴', region: '🌏 アジア', lat: 22.1987, lon: 113.5439, zoom: 12 },
  TH: { name: 'タイ (Thailand)', flag: '🇹🇭', region: '🌏 アジア', lat: 15.8700, lon: 100.9925, zoom: 6 },
  VN: { name: 'ベトナム (Vietnam)', flag: '🇻🇳', region: '🌏 アジア', lat: 14.0583, lon: 108.2772, zoom: 6 },
  SG: { name: 'シンガポール (Singapore)', flag: '🇸🇬', region: '🌏 アジア', lat: 1.3521, lon: 103.8198, zoom: 11 },
  MY: { name: 'マレーシア (Malaysia)', flag: '🇲🇾', region: '🌏 アジア', lat: 4.2105, lon: 101.9758, zoom: 6 },
  ID: { name: 'インドネシア (Indonesia)', flag: '🇮🇩', region: '🌏 アジア', lat: -0.7893, lon: 113.9213, zoom: 5 },
  PH: { name: 'フィリピン (Philippines)', flag: '🇵🇭', region: '🌏 アジア', lat: 12.8797, lon: 121.7740, zoom: 6 },
  IN: { name: 'インド (India)', flag: '🇮🇳', region: '🌏 アジア', lat: 20.5937, lon: 78.9629, zoom: 5 },
  PK: { name: 'パキスタン (Pakistan)', flag: '🇵🇰', region: '🌏 アジア', lat: 30.3753, lon: 69.3451, zoom: 5 },
  BD: { name: 'バングラデシュ (Bangladesh)', flag: '🇧🇩', region: '🌏 アジア', lat: 23.6850, lon: 90.3563, zoom: 6 },
  LK: { name: 'スリランカ (Sri Lanka)', flag: '🇱🇰', region: '🌏 アジア', lat: 7.8731, lon: 80.7718, zoom: 7 },
  NP: { name: 'ネパール (Nepal)', flag: '🇳🇵', region: '🌏 アジア', lat: 28.3949, lon: 84.1240, zoom: 6 },
  MM: { name: 'ミャンマー (Myanmar)', flag: '🇲🇲', region: '🌏 アジア', lat: 21.9162, lon: 95.9560, zoom: 5 },
  KH: { name: 'カンボジア (Cambodia)', flag: '🇰🇭', region: '🌏 アジア', lat: 12.5657, lon: 104.9910, zoom: 7 },
  LA: { name: 'ラオス (Laos)', flag: '🇱🇦', region: '🌏 アジア', lat: 19.8563, lon: 102.4955, zoom: 6 },
  MN: { name: 'モンゴル (Mongolia)', flag: '🇲🇳', region: '🌏 アジア', lat: 46.8625, lon: 103.8467, zoom: 5 },
  AE: { name: 'アラブ首長国連邦 (UAE)', flag: '🇦🇪', region: '🌏 アジア', lat: 23.4241, lon: 53.8478, zoom: 7 },
  SA: { name: 'サウジアラビア (Saudi Arabia)', flag: '🇸🇦', region: '🌏 アジア', lat: 23.8859, lon: 45.0792, zoom: 5 },
  IL: { name: 'イスラエル (Israel)', flag: '🇮🇱', region: '🌏 アジア', lat: 31.0461, lon: 34.8516, zoom: 7 },
  MV: { name: 'モルディブ (Maldives)', flag: '🇲🇻', region: '🌏 アジア', lat: 3.2028, lon: 73.2207, zoom: 7 },
  QA: { name: 'カタール (Qatar)', flag: '🇶🇦', region: '🌏 アジア', lat: 25.3548, lon: 51.1839, zoom: 8 },
  BH: { name: 'バーレーン (Bahrain)', flag: '🇧🇭', region: '🌏 アジア', lat: 26.0667, lon: 50.5577, zoom: 10 },
  OM: { name: 'オマーン (Oman)', flag: '🇴🇲', region: '🌏 アジア', lat: 21.4735, lon: 55.9754, zoom: 6 },
  JO: { name: 'ヨルダン (Jordan)', flag: '🇯🇴', region: '🌏 アジア', lat: 30.5852, lon: 36.2384, zoom: 7 },
  UZ: { name: 'ウズベキスタン (Uzbekistan)', flag: '🇺🇿', region: '🌏 アジア', lat: 41.3775, lon: 64.5853, zoom: 5 },
  KZ: { name: 'カザフスタン (Kazakhstan)', flag: '🇰🇿', region: '🌏 アジア', lat: 48.0196, lon: 66.9237, zoom: 4 },
  AZ: { name: 'アゼルバイジャン (Azerbaijan)', flag: '🇦🇿', region: '🌏 アジア', lat: 40.1431, lon: 47.5769, zoom: 6 },
  GE: { name: 'ジョージア (Georgia)', flag: '🇬🇪', region: '🌏 アジア', lat: 42.3154, lon: 43.3569, zoom: 7 },
  AM: { name: 'アルメニア (Armenia)', flag: '🇦🇲', region: '🌏 アジア', lat: 40.0691, lon: 45.0382, zoom: 8 },
  BN: { name: 'ブルネイ (Brunei)', flag: '🇧🇳', region: '🌏 アジア', lat: 4.5353, lon: 114.7277, zoom: 9 },

  FR: { name: 'フランス (France)', flag: '🇫🇷', region: '🇪🇺 ヨーロッパ', lat: 46.6034, lon: 1.8883, zoom: 5 },
  ES: { name: 'スペイン (Spain)', flag: '🇪🇸', region: '🇪🇺 ヨーロッパ', lat: 40.4637, lon: -3.7492, zoom: 6 },
  IT: { name: 'イタリア (Italy)', flag: '🇮🇹', region: '🇪🇺 ヨーロッパ', lat: 41.8719, lon: 12.5674, zoom: 6 },
  GB: { name: 'イギリス (UK)', flag: '🇬🇧', region: '🇪🇺 ヨーロッパ', lat: 55.3781, lon: -3.4360, zoom: 5 },
  DE: { name: 'ドイツ (Germany)', flag: '🇩🇪', region: '🇪🇺 ヨーロッパ', lat: 51.1657, lon: 10.4515, zoom: 5 },
  CH: { name: 'スイス (Switzerland)', flag: '🇨🇭', region: '🇪🇺 ヨーロッパ', lat: 46.8182, lon: 8.2275, zoom: 8 },
  AT: { name: 'オーストリア (Austria)', flag: '🇦🇹', region: '🇪🇺 ヨーロッパ', lat: 47.5162, lon: 14.5501, zoom: 7 },
  GR: { name: 'ギリシャ (Greece)', flag: '🇬🇷', region: '🇪🇺 ヨーロッパ', lat: 39.0742, lon: 21.8243, zoom: 7 },
  PT: { name: 'ポルトガル (Portugal)', flag: '🇵🇹', region: '🇪🇺 ヨーロッパ', lat: 39.3999, lon: -8.2245, zoom: 7 },
  NL: { name: 'オランダ (Netherlands)', flag: '🇳🇱', region: '🇪🇺 ヨーロッパ', lat: 52.1326, lon: 5.2913, zoom: 8 },
  SE: { name: 'スウェーデン (Sweden)', flag: '🇸🇪', region: '🇪🇺 ヨーロッパ', lat: 60.1282, lon: 18.6435, zoom: 5 },
  NO: { name: 'ノルウェー (Norway)', flag: '🇳🇴', region: '🇪🇺 ヨーロッパ', lat: 60.4720, lon: 8.4689, zoom: 5 },
  DK: { name: 'デンマーク (Denmark)', flag: '🇩🇰', region: '🇪🇺 ヨーロッパ', lat: 56.2639, lon: 9.5018, zoom: 7 },
  FI: { name: 'フィンランド (Finland)', flag: '🇫🇮', region: '🇪🇺 ヨーロッパ', lat: 61.9241, lon: 25.7482, zoom: 5 },
  TR: { name: 'トルコ (Turkey)', flag: '🇹🇷', region: '🇪🇺 ヨーロッパ', lat: 38.9637, lon: 35.2433, zoom: 6 },
  PL: { name: 'ポーランド (Poland)', flag: '🇵🇱', region: '🇪🇺 ヨーロッパ', lat: 51.9194, lon: 19.1451, zoom: 6 },
  CZ: { name: 'チェコ (Czech Republic)', flag: '🇨🇿', region: '🇪🇺 ヨーロッパ', lat: 49.8175, lon: 15.4730, zoom: 7 },
  HU: { name: 'ハンガリー (Hungary)', flag: '🇭🇺', region: '🇪🇺 ヨーロッパ', lat: 47.1625, lon: 19.5033, zoom: 7 },
  RO: { name: 'ルーマニア (Romania)', flag: '🇷🇴', region: '🇪🇺 ヨーロッパ', lat: 45.9432, lon: 24.9668, zoom: 6 },
  BE: { name: 'ベルギー (Belgium)', flag: '🇧🇪', region: '🇪🇺 ヨーロッパ', lat: 50.5039, lon: 4.4699, zoom: 8 },
  IE: { name: 'アイルランド (Ireland)', flag: '🇮🇪', region: '🇪🇺 ヨーロッパ', lat: 53.1424, lon: -7.6921, zoom: 7 },
  IS: { name: 'アイスランド (Iceland)', flag: '🇮🇸', region: '🇪🇺 ヨーロッパ', lat: 64.9631, lon: -19.0208, zoom: 6 },
  HR: { name: 'クロアチア (Croatia)', flag: '🇭🇷', region: '🇪🇺 ヨーロッパ', lat: 45.1, lon: 15.2, zoom: 7 },
  UA: { name: 'ウクライナ (Ukraine)', flag: '🇺🇦', region: '🇪🇺 ヨーロッパ', lat: 48.3794, lon: 31.1656, zoom: 6 },
  EE: { name: 'エストニア (Estonia)', flag: '🇪🇪', region: '🇪🇺 ヨーロッパ', lat: 58.5953, lon: 25.0136, zoom: 7 },
  LV: { name: 'ラトビア (Latvia)', flag: '🇱🇻', region: '🇪🇺 ヨーロッパ', lat: 56.8796, lon: 24.6032, zoom: 7 },
  LT: { name: 'リトアニア (Lithuania)', flag: '🇱🇹', region: '🇪🇺 ヨーロッパ', lat: 55.1694, lon: 23.8813, zoom: 7 },
  SK: { name: 'スロバキア (Slovakia)', flag: '🇸🇰', region: '🇪🇺 ヨーロッパ', lat: 48.6690, lon: 19.6990, zoom: 7 },
  SI: { name: 'スロベニア (Slovenia)', flag: '🇸🇮', region: '🇪🇺 ヨーロッパ', lat: 46.1512, lon: 14.9955, zoom: 8 },
  LU: { name: 'ルクセンブルク (Luxembourg)', flag: '🇱🇺', region: '🇪🇺 ヨーロッパ', lat: 49.8153, lon: 6.1296, zoom: 10 },
  MC: { name: 'モナコ (Monaco)', flag: '🇲🇨', region: '🇪🇺 ヨーロッパ', lat: 43.7384, lon: 7.4246, zoom: 14 },
  VA: { name: 'バチカン市国 (Vatican City)', flag: '🇻🇦', region: '🇪🇺 ヨーロッパ', lat: 41.9029, lon: 12.4534, zoom: 15 },
  SM: { name: 'サンマリノ (San Marino)', flag: '🇸🇲', region: '🇪🇺 ヨーロッパ', lat: 43.9424, lon: 12.4578, zoom: 12 },
  AD: { name: 'アンドラ (Andorra)', flag: '🇦🇩', region: '🇪🇺 ヨーロッパ', lat: 42.5063, lon: 1.5218, zoom: 10 },
  LI: { name: 'リヒテンシュタイン (Liechtenstein)', flag: '🇱🇮', region: '🇪🇺 ヨーロッパ', lat: 47.166, lon: 9.555, zoom: 11 },
  RS: { name: 'セルビア (Serbia)', flag: '🇷🇸', region: '🇪🇺 ヨーロッパ', lat: 44.0165, lon: 21.0059, zoom: 7 },
  BG: { name: 'ブルガリア (Bulgaria)', flag: '🇧🇬', region: '🇪🇺 ヨーロッパ', lat: 42.7339, lon: 25.4858, zoom: 7 },
  CY: { name: 'キプロス (Cyprus)', flag: '🇨🇾', region: '🇪🇺 ヨーロッパ', lat: 35.1264, lon: 33.4299, zoom: 8 },
  MT: { name: 'マルタ (Malta)', flag: '🇲🇹', region: '🇪🇺 ヨーロッパ', lat: 35.9375, lon: 14.3754, zoom: 11 },
  AL: { name: 'アルバニア (Albania)', flag: '🇦🇱', region: '🇪🇺 ヨーロッパ', lat: 41.1533, lon: 20.1683, zoom: 7 },

  US: { name: 'アメリカ (USA)', flag: '🇺🇸', region: '🗽 北米・中南米', lat: 37.0902, lon: -95.7129, zoom: 4 },
  CA: { name: 'カナダ (Canada)', flag: '🇨🇦', region: '🗽 北米・中南米', lat: 56.1304, lon: -106.3468, zoom: 3 },
  MX: { name: 'メキシコ (Mexico)', flag: '🇲🇽', region: '🗽 北米・中南米', lat: 23.6345, lon: 102.5528, zoom: 5 },
  BR: { name: 'ブラジル (Brazil)', flag: '🇧🇷', region: '🗽 北米・中南米', lat: -14.2350, lon: -51.9253, zoom: 4 },
  AR: { name: 'アルゼンチン (Argentina)', flag: '🇦🇷', region: '🗽 北米・中南米', lat: -38.4161, lon: -63.6167, zoom: 4 },
  PE: { name: 'ペルー (Peru)', flag: '🇵🇪', region: '🗽 北米・中南米', lat: -9.1900, lon: -75.0152, zoom: 5 },
  CL: { name: 'チリ (Chile)', flag: '🇨🇱', region: '🗽 北米・中南米', lat: -35.6751, lon: -71.5430, zoom: 4 },
  CO: { name: 'コロンビア (Colombia)', flag: '🇨🇴', region: '🗽 北米・中南米', lat: 4.5709, lon: -74.2973, zoom: 5 },
  CU: { name: 'キューバ (Cuba)', flag: '🇨🇺', region: '🗽 北米・中南米', lat: 21.5218, lon: -77.7812, zoom: 7 },
  JM: { name: 'ジャマイカ (Jamaica)', flag: '🇯🇲', region: '🗽 北米・中南米', lat: 18.1096, lon: -77.2975, zoom: 9 },
  CR: { name: 'コスタリカ (Costa Rica)', flag: '🇨🇷', region: '🗽 北米・中南米', lat: 9.7489, lon: -83.7534, zoom: 8 },
  PA: { name: 'パナマ (Panama)', flag: '🇵🇦', region: '🗽 北米・中南米', lat: 8.5380, lon: -80.7821, zoom: 8 },
  DO: { name: 'ドミニカ共和国 (Dominican Republic)', flag: '🇩🇴', region: '🗽 北米・中南米', lat: 18.7357, lon: -70.1627, zoom: 8 },
  GT: { name: 'グアテマラ (Guatemala)', flag: '🇬🇹', region: '🗽 北米・中南米', lat: 15.7835, lon: -90.2308, zoom: 8 },
  UY: { name: 'ウルグアイ (Uruguay)', flag: '🇺🇾', region: '🗽 北米・中南米', lat: -32.5228, lon: -55.7658, zoom: 7 },
  EC: { name: 'エクアドル (Ecuador)', flag: '🇪🇨', region: '🗽 北米・中南米', lat: -1.8312, lon: -78.1834, zoom: 6 },
  VE: { name: 'ベネズエラ (Venezuela)', flag: '🇻🇪', region: '🗽 北米・中南米', lat: 6.4238, lon: -66.5897, zoom: 5 },
  BO: { name: 'ボリビア (Bolivia)', flag: '🇧🇴', region: '🗽 北米・中南米', lat: -16.2902, lon: -63.5887, zoom: 5 },
  PY: { name: 'パラグアイ (Paraguay)', flag: '🇵🇾', region: '🗽 北米・中南米', lat: -23.4425, lon: -58.4438, zoom: 6 },
  HN: { name: 'ホンジュラス (Honduras)', flag: '🇭🇳', region: '🗽 北米・中南米', lat: 15.2, lon: -86.2, zoom: 7 },
  NI: { name: 'ニカラグア (Nicaragua)', flag: '🇳🇮', region: '🗽 北米・中南米', lat: 12.8654, lon: -85.2072, zoom: 7 },
  SV: { name: 'エルサルバドル (El Salvador)', flag: '🇸🇻', region: '🗽 北米・中南米', lat: 13.7942, lon: -88.8965, zoom: 8 },
  BS: { name: 'バハマ (Bahamas)', flag: '🇧🇸', region: '🗽 北米・中南米', lat: 25.0343, lon: -77.3963, zoom: 7 },
  BB: { name: 'バルバドス (Barbados)', flag: '🇧🇧', region: '🗽 北米・中南米', lat: 13.1939, lon: -59.5432, zoom: 11 },
  BZ: { name: 'ベリーズ (Belize)', flag: '🇧🇿', region: '🗽 北米・中南米', lat: 17.1899, lon: -88.4976, zoom: 8 },
  HT: { name: 'ハイチ (Haiti)', flag: '🇭🇹', region: '🗽 北米・中南米', lat: 18.9712, lon: -72.2852, zoom: 8 },
  PR: { name: 'プエルトリコ (Puerto Rico)', flag: '🇵🇷', region: '🗽 北米・中南米', lat: 18.2208, lon: -66.5901, zoom: 9 },
  TT: { name: 'トリニダード・トバゴ (Trinidad and Tobago)', flag: '🇹🇹', region: '🗽 北米・中南米', lat: 10.6918, lon: -61.2225, zoom: 9 },
  SR: { name: 'スリナム (Suriname)', flag: '🇸🇷', region: '🗽 北米・中南米', lat: 3.9193, lon: -56.0278, zoom: 7 },
  GY: { name: 'ガイアナ (Guyana)', flag: '🇬🇾', region: '🗽 北米・中南米', lat: 4.8604, lon: -58.9302, zoom: 6 },

  AU: { name: 'オーストラリア (Australia)', flag: '🇦🇺', region: '🦘 オセアニア', lat: -25.2744, lon: 133.7751, zoom: 4 },
  NZ: { name: 'ニュージーランド (New Zealand)', flag: '🇳🇿', region: '🦘 オセアニア', lat: -40.9006, lon: 174.8860, zoom: 5 },
  FJ: { name: 'フィジー (Fiji)', flag: '🇫🇯', region: '🦘 オセアニア', lat: -17.7134, lon: 178.0650, zoom: 8 },
  PG: { name: 'パプアニューギニア (Papua New Guinea)', flag: '🇵🇬', region: '🦘 オセアニア', lat: -6.3149, lon: 143.9555, zoom: 6 },
  VU: { name: 'ヴァヌアツ (Vanuatu)', flag: '🇻🇺', region: '🦘 オセアニア', lat: -15.3767, lon: 166.9592, zoom: 7 },
  WS: { name: 'サモア (Samoa)', flag: '🇼🇸', region: '🦘 オセアニア', lat: -13.7590, lon: -172.1046, zoom: 9 },
  TO: { name: 'トンガ (Tonga)', flag: '🇹🇴', region: '🦘 オセアニア', lat: -21.1789, lon: -175.1982, zoom: 9 },
  SB: { name: 'ソロモン諸島 (Solomon Islands)', flag: '🇸🇧', region: '🦘 オセアニア', lat: -9.6457, lon: 160.1562, zoom: 7 },
  NC: { name: 'ニューカレドニア (New Caledonia)', flag: '🇳🇨', region: '🦘 オセアニア', lat: -20.9043, lon: 165.6180, zoom: 7 },
  PF: { name: 'タヒチ / フランス領ポリネシア (French Polynesia)', flag: '🇵🇫', region: '🦘 オセアニア', lat: -17.6797, lon: -149.4068, zoom: 7 },
  KI: { name: 'キリバス (Kiribati)', flag: '🇰🇮', region: '🦘 オセアニア', lat: -3.3704, lon: -168.7340, zoom: 6 },
  FM: { name: 'ミクロネシア (Micronesia)', flag: '🇫🇲', region: '🦘 オセアニア', lat: 7.4256, lon: 150.5508, zoom: 8 },
  PW: { name: 'パラオ (Palau)', flag: '🇵🇼', region: '🦘 オセアニア', lat: 7.5150, lon: 134.5825, zoom: 9 },
  MH: { name: 'マーシャル諸島 (Marshall Islands)', flag: '🇲🇭', region: '🦘 オセアニア', lat: 7.1315, lon: 171.1845, zoom: 8 },
  TV: { name: 'ツバル (Tuvalu)', flag: '🇹🇻', region: '🦘 オセアニア', lat: -7.1095, lon: 177.6493, zoom: 11 },
  NR: { name: 'ナウル (Nauru)', flag: '🇳🇷', region: '🦘 オセアニア', lat: -0.5228, lon: 166.9315, zoom: 13 },
  GU: { name: 'グアム (Guam)', flag: '🇬🇺', region: '🦘 オセアニア', lat: 13.4443, lon: 144.7937, zoom: 10 },
  AS: { name: 'アメリカ領サモア (American Samoa)', flag: '🇦🇸', region: '🦘 オセアニア', lat: -14.2710, lon: -170.1322, zoom: 10 },

  EG: { name: 'エジプト (Egypt)', flag: '🇪🇬', region: '🦁 アフリカ', lat: 26.8206, lon: 30.8025, zoom: 6 },
  ZA: { name: '南アフリカ (South Africa)', flag: '🇿🇦', region: '🦁 アフリカ', lat: -30.5595, lon: 22.9375, zoom: 5 },
  MA: { name: 'モロッコ (Morocco)', flag: '🇲🇦', region: '🦁 アフリカ', lat: 31.7917, lon: -7.0926, zoom: 6 },
  KE: { name: 'ケニア (Kenya)', flag: '🇰🇪', region: '🦁 アフリカ', lat: -0.0236, lon: 37.9062, zoom: 6 },
  TZ: { name: 'タンザニア (Tanzania)', flag: '🇹🇿', region: '🦁 アフリカ', lat: -6.3690, lon: 34.8888, zoom: 6 },
  NG: { name: 'ナイジェリア (Nigeria)', flag: '🇳🇬', region: '🦁 アフリカ', lat: 9.0820, lon: 8.6753, zoom: 6 },
  GH: { name: 'ガーナ (Ghana)', flag: '🇬🇭', region: '🦁 アフリカ', lat: 7.9465, lon: -1.0232, zoom: 7 },
  ET: { name: 'エチオピア (Ethiopia)', flag: '🇪🇹', region: '🦁 アフリカ', lat: 9.1450, lon: 40.4897, zoom: 6 },
  SN: { name: 'セネガル (Senegal)', flag: '🇸🇳', region: '🦁 アフリカ', lat: 14.4974, lon: -14.4524, zoom: 7 },
  MG: { name: 'マダガスカル (Madagascar)', flag: '🇲🇬', region: '🦁 アフリカ', lat: -18.7669, lon: 46.8691, zoom: 6 },
  MU: { name: 'モーリシャス (Mauritius)', flag: '🇲🇺', region: '🦁 アフリカ', lat: -20.3484, lon: 57.5522, zoom: 9 },
  SC: { name: 'セーシェル (Seychelles)', flag: '🇸🇨', region: '🦁 アフリカ', lat: -4.6796, lon: 55.4920, zoom: 10 },
  TN: { name: 'チュニジア (Tunisia)', flag: '🇹🇳', region: '🦁 アフリカ', lat: 33.8869, lon: 9.5375, zoom: 6 },
  DZ: { name: 'アルジェリア (Algeria)', flag: '🇩🇿', region: '🦁 アフリカ', lat: 28.0339, lon: 1.6596, zoom: 5 },
  UG: { name: 'ウガンダ (Uganda)', flag: '🇺🇬', region: '🦁 アフリカ', lat: 1.3733, lon: 32.2903, zoom: 7 },
  RW: { name: 'ルワンダ (Rwanda)', flag: '🇷🇼', region: '🦁 アフリカ', lat: -1.9403, lon: 29.8739, zoom: 8 },
  ZW: { name: 'ジンバブエ (Zimbabwe)', flag: '🇿🇼', region: '🦁 アフリカ', lat: -19.0154, lon: 29.1549, zoom: 6 },
  BW: { name: 'ボツワナ (Botswana)', flag: '🇧🇼', region: '🦁 アフリカ', lat: -22.3285, lon: 24.6849, zoom: 6 },
  NA: { name: 'ナミビア (Namibia)', flag: '🇳🇦', region: '🦁 アフリカ', lat: -22.9576, lon: 18.4904, zoom: 6 },
  CV: { name: 'カーボベルデ (Cape Verde)', flag: '🇨🇻', region: '🦁 アフリカ', lat: 16.5388, lon: -23.0418, zoom: 8 },
  CD: { name: 'カメルーン (Cameroon)', flag: '🇨🇲', region: '🦁 アフリカ', lat: 3.8480, lon: 11.5021, zoom: 6 },
  CI: { name: 'コートジボワール (Ivory Coast)', flag: '🇨🇮', region: '🦁 アフリカ', lat: 7.5400, lon: -5.5471, zoom: 6 },
  ZM: { name: 'ザンビア (Zambia)', flag: '🇿🇲', region: '🦁 アフリカ', lat: -13.1339, lon: 27.8493, zoom: 6 },
  MZ: { name: 'モザンビーク (Mozambique)', flag: '🇲🇿', region: '🦁 アフリカ', lat: -18.6657, lon: 35.5296, zoom: 6 },
  AO: { name: 'アンゴラ (Angola)', flag: '🇦🇴', region: '🦁 アフリカ', lat: -11.2027, lon: 17.8739, zoom: 6 },
  MU_2: { name: 'モーリタニア (Mauritania)', flag: '🇲🇷', region: '🦁 アフリカ', lat: 21.0079, lon: -10.9408, zoom: 6 }
};
