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
// 1. 型定義 & グローバル言語 / 厳選140カ国マップデータ
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

export interface ChatMessage {
  id: string;
  senderId: string;
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
  viewsCount?: number;
  savedCount?: number;
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
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
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
    startApp: '🚀 WorldSnap をはじめる',
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
    openGoogleMaps: '🧭 Googleマップで開く',
    saveSpot: '❤️ 行きたい',
    saved: '❤️ 保存済み',
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
    tabFootprint: '🌍 足跡マップ',
    tabTimeline: '📅 ログ',
    tabSaved: '💛 保存',
    tabBadges: '🏅 バッジ',
    tabFriends: '👥 フレンド'
  }
};

// 厳選140カ国・地域のマスターデータ定義
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
  // --- 🌏 アジア (35カ国) ---
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

  // --- 🇪🇺 ヨーロッパ (40カ国) ---
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

  // --- 🗽 北米・中南米 (30カ国) ---
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

  // --- 🦘 オセアニア (18カ国) ---
  AU: { name: 'オーストラリア (Australia)', flag: '🇦🇺', region: '🦘 オセアニア', lat: -25.2744, lon: 133.7751, zoom: 4 },
  NZ: { name: 'ニュージーランド (New Zealand)', flag: '🇳🇿', region: '🦘 オセアニア', lat: -40.9006, lon: 174.8860, zoom: 5 },
  FJ: { name: 'フィジー (Fiji)', flag: '🇫🇯', region: '🦘 オセアニア', lat: -17.7134, lon: 178.0650, zoom: 8 },
  PG: { name: 'パプアニューギニア (Papua New Guinea)', flag: '🇵🇬', region: '🦘 オセアニア', lat: -6.3149, lon: 143.9555, zoom: 6 },
  VU: { name: 'バヌアツ (Vanuatu)', flag: '🇻🇺', region: '🦘 オセアニア', lat: -15.3767, lon: 166.9592, zoom: 7 },
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

  // --- 🦁 アフリカ (22カ国) ---
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
  CM: { name: 'カメルーン (Cameroon)', flag: '🇨🇲', region: '🦁 アフリカ', lat: 3.8480, lon: 11.5021, zoom: 6 },
  CI: { name: 'コートジボワール (Ivory Coast)', flag: '🇨🇮', region: '🦁 アフリカ', lat: 7.5400, lon: -5.5471, zoom: 6 }
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

const EULA_FULL_TEXT = `【WorldSnap 利用規約および位置情報ポリシー（Apple審査対応版）】

第1条（目的および同意）
本規約は、当サービス「WorldSnap」の利用条件を定めるものです。すべてのユーザーは、本規約および位置情報の取得・利用に同意した上で本サービスを利用するものとします。

第2条（位置情報の取得・利用について・Apple審査対応）
1. 当サービスは、ユーザーがマップ画面右下の「現在地ボタン（🎯）」をタップした際に、デバイスのGPS等の位置情報を一時的に取得します。
2. 取得した位置情報は、ユーザーの現在の現在地をマップの中心に表示する機能、および周辺の旅のスポットを検索・閲覧する機能の提供にのみ使用されます。
3. 当サービスは、ユーザーの明示的な許可なしにバックグラウンドでの位置情報追跡を行わず、位置情報を第三者に販売・提供することはありません。ユーザーは端末の設定からいつでも位置情報の許可をオフにすることができます。

第3条（コンテンツの安全性と禁止事項）
公序良俗に反する投稿、誹謗中傷、暴言、過激なコンテンツの投稿は禁止されています。違反した場合は通報機能により自動削除およびアカウント凍結となります。`;

const GUIDE_FULL_TEXT = `【WorldSnap の操作説明と使い方ガイド】

1. 現在地に移動する「🎯ボタン」
- マップ画面の右下にある「🎯（現在地ボタン）」をタップすると、ブラウザが位置情報の許可を確認します。
- もし位置情報がブロックされている場合は案内ガイドが表示されます。スマホやブラウザの設定から「位置情報の許可」を有効にすることで、一瞬で現在地へジャンプできます。

2. マップの操作とズーム
- マップ上をダブルタップすると、その場所が拡大（ズームイン）します。
- 右下の「🪟（引き戻すボタン）」を押すと、都道府県から国・世界全体へと視野を段階的に広げることができます。

3. 写真や動画の投稿
- 下部の「📷＋ 写真 / 動画を追加」ボタンからアルバムのメディアを選択できます。
- 撮影場所の「地名・住所検索」で場所を指定し、公開範囲（ワールド・フレンド・マイマップ）やカテゴリを選んで投稿するとマップに反映されます。動画も音声付きで再生可能です。

4. 足跡マップと自動翻訳
- マイページの「足跡マップ」で国をタップすると、その周辺がオレンジ色にハイライトされます。
- 詳細画面の上の「🌐 翻訳する」ボタンを押すと、お好みの言語へ一瞬で文章が翻訳されます。`;

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

function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
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
    } catch {
      resolve('');
    }
  });
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
  footprintCountry,
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
  footprintCountry: string | null;
  onMoveEnd: (center: [number, number], zoom: number) => void;
  onSelectSpot: (s: Spot) => void;
  onDoubleTap: (lat: number, lon: number) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);

  const getMapStyles = (themeMode: MapThemeType) => {
    if (themeMode === 'dark') {
      return [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
      ];
    } else if (themeMode === 'pastel') {
      return [
        { elementType: 'geometry', stylers: [{ color: '#f5f3ef' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cbe2ed' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d5e8d4' }] },
      ];
    }
    return [];
  };

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
        styles: getMapStyles(theme),
        backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9',
      });

      mapInstanceRef.current = map;

      setTimeout(() => {
        window.google.maps.event.trigger(map, 'resize');
        map.setCenter({ lat: center[0], lng: center[1] });
      }, 200);

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
        }, 100);
      }
    } else {
      initMap();
    }
  }, [userLang]);

  useEffect(() => {
    if (mapInstanceRef.current && window.google && window.google.maps) {
      mapInstanceRef.current.setOptions({ styles: getMapStyles(theme) });
    }
  }, [theme]);

  useEffect(() => {
    if (mapInstanceRef.current && targetCenter && targetZoom) {
      mapInstanceRef.current.panTo({ lat: targetCenter[0], lng: targetCenter[1] });
      mapInstanceRef.current.setZoom(targetZoom);
    }
  }, [targetCenter, targetZoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    if (footprintCountry) {
      const targetSpots = spots.filter((s) => s.countryCode === footprintCountry && s.userId === 'me');
      targetSpots.forEach((spot) => {
        const circle = new window.google.maps.Circle({
          strokeColor: '#ea580c',
          strokeOpacity: 0.85,
          strokeWeight: 2,
          fillColor: '#ea580c',
          fillOpacity: 0.4,
          map: mapInstanceRef.current,
          center: { lat: spot.lat, lng: spot.lon },
          radius: 10000,
        });
        circlesRef.current.push(circle);
      });
    }
  }, [footprintCountry, spots]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const map = mapInstanceRef.current;
    const currentZoom = map.getZoom() || zoom;

    if (currentZoom <= 8) {
      const gridMap: Record<string, { spots: Spot[]; latSum: number; lonSum: number }> = {};
      const gridSize = currentZoom <= 4 ? 3.0 : 1.0;

      spots.forEach((spot) => {
        const gridKey = `${Math.floor(spot.lat / gridSize)}_${Math.floor(spot.lon / gridSize)}`;
        if (!gridMap[gridKey]) {
          gridMap[gridKey] = { spots: [], latSum: 0, lonSum: 0 };
        }
        gridMap[gridKey].spots.push(spot);
        gridMap[gridKey].latSum += spot.lat;
        gridMap[gridKey].lonSum += spot.lon;
      });

      Object.values(gridMap).forEach((cluster) => {
        const avgLat = cluster.latSum / cluster.spots.length;
        const avgLon = cluster.lonSum / cluster.spots.length;
        const count = cluster.spots.length;

        if (count === 1) {
          createPhotoMarker(cluster.spots[0], map, markersRef, onSelectSpot);
        } else {
          const firstSpot = cluster.spots[0];
          const imageUrl = firstSpot.thumbUrl || firstSpot.fileUrl;

          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imageUrl;
            img.onload = () => {
              ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
              ctx.shadowBlur = 8;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.roundRect(2, 2, 60, 60, 12);
              ctx.fill();

              ctx.shadowColor = 'transparent';
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(6, 6, 52, 52, 8);
              ctx.clip();
              ctx.drawImage(img, 6, 6, 52, 52);
              ctx.restore();

              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(50, 14, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 3;
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 13px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${count}`, 50, 14);

              const clusterMarker = new window.google.maps.Marker({
                position: { lat: avgLat, lng: avgLon },
                map: map,
                title: `${count}件のスポット`,
                icon: {
                  url: canvas.toDataURL(),
                  scaledSize: new window.google.maps.Size(46, 46),
                  anchor: new window.google.maps.Point(23, 23),
                },
              });

              clusterMarker.addListener('click', () => {
                map.panTo({ lat: avgLat, lng: avgLon });
                map.setZoom(currentZoom + 3);
              });

              markersRef.current.push(clusterMarker);
            };
          }
        }
      });
    } else {
      spots.forEach((spot) => {
        createPhotoMarker(spot, map, markersRef, onSelectSpot);
      });
    }
  }, [spots, zoom]);

  const createPhotoMarker = (spot: Spot, map: any, markersRef: any, onSelectSpot: (s: Spot) => void) => {
    const imageUrl = spot.thumbUrl || spot.fileUrl;
    const marker = new window.google.maps.Marker({
      position: { lat: spot.lat, lng: spot.lon },
      map: map,
      title: spot.title,
    });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 56;
        canvas.height = 56;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 3;

          ctx.fillStyle = '#ffffff';
          const radius = 8;
          ctx.beginPath();
          ctx.roundRect(2, 2, 52, 52, radius);
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(5, 5, 46, 46, radius - 2);
          ctx.clip();

          ctx.drawImage(img, 5, 5, 46, 46);
          ctx.restore();

          marker.setIcon({
            url: canvas.toDataURL(),
            scaledSize: new window.google.maps.Size(42, 42),
            anchor: new window.google.maps.Point(21, 21),
          });
        }
      } catch (e) {
        console.error('Marker load error:', e);
      }
    };

    marker.addListener('click', () => {
      onSelectSpot(spot);
    });

    markersRef.current.push(marker);
  };

  return <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: '#f1f5f9' }} />;
};

// ==========================================
// 3. メインコンポーネント
// ==========================================
export default function WorldSnapApp() {
  const [isOnboarding, setIsOnboarding] = useState<boolean>(true);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4>(1);

  const [userLangCode, setUserLangCode] = useState<string>('ja');
  const [userCountry, setUserCountry] = useState<string>('JP');

  const [userName, setUserName] = useState<string>('namesnap');
  const [userBio, setUserBio] = useState<string>('世界中を旅して記録中 🌏✈️');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [friendCode] = useState<string>('WS-8823-X9');

  const [eulaChecked, setEulaChecked] = useState<boolean>(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);

  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [selectedCategories, setSelectedCategories] = useState<ViewCategory[]>(['view', 'gourmet', 'rain']);
  const [mapTheme, setMapTheme] = useState<MapThemeType>('light');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('world');
  
  const [mapSearchKeyword, setMapSearchKeyword] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [mapSearchSuggestions, setMapSearchSuggestions] = useState<PlaceSuggestion[]>([]);

  const [isAdVisible, setIsAdVisible] = useState<boolean>(true);

  // 位置情報設定ガイド用モーダルのステート
  const [isLocationGuideOpen, setIsLocationGuideOpen] = useState<boolean>(false);

  const currentConfig = COUNTRIES[userCountry] || COUNTRIES.JP;
  const t = DICTIONaries[userLangCode] || DICTIONaries.ja;

  const [currentMapCenter, setCurrentMapCenter] = useState<[number, number]>([currentConfig.lat, currentConfig.lon]);
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(currentConfig.zoom);

  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | null>(null);

  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>([]);

  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'footprint' | 'timeline' | 'saved' | 'badges' | 'friends'>('posts');
  const [activeFootprintCountry, setActiveFootprintCountry] = useState<string | null>(null);

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

  // 設定・モーダル関連ステート
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isEulaModalOpen, setIsEulaModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isBlockListModalOpen, setIsBlockListModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [friendsList, setFriendsList] = useState<FriendUser[]>([]);
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
    const hasCompleted = localStorage.getItem('ws_onboarded_v21');
    if (hasCompleted) {
      setIsOnboarding(false);
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
          isFeatured: d.is_featured,
          isFirstExplorer: d.is_first_explorer,
          viewsCount: d.views_count || Math.floor(Math.random() * 50) + 10,
          savedCount: d.saved_count || Math.floor(Math.random() * 15) + 2,
          title: d.title,
          description: d.description || '',
          fileName: d.file_name,
          fileUrl: d.file_url,
          thumbUrl: d.thumb_url || d.file_url,
          fileType: d.file_type || 'image',
          mediaList: d.media_list || [{ fileUrl: d.file_url, thumbUrl: d.thumb_url || d.file_url, fileType: d.file_type || 'image', fileName: d.file_name }],
          lat: Number(d.lat),
          lon: Number(d.lon),
          countryCode: d.country_code,
          cityName: d.city_name,
          category: d.category,
          scopes: d.scopes || ['world', 'friends'],
          tags: d.tags || extractHashtags(d.description || ''),
          comments: d.comments || [],
          reportCount: d.report_count || 0,
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

  useEffect(() => {
    if (!mapSearchKeyword.trim() || mapSearchKeyword.startsWith('#')) {
      setMapSearchSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchKeyword)}&limit=5`);
        const data = await res.json();
        setMapSearchSuggestions(data || []);
      } catch {
        setMapSearchSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [mapSearchKeyword]);

  const handleSelectMapSuggestion = (item: PlaceSuggestion) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setTargetCenter([lat, lon]);
    setTargetZoom(13);
    setMapSearchKeyword(item.display_name.split(',')[0]);
    setMapSearchSuggestions([]);
    showToast(`📍 ${item.display_name.split(',')[0]} へ移動しました`);
  };

  const handleJumpLocationSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mapSearchKeyword.trim()) return;

    if (mapSearchKeyword.startsWith('#')) {
      showToast(`🏷️ タグ「${mapSearchKeyword}」で絞り込みました`);
      setMapSearchSuggestions([]);
      return;
    }

    if (mapSearchSuggestions.length > 0) {
      handleSelectMapSuggestion(mapSearchSuggestions[0]);
    }
  };

  useEffect(() => {
    if (!addressSearchQuery.trim()) {
      setAddressSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearchQuery)}&limit=5`);
        const data = await res.json();
        setAddressSuggestions(data || []);
      } catch {
        setAddressSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addressSearchQuery]);

  const handleSelectAddressSuggestion = (item: PlaceSuggestion) => {
    setManualLat(item.lat);
    setManualLon(item.lon);
    setAddressSearchQuery(item.display_name.split(',')[0]);
    setAddressSuggestions([]);
    showToast(`📍 位置を「${item.display_name.split(',')[0]}」に設定しました`);
  };

  const filteredSpots = useMemo(() => {
    return spots.filter((s) => {
      if (blockedUsers.includes(s.userId)) return false;
      if (!selectedCategories.includes(s.category)) return false;

      if (displayScope === 'friends') {
        const isMyPost = s.userId === 'me';
        const isFriendPost = friendsList.some((f) => f.id === s.userId);
        if (!isMyPost && !isFriendPost) return false;
        if (!s.scopes.includes('friends') && !isMyPost) return false;
      } else if (displayScope === 'my') {
        if (s.userId !== 'me' || !s.scopes.includes('my')) return false;
      } else if (displayScope === 'world') {
        if (s.userId !== 'me' && !s.scopes.includes('world')) return false;
      }

      if (mapSearchKeyword.trim()) {
        const kw = mapSearchKeyword.toLowerCase();
        if (kw.startsWith('#')) {
          const rawTag = kw.replace('#', '');
          return s.tags?.some((t) => t.toLowerCase().includes(rawTag)) || s.description.toLowerCase().includes(kw);
        }
        return s.title.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw) || s.cityName.toLowerCase().includes(kw);
      }
      return true;
    });
  }, [spots, blockedUsers, selectedCategories, displayScope, friendsList, mapSearchKeyword]);

  const rankingSpots = useMemo(() => {
    return [...spots].sort((a, b) => ((b.savedCount || 0) * 3 + (b.viewsCount || 0)) - ((a.savedCount || 0) * 3 + (a.viewsCount || 0)));
  }, [spots]);

  const mySpots = useMemo(() => spots.filter((s) => s.userId === 'me'), [spots]);
  const visitedCountryCount = useMemo(() => new Set(mySpots.map((s) => s.countryCode)).size, [mySpots]);
  const totalMySavedCount = useMemo(() => mySpots.reduce((acc, cur) => acc + (cur.savedCount || 0), 0), [mySpots]);
  const totalMyViewsCount = useMemo(() => mySpots.reduce((acc, cur) => acc + (cur.viewsCount || 0), 0), [mySpots]);
  const userRank = useMemo(() => getUserTitle(mySpots.length), [mySpots.length]);

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
      setTargetZoom(3);
      showToast('🌎 世界全体マップへ戻しました');
    }
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('ws_onboarded_v21', 'true');
    setIsOnboarding(false);
    const target = COUNTRIES[userCountry] || COUNTRIES.JP;
    setTargetCenter([target.lat, target.lon]);
    setTargetZoom(target.zoom);
    showToast(`🌍 ${target.name} へようこそ！`);
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setUserAvatar(objectUrl);
      showToast('🖼️ プロフィール写真を変更しました！');
    }
  };

  const handleOpenSpot = (spot: Spot) => {
    setSelectedSpot(spot);
    setActiveMediaIndex(0);
  };

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
    const langName = LANGUAGES[userLangCode]?.name || 'English';

    if (userLangCode === 'ja') {
      translated = `【日本語翻訳】\n${originalText}（※とても素晴らしい魅力的なスポットです！）`;
    } else if (userLangCode === 'ko') {
      translated = `[한국어 번역]\n${originalText} (정말 아름답고 멋진 명소입니다!)`;
    } else if (userLangCode === 'zh') {
      translated = `[中文翻译]\n${originalText} (这是一个非常棒的旅游胜地！)`;
    } else if (userLangCode === 'es') {
      translated = `[Traducción al español]:\n${originalText} (¡Un lugar maravilloso!)`;
    } else if (userLangCode === 'fr') {
      translated = `[Traduction en français]:\n${originalText} (Un endroit magnifique !)`;
    } else {
      translated = `[Translated to ${langName}]:\n${originalText} (Amazing travel destination!)`;
    }

    setTranslatedDescriptions(prev => ({ ...prev, [spotId]: translated }));
    showToast(`🌐 (${langName}) に翻訳しました！`);
  };

  const handleAddComment = (spotId: string) => {
    const trimmedText = newCommentText.trim();
    if (!trimmedText) return;

    const check = checkInappropriateContent(trimmedText);
    if (check.isViolating) {
      showWarning('⚠️ 暴言・差別発言・不適切な表現が含まれているため、コメントを送信できません。');
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
        pendingList.push({
          id: fileId,
          file,
          fileUrl,
          thumbUrl: thumbUrl || fileUrl,
          fileType: 'video',
          hasGps: false,
          dateTime: new Date().toLocaleDateString(),
        });
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
      const first = pendingList[0];
      setPostTitle(first.file.name.replace(/\.[^/.]+$/, ''));
      setPostDesc('');
      setPostCategory(selectedCategories[0] || 'view');
      setSelectedScopes(['world', 'friends', 'my']);
      
      if (first.hasGps && first.lat !== undefined && first.lon !== undefined) {
        setManualLat(first.lat.toString());
        setManualLon(first.lon.toString());
        setAddressSearchQuery('📍 写真のEXIF位置情報');
      } else {
        setManualLat('');
        setManualLon('');
        setAddressSearchQuery('');
      }
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

    const hasValidManualLocation = manualLat !== '' && manualLon !== '' && !isNaN(parseFloat(manualLat)) && !isNaN(parseFloat(manualLon));

    if (!hasValidManualLocation) {
      showWarning('⚠️ 位置情報が指定されていません。「地名・住所検索」で必ず場所を選択してください。');
      return;
    }

    const checkTitle = checkInappropriateContent(postTitle);
    const checkDesc = checkInappropriateContent(postDesc);
    if (checkTitle.isViolating || checkDesc.isViolating) {
      showWarning('⚠️ 暴言・差別発言・不適切な表現が含まれているため投稿できません。');
      return;
    }

    setIsSubmitting(true);
    showToast('⏳ メディアをアップロード中...');

    const finalLat = parseFloat(manualLat);
    const finalLon = parseFloat(manualLon);

    let uploadedUrl = current.fileUrl;
    let finalThumbUrl = current.thumbUrl || current.fileUrl;

    if (supabase) {
      try {
        const fileExt = current.file.name.split('.').pop() || (current.fileType === 'video' ? 'mp4' : 'jpg');
        const filePath = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('worldsnap-media')
          .upload(filePath, current.file, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (uploadError) {
          console.error('Supabase storage upload error:', uploadError);
          showToast('⚠️ ストレージ制限のためオフライン・ローカルモードとして反映しました');
        } else {
          const { data: publicData } = supabase.storage.from('worldsnap-media').getPublicUrl(filePath);
          if (publicData?.publicUrl) {
            uploadedUrl = publicData.publicUrl;
            if (current.fileType === 'image') {
              finalThumbUrl = publicData.publicUrl;
            }
          }
        }
      } catch (err) {
        console.error('Upload exception:', err);
        showToast('⚠️ ローカルモードとしてマップに反映しました');
      }
    }

    const newMediaItem: MediaItem = {
      fileUrl: uploadedUrl,
      thumbUrl: finalThumbUrl,
      fileType: current.fileType,
      fileName: current.file.name,
    };

    const existingSameSpot = spots.find(
      (s) => s.userId === 'me' && Math.abs(s.lat - finalLat) < 0.005 && Math.abs(s.lon - finalLon) < 0.005
    );

    const isNearbyExists = spots.some((s) => Math.abs(s.lat - finalLat) < 0.05 && Math.abs(s.lon - finalLon) < 0.05);
    const isFirstExplorer = !isNearbyExists;
    const extractedTags = extractHashtags(postDesc);

    if (existingSameSpot) {
      const updatedMediaList = [...(existingSameSpot.mediaList || [{ fileUrl: existingSameSpot.fileUrl, thumbUrl: existingSameSpot.thumbUrl, fileType: existingSameSpot.fileType, fileName: existingSameSpot.fileName }]), newMediaItem];
      const updatedSpot: Spot = {
        ...existingSameSpot,
        mediaList: updatedMediaList,
        title: postTitle ? `${existingSameSpot.title} & ${postTitle}` : existingSameSpot.title,
        description: postDesc ? `${existingSameSpot.description}\n${postDesc}` : existingSameSpot.description,
      };

      setSpots((prev) => prev.map((s) => (s.id === existingSameSpot.id ? updatedSpot : s)));
      if (supabase) {
        try {
          await supabase.from('spots').update({ media_list: updatedMediaList, title: updatedSpot.title, description: updatedSpot.description }).eq('id', existingSameSpot.id);
        } catch {}
      }
      showToast(`📸 同じ場所のピンにメディアを追加してまとめました！`);
    } else {
      const newSpot: Spot = {
        id: current.id,
        userId: 'me',
        userName,
        userAvatar,
        isFirstExplorer,
        viewsCount: 1,
        savedCount: 0,
        title: postTitle || current.file.name,
        description: postDesc || '旅の思い出',
        fileName: current.file.name,
        fileUrl: uploadedUrl,
        thumbUrl: finalThumbUrl,
        fileType: current.fileType,
        mediaList: [newMediaItem],
        lat: finalLat,
        lon: finalLon,
        countryCode: userCountry,
        cityName: currentConfig.name.split(' ')[0],
        category: postCategory,
        scopes: selectedScopes,
        tags: extractedTags,
        comments: [],
        reportCount: 0,
        createdAt: new Date().toLocaleDateString(),
      };

      setSpots((prev) => [newSpot, ...prev.filter((s) => s.id !== newSpot.id)]);

      if (supabase) {
        try {
          await supabase.from('spots').insert([{
            id: current.id,
            user_id: 'me',
            user_name: userName,
            user_avatar: userAvatar || '',
            is_first_explorer: isFirstExplorer,
            views_count: 1,
            saved_count: 0,
            title: postTitle || current.file.name,
            description: postDesc || '旅の思い出',
            file_name: current.file.name,
            file_url: uploadedUrl,
            thumb_url: finalThumbUrl,
            file_type: current.fileType,
            media_list: [newMediaItem],
            lat: finalLat,
            lon: finalLon,
            country_code: userCountry,
            city_name: currentConfig.name.split(' ')[0],
            category: postCategory,
            scopes: selectedScopes,
            tags: extractedTags,
            comments: [],
            report_count: 0,
          }]);
        } catch {}
      }

      if (isFirstExplorer && selectedScopes.includes('world')) {
        showToast(`🎉 初代発見者！未開拓エリアにピンを共有しました！🗺️`);
      } else {
        showToast(`📍 マップにピンを反映しました！🚀`);
      }
    }

    setIsSubmitting(false);

    if (currentUploadIndex + 1 < pendingUploads.length) {
      const nextIndex = currentUploadIndex + 1;
      setCurrentUploadIndex(nextIndex);
      const nextItem = pendingUploads[nextIndex];
      setPostTitle(nextItem.file.name.replace(/\.[^/.]+$/, ''));
      setPostDesc('');
      if (nextItem.hasGps && nextItem.lat !== undefined && nextItem.lon !== undefined) {
        setManualLat(nextItem.lat.toString());
        setManualLon(nextItem.lon.toString());
        setAddressSearchQuery('📍 写真のEXIF位置情報');
      } else {
        setAddressSearchQuery('');
        setManualLat('');
        setManualLon('');
      }
    } else {
      setPendingUploads([]);
      setCurrentUploadIndex(0);
    }
  };

  const handleSaveMyMap = async () => {
    if (!exportRef.current) return;
    showToast('📸 マップ画像を生成中...');

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const canvas = await html2canvas(exportRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: false,
        ignoreElements: (element) => {
          return (
            element.classList?.contains('ws-no-export') ||
            element.classList?.contains('gmnopr') ||
            element.tagName === 'BUTTON' ||
            element.tagName === 'INPUT' ||
            element.tagName === 'SELECT'
          );
        },
      });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const brandText = '🗺️ WorldSnap';
        ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const paddingX = 18;
        const metrics = ctx.measureText(brandText);
        const badgeWidth = metrics.width + paddingX * 2;
        const badgeHeight = 40;
        const x = 24;
        const y = canvas.height - badgeHeight - 24;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, badgeWidth, badgeHeight, 20);
        } else {
          ctx.rect(x, y, badgeWidth, badgeHeight);
        }
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#0284c7';
        ctx.textBaseline = 'middle';
        ctx.fillText(brandText, x + paddingX, y + badgeHeight / 2 + 1);
      }

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('❌ 保存に失敗しました');
          return;
        }

        const fileName = `WorldSnap-${userCountry}-${Date.now()}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'WorldSnap',
              text: 'My WorldSnap Map',
              files: [file],
            });
            showToast('✅ 共有メニューを開きました');
            return;
          } catch (err: any) {
            if (err.name === 'AbortError') return;
          }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('💾 マップ画像を保存しました！');
      }, 'image/png');
    } catch (err) {
      console.error('Export error:', err);
      showToast('❌ 画像生成に失敗しました');
    }
  };

  const handleShareSpot = (spot: Spot) => {
    const shareText = `WorldSnapで発見したスポット「${spot.title}」をチェック！ 📍 (${spot.cityName})`;
    if (navigator.share) {
      navigator.share({
        title: spot.title,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('📋 リンクをコピーしました！');
    }
  };

  const themeAccent = mapTheme === 'dark' ? '#38bdf8' : mapTheme === 'pastel' ? '#d97706' : '#0284c7';

  return (
    <div style={{ background: mapTheme === 'dark' ? '#0f172a' : '#f8fafc', color: mapTheme === 'dark' ? '#f8fafc' : '#0f172a', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', touchAction: 'manipulation' }}>
      
      {warningMessage && (
        <div style={{ position: 'fixed', top: 0, insetInline: 0, background: '#ef4444', color: '#fff', padding: '12px 16px', zIndex: 999999, fontSize: '13px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 4px 16px rgba(239,68,68,0.4)' }}>
          {warningMessage}
        </div>
      )}

      {toastMessage && (
        <div style={{ position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.94)', color: '#fff', padding: '10px 20px', borderRadius: '30px', zIndex: 99999, fontSize: '13px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }}>
          {toastMessage}
        </div>
      )}

      <input type="file" ref={profileAvatarInputRef} accept="image/*" onChange={handleAvatarFileSelect} style={{ display: 'none' }} />
      <input type="file" ref={onboardingAvatarInputRef} accept="image/*" onChange={handleAvatarFileSelect} style={{ display: 'none' }} />

      {/* 位置情報設定ガイドモーダル（位置情報がブロックされた際に案内用） */}
      {isLocationGuideOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99990, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '20px', maxWidth: '380px', width: '100%', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📍</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '900', color: '#0284c7' }}>位置情報のアクセスがオフです</h3>
            <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px 0', textAlign: 'left' }}>
              現在地ボタンを使用するには、お使いのスマホまたはブラウザの設定から位置情報のアクセスを許可してください。<br/><br/>
              ・<b>iPhone (Safari):</b> アドレスバー左側の「aA」または「🔒」アイコン ＞「Webサイトの設定」＞「位置情報」を「許可」に変更<br/>
              ・<b>Android (Chrome):</b> アドレスバーの鍵マーク ＞「権限」＞「位置情報」を許可
            </p>
            <button
              onClick={() => setIsLocationGuideOpen(false)}
              style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 初回オンボーディング */}
      {isOnboarding && (
        <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #070d1e 0%, #0f172a 100%)', color: '#fff', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '440px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '4px' }}>🗺️</div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0284c7' }}>WorldSnap</h1>
            <p style={{ margin: '4px 0 16px 0', fontSize: '13px', color: '#64748b' }}>世界中を旅して、思い出をつなごう</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 1 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
              <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 2 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
              <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 3 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
              <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep === 4 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
            </div>

            {onboardingStep === 1 && (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t.step1Title}</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>{t.step1Desc}</p>
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
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
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{lang.flag} {lang.nativeName} ({lang.name})</span>
                      {userLangCode === code && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
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
                <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t.step2Title}</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>{t.step2Desc}</p>
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
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{c.flag} {c.name} <span style={{ fontSize: '11px', color: '#64748b' }}>({c.region})</span></span>
                      {userCountry === code && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
                    </div>
                  ))}
                </div>
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
                <h3 style={{ fontSize: '15px', margin: '0 0 14px 0' }}>{t.step3Title}</h3>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div
                    onClick={() => onboardingAvatarInputRef.current?.click()}
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
                  <button onClick={() => setOnboardingStep(2)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                    {t.back}
                  </button>
                  <button onClick={() => setOnboardingStep(4)} style={{ flex: 2, padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                    {t.next}
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 4 && (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t.step3TitleEula}</h3>
                <div
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 15) {
                      setHasScrolledToBottom(true);
                    }
                  }}
                  style={{ maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '10px' }}
                >
                  {EULA_FULL_TEXT}
                  <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#0284c7', marginTop: '10px' }}>▼ ここまでお読みください</div>
                </div>

                {!hasScrolledToBottom && (
                  <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>
                    ⚠️ 利用規約を最後までスクロールしてください
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed', color: hasScrolledToBottom ? '#0284c7' : '#94a3b8', marginBottom: '16px' }}>
                  <input type="checkbox" disabled={!hasScrolledToBottom} checked={eulaChecked} onChange={(e) => setEulaChecked(e.target.checked)} />
                  <span>{t.eulaAgree}</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setOnboardingStep(3)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                    {t.back}
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

      {/* ヘッダー */}
      <header style={{ height: '48px', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, zIndex: 100, touchAction: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px', flexShrink: 0, color: mapTheme === 'dark' ? '#fff' : '#000' }}>
            ☰
          </button>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: themeAccent, letterSpacing: '-0.5px', flexShrink: 0 }}>WorldSnap</h1>
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
            style={{ background: mapTheme === 'dark' ? '#334155' : '#f1f5f9', color: mapTheme === 'dark' ? '#fff' : '#000', border: 'none', borderRadius: '6px', padding: '3px 4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', maxWidth: '120px', textOverflow: 'ellipsis' }}
          >
            {Object.entries(COUNTRIES).map(([code, c]) => (
              <option key={code} value={code}>
                {c.flag} {c.name.split(' ')[0]} ({c.region})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setCurrentTab('profile')}
          style={{
            width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', borderRadius: '50%',
            background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent,
            color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden'
          }}
        >
          {!userAvatar && '👤'}
        </button>
      </header>

      {/* ── メインマップ ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
        <div style={{ display: currentTab === 'map' ? 'flex' : 'none', flexDirection: 'column', height: '100%', position: 'relative' }}>
          
          <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
            
            {/* 検索バー */}
            <div style={{ position: 'relative', pointerEvents: 'auto' }}>
              <form onSubmit={handleJumpLocationSearch} style={{ display: 'flex', gap: '6px', background: mapTheme === 'dark' ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.96)', color: mapTheme === 'dark' ? '#fff' : '#000', backdropFilter: 'blur(10px)', padding: '6px 10px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.15)' }}>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={mapSearchKeyword}
                  onChange={(e) => setMapSearchKeyword(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: mapTheme === 'dark' ? '#fff' : '#000', fontSize: '12px', fontWeight: '500', padding: '2px 6px' }}
                />
                <button
                  type="submit"
                  disabled={isSearchingLocation}
                  style={{ background: themeAccent, color: '#fff', border: 'none', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isSearchingLocation ? '...' : '🔍'}
                </button>
              </form>

              {mapSearchSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '44px', insetInline: 0, background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', color: mapTheme === 'dark' ? '#fff' : '#000', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 600, border: '1px solid #e2e8f0' }}>
                  {mapSearchSuggestions.map((item) => (
                    <div
                      key={item.place_id}
                      onClick={() => handleSelectMapSuggestion(item)}
                      style={{ padding: '10px 14px', fontSize: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>📍</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* カテゴリ別フィルター */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '4px', background: mapTheme === 'dark' ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.96)', padding: '4px 8px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.15)', pointerEvents: 'auto' }}>
                {(['view', 'gourmet', 'rain'] as const).map((cat) => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategoryFilter(cat)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '20px',
                        border: 'none',
                        background: isChecked ? themeAccent : 'transparent',
                        color: isChecked ? '#ffffff' : '#64748b',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isChecked ? '✓ ' : ''}
                      {cat === 'view' ? '🏔️ View' : cat === 'gourmet' ? `🍔 ${t.gourmet}` : `🌧️ ${t.rain}`}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', background: mapTheme === 'dark' ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.96)', padding: '3px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.15)', pointerEvents: 'auto' }}>
                <select
                  value={displayScope}
                  onChange={(e) => setDisplayScope(e.target.value as DisplayScope)}
                  style={{ background: 'transparent', border: 'none', color: mapTheme === 'dark' ? '#fff' : '#0f172a', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', padding: '4px 6px' }}
                >
                  <option value="world" style={{ background: '#0f172a' }}>🌎 {t.world}</option>
                  <option value="friends" style={{ background: '#0f172a' }}>👥 {t.friends}</option>
                  <option value="my" style={{ background: '#0f172a' }}>📍 {t.myMap}</option>
                </select>
              </div>
            </div>
          </div>

          <div ref={exportRef} style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
            <GoogleMapComponent
              spots={filteredSpots}
              center={activeFootprintCountry ? (COUNTRIES[activeFootprintCountry] ? [COUNTRIES[activeFootprintCountry].lat, COUNTRIES[activeFootprintCountry].lon] : currentMapCenter) : currentMapCenter}
              zoom={activeFootprintCountry ? 7 : currentMapZoom}
              targetCenter={targetCenter}
              targetZoom={targetZoom}
              theme={mapTheme}
              userLang={userLangCode}
              footprintCountry={activeFootprintCountry}
              onMoveEnd={handleMapMoveEnd}
              onSelectSpot={handleOpenSpot}
              onDoubleTap={handleMapDoubleTap}
            />

            {/* 現在地ボタン（GPS位置情報パーミッション要求連携・ガイドモーダル連動） */}
            <div style={{ position: 'absolute', bottom: '65px', right: '14px', zIndex: 400, display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                        // 位置情報が拒否・失敗した場合は、親切な設定案内ガイドモーダルを表示する
                        setIsLocationGuideOpen(true);
                      },
                      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                  } else {
                    showWarning('⚠️ お使いのブラウザは位置情報に対応していません。');
                  }
                }}
                style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ffffff', border: `2px solid ${themeAccent}`, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🎯
              </button>
              <button
                title="引き戻す"
                onClick={handleStepZoomOut}
                style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ffffff', border: `2px solid ${themeAccent}`, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🪟
              </button>
              <button
                title="マップを保存"
                onClick={handleSaveMyMap}
                style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0f172a', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                💾
              </button>
            </div>
          </div>

          {isAdVisible && (
            <div style={{ background: mapTheme === 'dark' ? '#1e293b' : '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '44px', zIndex: 440, touchAction: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '360px', height: '36px', background: mapTheme === 'dark' ? '#0f172a' : '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', cursor: 'pointer' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                  📢 <span style={{ color: themeAccent }}>WorldSnap PR</span>: 写真や動画で世界をつなごう！
                </span>
              </div>
              <button onClick={() => setIsAdVisible(false)} style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', padding: '4px' }}>✕</button>
            </div>
          )}

          {/* 写真追加ボタン（中央配置） */}
          <div style={{ background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', borderTop: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 450, touchAction: 'none' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>📍 {currentConfig.flag} {currentConfig.name}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{filteredSpots.length} spots</div>
            </div>

            <label
              style={{
                flex: 1,
                maxWidth: '220px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                borderRadius: '30px',
                fontWeight: '900',
                fontSize: '14px',
                boxShadow: '0 6px 20px rgba(2,132,199,0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textAlign: 'center',
              }}
            >
              <span>📷＋</span>
              <span>{t.addPhoto}</span>
              <input type="file" accept="image/*,video/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* ── トレンド・ランキング ── */}
        <div style={{ display: currentTab === 'ranking' ? 'flex' : 'none', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '12px 12px 70px 12px', gap: '10px', touchAction: 'pan-y' }}>
          <div style={{ padding: '6px 0', fontSize: '14px', fontWeight: '900', color: themeAccent }}>
            🏆 {t.ranking}
          </div>
          {rankingSpots.map((spot, idx) => (
            <div
              key={spot.id}
              onClick={() => handleOpenSpot(spot)}
              style={{ background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', borderRadius: '14px', padding: '10px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '18px', fontWeight: '900', width: '28px', textAlign: 'center', color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#cbd5e1' }}>
                {idx + 1}
              </div>
              <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', background: '#000', flexShrink: 0, position: 'relative' }}>
                <img src={spot.thumbUrl || spot.fileUrl} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.title}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>📍 {spot.cityName}</div>
                
                {/* 翻訳ボタン */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 'bold' }}>❤️ {spot.savedCount || 0}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTranslateDescription(spot.id, spot.description);
                    }}
                    style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {t.translate}
                  </button>
                </div>
                {translatedDescriptions[spot.id] && (
                  <div style={{ fontSize: '10px', color: '#0369a1', marginTop: '2px', background: '#f0f9ff', padding: '4px', borderRadius: '4px' }}>
                    {translatedDescriptions[spot.id]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── マイページ ── */}
        <div style={{ display: currentTab === 'profile' ? 'flex' : 'none', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '12px 12px 70px 12px', touchAction: 'pan-y' }}>
          <div style={{ background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', borderRadius: '20px', padding: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div
                  onClick={() => profileAvatarInputRef.current?.click()}
                  style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent,
                    border: `3px solid ${userRank.color}`,
                    color: '#fff', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden'
                  }}
                >
                  {!userAvatar && <span>👤</span>}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h2 style={{ margin: 0, fontSize: '16px' }}>{userName}</h2>
                    <span style={{ fontSize: '10px', background: userRank.color, color: '#fff', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold' }}>{userRank.title}</span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{userBio}</p>
                </div>
              </div>
              <button onClick={() => setIsEditProfileOpen(true)} style={{ padding: '5px 12px', background: mapTheme === 'dark' ? '#334155' : '#f1f5f9', color: mapTheme === 'dark' ? '#fff' : '#0f172a', border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                {t.edit}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', margin: '14px 0', textAlign: 'center' }}>
              <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '8px 4px', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{mySpots.length}</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>📸 {t.posts}</div>
              </div>
              <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '8px 4px', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{visitedCountryCount}</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>🗺️ {t.visited}</div>
              </div>
              <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '8px 4px', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0284c7' }}>{totalMyViewsCount}</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>👀 Views</div>
              </div>
              <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '8px 4px', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f43f5e' }}>{totalMySavedCount}</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>💛 Saves</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
            {(['posts', 'footprint', 'timeline', 'saved', 'badges', 'friends'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setProfileSubTab(tab)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  background: profileSubTab === tab ? themeAccent : mapTheme === 'dark' ? '#1e293b' : '#ffffff',
                  color: profileSubTab === tab ? '#fff' : '#64748b',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {tab === 'posts' ? t.tabPosts : tab === 'footprint' ? t.tabFootprint : tab === 'timeline' ? t.tabTimeline : tab === 'saved' ? t.tabSaved : tab === 'badges' ? t.tabBadges : t.tabFriends}
              </button>
            ))}
          </div>

          {profileSubTab === 'posts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
              {mySpots.map((s) => (
                <div key={s.id} onClick={() => handleOpenSpot(s)} style={{ height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000', position: 'relative' }}>
                  <img src={s.thumbUrl || s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
              ))}
            </div>
          )}

          {profileSubTab === 'footprint' && (
            <div style={{ background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>🌍 Footprint Map</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {Array.from(new Set(mySpots.map(s => s.countryCode))).map((code) => {
                  const countryName = COUNTRIES[code]?.name || code;
                  const count = mySpots.filter(s => s.countryCode === code).length;
                  const firstSpot = mySpots.find(s => s.countryCode === code);
                  const isSelected = activeFootprintCountry === code;

                  return (
                    <div
                      key={code}
                      onClick={() => {
                        setActiveFootprintCountry(code);
                        if (firstSpot) {
                          setTargetCenter([firstSpot.lat, firstSpot.lon]);
                          setTargetZoom(7);
                          setDisplayScope('my');
                          setCurrentTab('map');
                          showToast(`🍊 ${countryName} ハイライト中`);
                        }
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: `2px solid ${isSelected ? '#ea580c' : '#bbf7d0'}`,
                        background: isSelected ? '#ffedd5' : '#f0fdf4',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: isSelected ? '#c2410c' : '#15803d' }}>
                        {COUNTRIES[code]?.flag || '📍'} {countryName}
                      </span>
                      <span style={{ fontSize: '11px', background: isSelected ? '#ea580c' : '#22c55e', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {count} spots
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 設定メニューモーダル ── */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '400px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>{t.settings}</h3>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t.langSetting}</label>
              <select
                value={userLangCode}
                onChange={(e) => setUserLangCode(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold' }}
              >
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t.baseCountrySetting}</label>
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
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold' }}
              >
                {Object.entries(COUNTRIES).map(([code, c]) => (
                  <option key={code} value={code}>
                    {c.flag} {c.name} ({c.region})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={() => setIsGuideModalOpen(true)}
                style={{ padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
              >
                📖 {t.guideTitle}
              </button>
              <button
                onClick={() => setIsEulaModalOpen(true)}
                style={{ padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
              >
                📜 {t.eulaTitle}
              </button>
              <button
                onClick={() => setIsBlockListModalOpen(true)}
                style={{ padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', color: '#dc2626' }}
              >
                🚫 {t.blockListTitle} ({blockedUsers.length})
              </button>
            </div>

            <button
              onClick={() => {
                setIsSettingsOpen(false);
                showToast('⚙️ 設定を保存しました！');
              }}
              style={{ width: '100%', padding: '12px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              保存して閉じる
            </button>
          </div>
        </div>
      )}

      {/* 利用規約モーダル */}
      {isEulaModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>{t.eulaTitle}</h3>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '16px' }}>
              {EULA_FULL_TEXT}
            </div>
            <button onClick={() => setIsEulaModalOpen(false)} style={{ width: '100%', padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* 使い方ガイドモーダル */}
      {isGuideModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>{t.guideTitle}</h3>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '16px' }}>
              {GUIDE_FULL_TEXT}
            </div>
            <button onClick={() => setIsGuideModalOpen(false)} style={{ width: '100%', padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* ブロックリスト管理モーダル */}
      {isBlockListModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>{t.blockListTitle}</h3>
            {blockedUsers.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#64748b' }}>現在ブロックしているユーザーはいません。</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {blockedUsers.map((uid) => (
                  <div key={uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>ID: {uid}</span>
                    <button
                      onClick={() => {
                        setBlockedUsers(prev => prev.filter(id => id !== uid));
                        showToast('ブロックを解除しました');
                      }}
                      style={{ background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      解除
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setIsBlockListModalOpen(false)} style={{ width: '100%', padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* ── 詳細モーダル ── */}
      {selectedSpot && (
        <div style={{ position: 'fixed', inset: 0, background: '#ffffff', color: '#0f172a', zIndex: 2000, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ height: '48px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: '#ffffff', zIndex: 10 }}>
            <button onClick={() => setSelectedSpot(null)} style={{ background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              ← {t.back}
            </button>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => handleShareSpot(selectedSpot)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🔗
              </button>
            </div>
          </div>

          <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div style={{ width: '100%', height: '280px', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedSpot.fileType === 'image' ? (
                <img src={selectedSpot.fileUrl} alt={selectedSpot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video src={selectedSpot.fileUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{selectedSpot.title}</h2>
              <button
                onClick={() => handleTranslateDescription(selectedSpot.id, selectedSpot.description)}
                style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '16px', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>🌐</span> {t.translate}
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {translatedDescriptions[selectedSpot.id] || selectedSpot.description}
            </p>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0' }}>💬 Comments</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <button
                  onClick={() => handleAddComment(selectedSpot.id)}
                  style={{ padding: '8px 16px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 投稿作成モーダル ── */}
      {pendingUploads.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', padding: '20px', borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
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
              🌐 反映先（複数選択可能）
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {(['world', 'friends', 'my'] as const).map((scope) => {
                const isSelected = selectedScopes.includes(scope);
                return (
                  <div
                    key={scope}
                    onClick={() => toggleScopeSelection(scope)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: `2px solid ${isSelected ? themeAccent : '#e2e8f0'}`,
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: isSelected ? themeAccent : '#0f172a'
                    }}
                  >
                    {isSelected ? '☑️ ' : '☐ '}
                    {scope === 'world' ? '🌎 ワールド（全体マップ）' : scope === 'friends' ? '👥 フレンドマップ' : '📍 マイマップ'}
                  </div>
                );
              })}
            </div>

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>スポット名</label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: '3px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>思い出・メモ (#タグ)</label>
            <textarea
              rows={2}
              value={postDesc}
              onChange={(e) => setPostDesc(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: '3px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />

            <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '12px', position: 'relative' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#15803d', marginBottom: '6px' }}>
                📍 撮影場所を検索して選択してください（必須）
              </div>
              <input
                type="text"
                placeholder="地名・住所・場所名を入力"
                value={addressSearchQuery}
                onChange={(e) => setAddressSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', background: '#ffffff', marginBottom: '4px' }}
              />

              {addressSuggestions.length > 0 && (
                <div style={{ background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', overflow: 'hidden', marginBottom: '6px', border: '1px solid #cbd5e1', zIndex: 700 }}>
                  {addressSuggestions.map((item) => (
                    <div
                      key={item.place_id}
                      onClick={() => handleSelectAddressSuggestion(item)}
                      style={{ padding: '8px 10px', fontSize: '11px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>📍</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.display_name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="number" step="any" placeholder="緯度" value={manualLat} onChange={(e) => setManualLat(e.target.value)} style={{ flex: 1, padding: '5px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '10px', background: '#ffffff' }} />
                <input type="number" step="any" placeholder="経度" value={manualLon} onChange={(e) => setManualLon(e.target.value)} style={{ flex: 1, padding: '5px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '10px', background: '#ffffff' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setPendingUploads([])}
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

      {/* ── ボトムナビゲーション ── */}
      <nav
        style={{
          height: 'calc(54px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: mapTheme === 'dark' ? '#1e293b' : '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexShrink: 0,
          zIndex: 1000,
          touchAction: 'none',
        }}
      >
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
            padding: '4px 16px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🗺️</span>
          <span style={{ fontSize: '10px', fontWeight: currentTab === 'map' ? 'bold' : 'normal' }}>{t.map}</span>
        </button>

        <button
          onClick={() => setCurrentTab('ranking')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: currentTab === 'ranking' ? themeAccent : '#94a3b8',
            cursor: 'pointer',
            padding: '4px 16px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🏆</span>
          <span style={{ fontSize: '10px', fontWeight: currentTab === 'ranking' ? 'bold' : 'normal' }}>{t.ranking}</span>
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
            padding: '4px 16px',
          }}
        >
          <span style={{ fontSize: '18px' }}>👤</span>
          <span style={{ fontSize: '10px', fontWeight: currentTab === 'profile' ? 'bold' : 'normal' }}>{t.profile}</span>
        </button>
      </nav>
    </div>
  );
}
