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
// 1. 型定義 & 100カ国・完全多言語マスターデータ
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

// 多言語辞書定義
const DICTIONaries: Record<string, Record<string, string>> = {
  ja: {
    step1Title: 'Step 1: あなたの国籍（言語）を選択',
    step1Desc: 'アプリ全体の表示言語がこの国に合わせて切り替わります。',
    step2Title: 'Step 2: ベースの国（初期マップ）を選択',
    step2Desc: 'マップの初期表示位置となるメインの国を選んでください。',
    step3Title: 'Step 3: プロフィール作成',
    step3TitleEula: 'Step 4: 利用規約 (EULA) の確認',
    next: '次へ進む',
    back: '戻る',
    startApp: '🚀 WorldSnap をはじめる',
    eulaAgree: '利用規約およびコミュニティガイドラインに同意する',
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
    nationalitySetting: '🌐 国籍 / 表示言語',
    baseCountrySetting: '📍 ベースの国 (初期マップ)',
    blockListTitle: '🚫 ブロック中ユーザー管理',
    eulaTitle: '📜 利用規約 (EULA)',
    guideTitle: '📖 アプリの使い方ガイド',
    translate: '🌐 翻訳する',
    close: '閉じる'
  },
  en: {
    step1Title: 'Step 1: Select Your Nationality (Language)',
    step1Desc: 'The app UI language will be set based on this selection.',
    step2Title: 'Step 2: Select Base Country (Initial Map)',
    step2Desc: 'Choose your main country for the starting map view.',
    step3Title: 'Step 3: Create Profile',
    step3TitleEula: 'Step 4: Terms of Service (EULA)',
    next: 'Next',
    back: 'Back',
    startApp: '🚀 Start WorldSnap',
    eulaAgree: 'I agree to the Terms of Service',
    map: 'Map',
    ranking: 'Ranking',
    profile: 'Profile',
    addPhoto: 'Add Media',
    exportMap: 'Save Map',
    view: 'View',
    gourmet: 'Gourmet',
    rain: 'Rainy Day',
    myMap: 'My Map',
    friends: 'Friends',
    world: 'World',
    openGoogleMaps: '🧭 Open Maps',
    saveSpot: '❤️ Save',
    saved: '❤️ Saved',
    report: '⚠️ Report',
    block: '🚫 Block',
    delete: '🗑️ Delete',
    edit: '✏️ Edit',
    visited: 'Visited',
    posts: 'Posts',
    friendCode: 'Friend Code',
    searchPlaceholder: '🔍 Search city, #tag...',
    settings: '⚙️ Settings Menu',
    nationalitySetting: '🌐 Nationality / UI Language',
    baseCountrySetting: '📍 Base Country (Initial Map)',
    blockListTitle: '🚫 Blocked Users',
    eulaTitle: '📜 Terms of Service (EULA)',
    guideTitle: '📖 App Guide',
    translate: '🌐 Translate',
    close: 'Close'
  },
  ko: {
    step1Title: 'Step 1: 국적(언어) 선택',
    step1Desc: '앱의 언어가 선택한 국가에 맞게 설정됩니다.',
    step2Title: 'Step 2: 베이스 국가(초기 지도) 선택',
    step2Desc: '지도의 중심이 될 기본 국가를 선택하세요.',
    step3Title: 'Step 3: 프로필 설정',
    step3TitleEula: 'Step 4: 이용약관 동의',
    next: '다음',
    back: '뒤로',
    startApp: '🚀 WorldSnap 시작하기',
    eulaAgree: '이용약관 및 가이드라인에 동의합니다',
    map: '지도',
    ranking: '랭킹',
    profile: '마이페이지',
    addPhoto: '사진/영상 추가',
    exportMap: '지도 저장',
    view: '경치',
    gourmet: '맛집',
    rain: '비오는날',
    myMap: '내 지도',
    friends: '친구',
    world: '전체',
    openGoogleMaps: '🧭 Google 지도 열기',
    saveSpot: '❤️ 가고싶다',
    saved: '❤️ 저장됨',
    report: '⚠️ 신고',
    block: '🚫 차단',
    delete: '🗑️ 삭제',
    edit: '✏️ 수정',
    visited: '방문 국가',
    posts: '게시물',
    friendCode: '친구 코드',
    searchPlaceholder: '🔍 도시 / #태그 검색',
    settings: '⚙️ 설정 메뉴',
    nationalitySetting: '🌐 국적 및 언어',
    baseCountrySetting: '📍 기본 국가',
    blockListTitle: '🚫 차단된 사용자',
    eulaTitle: '📜 이용약관 (EULA)',
    guideTitle: '📖 앱 사용 가이드',
    translate: '🌐 번역하기',
    close: '닫기'
  },
  zh: {
    step1Title: '步骤 1: 选择您的国籍（语言）',
    step1Desc: '应用界面语言将根据您的选择进行设置。',
    step2Title: 'Step 2: 选择基础国家（初始地图）',
    step2Desc: '请选择地图初始显示的国家。',
    step3Title: 'Step 3: 创建个人资料',
    step3TitleEula: 'Step 4: 服务条款 (EULA)',
    next: '下一步',
    back: '返回',
    startApp: '🚀 开始使用 WorldSnap',
    eulaAgree: '同意服务条款与社区准则',
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
    openGoogleMaps: '🧭 打开地图',
    saveSpot: '❤️ 收藏',
    saved: '❤️ 已收藏',
    report: '⚠️ 举报',
    block: '🚫 拉黑',
    delete: '🗑️ 删除',
    edit: '编辑',
    visited: '已访问',
    posts: '动态',
    friendCode: '好友码',
    searchPlaceholder: '🔍 搜索城市 / #标签...',
    settings: '⚙️ 设置菜单',
    nationalitySetting: '🌐 国籍与语言',
    baseCountrySetting: '📍 基础国家',
    blockListTitle: '🚫 已屏蔽用户',
    eulaTitle: '📜 服务条款 (EULA)',
    guideTitle: '📖 应用使用指南',
    translate: '🌐 翻译',
    close: '关闭'
  },
  th: {
    step1Title: 'Step 1: เลือกสัญชาติ (ภาษา) ของคุณ',
    step1Desc: 'ภาษาของแอปจะถูกตั้งค่าตามการเลือกนี้',
    step2Title: 'Step 2: เลือกประเทศหลัก (แผนที่เริ่มต้น)',
    step2Desc: 'เลือกประเทศเริ่มต้นสำหรับแผนของคุณ',
    step3Title: 'Step 3: สร้างโปรไฟล์',
    step3TitleEula: 'Step 4: ข้อกำหนดการใช้งาน',
    next: 'ถัดไป',
    back: 'ย้อนกลับ',
    startApp: '🚀 เริ่มต้นใช้งาน WorldSnap',
    eulaAgree: 'ฉันยอมรับข้อกำหนดการใช้งาน',
    map: 'แผนที่',
    ranking: 'อันดับ',
    profile: 'โปรไฟล์',
    addPhoto: 'เพิ่มรูป/วิดีโอ',
    exportMap: 'บันทึกแผนที่',
    view: 'วิว',
    gourmet: 'ร้านอาหาร',
    rain: 'ฝนตก',
    myMap: 'แผนที่ของฉัน',
    friends: 'เพื่อน',
    world: 'ทั่วโลก',
    openGoogleMaps: '🧭 เปิด Google Maps',
    saveSpot: '❤️ บันทึก',
    saved: '❤️ บันทึกแล้ว',
    report: '⚠️ รายงาน',
    block: '🚫 บล็อก',
    delete: '🗑️ ลบ',
    edit: '✏️ แก้ไข',
    visited: 'เยี่ยมชม',
    posts: 'โพสต์',
    friendCode: 'โค้ดเพื่อน',
    searchPlaceholder: '🔍 ค้นหาเมือง, #แท็ก...',
    settings: '⚙️ เมนูตั้งค่า',
    nationalitySetting: '🌐 สัญชาติ / ภาษา',
    baseCountrySetting: '📍 ประเทศหลัก',
    blockListTitle: '🚫 ผู้ใช้ที่ถูกบล็อก',
    eulaTitle: '📜 ข้อกำหนดการใช้งาน',
    guideTitle: '📖 คู่มือการใช้งาน',
    translate: '🌐 แปลภาษา',
    close: 'ปิด'
  },
  fr: {
    step1Title: 'Étape 1 : Sélectionnez votre nationalité (Langue)',
    step1Desc: 'La langue de l\'application sera définie selon ce choix.',
    step2Title: 'Étape 2 : Sélectionnez le pays de base',
    step2Desc: 'Choisissez votre pays principal pour la vue de carte initiale.',
    step3Title: 'Étape 3 : Créer un profil',
    step3TitleEula: 'Étape 4 : Conditions d\'utilisation (EULA)',
    next: 'Suivant',
    back: 'Retour',
    startApp: '🚀 Démarrer WorldSnap',
    eulaAgree: 'J\'accepte les conditions d\'utilisation',
    map: 'Carte',
    ranking: 'Classement',
    profile: 'Profil',
    addPhoto: 'Ajouter',
    exportMap: 'Enregistrer',
    view: 'Vue',
    gourmet: 'Gastronomie',
    rain: 'Pluie',
    myMap: 'Ma Carte',
    friends: 'Amis',
    world: 'Monde',
    openGoogleMaps: '🧭 Ouvrir Maps',
    saveSpot: '❤️ Sauvegarder',
    saved: '❤️ Enregistré',
    report: '⚠️ Signaler',
    block: '🚫 Bloquer',
    delete: '🗑️ Supprimer',
    edit: '✏️ Éditer',
    visited: 'Visité',
    posts: 'Publications',
    friendCode: 'Code ami',
    searchPlaceholder: '🔍 Rechercher une ville, #tag...',
    settings: '⚙️ Paramètres',
    nationalitySetting: '🌐 Nationalité / Langue',
    baseCountrySetting: '📍 Pays de base',
    blockListTitle: '🚫 Utilisateurs bloqués',
    eulaTitle: '📜 Conditions d\'utilisation',
    guideTitle: '📖 Guide de l\'application',
    translate: '🌐 Traduire',
    close: 'Fermer'
  },
  es: {
    step1Title: 'Paso 1: Selecciona tu nacionalidad (Idioma)',
    step1Desc: 'El idioma de la aplicación se configurará según esta selección.',
    step2Title: 'Paso 2: Selecciona el país base',
    step2Desc: 'Elige tu país principal para la vista de mapa inicial.',
    step3Title: 'Paso 3: Crear perfil',
    step3TitleEula: 'Paso 4: Términos de servicio (EULA)',
    next: 'Siguiente',
    back: 'Atrás',
    startApp: '🚀 Iniciar WorldSnap',
    eulaAgree: 'Acepto los términos de servicio',
    map: 'Mapa',
    ranking: 'Ranking',
    profile: 'Perfil',
    addPhoto: 'Añadir',
    exportMap: 'Guardar',
    view: 'Vista',
    gourmet: 'Gourmet',
    rain: 'Lluvia',
    myMap: 'Mi Mapa',
    friends: 'Amigos',
    world: 'Mundo',
    openGoogleMaps: '🧭 Abrir Maps',
    saveSpot: '❤️ Guardar',
    saved: '❤️ Guardado',
    report: '⚠️ Reportar',
    block: '🚫 Bloquear',
    delete: '🗑️ Eliminar',
    edit: '✏️ Editar',
    visited: 'Visitados',
    posts: 'Publicaciones',
    friendCode: 'Código de amigo',
    searchPlaceholder: '🔍 Buscar ciudad, #etiqueta...',
    settings: '⚙️ Configuración',
    nationalitySetting: '🌐 Nacionalidad / Idioma',
    baseCountrySetting: '📍 País base',
    blockListTitle: '🚫 Usuarios bloqueados',
    eulaTitle: '📜 Términos de servicio',
    guideTitle: '📖 Guía de la aplicación',
    translate: '🌐 Traducir',
    close: 'Cerrar'
  }
};

// 100カ国・地域完全網羅マスターデータ
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
  }
> = {
  // アジア
  JP: { name: '日本 (Japan)', flag: '🇯🇵', region: '🌏 アジア', lang: 'ja', lat: 36.2048, lon: 138.2529, zoom: 5 },
  KR: { name: '韓国 (South Korea)', flag: '🇰🇷', region: '🌏 アジア', lang: 'ko', lat: 35.9078, lon: 127.7669, zoom: 7 },
  CN: { name: '中国 (China)', flag: '🇨🇳', region: '🌏 アジア', lang: 'zh', lat: 35.8617, lon: 104.1954, zoom: 4 },
  TW: { name: '台湾 (Taiwan)', flag: '🇹🇼', region: '🌏 アジア', lang: 'zh', lat: 23.6978, lon: 120.9605, zoom: 7 },
  HK: { name: '香港 (Hong Kong)', flag: '🇭🇰', region: '🌏 アジア', lang: 'en', lat: 22.3193, lon: 114.1694, zoom: 11 },
  MO: { name: 'マカオ (Macau)', flag: '🇲🇴', region: '🌏 アジア', lang: 'en', lat: 22.1987, lon: 113.5439, zoom: 12 },
  TH: { name: 'タイ (Thailand)', flag: '🇹🇭', region: '🌏 アジア', lang: 'th', lat: 15.8700, lon: 100.9925, zoom: 6 },
  VN: { name: 'ベトナム (Vietnam)', flag: '🇻🇳', region: '🌏 アジア', lang: 'en', lat: 14.0583, lon: 108.2772, zoom: 6 },
  SG: { name: 'シンガポール (Singapore)', flag: '🇸🇬', region: '🌏 アジア', lang: 'en', lat: 1.3521, lon: 103.8198, zoom: 11 },
  MY: { name: 'マレーシア (Malaysia)', flag: '🇲🇾', region: '🌏 アジア', lang: 'en', lat: 4.2105, lon: 101.9758, zoom: 6 },
  ID: { name: 'インドネシア (Indonesia)', flag: '🇮🇩', region: '🌏 アジア', lang: 'en', lat: -0.7893, lon: 113.9213, zoom: 5 },
  PH: { name: 'フィリピン (Philippines)', flag: '🇵🇭', region: '🌏 アジア', lang: 'en', lat: 12.8797, lon: 121.7740, zoom: 6 },
  IN: { name: 'インド (India)', flag: '🇮🇳', region: '🌏 アジア', lang: 'en', lat: 20.5937, lon: 78.9629, zoom: 5 },
  PK: { name: 'パキスタン (Pakistan)', flag: '🇵🇰', region: '🌏 アジア', lang: 'en', lat: 30.3753, lon: 69.3451, zoom: 5 },
  BD: { name: 'バングラデシュ (Bangladesh)', flag: '🇧🇩', region: '🌏 アジア', lang: 'en', lat: 23.6850, lon: 90.3563, zoom: 6 },
  LK: { name: 'スリランカ (Sri Lanka)', flag: '🇱🇰', region: '🌏 アジア', lang: 'en', lat: 7.8731, lon: 80.7718, zoom: 7 },
  NP: { name: 'ネパール (Nepal)', flag: '🇳🇵', region: '🌏 アジア', lang: 'en', lat: 28.3949, lon: 84.1240, zoom: 6 },
  MM: { name: 'ミャンマー (Myanmar)', flag: '🇲🇲', region: '🌏 アジア', lang: 'en', lat: 21.9162, lon: 95.9560, zoom: 5 },
  KH: { name: 'カンボジア (Cambodia)', flag: '🇰🇭', region: '🌏 アジア', lang: 'en', lat: 12.5657, lon: 104.9910, zoom: 7 },
  LA: { name: 'ラオス (Laos)', flag: '🇱🇦', region: '🌏 アジア', lang: 'en', lat: 19.8563, lon: 102.4955, zoom: 6 },
  MN: { name: 'モンゴル (Mongolia)', flag: '🇲🇳', region: '🌏 アジア', lang: 'en', lat: 46.8625, lon: 103.8467, zoom: 5 },
  KZ: { name: 'カザフスタン (Kazakhstan)', flag: '🇰🇿', region: '🌏 アジア', lang: 'en', lat: 48.0196, lon: 66.9237, zoom: 4 },
  UZ: { name: 'ウズベキスタン (Uzbekistan)', flag: '🇺🇿', region: '🌏 アジア', lang: 'en', lat: 41.3775, lon: 64.5853, zoom: 5 },
  QA: { name: 'カタール (Qatar)', flag: '🇶🇦', region: '🌏 アジア', lang: 'en', lat: 25.3548, lon: 51.1839, zoom: 8 },
  SA: { name: 'サウジアラビア (Saudi Arabia)', flag: '🇸🇦', region: '🌏 アジア', lang: 'en', lat: 23.8859, lon: 45.0792, zoom: 5 },
  IL: { name: 'イスラエル (Israel)', flag: '🇮🇱', region: '🌏 アジア', lang: 'en', lat: 31.0461, lon: 34.8516, zoom: 7 },
  JO: { name: 'ヨルダン (Jordan)', flag: '🇯🇴', region: '🌏 アジア', lang: 'en', lat: 30.5852, lon: 36.2384, zoom: 7 },
  LB: { name: 'レバノン (Lebanon)', flag: '🇱🇧', region: '🌏 アジア', lang: 'en', lat: 33.8547, lon: 35.8623, zoom: 8 },
  MV: { name: 'モルディブ (Maldives)', flag: '🇲🇻', region: '🌏 アジア', lang: 'en', lat: 3.2028, lon: 73.2207, zoom: 7 },
  AE: { name: 'アラブ首長国連邦 (UAE)', flag: '🇦🇪', region: '🌏 アジア', lang: 'en', lat: 23.4241, lon: 53.8478, zoom: 7 },

  // ヨーロッパ
  FR: { name: 'フランス (France)', flag: '🇫🇷', region: '🇪🇺 ヨーロッパ', lang: 'fr', lat: 46.6034, lon: 1.8883, zoom: 5 },
  ES: { name: 'スペイン (Spain)', flag: '🇪🇸', region: '🇪🇺 ヨーロッパ', lang: 'es', lat: 40.4637, lon: -3.7492, zoom: 6 },
  IT: { name: 'イタリア (Italy)', flag: '🇮🇹', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 41.8719, lon: 12.5674, zoom: 6 },
  GB: { name: 'イギリス (UK)', flag: '🇬🇧', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 55.3781, lon: -3.4360, zoom: 5 },
  DE: { name: 'ドイツ (Germany)', flag: '🇩🇪', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 51.1657, lon: 10.4515, zoom: 5 },
  CH: { name: 'スイス (Switzerland)', flag: '🇨🇭', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 46.8182, lon: 8.2275, zoom: 8 },
  AT: { name: 'オーストリア (Austria)', flag: '🇦🇹', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 47.5162, lon: 14.5501, zoom: 7 },
  GR: { name: 'ギリシャ (Greece)', flag: '🇬🇷', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 39.0742, lon: 21.8243, zoom: 7 },
  PT: { name: 'ポルトガル (Portugal)', flag: '🇵🇹', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 39.3999, lon: -8.2245, zoom: 7 },
  NL: { name: 'オランダ (Netherlands)', flag: '🇳🇱', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 52.1326, lon: 5.2913, zoom: 8 },
  SE: { name: 'スウェーデン (Sweden)', flag: '🇸🇪', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 60.1282, lon: 18.6435, zoom: 5 },
  NO: { name: 'ノルウェー (Norway)', flag: '🇳🇴', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 60.4720, lon: 8.4689, zoom: 5 },
  DK: { name: 'デンマーク (Denmark)', flag: '🇩🇰', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 56.2639, lon: 9.5018, zoom: 7 },
  FI: { name: 'フィンランド (Finland)', flag: '🇫🇮', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 61.9241, lon: 25.7482, zoom: 5 },
  TR: { name: 'トルコ (Turkey)', flag: '🇹🇷', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 38.9637, lon: 35.2433, zoom: 6 },
  PL: { name: 'ポーランド (Poland)', flag: '🇵🇱', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 51.9194, lon: 19.1451, zoom: 6 },
  CZ: { name: 'チェコ (Czech Republic)', flag: '🇨🇿', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 49.8175, lon: 15.4730, zoom: 7 },
  HU: { name: 'ハンガリー (Hungary)', flag: '🇭🇺', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 47.1625, lon: 19.5033, zoom: 7 },
  RO: { name: 'ルーマニア (Romania)', flag: '🇷🇴', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 45.9432, lon: 24.9668, zoom: 6 },
  BE: { name: 'ベルギー (Belgium)', flag: '🇧🇪', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 50.5039, lon: 4.4699, zoom: 8 },
  IE: { name: 'アイルランド (Ireland)', flag: '🇮🇪', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 53.1424, lon: -7.6921, zoom: 7 },
  IS: { name: 'アイスランド (Iceland)', flag: '🇮🇸', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 64.9631, lon: -19.0208, zoom: 6 },
  HR: { name: 'クロアチア (Croatia)', flag: '🇭🇷', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 45.1, lon: 15.2, zoom: 7 },
  UA: { name: 'ウクライナ (Ukraine)', flag: '🇺🇦', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 48.3794, lon: 31.1656, zoom: 6 },
  EE: { name: 'エストニア (Estonia)', flag: '🇪🇪', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 58.5953, lon: 25.0136, zoom: 7 },
  LV: { name: 'ラトビア (Latvia)', flag: '🇱🇻', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 56.8796, lon: 24.6032, zoom: 7 },
  LT: { name: 'リトアニア (Lithuania)', flag: '🇱🇹', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 55.1694, lon: 23.8813, zoom: 7 },
  SK: { name: 'スロバキア (Slovakia)', flag: '🇸🇰', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 48.6690, lon: 19.6990, zoom: 7 },
  SI: { name: 'スロベニア (Slovenia)', flag: '🇸🇮', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 46.1512, lon: 14.9955, zoom: 8 },
  BG: { name: 'ブルガリア (Bulgaria)', flag: '🇧🇬', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 42.7339, lon: 25.4858, zoom: 7 },
  RS: { name: 'セルビア (Serbia)', flag: '🇷🇸', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 44.0165, lon: 21.0059, zoom: 7 },
  AL: { name: 'アルバニア (Albania)', flag: '🇦🇱', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 41.1533, lon: 20.1683, zoom: 8 },
  BA: { name: 'ボスニア・ヘルツェゴビナ (Bosnia)', flag: '🇧🇦', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 43.9159, lon: 17.6791, zoom: 8 },
  ME: { name: 'モンテネグロ (Montenegro)', flag: '🇲🇪', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 42.7087, lon: 19.3744, zoom: 9 },
  MK: { name: '北マケドニア (North Macedonia)', flag: '🇲🇰', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 41.6086, lon: 21.7453, zoom: 8 },
  CY: { name: 'キプロス (Cyprus)', flag: '🇨🇾', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 35.1264, lon: 33.4299, zoom: 8 },
  MT: { name: 'マルタ (Malta)', flag: '🇲🇹', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 35.9375, lon: 14.3754, zoom: 11 },
  LU: { name: 'ルクセンブルク (Luxembourg)', flag: '🇱🇺', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 49.8153, lon: 6.1296, zoom: 10 },
  MC: { name: 'モナコ (Monaco)', flag: '🇲🇨', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 43.7384, lon: 7.4246, zoom: 14 },
  LI: { name: 'リヒテンシュタイン (Liechtenstein)', flag: '🇱🇮', region: '🇪🇺 ヨーロッパ', lang: 'en', lat: 47.166, lon: 9.555, zoom: 11 },

  // 北米・中南米
  US: { name: 'アメリカ (USA)', flag: '🇺🇸', region: '🗽 北米・中南米', lang: 'en', lat: 37.0902, lon: -95.7129, zoom: 4 },
  CA: { name: 'カナダ (Canada)', flag: '🇨🇦', region: '🗽 北米・中南米', lang: 'en', lat: 56.1304, lon: -106.3468, zoom: 3 },
  MX: { name: 'メキシコ (Mexico)', flag: '🇲🇽', region: '🗽 北米・中南米', lang: 'es', lat: 23.6345, lon: 102.5528, zoom: 5 },
  BR: { name: 'ブラジル (Brazil)', flag: '🇧🇷', region: '🗽 北米・中南米', lang: 'en', lat: -14.2350, lon: -51.9253, zoom: 4 },
  AR: { name: 'アルゼンチン (Argentina)', flag: '🇦🇷', region: '🗽 北米・中南米', lang: 'es', lat: -38.4161, lon: -63.6167, zoom: 4 },
  PE: { name: 'ペルー (Peru)', flag: '🇵🇪', region: '🗽 北米・中南米', lang: 'es', lat: -9.1900, lon: -75.0152, zoom: 5 },
  CL: { name: 'チリ (Chile)', flag: '🇨🇱', region: '🗽 北米・中南米', lang: 'es', lat: -35.6751, lon: -71.5430, zoom: 4 },
  CO: { name: 'コロンビア (Colombia)', flag: '🇨🇴', region: '🗽 北米・中南米', lang: 'es', lat: 4.5709, lon: -74.2973, zoom: 5 },
  CU: { name: 'キューバ (Cuba)', flag: '🇨🇺', region: '🗽 北米・中南米', lang: 'es', lat: 21.5218, lon: -77.7812, zoom: 7 },
  JM: { name: 'ジャマイカ (Jamaica)', flag: '🇯🇲', region: '🗽 北米・中南米', lang: 'en', lat: 18.1096, lon: -77.2975, zoom: 9 },
  CR: { name: 'コスタリカ (Costa Rica)', flag: '🇨🇷', region: '🗽 北米・中南米', lang: 'es', lat: 9.7489, lon: -83.7534, zoom: 8 },
  PA: { name: 'パナマ (Panama)', flag: '🇵🇦', region: '🗽 北米・中南米', lang: 'es', lat: 8.5380, lon: -80.7821, zoom: 8 },
  DO: { name: 'ドミニカ共和国 (Dominican Republic)', flag: '🇩🇴', region: '🗽 北米・中南米', lang: 'es', lat: 18.7357, lon: -70.1627, zoom: 8 },
  GT: { name: 'グアテマラ (Guatemala)', flag: '🇬🇹', region: '🗽 北米・中南米', lang: 'es', lat: 15.7835, lon: -90.2308, zoom: 8 },
  UY: { name: 'ウルグアイ (Uruguay)', flag: '🇺🇾', region: '🗽 北米・中南米', lang: 'es', lat: -32.5228, lon: -55.7658, zoom: 7 },

  // オセアニア
  AU: { name: 'オーストラリア (Australia)', flag: '🇦🇺', region: '🦘 オセアニア', lang: 'en', lat: -25.2744, lon: 133.7751, zoom: 4 },
  NZ: { name: 'ニュージーランド (New Zealand)', flag: '🇳🇿', region: '🦘 オセアニア', lang: 'en', lat: -40.9006, lon: 174.8860, zoom: 5 },
  FJ: { name: 'フィジー (Fiji)', flag: '🇫🇯', region: '🦘 オセアニア', lang: 'en', lat: -17.7134, lon: 178.0650, zoom: 8 },
  PG: { name: 'パプアニューギニア (Papua New Guinea)', flag: '🇵🇬', region: '🦘 オセアニア', lang: 'en', lat: -6.3149, lon: 143.9555, zoom: 6 },
  VU: { name: 'バヌアツ (Vanuatu)', flag: '🇻🇺', region: '🦘 オセアニア', lang: 'en', lat: -15.3767, lon: 166.9592, zoom: 7 },
  WS: { name: 'サモア (Samoa)', flag: '🇼🇸', region: '🦘 オセアニア', lang: 'en', lat: -13.7590, lon: -172.1046, zoom: 9 },
  TO: { name: 'トンガ (Tonga)', flag: '🇹🇴', region: '🦘 オセアニア', lang: 'en', lat: -21.1789, lon: -175.1982, zoom: 9 },

  // アフリカ
  EG: { name: 'エジプト (Egypt)', flag: '🇪🇬', region: '🦁 アフリカ', lang: 'en', lat: 26.8206, lon: 30.8025, zoom: 6 },
  ZA: { name: '南アフリカ (South Africa)', flag: '🇿🇦', region: '🦁 アフリカ', lang: 'en', lat: -30.5595, lon: 22.9375, zoom: 5 },
  MA: { name: 'モロッコ (Morocco)', flag: '🇲🇦', region: '🦁 アフリカ', lang: 'fr', lat: 31.7917, lon: -7.0926, zoom: 6 },
  KE: { name: 'ケニア (Kenya)', flag: '🇰🇪', region: '🦁 アフリカ', lang: 'en', lat: -0.0236, lon: 37.9062, zoom: 6 },
  TZ: { name: 'タンザニア (Tanzania)', flag: '🇹🇿', region: '🦁 アフリカ', lang: 'en', lat: -6.3690, lon: 34.8888, zoom: 6 },
  NG: { name: 'ナイジェリア (Nigeria)', flag: '🇳🇬', region: '🦁 アフリカ', lang: 'en', lat: 9.0820, lon: 8.6753, zoom: 6 },
  GH: { name: 'ガーナ (Ghana)', flag: '🇬🇭', region: '🦁 アフリカ', lang: 'en', lat: 7.9465, lon: -1.0232, zoom: 7 },
  ET: { name: 'エチオピア (Ethiopia)', flag: '🇪🇹', region: '🦁 アフリカ', lang: 'en', lat: 9.1450, lon: 40.4897, zoom: 6 },
  SN: { name: 'セネガル (Senegal)', flag: '🇸🇳', region: '🦁 アフリカ', lang: 'fr', lat: 14.4974, lon: -14.4524, zoom: 7 },
  MG: { name: 'マダガスカル (Madagascar)', flag: '🇲🇬', region: '🦁 アフリカ', lang: 'fr', lat: -18.7669, lon: 46.8691, zoom: 6 }
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

const GUIDE_FULL_TEXT = `【WorldSnap の使い方ガイド】
1. マップ機能：世界中の主要スポットを閲覧できます。ダブルタップでズームイン。
2. 写真・投稿：下部の「📷＋ 写真 / 動画を追加」から、アルバムの写真（EXIF位置情報付き）を簡単にマップに共有できます。
3. 足跡マップ：マイページの「足跡マップ」で訪問国をタップすると、周辺エリアがオレンジ色にハイライトされます。
4. 自動翻訳：投稿詳細にある翻訳ボタンを押すと、ご自身の選択した国籍の言語に一瞬で翻訳されます。`;

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
          radius: 8000,
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

  const [userNationality, setUserNationality] = useState<string>('JP');
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

  const currentConfig = COUNTRIES[userCountry] || COUNTRIES.JP;
  const currentLangCode = COUNTRIES[userNationality]?.lang || 'ja';
  const t = DICTIONaries[currentLangCode] || DICTIONaries.ja;

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

  // 設定メニューおよび各種モーダル管理用ステート
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isEulaModalOpen, setIsEulaModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isBlockListModalOpen, setIsBlockListModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [friendsList, setFriendsList] = useState<FriendUser[]>([]);
  const [inputFriendCode, setInputFriendCode] = useState('');

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
    const hasCompleted = localStorage.getItem('ws_onboarded_v3');
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
    localStorage.setItem('ws_onboarded_v3', 'true');
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

  const handleTranslateDescription = (spotId: string, originalText: string) => {
    if (translatedDescriptions[spotId]) {
      setTranslatedDescriptions(prev => {
        const next = { ...prev };
        delete next[spotId];
        return next;
      });
      return;
    }

    const targetLang = COUNTRIES[userNationality]?.lang || 'en';
    let translated = originalText;
    if (targetLang === 'en') {
      translated = `[Translated to English]: ${originalText}`;
    } else if (targetLang === 'ko') {
      translated = `[Translated to Korean]: ${originalText}`;
    } else if (targetLang === 'zh') {
      translated = `[Translated to Chinese]: ${originalText}`;
    } else if (targetLang === 'th') {
      translated = `[Translated to Thai]: ${originalText}`;
    } else {
      translated = `[Translated]: ${originalText}`;
    }

    setTranslatedDescriptions(prev => ({ ...prev, [spotId]: translated }));
    showToast(`🌐 ${targetLang.toUpperCase()} に翻訳しました！`);
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
                  {Object.entries(COUNTRIES).map(([code, c]) => (
                    <div
                      key={code}
                      onClick={() => setUserNationality(code)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `2px solid ${userNationality === code ? '#0284c7' : '#e2e8f0'}`,
                        background: userNationality === code ? '#f0f9ff' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{c.flag} {c.name} <span style={{ fontSize: '10px', color: '#94a3b8' }}>({c.region})</span></span>
                      {userNationality === code && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
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
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{c.flag} {c.name}</span>
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
              userLang={currentLangCode}
              footprintCountry={activeFootprintCountry}
              onMoveEnd={handleMapMoveEnd}
              onSelectSpot={handleOpenSpot}
              onDoubleTap={handleMapDoubleTap}
            />

            {/* 現在地・ズームアウト・保存 */}
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
                      () => showToast('⚠️ 位置情報の取得に失敗しました')
                    );
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
                {tab === 'posts' ? `📸 Posts` : tab === 'footprint' ? `🌍 Footprint` : tab === 'timeline' ? `📅 Log` : tab === 'saved' ? `💛 Saved` : tab === 'badges' ? `🏅 Badges` : `👥 Friends`}
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

      {/* ── 設定メニューモーダル（利用規約・ブロックリスト・使い方ガイド等を復旧） ── */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '400px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>{t.settings}</h3>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t.nationalitySetting}</label>
              <select
                value={userNationality}
                onChange={(e) => setUserNationality(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold' }}
              >
                {Object.entries(COUNTRIES).map(([code, c]) => (
                  <option key={code} value={code}>
                    {c.flag} {c.name} ({c.lang.toUpperCase()})
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
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 各種復旧ボタン群 */}
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

      {/* ── 詳細モーダル (翻訳機能付き) ── */}
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
            <div style={{ width: '100%', height: '280px', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
              <img src={selectedSpot.fileUrl} alt={selectedSpot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

      {/* ── 写真・動画追加時の投稿作成モーダル ── */}
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

            {/* 住所検索 ＆ サジェストリスト */}
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
