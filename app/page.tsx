'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 0. Supabase クライアント初期化
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Google Maps API キー
const GOOGLE_MAPS_API_KEY = 'AIzaSyQqbNFmr77hi-gvKwo1bv9xSdADGuAN7I';

// ==========================================
// 1. 型定義 & マスターデータ
// ==========================================
export type ViewCategory = 'view' | 'gourmet' | 'rain';
export type DisplayScope = 'my' | 'friends' | 'world';
export type TabType = 'map' | 'ranking' | 'profile';

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

const NG_PATTERNS = [
  '死ね', 'しね', '殺す', 'ころす', '消えろ', 'きえろ', 'バカ', 'ばか', 'アホ', 'あほ', 'クズ', 'くず', 'カス', 'かす',
  'ブス', 'ぶす', 'デブ', 'でぶ', 'キモい', 'きもい', 'レイプ', 'れいぷ', '売春', 'ばいしゅん',
  'ドラッグ', 'どらっぐ', '大麻', 'たいま', '覚醒剤', '暴力', '暴行', '自殺', 'じさつ',
  'ホモ', 'ほも', 'オカマ', 'おかま', '差別', 'さべつ', 'チョン', '中国人差別', '外国人差別',
  'セックス', 'せっくす', 'エロ', 'えろ', 'ちんこ', 'まんこ', 'おっぱい', 'オナニー', 'おなにー',
  'fuck', 'shit', 'bitch', 'asshole', 'idiot', 'stupid', 'cunt', 'dick', 'pussy'
];

function checkInappropriateContent(text: string): { isViolating: boolean; matchedWord: string } {
  if (!text) return { isViolating: false, matchedWord: '' };
  const lower = text.toLowerCase().replace(/\s+/g, '');
  for (const word of NG_PATTERNS) {
    if (lower.includes(word.toLowerCase())) {
      return { isViolating: true, matchedWord: word };
    }
  }
  return { isViolating: false, matchedWord: '' };
}

function getUserTitle(count: number) {
  if (count >= 300) return { title: '🪐 宇宙級の旅人', color: '#ec4899' };
  if (count >= 250) return { title: '🌏 ワールドレジェンド', color: '#d946ef' };
  if (count >= 200) return { title: '💎 地球の語り部', color: '#06b6d4' };
  if (count >= 150) return { title: '🌌 歴戦の探求者', color: '#10b981' };
  if (count >= 100) return { title: '👑 百景の覇者', color: '#eab308' };
  if (count >= 90) return { title: '🏆 ワールドナビゲーター', color: '#f97316' };
  if (count >= 80) return { title: '🌟 グローバルウォーカー', color: '#f59e0b' };
  if (count >= 70) return { title: '⭐ トラベルマスター', color: '#f43f5e' };
  if (count >= 60) return { title: '🏔️ 開拓エキスパート', color: '#8b5cf6' };
  if (count >= 50) return { title: '🧭 ジャーニーガイド', color: '#6366f1' };
  if (count >= 40) return { title: '✈️ 熟練ボイジャー', color: '#3b82f6' };
  if (count >= 30) return { title: '🗺️ エリアトラベラー', color: '#0284c7' };
  if (count >= 20) return { title: '📷 スポットハンター', color: '#0ea5e9' };
  if (count >= 10) return { title: '🎒 トラベルビギナー', color: '#38bdf8' };
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
  KR: { name: '대한민국 (韓国)', flag: '🇰🇷', region: '🌏 アジア', lang: 'ko', lat: 35.9078, lon: 127.7669, zoom: 7, dict: { step1Title: 'Step 1: 국적 선택', step1Desc: '지도의 지명과 앱 언어가 한국어로 표시됩니다.', step2Title: 'Step 2: 프로필 설정', step3Title: 'Step 3: 이용약관 (EULA) 동의', next: '다음', back: '뒤로', startApp: '🚀 WorldSnap 시작하기', eulaAgree: '이용약관 및 커뮤니티 가이드라인에 동의합니다', termsTitle: '📜 WorldSnap 이용약관 (EULA)', map: '지도', ranking: '랭킹', profile: '마이페이지', addPhoto: '사진/동영상 추가', exportMap: '지도 저장', view: '경치', gourmet: '맛집', rain: '비오는날', myMap: '내 지도', friends: '친구', world: '전체', openGoogleMaps: '🧭 Google 지도에서 길찾기', saveSpot: '❤️ 가고싶다', saved: '❤️ 저장됨', report: '⚠️ 신고', block: '🚫 차단', delete: '🗑️ 삭제', edit: '✏️ 수정', visited: '방문 국가', countriesUnit: '개국', posts: '게시물', friendCode: '친구 코드', searchPlaceholder: '🔍 도시 / #태그 검색', cacheClear: '🧹 캐시 삭제', deleteAccount: '⚠️ 회원 탈퇴', logout: '🚪 ログアウト', close: '닫기' } },
  CN: { name: '中国 (China)', flag: '🇨🇳', region: '🌏 アジア', lang: 'zh', lat: 35.8617, lon: 104.1954, zoom: 4, dict: { step1Title: '步骤 1: 选择国家', step1Desc: '选择国家', step2Title: '步骤 2', step3Title: '步骤 3', next: '下一步', back: '返回', startApp: '开始', eulaAgree: '同意', termsTitle: '条款', map: '地图', ranking: '排行', profile: '我的', addPhoto: '添加', exportMap: '保存地图', view: '风景', gourmet: '美食', rain: '雨天', myMap: '我的地图', friends: '好友', world: '世界', openGoogleMaps: '地图', saveSpot: '收藏', saved: '已收藏', report: '举报', block: '拉黑', delete: '删除', edit: '编辑', visited: '已访问', countriesUnit: '个国家', posts: '动态', friendCode: '好友码', searchPlaceholder: '搜索...', cacheClear: '清理缓存', deleteAccount: '注销账号', logout: '退出', close: '关闭' } },
  TW: { name: '台灣 (台湾)', flag: '🇹🇼', region: '🌏 アジア', lang: 'zh', lat: 23.6978, lon: 120.9605, zoom: 7, dict: { step1Title: 'Step 1: 選擇國家', step1Desc: '選擇國家', step2Title: 'Step 2', step3Title: 'Step 3', next: '下一步', back: '返回', startApp: '開始', eulaAgree: '同意', termsTitle: '條款', map: '地圖', ranking: '排行', profile: '我的', addPhoto: '新增', exportMap: '儲存地圖', view: '風景', gourmet: '美食', rain: '雨天', myMap: '我的地圖', friends: '好友', world: '世界', openGoogleMaps: '地圖', saveSpot: '收藏', saved: '已收藏', report: '舉報', block: '封鎖', delete: '刪除', edit: '編輯', visited: '訪問', countriesUnit: '個國家', posts: '貼文', friendCode: '好友代碼', searchPlaceholder: '搜尋...', cacheClear: '清除快取', deleteAccount: '刪除帳號', logout: '登出', close: '關閉' } },
  TH: { name: 'ประเทศไทย (タイ)', flag: '🇹🇭', region: '🌏 アジア', lang: 'th', lat: 15.8700, lon: 100.9925, zoom: 6, dict: { step1Title: 'Step 1: เลือกประเทศ', step1Desc: 'เลือกประเทศ', step2Title: 'Step 2', step3Title: 'Step 3', next: 'ถัดไป', back: 'ย้อนกลับ', startApp: 'เริ่ม', eulaAgree: 'ยอมรับ', termsTitle: 'เงื่อนไข', map: 'แผนที่', ranking: 'อันดับ', profile: 'โปรไฟล์', addPhoto: 'เพิ่ม', exportMap: 'บันทึกแผนที่', view: 'วิว', gourmet: 'ร้านอาหาร', rain: 'ฝน', myMap: 'แผนที่ฉัน', friends: 'เพื่อน', world: 'ทั่วโลก', openGoogleMaps: 'แผนที่', saveSpot: 'บันทึก', saved: 'บันทึกแล้ว', report: 'รายงาน', block: 'บล็อก', delete: 'ลบ', edit: 'แก้ไข', visited: 'เยี่ยมชม', countriesUnit: 'ประเทศ', posts: 'โพสต์', friendCode: 'โค้ด', searchPlaceholder: 'ค้นหา...', cacheClear: 'ล้างแคช', deleteAccount: 'ลบบัญชี', logout: 'ออกจากระบบ', close: 'ปิด' } },
  VN: { name: 'Việt Nam (ベトナム)', flag: '🇻🇳', region: '🌏 アジア', lang: 'en', lat: 14.0583, lon: 108.2772, zoom: 6, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  SG: { name: 'Singapore (シンガポール)', flag: '🇸🇬', region: '🌏 アジア', lang: 'en', lat: 1.3521, lon: 103.8198, zoom: 11, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  MY: { name: 'Malaysia (マレーシア)', flag: '🇲🇾', region: '🌏 アジア', lang: 'en', lat: 4.2105, lon: 101.9758, zoom: 6, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  PH: { name: 'Pilipinas (フィリピン)', flag: '🇵🇭', region: '🌏 アジア', lang: 'en', lat: 12.8797, lon: 121.7740, zoom: 6, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  ID: { name: 'Indonesia (インドネシア)', flag: '🇮🇩', region: '🌏 アジア', lang: 'en', lat: -0.7893, lon: 113.9213, zoom: 5, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  IN: { name: 'India (インド)', flag: '🇮🇳', region: '🌏 アジア', lang: 'en', lat: 20.5937, lon: 78.9629, zoom: 5, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },

  CH: { name: 'Schweiz (スイス)', flag: '🇨🇭', region: '🏰 ヨーロッパ', lang: 'de', lat: 46.8182, lon: 8.2275, zoom: 8, dict: { step1Title: 'Schritt 1: Land wählen', step1Desc: 'Kartennamen und UI werden auf Deutsch angezeigt.', step2Title: 'Schritt 2: Profil erstellen', step3Title: 'Schritt 3: Nutzungsbedingungen (EULA)', next: 'Weiter', back: 'Zurück', startApp: '🚀 WorldSnap Starten', eulaAgree: 'Ich stimme den Nutzungsbedingungen zu', termsTitle: '📜 Nutzungsbedingungen (EULA)', map: 'Karte', ranking: 'Ranking', profile: 'Profil', addPhoto: 'Medien hinzufügen', exportMap: 'Speichern', view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen', myMap: 'Meine Karte', friends: 'Freunde', world: 'Weltweit', openGoogleMaps: '🧭 In Google Maps öffnen', saveSpot: '❤️ Merken', saved: '❤️ Gemerkt', report: '⚠️ Melden', block: '🚫 Blockieren', delete: '🗑️ Löschen', edit: '✏️ Bearbeiten', visited: 'Besucht', countriesUnit: 'Länder', posts: 'Beiträge', friendCode: 'Freundescode', searchPlaceholder: '🔍 Ort / #Tag suchen', cacheClear: '🧹 Cache leeren', deleteAccount: '⚠️ Konto löschen', logout: '🚪 Abmelden', close: 'Schließen' } },
  FR: { name: 'France (フランス)', flag: '🇫🇷', region: '🏰 ヨーロッパ', lang: 'fr', lat: 46.2276, lon: 2.2137, zoom: 6, dict: { step1Title: 'Étape 1 : Pays', step1Desc: 'Les noms de lieux et l’interface seront traduits en français.', step2Title: 'Étape 2 : Profil', step3Title: 'Étape 3 : Conditions', next: 'Suivant', back: 'Retour', startApp: '🚀 Démarrer WorldSnap', eulaAgree: 'J’accepte les conditions', termsTitle: '📜 Conditions (EULA)', map: 'Carte', ranking: 'Tendances', profile: 'Profil', addPhoto: 'Ajouter média', exportMap: 'Enregistrer', view: 'Paysage', gourmet: 'Gourmet', rain: 'Pluie', myMap: 'Ma carte', friends: 'Amis', world: 'Monde', openGoogleMaps: '🧭 Google Maps', saveSpot: '❤️ Enregistrer', saved: '❤️ Enregistré', report: '⚠️ Signaler', block: '🚫 Bloquer', delete: '🗑️ Supprimer', edit: '✏️ Modifier', visited: 'Pays visités', countriesUnit: 'pays', posts: 'Publications', friendCode: 'Code ami', searchPlaceholder: '🔍 Rechercher une ville, #tag...', cacheClear: '🧹 Vider le cache', deleteAccount: '⚠️ Supprimer le compte', logout: '🚪 Déconnexion', close: 'Fermer' } },
  DE: { name: 'Deutschland (ドイツ)', flag: '🇩🇪', region: '🏰 ヨーロッパ', lang: 'de', lat: 51.1657, lon: 10.4515, zoom: 6, dict: { step1Title: 'Schritt 1: Land', step1Desc: 'Land wählen', step2Title: 'Schritt 2', step3Title: 'Schritt 3', next: 'Weiter', back: 'Zurück', startApp: 'Start', eulaAgree: 'Zustimmen', termsTitle: 'AGB', map: 'Karte', ranking: 'Ranking', profile: 'Profil', addPhoto: 'Hinzufügen', exportMap: 'Speichern', view: 'Sicht', gourmet: 'Gourmet', rain: 'Regen', myMap: 'Meine', friends: 'Freunde', world: 'Welt', openGoogleMaps: 'Maps', saveSpot: 'Merken', saved: 'Gemerkt', report: 'Melden', block: 'Blockieren', delete: 'Löschen', edit: 'Ändern', visited: 'Besucht', countriesUnit: 'Länder', posts: 'Beiträge', friendCode: 'Code', searchPlaceholder: 'Suchen...', cacheClear: 'Cache', deleteAccount: 'Konto', logout: 'Abmelden', close: 'Schließen' } },
  GB: { name: 'United Kingdom (イギリス)', flag: '🇬🇧', region: '🏰 ヨーロッパ', lang: 'en', lat: 55.3781, lon: -3.4360, zoom: 6, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  IT: { name: 'Italia (イタリア)', flag: '🇮🇹', region: '🏰 ヨーロッパ', lang: 'it', lat: 41.8719, lon: 12.5674, zoom: 6, dict: { step1Title: 'Step 1: Paese', step1Desc: 'Seleziona paese', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Avanti', back: 'Indietro', startApp: 'Inizia', eulaAgree: 'Accetto', termsTitle: 'Termini', map: 'Mappa', ranking: 'Classifica', profile: 'Profilo', addPhoto: 'Aggiungi', exportMap: 'Salva', view: 'Vista', gourmet: 'Gourmet', rain: 'Pioggia', myMap: 'Mappa mia', friends: 'Amici', world: 'Mondo', openGoogleMaps: 'Maps', saveSpot: 'Salva', saved: 'Salvato', report: 'Segnala', block: 'Blocca', delete: 'Elimina', edit: 'Modifica', visited: 'Visitati', countriesUnit: 'paesi', posts: 'Post', friendCode: 'Codice', searchPlaceholder: 'Cerca...', cacheClear: 'Cache', deleteAccount: 'Elimina', logout: 'Esci', close: 'Chiudi' } },
  ES: { name: 'España (スペイン)', flag: '🇪🇸', region: '🏰 ヨーロッパ', lang: 'es', lat: 40.4637, lon: -3.7492, zoom: 6, dict: { step1Title: 'Paso 1: País', step1Desc: 'Selecciona país', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Siguiente', back: 'Atrás', startApp: 'Empezar', eulaAgree: 'Acepto', termsTitle: 'Términos', map: 'Mapa', ranking: 'Ranking', profile: 'Perfil', addPhoto: 'Añadir', exportMap: 'Guardar', view: 'Vista', gourmet: 'Gourmet', rain: 'Lluvia', myMap: 'Mi mapa', friends: 'Amigos', world: 'Mundo', openGoogleMaps: 'Maps', saveSpot: 'Guardar', saved: 'Saved', report: 'Reportar', block: 'Bloquear', delete: 'Eliminar', edit: 'Editar', visited: 'Visitados', countriesUnit: 'países', posts: 'Publicaciones', friendCode: 'Código', searchPlaceholder: 'Buscar...', cacheClear: 'Limpiar', deleteAccount: 'Eliminar', logout: 'Salir', close: 'Cerrar' } },
  NL: { name: 'Nederland (オランダ)', flag: '🇳🇱', region: '🏰 ヨーロッパ', lang: 'en', lat: 52.1326, lon: 5.2913, zoom: 7, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  PT: { name: 'Portugal (ポルトガル)', flag: '🇵🇹', region: '🏰 ヨーロッパ', lang: 'en', lat: 39.3999, lon: -8.2245, zoom: 6, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  GR: { name: 'Ελλάδα (ギリシャ)', flag: '🇬🇷', region: '🏰 ヨーロッパ', lang: 'en', lat: 39.0742, lon: 21.8243, zoom: 6, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  BE: { name: 'België / Belgique (ベルギー)', flag: '🇧🇪', region: '🏰 ヨーロッパ', lang: 'en', lat: 50.5039, lon: 4.4699, zoom: 8, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  PL: { name: 'Polska (ポーランド)', flag: '🇵🇱', region: '🏰 ヨーロッパ', lang: 'en', lat: 51.9194, lon: 19.1451, zoom: 6, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  AT: { name: 'Österreich (オーストリア)', flag: '🇦🇹', region: '🏰 ヨーロッパ', lang: 'de', lat: 47.5162, lon: 14.5501, zoom: 7, dict: { step1Title: 'Schritt 1: Land', step1Desc: 'Land wählen', step2Title: 'Schritt 2', step3Title: 'Schritt 3', next: 'Weiter', back: 'Zurück', startApp: 'Start', eulaAgree: 'Zustimmen', termsTitle: 'AGB', map: 'Karte', ranking: 'Ranking', profile: 'Profil', addPhoto: 'Hinzufügen', exportMap: 'Speichern', view: 'Sicht', gourmet: 'Gourmet', rain: 'Regen', myMap: 'Meine', friends: 'Freunde', world: 'Welt', openGoogleMaps: 'Maps', saveSpot: 'Merken', saved: 'Gemerkt', report: 'Melden', block: 'Blockieren', delete: 'Löschen', edit: 'Ändern', visited: 'Besucht', countriesUnit: 'Länder', posts: 'Beiträge', friendCode: 'Code', searchPlaceholder: 'Suchen...', cacheClear: 'Cache', deleteAccount: 'Konto', logout: 'Abmelden', close: 'Schließen' } },

  // --- 北米・中南米 ---
  US: { name: 'USA (アメリカ)', flag: '🇺🇸', region: '🗽 北米・中南米', lang: 'en', lat: 37.0902, lon: -95.7129, zoom: 4, dict: { step1Title: 'Step 1: Select Nationality', step1Desc: 'Map labels and UI will be displayed in English.', step2Title: 'Step 2: Create Profile', step3Title: 'Step 3: Terms of Service (EULA)', next: 'Next', back: 'Back', startApp: '🚀 Start WorldSnap', eulaAgree: 'I agree to the Terms of Service', termsTitle: '📜 Terms of Service (EULA)', map: 'Map', ranking: 'Trending', profile: 'Profile', addPhoto: 'Add Media', exportMap: 'Save Map', view: 'View', gourmet: 'Gourmet', rain: 'Rainy Day', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: '🧭 Open Maps', saveSpot: '❤️ Save', saved: '❤️ Saved', report: '⚠️ Report', block: '🚫 Block', delete: '🗑️ Delete', edit: '✏️ Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Friend Code', searchPlaceholder: '🔍 Search city, #tag...', cacheClear: '🧹 Clear Cache', deleteAccount: '⚠️ Delete Account', logout: '🚪 Log Out', close: 'Close' } },
  CA: { name: 'Canada (カナダ)', flag: '🇨🇦', region: '🗽 北米・中南米', lang: 'en', lat: 56.1304, lon: -106.3468, zoom: 4, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  BR: { name: 'Brasil (ブラジル)', flag: '🇧🇷', region: '🗽 北米・中南米', lang: 'en', lat: -14.2350, lon: -51.9253, zoom: 4, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  MX: { name: 'México (メキシコ)', flag: '🇲🇽', region: '🗽 北米・中南米', lang: 'en', lat: 23.6345, lon: 102.5528, zoom: 5, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  PE: { name: 'Perú (ペルー)', flag: '🇵🇪', region: '🗽 北米・中南米', lang: 'en', lat: -9.1900, lon: -75.0152, zoom: 5, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },

  // --- オセアニア ---
  AU: { name: 'Australia (オーストラリア)', flag: '🇦🇺', region: '🦘 オセアニア', lang: 'en', lat: -25.2744, lon: 133.7751, zoom: 4, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2: Profile', step3Title: 'Step 3: EULA', next: 'Next', back: 'Back', startApp: '🚀 Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  NZ: { name: 'New Zealand (ニュージーランド)', flag: '🇳🇿', region: '🦘 オセアニア', lang: 'en', lat: -40.9006, lon: 174.8860, zoom: 5, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },

  // --- 中東・アフリカ ---
  AE: { name: 'UAE / Dubai (アラブ首長国連邦)', flag: '🇦🇪', region: '🐪 中東・アフリカ', lang: 'en', lat: 23.4241, lon: 53.8478, zoom: 7, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  SA: { name: 'Saudi Arabia (サウジアラビア)', flag: '🇸🇦', region: '🐪 中東・アフリカ', lang: 'en', lat: 23.8859, lon: 45.0792, zoom: 5, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  EG: { name: 'Egypt (エジプト)', flag: '🇪🇬', region: '🐪 中東・アフリカ', lang: 'en', lat: 26.8206, lon: 30.8025, zoom: 6, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  MA: { name: 'Maroc (モロッコ)', flag: '🇲🇦', region: '🐪 中東・アフリカ', lang: 'en', lat: 31.7917, lon: -7.0926, zoom: 6, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  ZA: { name: 'South Africa (南アフリカ)', flag: '🇿🇦', region: '🐪 中東・アフリカ', lang: 'en', lat: -30.5595, lon: 22.9375, zoom: 5, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
  MV: { name: 'Maldives (モルディブ)', flag: '🇲🇻', region: '🐪 中東・アフリカ', lang: 'en', lat: 3.2028, lon: 73.2207, zoom: 7, dict: { step1Title: 'Step 1: Country', step1Desc: 'Select country', step2Title: 'Step 2', step3Title: 'Step 3', next: 'Next', back: 'Back', startApp: 'Start', eulaAgree: 'I agree', termsTitle: 'Terms', map: 'Map', ranking: 'Ranking', profile: 'Profile', addPhoto: 'Add', exportMap: 'Save', view: 'View', gourmet: 'Gourmet', rain: 'Rain', myMap: 'My Map', friends: 'Friends', world: 'World', openGoogleMaps: 'Maps', saveSpot: 'Save', saved: 'Saved', report: 'Report', block: 'Block', delete: 'Delete', edit: 'Edit', visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Code', searchPlaceholder: 'Search...', cacheClear: 'Clear', deleteAccount: 'Delete', logout: 'Logout', close: 'Close' } },
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
