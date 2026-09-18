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
// 1. 型定義 & マスターデータ
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

export const COUNTRIES: Record<
  string,
  {
    name: string;
    flag: string;
    region: string;
    lang: string;
    lat: number;
    lon: number;
    zoom: number;
    dict: Record<string, string>;
  }
> = {
  JP: { name: '日本 (Japan)', flag: '🇯🇵', region: '🌏 アジア', lang: 'ja', lat: 36.2048, lon: 138.2529, zoom: 5, dict: { step1Title: 'Step 1: 国籍・メインの国を選択', step1Desc: '選択した国に応じて、地図の地名とアプリ全体の言語がローカライズされます。', step2Title: 'Step 2: プロフィール作成', step3Title: 'Step 3: 利用規約 (EULA) の確認', next: '次へ進む', back: '戻る', startApp: '🚀 WorldSnap をはじめる', eulaAgree: '利用規約およびコミュニティガイドラインに同意する', termsTitle: '📜 WorldSnap 利用規約 (EULA)', map: 'マップ', ranking: 'ランキング', profile: 'マイページ', addPhoto: '写真 / 動画を追加', exportMap: 'マップ保存', view: 'View', gourmet: 'グルメ', rain: '雨の日', myMap: 'マイマップ', friends: 'フレンド', world: 'ワールド', openGoogleMaps: '🧭 Googleマップで開く', saveSpot: '❤️ 行きたい', saved: '❤️ 保存済み', report: '⚠️ 通報', block: '🚫 ブロック', delete: '🗑️ 削除', edit: '✏️ 編集', visited: '訪問国', countriesUnit: 'カ国', posts: '投稿', friendCode: 'フレンドコード', searchPlaceholder: '🔍 地域・都市・#タグを検索（例: 京都、#絶景）', cacheClear: '🧹 地図キャッシュ削除', deleteAccount: '⚠️ アカウントの削除 (退会処理)', logout: '🚪 ログアウト', close: '閉じる' } },
  KR: { name: '韓国 (South Korea)', flag: '🇰🇷', region: '🌏 アジア', lang: 'ko', lat: 35.9078, lon: 127.7669, zoom: 7, dict: { step1Title: 'Step 1: 国籍選択', step1Desc: '選択した国に応じて言語が切り替わります', step2Title: 'Step 2', step3Title: 'Step 3', next: '次へ', back: '戻る', startApp: 'はじめる', eulaAgree: '同意する', termsTitle: '利用規約', map: 'マップ', ranking: 'ランキング', profile: 'マイページ', addPhoto: '写真追加', exportMap: '保存', view: 'View', gourmet: 'グルメ', rain: '雨', myMap: 'マイマップ', friends: 'フレンド', world: 'ワールド', openGoogleMaps: 'マップ', saveSpot: '保存', saved: '保存済', report: '通報', block: 'ブロック', delete: '削除', edit: '編集', visited: '訪問国', countriesUnit: 'カ国', posts: '投稿', friendCode: 'コード', searchPlaceholder: '検索...', cacheClear: 'キャッシュ削除', deleteAccount: '退会', logout: 'ログアウト', close: '閉じる' } },
  CN: { name: '中国 (China)', flag: '🇨🇳', region: '🌏 アジア', lang: 'zh', lat: 35.8617, lon: 104.1954, zoom: 4, dict: { step1Title: '选择国家', step1Desc: '选择国家', step2Title: 'Step 2', step3Title: 'Step 3', next: '下一步', back: '返回', startApp: '开始', eulaAgree: '同意', termsTitle: '条款', map: '地图', ranking: '排行', profile: '我的', addPhoto: '添加', exportMap: '保存地图', view: '风景', gourmet: '美食', rain: '雨天', myMap: '我的地图', friends: '好友', world: '世界', openGoogleMaps: '地图', saveSpot: '收藏', saved: '已收藏', report: '举报', block: '拉黑', delete: '删除', edit: '编辑', visited: '已访问', countriesUnit: '个国家', posts: '动态', friendCode: '好友码', searchPlaceholder: '搜索...', cacheClear: '清理缓存', deleteAccount: '注销账号', logout: '退出', close: '关闭' } },
  TW: { name: '台湾 (Taiwan)', flag: '🇹🇼', region: '🌏 アジア', lang: 'zh', lat: 23.6978, lon: 120.9605, zoom: 7, dict: { step1Title: '選擇國家', step1Desc: '選擇國家', step2Title: 'Step 2', step3Title: 'Step 3', next: '下一步', back: '返回', startApp: '開始', eulaAgree: '同意', termsTitle: '條款', map: '地圖', ranking: '排行', profile: '我的', addPhoto: '新增', exportMap: '儲存地圖', view: '風景', gourmet: '美食', rain: '雨天', myMap: '我的地圖', friends: '好友', world: '世界', openGoogleMaps: '地圖', saveSpot: '收藏', saved: '已收藏', report: '舉報', block: '封鎖', delete: '刪除', edit: '編輯', visited: '訪問', countriesUnit: '個國家', posts: '貼文', friendCode: '好友代碼', searchPlaceholder: '搜尋...', cacheClear: '清除快取', deleteAccount: '刪除帳號', logout: '登出', close: '關閉' } },
  TH: { name: 'タイ (Thailand)', flag: '🇹🇭', region: '🌏 アジア', lang: 'th', lat: 15.8700, lon: 100.9925, zoom: 6, dict: { step1Title: 'เลือกประเทศ', step1Desc: 'เลือกประเทศ', step2Title: 'Step 2', step3Title: 'Step 3', next: 'ถัดไป', back: 'ย้อนกลับ', startApp: 'เริ่ม', eulaAgree: 'ยอมรับ', termsTitle: 'เงื่อนไข', map: 'แผนที่', ranking: 'อันดับ', profile: 'โปรไฟล์', addPhoto: 'เพิ่ม', exportMap: 'บันทึก', view: 'วิว', gourmet: 'ร้านอาหาร', rain: 'ฝน', myMap: 'แผนที่ฉัน', friends: 'เพื่อน', world: 'ทั่วโลก', openGoogleMaps: 'แผนที่', saveSpot: 'บันทึก', saved: 'บันทึกแล้ว', report: 'รายงาน', block: 'บล็อก', delete: 'ลบ', edit: 'แก้ไข', visited: 'เยี่ยมชม', countriesUnit: 'ประเทศ', posts: 'โพสต์', friendCode: 'โค้ด', searchPlaceholder: 'ค้นหา...', cacheClear: 'ล้างแคช', deleteAccount: 'ลบบัญชี', logout: 'ออกจากระบบ', close: 'ปิด' } },
  VN: { name: 'ベトナム (Vietnam)', flag: '🇻🇳', region: '🌏 アジア', lang: 'en', lat: 14.0583, lon: 108.2772, zoom: 6, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  SG: { name: 'シンガポール (Singapore)', flag: '🇸🇬', region: '🌏 アジア', lang: 'en', lat: 1.3521, lon: 103.8198, zoom: 11, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  MY: { name: 'マレーシア (Malaysia)', flag: '🇲🇾', region: '🌏 アジア', lang: 'en', lat: 4.2105, lon: 101.9758, zoom: 6, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  ID: { name: 'インドネシア (Indonesia)', flag: '🇮🇩', region: '🌏 アジア', lang: 'en', lat: -0.7893, lon: 113.9213, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  PH: { name: 'フィリピン (Philippines)', flag: '🇵🇭', region: '🌏 アジア', lang: 'en', lat: 12.8797, lon: 121.7740, zoom: 6, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  IN: { name: 'インド (India)', flag: '🇮🇳', region: '🌏 アジア', lang: 'en', lat: 20.5937, lon: 78.9629, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  AE: { name: 'アラブ首長国連邦 (UAE)', flag: '🇦🇪', region: '🌏 アジア', lang: 'en', lat: 23.4241, lon: 53.8478, zoom: 7, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },

  // 🇪🇺 ヨーロッパ (Europe)
  FR: { name: 'フランス (France)', flag: '🇫🇷', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 46.6034, lon: 1.8883, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  ES: { name: 'スペイン (Spain)', flag: '🇪🇸', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 40.4637, lon: -3.7492, zoom: 6, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  IT: { name: 'イタリア (Italy)', flag: '🇮🇹', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 41.8719, lon: 12.5674, zoom: 6, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  GB: { name: 'イギリス (UK)', flag: '🇬🇧', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 55.3781, lon: -3.4360, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  DE: { name: 'ドイツ (Germany)', flag: '🇩🇪', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 51.1657, lon: 10.4515, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  CH: { name: 'スイス (Switzerland)', flag: '🇨🇭', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 46.8182, lon: 8.2275, zoom: 8, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  AT: { name: 'オーストリア (Austria)', flag: '🇦🇹', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 47.5162, lon: 14.5501, zoom: 7, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  GR: { name: 'ギリシャ (Greece)', flag: '🇬🇷', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 39.0742, lon: 21.8243, zoom: 7, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  PT: { name: 'ポルトガル (Portugal)', flag: '🇵🇹', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 39.3999, lon: -8.2245, zoom: 7, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  NL: { name: 'オランダ (Netherlands)', flag: '🇳🇱', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 52.1326, lon: 5.2913, zoom: 8, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  SE: { name: 'スウェーデン (Sweden)', flag: '🇸🇪', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 60.1282, lon: 18.6435, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  NO: { name: 'ノルウェー (Norway)', flag: '🇳🇴', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 60.4720, lon: 8.4689, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  DK: { name: 'デンマーク (Denmark)', flag: '🇩🇰', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 56.2639, lon: 9.5018, zoom: 7, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  FI: { name: 'フィンランド (Finland)', flag: '🇫🇮', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 61.9241, lon: 25.7482, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  TR: { name: 'トルコ (Turkey)', flag: '🇹🇷', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 38.9637, lon: 35.2433, zoom: 6, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },

  // 🗽 北米・中南米 (North & South America)
  US: { name: 'アメリカ (USA)', flag: '🇺🇸', region: '🗽 北米・中南米', lang: 'en', lat: 37.0902, lon: -95.7129, zoom: 4, dict: { step1Title: 'Step 1: Select Nationality', step1Desc: 'Map labels and UI will be displayed in English.', step2Title: 'Step 2: Create Profile', step3Title: 'Step 3: Terms of Service (EULA)', next: 'Next', back: 'Back', startApp: '🚀 Start WorldSnap', eulaAgree: 'I agree to the Terms of Service', termsTitle: '📜 Terms of Service (EULA)', map: 'Map', ranking: 'Trending', profile: 'Profile', addPhoto: 'Add Media', exportMap: 'Save Map', view: 'View', gourmet: 'Gourmet', rain: 'Rainy Day', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: '🧭 Open Maps', saveSpot: '❤️ Save', saved: '❤️ Saved', report: '⚠️ Report', block: '🚫 Block', delete: '🗑️ Delete', edit: '✏️ Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Friend Code', searchPlaceholder: '🔍 Search city, #tag...', cacheClear: '🧹 Clear Cache', deleteAccount: '⚠️ Delete Account', logout: '🚪 Log Out', close: 'Close' } },
  CA: { name: 'カナダ (Canada)', flag: '🇨🇦', region: '🗽 北米・中南米', lang: 'en', lat: 56.1304, lon: -106.3468, zoom: 3, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  MX: { name: 'メキシコ (Mexico)', flag: '🇲🇽', region: '🗽 北米・中南米', lang: 'en', lat: 23.6345, lon: 102.5528, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  BR: { name: 'ブラジル (Brazil)', flag: '🇧🇷', region: '🗽 北米・中南米', lang: 'en', lat: -14.2350, lon: -51.9253, zoom: 4, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  AR: { name: 'アルゼンチン (Argentina)', flag: '🇦🇷', region: '🗽 北米・中南米', lang: 'en', lat: -38.4161, lon: -63.6167, zoom: 4, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  PE: { name: 'ペルー (Peru)', flag: '🇵🇪', region: '🗽 北米・中南米', lang: 'en', lat: -9.1900, lon: -75.0152, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },

  // 🦘 オセアニア (Oceania)
  AU: { name: 'オーストラリア (Australia)', flag: '🇦🇺', region: '🦘 オセアニア', lang: 'en', lat: -25.2744, lon: 133.7751, zoom: 4, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2: Profile', step3Title: 'Step 3: EULA', next: 'Next', back: 'Back', startApp: '🚀 Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  NZ: { name: 'ニュージーランド (New Zealand)', flag: '🇳🇿', region: '🦘 オセアニア', lang: 'en', lat: -40.9006, lon: 174.8860, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },

  // 🦁 アフリカ (Africa)
  EG: { name: 'エジプト (Egypt)', flag: '🇪🇬', region: '🦁 アフリカ', lang: 'en', lat: 26.8206, lon: 30.8025, zoom: 6, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  ZA: { name: '南アフリカ (South Africa)', flag: '🇿🇦', region: '🦁 アフリカ', lang: 'en', lat: -30.5595, lon: 22.9375, zoom: 5, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  MA: { name: 'モロッコ (Morocco)', flag: '🇲🇦', region: '🦁 アフリカ', lang: 'en', lat: 31.7917, lon: -7.0926, zoom: 6, dict: { step1Title: 'Select Country', step1Desc: 'Select country', step2Title: 'Profile', step3Title: 'EULA', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } }
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
・通報機能（Report）：ユーザーは不適切な写真・ピンを通報できます。通報が30件に達したコンテンツおよびユーザーは自動的に削除・1週間凍結されます。
・ブロック機能（Block）：ユーザーは特定の他ユーザーをブロックでき、ブロックされたユーザーの投稿やピンは即座に非表示となります。`;

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
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#ea580c',
          fillOpacity: 0.35,
          map: mapInstanceRef.current,
          center: { lat: spot.lat, lng: spot.lon },
          radius: 15000,
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
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [eulaChecked, setEulaChecked] = useState<boolean>(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);

  const [userCountry, setUserCountry] = useState<string>('JP');
  const [userName, setUserName] = useState<string>('namesnap');
  const [userBio, setUserBio] = useState<string>('世界中を旅して記録中 🌏✈️');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [friendCode] = useState<string>('WS-8823-X9');

  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [selectedCategories, setSelectedCategories] = useState<ViewCategory[]>(['view', 'gourmet', 'rain']);
  const [mapTheme, setMapTheme] = useState<MapThemeType>('light');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('world');
  
  const [mapSearchKeyword, setMapSearchKeyword] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [mapSearchSuggestions, setMapSearchSuggestions] = useState<PlaceSuggestion[]>([]);

  const [isAdVisible, setIsAdVisible] = useState<boolean>(true);

  const currentConfig = COUNTRIES[userCountry] || COUNTRIES.JP;

  const [currentMapCenter, setCurrentMapCenter] = useState<[number, number]>([currentConfig.lat, currentConfig.lon]);
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(currentConfig.zoom);

  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | null>(null);

  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>([]);

  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'footprint' | 'timeline' | 'saved' | 'badges' | 'friends'>('posts');
  const [activeFootprintCountry, setActiveFootprintCountry] = useState<string | null>(null);

  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editCategory, setEditCategory] = useState<ViewCategory>('view');
  const [editScopes, setEditScopes] = useState<DisplayScope[]>(['world']);

  const [newCommentText, setNewCommentText] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportReasonType, setReportReasonType] = useState<string>('inappropriate');

  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [inputMessageText, setInputMessageText] = useState<string>('');

  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(0);
  const [postTitle, setPostTitle] = useState<string>('');
  const [postDesc, setPostDesc] = useState<string>('');
  const [postCategory, setPostCategory] = useState<ViewCategory>('view');
  const [selectedScopes, setSelectedScopes] = useState<DisplayScope[]>(['world', 'friends', 'my']);
  
  const [addressSearchQuery, setAddressSearchQuery] = useState<string>('');
  const [addressSuggestions, setAddressSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLon, setManualLon] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isEulaModalOpen, setIsEulaModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [friendsList, setFriendsList] = useState<FriendUser[]>([]);
  const [inputFriendCode, setInputFriendCode] = useState('');

  const exportRef = useRef<HTMLDivElement>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement>(null);
  const onboardingAvatarInputRef = useRef<HTMLInputElement>(null);

  const t = currentConfig.dict;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 5000);
  };

  useEffect(() => {
    const hasCompleted = localStorage.getItem('ws_onboarded_v2');
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
    localStorage.setItem('ws_onboarded_v2', 'true');
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

  const handleNextMedia = () => {
    if (!selectedSpot?.mediaList || selectedSpot.mediaList.length <= 1) return;
    setActiveMediaIndex((prev) => (prev + 1) % selectedSpot.mediaList!.length);
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

  const handleSendMessage = () => {
    const trimmedMsg = inputMessageText.trim();
    if (!trimmedMsg || !selectedFriend) return;

    const check = checkInappropriateContent(trimmedMsg);
    if (check.isViolating) {
      showWarning('⚠️ 暴言・差別発言・下ネタ等の不適切な表現が含まれているため、メッセージを送信できません。');
      return;
    }

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: 'me',
      text: trimmedMsg,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => ({
      ...prev,
      [selectedFriend.id]: [...(prev[selectedFriend.id] || []), newMsg],
    }));
    setInputMessageText('');
  };

  const handleExecuteReport = async (reason: string) => {
    if (!selectedSpot) return;
    const spotId = selectedSpot.id;
    const targetUserId = selectedSpot.userId;

    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === spotId) {
          const nextCount = (s.reportCount || 0) + 1;
          return { ...s, reportCount: nextCount };
        }
        return s;
      })
    );

    const currentSpot = spots.find((s) => s.id === spotId);
    const updatedReportCount = (currentSpot?.reportCount || 0) + 1;

    if (updatedReportCount >= 30) {
      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      setBlockedUsers((prev) => [...prev, targetUserId]);
      if (supabase) {
        await supabase.from('spots').delete().eq('id', spotId);
      }
      showToast('⚠️ 通報が30件に達したため、この投稿は自動削除されました。');
    } else {
      showToast(`✅ 通報を受け付けました（理由: ${reason}）。`);
    }

    setIsReportModalOpen(false);
    setSelectedSpot(null);
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
      setPostTitle(pendingList[0].file.name.replace(/\.[^/.]+$/, ''));
      setPostDesc('');
      setPostCategory(selectedCategories[0] || 'view');
      setSelectedScopes(['world', 'friends', 'my']);
      
      if (pendingList[0].hasGps && pendingList[0].lat !== undefined && pendingList[0].lon !== undefined) {
        setManualLat(pendingList[0].lat.toString());
        setManualLon(pendingList[0].lon.toString());
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
      setPostTitle(pendingUploads[nextIndex].file.name.replace(/\.[^/.]+$/, ''));
      setPostDesc('');
      setAddressSearchQuery('');
      setManualLat('');
      setManualLon('');
    } else {
      setPendingUploads([]);
      setCurrentUploadIndex(0);
    }
  };

  const handleStartEdit = (spot: Spot) => {
    setEditingSpot(spot);
    setEditTitle(spot.title);
    setEditDesc(spot.description);
    setEditCategory(spot.category);
    setEditScopes(spot.scopes);
  };

  const handleSaveEdit = async () => {
    if (!editingSpot) return;

    const checkTitle = checkInappropriateContent(editTitle);
    const checkDesc = checkInappropriateContent(editDesc);
    if (checkTitle.isViolating || checkDesc.isViolating) {
      showWarning('⚠️ 暴言・差別発言・不適切な表現が含まれているため変更を保存できません。');
      return;
    }

    const updatedSpot: Spot = {
      ...editingSpot,
      title: editTitle.trim() || editingSpot.title,
      description: editDesc.trim(),
      category: editCategory,
      scopes: editScopes,
      tags: extractHashtags(editDesc.trim()),
    };

    setSpots((prev) => prev.map((s) => (s.id === editingSpot.id ? updatedSpot : s)));
    if (selectedSpot && selectedSpot.id === editingSpot.id) {
      setSelectedSpot(updatedSpot);
    }

    if (supabase) {
      await supabase.from('spots').update({
        title: updatedSpot.title,
        description: updatedSpot.description,
        category: updatedSpot.category,
        scopes: updatedSpot.scopes,
        tags: updatedSpot.tags,
      }).eq('id', editingSpot.id);
    }

    setEditingSpot(null);
    showToast('✏️ 投稿の修正を保存しました！');
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

  const toggleSaveSpot = async (spotId: string) => {
    if (savedSpotIds.includes(spotId)) {
      setSavedSpotIds((prev) => prev.filter((id) => id !== spotId));
      setSpots((prev) => prev.map((s) => s.id === spotId ? { ...s, savedCount: Math.max(0, (s.savedCount || 1) - 1) } : s));
      if (supabase) {
        await supabase.from('saved_spots').delete().match({ user_id: 'me', spot_id: spotId });
      }
      showToast('保存を解除しました');
    } else {
      setSavedSpotIds((prev) => [...prev, spotId]);
      setSpots((prev) => prev.map((s) => s.id === spotId ? { ...s, savedCount: (s.savedCount || 0) + 1 } : s));
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

      {/* 初回オンボーディング：利用規約最後までスクロール必須 */}
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
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{c.flag} {c.name} <span style={{ fontSize: '10px', color: '#94a3b8' }}>({c.region})</span></span>
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
                  <button onClick={() => setOnboardingStep(2)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
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
                {c.flag} {c.name.split(' ')[0]}
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
            
            {/* 検索バー（サジェスト付き） */}
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
                  {isSearchingLocation ? '移動中...' : '検索 🚀'}
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

            {/* カテゴリ別一括フィルター（最低1つ選択必須） ＆ スコープ切り替え */}
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
                      {cat === 'view' ? '🏔️ View' : cat === 'gourmet' ? '🍔 グルメ' : '🌧️ 雨の日'}
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
                  <option value="friends" style={{ background: '#0f172a' }}>👥 フレンドマップ</option>
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
              userLang={currentConfig.lang}
              footprintCountry={activeFootprintCountry}
              onMoveEnd={handleMapMoveEnd}
              onSelectSpot={handleOpenSpot}
              onDoubleTap={handleMapDoubleTap}
            />

            {/* 現在地ボタン・ズームアウト・マップ保存共有ボタン */}
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
                      () => {
                        showToast('⚠️ 位置情報の取得に失敗しました');
                      }
                    );
                  } else {
                    showToast('⚠️ お使いのブラウザは位置情報に対応していません');
                  }
                }}
                style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ffffff', border: `2px solid ${themeAccent}`, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🎯
              </button>
              <button
                title="段階的に引き戻す"
                onClick={handleStepZoomOut}
                style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ffffff', border: `2px solid ${themeAccent}`, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🪟
              </button>
              <button
                title="マップを画像として保存・共有"
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
              <button
                onClick={() => setIsAdVisible(false)}
                style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', padding: '4px' }}
                title="広告を閉じる"
              >
                ✕
              </button>
            </div>
          )}

          {/* 下部バー：写真・動画追加ボタンを中央に大きく目立つ配置 */}
          <div style={{ background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', borderTop: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 450, touchAction: 'none' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>📍 {currentConfig.flag} {currentConfig.name}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>表示中: {filteredSpots.length}件</div>
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
                letterSpacing: '0.5px'
              }}
            >
              <span style={{ fontSize: '16px' }}>📷＋</span>
              <span>{t.addPhoto}</span>
              <input type="file" accept="image/*,video/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* ── トレンド・ランキング ── */}
        <div style={{ display: currentTab === 'ranking' ? 'flex' : 'none', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '12px 12px 70px 12px', gap: '10px', touchAction: 'pan-y' }}>
          <div style={{ padding: '6px 0', fontSize: '14px', fontWeight: '900', color: themeAccent }}>
            🏆 人気スポットランキング（行きたい数＆閲覧数順）
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
                {spot.isOfficial && (
                  <span style={{ position: 'absolute', top: '2px', left: '2px', background: '#0284c7', color: '#fff', fontSize: '8px', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>公式</span>
                )}
                {spot.mediaList && spot.mediaList.length > 1 && (
                  <span style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '8px', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>
                    +{spot.mediaList.length}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.title}</div>
                  {spot.isOfficial && <span style={{ fontSize: '10px', background: '#0284c7', color: '#fff', padding: '1px 5px', borderRadius: '10px', fontWeight: 'bold', flexShrink: 0 }}>公式</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>📍 {COUNTRIES[spot.countryCode]?.flag} {spot.cityName}</div>
                <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 'bold', marginTop: '4px' }}>❤️ {spot.savedCount || 0} 保存 · 👀 {spot.viewsCount || 0} 閲覧</div>
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
                  title="クリックしてアバター画像を変更"
                >
                  {!userAvatar && <span>👤</span>}
                  <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.4)', fontSize: '8px', color: '#fff', textAlign: 'center', padding: '1px 0' }}>
                    変更
                  </div>
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
                編集
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', margin: '14px 0', textAlign: 'center' }}>
              <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '8px 4px', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{mySpots.length}</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>📸 投稿数</div>
              </div>
              <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '8px 4px', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{visitedCountryCount}</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>🗺️ 訪問国</div>
              </div>
              <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '8px 4px', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0284c7' }}>{totalMyViewsCount}</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>👀 総閲覧</div>
              </div>
              <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '8px 4px', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f43f5e' }}>{totalMySavedCount}</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>💛 保存数</div>
              </div>
            </div>

            <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                {tab === 'posts' ? `📸 投稿` : tab === 'footprint' ? `🌍 足跡マップ` : tab === 'timeline' ? `📅 ログ` : tab === 'saved' ? `💛 保存` : tab === 'badges' ? `🏅 バッジ` : `👥 フレンド`}
              </button>
            ))}
          </div>

          {profileSubTab === 'posts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
              {mySpots.map((s) => (
                <div key={s.id} onClick={() => handleOpenSpot(s)} style={{ height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000', position: 'relative' }}>
                  <img src={s.thumbUrl || s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  {s.mediaList && s.mediaList.length > 1 && (
                    <span style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(15,23,42,0.8)', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                      +{s.mediaList.length}
                    </span>
                  )}
                  {s.isFirstExplorer && (
                    <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: '#10b981', color: '#fff', fontSize: '8px', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>初代開拓</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 足跡マップ（タップするとオレンジ色になりマップがハイライト） */}
          {profileSubTab === 'footprint' && (
            <div style={{ background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>🌍 行ったことのある地域（足跡マップ）</div>
              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '14px' }}>タップするとオレンジ色に変わり、マップ上でその場所がハイライトされます</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                          showToast(`🍊 ${countryName} の足跡をオレンジハイライトしました！`);
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
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: isSelected ? '#c2410c' : '#15803d' }}>
                        {COUNTRIES[code]?.flag || '📍'} {countryName} {isSelected ? ' (選択中🍊)' : ''}
                      </span>
                      <span style={{ fontSize: '11px', background: isSelected ? '#ea580c' : '#22c55e', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                        ピン {count}件
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {profileSubTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mySpots.map((s) => (
                <div key={s.id} onClick={() => handleOpenSpot(s)} style={{ background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', borderRadius: '12px', padding: '10px', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                    <img src={s.thumbUrl || s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: themeAccent }}>📅 {s.createdAt}</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>📍 {s.cityName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {profileSubTab === 'saved' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
              {spots
                .filter((s) => savedSpotIds.includes(s.id))
                .map((s) => (
                  <div key={s.id} onClick={() => handleOpenSpot(s)} style={{ height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000', position: 'relative' }}>
                    <img src={s.thumbUrl || s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: '#f43f5e', color: '#fff', fontSize: '8px', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {s.category === 'gourmet' ? '🍔 グルメ' : s.category === 'view' ? '🏔️ 絶景' : '🌧️ 雨の日'}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* バッジコレクション */}
          {profileSubTab === 'badges' && (
            <div style={{ background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px' }}>🏅 実績・バッジコレクション（百景の覇者まで）</div>
              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '14px' }}>投稿数に応じて段階的にアンロックされるトロフィー</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🌱</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>見習い探検家 (1+)</div>
                  <div style={{ fontSize: '9px', color: mySpots.length >= 1 ? '#22c55e' : '#94a3b8' }}>{mySpots.length >= 1 ? '達成済み ✓' : '未達成'}</div>
                </div>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎒</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>十景のトラベラー (10+)</div>
                  <div style={{ fontSize: '9px', color: mySpots.length >= 10 ? '#22c55e' : '#94a3b8' }}>{mySpots.length >= 10 ? '達成済み ✓' : `${mySpots.length}/10`}</div>
                </div>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🗺️</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>二十景のエキスパート (20+)</div>
                  <div style={{ fontSize: '9px', color: mySpots.length >= 20 ? '#22c55e' : '#94a3b8' }}>{mySpots.length >= 20 ? '達成済み ✓' : `${mySpots.length}/20`}</div>
                </div>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>✈️</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>三十景のボイジャー (30+)</div>
                  <div style={{ fontSize: '9px', color: mySpots.length >= 30 ? '#22c55e' : '#94a3b8' }}>{mySpots.length >= 30 ? '達成済み ✓' : `${mySpots.length}/30`}</div>
                </div>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🧭</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>四十景のナビ (40+)</div>
                  <div style={{ fontSize: '9px', color: mySpots.length >= 40 ? '#22c55e' : '#94a3b8' }}>{mySpots.length >= 40 ? '達成済み ✓' : `${mySpots.length}/40`}</div>
                </div>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏔️</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>五十景の開拓者 (50+)</div>
                  <div style={{ fontSize: '9px', color: mySpots.length >= 50 ? '#22c55e' : '#94a3b8' }}>{mySpots.length >= 50 ? '達成済み ✓' : `${mySpots.length}/50`}</div>
                </div>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>💎</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>六十景の語り部 (60+)</div>
                  <div style={{ fontSize: '9px', color: mySpots.length >= 60 ? '#22c55e' : '#94a3b8' }}>{mySpots.length >= 60 ? '達成済み ✓' : `${mySpots.length}/60`}</div>
                </div>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>⭐</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>七十景の旅人 (70+)</div>
                  <div style={{ fontSize: '9px', color: mySpots.length >= 70 ? '#22c55e' : '#94a3b8' }}>{mySpots.length >= 70 ? '達成済み ✓' : `${mySpots.length}/70`}</div>
                </div>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🌟</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>八十景の探求者 (80+)</div>
                  <div style={{ fontSize: '9px', color: mySpots.length >= 80 ? '#22c55e' : '#94a3b8' }}>{mySpots.length >= 80 ? '達成済み ✓' : `${mySpots.length}/80`}</div>
                </div>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏆</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>九十景の巨匠 (90+)</div>
                  <div style={{ fontSize: '9px', color: mySpots.length >= 90 ? '#22c55e' : '#94a3b8' }}>{mySpots.length >= 90 ? '達成済み ✓' : `${mySpots.length}/90`}</div>
                </div>
                <div style={{ background: mapTheme === 'dark' ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '10px', border: '2px solid #eab308', textAlign: 'center', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>👑</div>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: '#eab308' }}>百景の覇者 (100+)</div>
                  <div style={{ fontSize: '10px', color: mySpots.length >= 100 ? '#22c55e' : '#94a3b8', fontWeight: 'bold' }}>{mySpots.length >= 100 ? '👑 殿堂入り達成おめでとうございます！' : `あと ${100 - mySpots.length} 個の投稿で覇者になれます！`}</div>
                </div>
              </div>
            </div>
          )}

          {profileSubTab === 'friends' && (
            <div style={{ background: mapTheme === 'dark' ? '#1e293b' : '#ffffff', borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="友達コードを入力"
                  value={inputFriendCode}
                  onChange={(e) => setInputFriendCode(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: mapTheme === 'dark' ? '#334155' : '#f8fafc', color: mapTheme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                />
                <button
                  onClick={() => {
                    if (!inputFriendCode) return;
                    setFriendsList((prev) => [...prev, { id: 'user-' + Date.now(), name: 'Traveler_Buddy', avatar: '', bio: '新規フレンドです！', postsCount: 3 }]);
                    setInputFriendCode('');
                    showToast('👥 友達を追加しました！');
                  }}
                  style={{ padding: '8px 14px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  追加
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {friendsList.map((f) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setSelectedFriend(f)}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: themeAccent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                        👤
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{f.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>投稿 {f.postsCount}件 · タップしてチャット</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFriend(f)}
                      style={{ padding: '5px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      💬 メッセージ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── フレンドプロフィール ＆ メッセージモーダル ── */}
      {selectedFriend && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', width: '100%', maxWidth: '420px', borderRadius: '20px', padding: '20px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: themeAccent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  👤
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>{selectedFriend.name}</h3>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{selectedFriend.bio}</span>
                </div>
              </div>
              <button onClick={() => setSelectedFriend(null)} style={{ background: 'transparent', border: 'none', fontSize: '16px', color: '#94a3b8', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ flex: 1, minHeight: '200px', maxHeight: '260px', overflowY: 'auto', background: '#f8fafc', padding: '10px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {(chatMessages[selectedFriend.id] || []).map((msg) => (
                <div key={msg.id} style={{ alignSelf: msg.senderId === 'me' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ background: msg.senderId === 'me' ? themeAccent : '#e2e8f0', color: msg.senderId === 'me' ? '#fff' : '#0f172a', padding: '8px 12px', borderRadius: '12px', fontSize: '12px' }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: msg.senderId === 'me' ? 'right' : 'left', marginTop: '2px' }}>
                    {msg.createdAt}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="メッセージを入力..."
                value={inputMessageText}
                onChange={(e) => setInputMessageText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
              <button
                onClick={handleSendMessage}
                style={{ padding: '8px 14px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                送信
              </button>
            </div>
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
              <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '20px', background: themeAccent, color: '#fff' }}>
                {selectedSpot.category === 'view' ? '🏔️ VIEW' : selectedSpot.category === 'gourmet' ? '🍔 GOURMET' : '🌧️ 雨の日'}
              </span>
              <button onClick={() => handleShareSpot(selectedSpot)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="シェア">
                🔗
              </button>
            </div>
          </div>

          <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            {(() => {
              const currentMedia = selectedSpot.mediaList && selectedSpot.mediaList[activeMediaIndex] 
                ? selectedSpot.mediaList[activeMediaIndex] 
                : { fileUrl: selectedSpot.fileUrl, fileType: selectedSpot.fileType, thumbUrl: selectedSpot.thumbUrl };

              const hasMultiple = selectedSpot.mediaList && selectedSpot.mediaList.length > 1;

              return (
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <div
                    onClick={hasMultiple ? handleNextMedia : () => setIsLightboxOpen(true)}
                    style={{
                      width: '100%',
                      height: '280px',
                      background: '#000',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={hasMultiple ? 'タップして次の写真を表示' : 'タップして拡大表示'}
                  >
                    {currentMedia.fileType === 'image' ? (
                      <img src={currentMedia.fileUrl} alt={selectedSpot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <video src={currentMedia.fileUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    )}

                    {hasMultiple && (
                      <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '14px', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
                        👉 タップで次へ ({activeMediaIndex + 1}/{selectedSpot.mediaList!.length})
                      </div>
                    )}
                  </div>

                  {hasMultiple && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                      {selectedSpot.mediaList!.map((_, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveMediaIndex(idx)}
                          style={{
                            width: activeMediaIndex === idx ? '18px' : '6px',
                            height: '6px',
                            borderRadius: '3px',
                            background: activeMediaIndex === idx ? themeAccent : '#cbd5e1',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{selectedSpot.title}</h2>
                  {selectedSpot.isOfficial && <span style={{ fontSize: '10px', background: '#0284c7', color: '#fff', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>公式</span>}
                </div>
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

            <div style={{ display: 'flex', gap: '12px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px', margin: '12px 0', fontSize: '12px', color: '#475569' }}>
              <span>👀 <strong>{selectedSpot.viewsCount || 0}</strong> 人が閲覧</span>
              <span>💛 <strong>{selectedSpot.savedCount || 0}</strong> 人が行きたいリストに保存</span>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', margin: '14px 0 10px 0', whiteSpace: 'pre-wrap' }}>{selectedSpot.description}</p>

            {selectedSpot.tags && selectedSpot.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {selectedSpot.tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => {
                      setMapSearchKeyword(`#${tag}`);
                      setSelectedSpot(null);
                      setCurrentTab('map');
                    }}
                    style={{ fontSize: '11px', background: '#e0f2fe', color: '#0284c7', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0' }}>💬 コメント ({selectedSpot.comments?.length || 0})</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {selectedSpot.comments && selectedSpot.comments.length > 0 ? (
                  selectedSpot.comments.map((com) => (
                    <div key={com.id} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{com.userName}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{com.createdAt}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#334155' }}>{com.text}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>まだコメントはありません。最初のコメントを投稿してみよう！</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="コメントを入力..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(selectedSpot.id); }}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <button
                  onClick={() => handleAddComment(selectedSpot.id)}
                  style={{ padding: '8px 16px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  送信
                </button>
              </div>
            </div>

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
                margin: '20px 0',
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
                  <>
                    <button onClick={() => handleStartEdit(selectedSpot)} style={{ padding: '5px 10px', background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {t.edit}
                    </button>
                    <button onClick={() => handleDeleteSpot(selectedSpot.id)} style={{ padding: '5px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {t.delete}
                    </button>
                  </>
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

      {/* ── 投稿編集モーダル ── */}
      {editingSpot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 5500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', padding: '20px', borderRadius: '18px', maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 'bold' }}>✏️ 投稿の編集</h3>

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>スポット名</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: '3px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>思い出・メモ (#タグ)</label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: '3px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>カテゴリ</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '14px' }}>
              {(['view', 'gourmet', 'rain'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setEditCategory(cat)}
                  style={{
                    padding: '6px',
                    borderRadius: '8px',
                    border: `2px solid ${editCategory === cat ? themeAccent : '#e2e8f0'}`,
                    background: editCategory === cat ? '#f0f9ff' : '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    color: editCategory === cat ? themeAccent : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  {cat === 'view' ? '🏔️ View' : cat === 'gourmet' ? '🍔 グルメ' : '🌧️ 雨の日'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEditingSpot(null)}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveEdit}
                style={{ flex: 1, padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 詳細な通報選択モーダル ── */}
      {isReportModalOpen && selectedSpot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', padding: '20px', borderRadius: '18px', maxWidth: '380px', width: '100%' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 'bold' }}>⚠️ 投稿の通報</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#64748b' }}>
              問題の理由を選択してください。（※30件以上の通報が集まると自動的に削除されます）
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {[
                { id: 'inappropriate', label: '🛑 不適切なコンテンツ (露出・グロテスク)' },
                { id: 'harassment', label: '💬 ハラスメント・誹謗中傷 (攻撃的な発言)' },
                { id: 'spam', label: '📢 スパム・宣伝 (無関係な広告や連投)' },
                { id: 'copyright', label: ' ©️ 著作権・肖像権の侵害 (無断転載など)' },
                { id: 'fake_location', label: '📍 位置情報の虚偽・危険な場所' },
              ].map((reason) => (
                <div
                  key={reason.id}
                  onClick={() => setReportReasonType(reason.label)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: `2px solid ${reportReasonType === reason.label ? themeAccent : '#e2e8f0'}`,
                    background: reportReasonType === reason.label ? '#f0f9ff' : '#ffffff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  {reason.label}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsReportModalOpen(false)}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                キャンセル
              </button>
              <button
                onClick={() => handleExecuteReport(reportReasonType)}
                style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                通報を送信する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 投稿モーダル ── */}
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
              🌐 反映先（複数選択可能 - チェックを外して調整可能）
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <div
                onClick={() => toggleScopeSelection('world')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: `2px solid ${selectedScopes.includes('world') ? themeAccent : '#e2e8f0'}`,
                  background: selectedScopes.includes('world') ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: selectedScopes.includes('world') ? themeAccent : '#0f172a' }}>
                    {selectedScopes.includes('world') ? '☑️' : '☐'} 🌎 ワールド（全体マップ）
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>他の旅人の参考になり、リアクションが届きます</div>
                </div>
              </div>

              <div
                onClick={() => toggleScopeSelection('friends')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: `2px solid ${selectedScopes.includes('friends') ? themeAccent : '#e2e8f0'}`,
                  background: selectedScopes.includes('friends') ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: selectedScopes.includes('friends') ? themeAccent : '#0f172a' }}>
                    {selectedScopes.includes('friends') ? '☑️' : '☐'} 👥 フレンドマップ（全員に共有）
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>フレンド全員のマップに反映されます</div>
                </div>
              </div>

              <div
                onClick={() => toggleScopeSelection('my')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: `2px solid ${selectedScopes.includes('my') ? themeAccent : '#e2e8f0'}`,
                  background: selectedScopes.includes('my') ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: selectedScopes.includes('my') ? themeAccent : '#0f172a' }}>
                    {selectedScopes.includes('my') ? '☑️' : '☐'} 📍 マイマップ
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>あなただけの旅ログ・足跡として保存</div>
                </div>
              </div>
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

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>思い出・メモ (#タグをつけて検索しやすく)</label>
            <textarea
              placeholder="おすすめポイント（例: 眺め最高！ #京都観光 #絶景カフェ）"
              rows={2}
              value={postDesc}
              onChange={(e) => setPostDesc(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: '3px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />

            {/* 住所検索 ＆ サジェストリスト */}
            <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '12px', position: 'relative' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#15803d', marginBottom: '6px' }}>
                📍 撮影場所を検索して選択してください（必須）
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: addressSuggestions.length > 0 ? '4px' : '6px' }}>
                <input
                  type="text"
                  placeholder="地名・住所・場所名を入力（例: 京都タワー）"
                  value={addressSearchQuery}
                  onChange={(e) => setAddressSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', background: '#ffffff' }}
                />
              </div>

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
