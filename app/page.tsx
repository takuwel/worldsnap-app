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
// 1. 型定義 & 拡充された多言語コンプラNGワード辞書 & 196カ国マスターデータ
// ==========================================
export type ViewCategory = 'view' | 'gourmet' | 'rain';
export type DisplayScope = 'my' | 'friends' | 'world';
export type TabType = 'map' | 'timeline' | 'ranking' | 'profile';
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

// 15言語以上の多言語コンプライアンス・NGワード（暴言・差別・ヘイト等）
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
  'nigger', 'faggot', 'retard', 'suicide', 'kill', 'rape', 'cocaine', 'heroin', 'nazi', 'hitler', 'bastard', 'suck',
  '시발', '새끼', '개새끼', '병신', '지랄', '미친', '죽여', '꺼져', '창녀', '호구', '쓰레기',
  '操', '傻逼', '去死', '混蛋', '废物', '滚', '贱人', '妓女', '白痴', '死', '毒品',
  'puta', 'mierda', 'cabrón', 'estúpido', 'idiota', 'pendejo', 'imbécil', 'maricón',
  'merde', 'connard', 'salope', 'putain', 'enculé', 'fdp', 'imbécile',
  'scheisse', 'arschloch', 'hurensohn', 'verdammt', 'schlampe', 'idiot',
  'caralho', 'filho da puta', 'merda', 'porra', 'puta', 'idiota',
  'stronzo', 'merda', 'vaffanculo', 'cazzo', 'cretino', 'puttana',
  'сука', 'блять', 'ебать', 'хуй', 'пизда', 'мудак',
  'كلب', 'حمار', 'متناك', 'منيوك', 'قحبة',
  'Hia', 'E-dok', 'Kwai', 'Sat',
  'địt', 'đụ', 'mẹ mày', 'chó', 'khốn nạn',
  'anjing', 'babi', 'kampret', 'bangsat', 'kontol', 'memek'
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

function getUserTitle(count: number, lang: string) {
  if (lang === 'en') {
    if (count >= 100) return { title: '👑 Master of 100 Views', color: '#eab308' };
    if (count >= 50) return { title: '🏔️ Explorer of 50 Views', color: '#8b5cf6' };
    if (count >= 10) return { title: '🎒 Traveler of 10 Views', color: '#38bdf8' };
    if (count >= 1) return { title: '🌱 Apprentice Explorer', color: '#22c55e' };
    return { title: '🐣 Travel Beginner', color: '#94a3b8' };
  } else if (lang === 'ko') {
    if (count >= 100) return { title: '👑 100경의 패자', color: '#eab308' };
    if (count >= 50) return { title: '🏔️ 50경의 개척자', color: '#8b5cf6' };
    if (count >= 10) return { title: '🎒 10경의 트래블러', color: '#38bdf8' };
    if (count >= 1) return { title: '🌱 초보 탐험가', color: '#22c55e' };
    return { title: '🐣 여행 비기너', color: '#94a3b8' };
  } else if (lang === 'zh') {
    if (count >= 100) return { title: '👑 百景霸者', color: '#eab308' };
    if (count >= 50) return { title: '🏔️ 五十景开拓者', color: '#8b5cf6' };
    if (count >= 10) return { title: '🎒 十景旅行者', color: '#38bdf8' };
    if (count >= 1) return { title: '🌱 见习探险家', color: '#22c55e' };
    return { title: '🐣 旅游新手', color: '#94a3b8' };
  } else {
    if (count >= 100) return { title: '👑 百景の覇者', color: '#eab308' };
    if (count >= 50) return { title: '🏔️ 五十景の開拓者', color: '#8b5cf6' };
    if (count >= 10) return { title: '🎒 十景のトラベラー', color: '#38bdf8' };
    if (count >= 1) return { title: '🌱 見習い探検家', color: '#22c55e' };
    return { title: '🐣 旅のビギナー', color: '#94a3b8' };
  }
}

export const LANGUAGES: Record<string, { name: string; nativeName: string; flag: string }> = {
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  zh: { name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  zh_tw: { name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
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
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  ms: { name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  tl: { name: 'Filipino', nativeName: 'Tagalog', flag: '🇵🇭' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  pl: { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  sv: { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' }
};

export const DICTIONARIES: Record<string, Record<string, string>> = {
  ja: {
    step1Title: 'Step 1: 表示言語を選択',
    step1Desc: '世界中の人々が使えるよう、お好みの言語を選択してください。',
    step2Title: 'Step 2: ベースの国（初期マップ）を選択',
    step2Desc: 'マップの初期表示位置となるメインの国を選んでください（全196カ国対応・地域別）。',
    step3Title: 'Step 3: プロフィール作成',
    step3TitleEula: 'Step 4: 利用規約 & 位置情報ポリシーの確認',
    next: '次へ進む',
    back: '戻る',
    startApp: '🚀 wap をはじめる',
    eulaAgree: '利用規約および位置情報の利用方針に同意する（必須）',
    map: 'マップ',
    feed: 'タイムライン',
    ranking: 'ランキング',
    profile: 'マイページ',
    addPhoto: '写真 / 動画を追加',
    exportMap: 'マップ保存',
    view: '景色',
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
    countrySearchPlaceholder: '🔍 国名で検索 (例: 日本、フランス)',
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
    tabFriends: '👥 フレンド',
    reportSpot: '🚨 この投稿を通報する',
    blockUser: '🚫 このユーザーをブロックする',
    supportContactBtn: '✉️ サポート・お問い合わせ（メールを送る）',
    scopeWorld: '🌎 ワールド',
    scopeFriends: '👥 フレンド',
    scopeMy: '📍 マイマップ',
    deleteAccountBtn: '⚠️ アカウントを削除（退会する）',
    commentPlaceholder: '💬 コメントを入力...',
    commentSend: '送信',
    myQrCode: '📱 自分のQRコード',
    scanQrCode: '📷 QRコードをスキャン',
    eulaFullText: `【wap 利用規約および位置情報ポリシー（Apple審査対応版）】

第1条（目的および同意）
本規約は、マップ共有アプリ「wap」の利用条件を定めるものです。すべてのユーザーは、本規約および位置情報の取得・利用に同意した上で本サービスを利用するものとします。

第2条（位置情報の取得・利用について・パーミッション目的）
1. 当サービスは、ユーザーがマップ画面の「現在地ボタン（🎯）」をタップした際に、デバイスのGPS等の位置情報を一時的に取得します。
2. 取得した位置情報は、「周辺の旅のスポットを検索・表示するため」「現在地を中心にマップを表示するため」にのみ使用されます。
3. 当サービスは、ユーザーの明示的な許可なしにバックグラウンドでの位置情報追跡を行わず、位置情報を第三者に販売・提供することはありません。

第3条（コンテンツの安全性と免責事項・情報の正確性について）
1. 本アプリでは、ユーザー生成コンテンツ（UGC）の安全性を保つため、暴言、ヘイトスピーチ、差別的表現、過度な性的表現などの不適切な投稿を厳禁としています。
2. 掲載されているスポットの写真や店舗情報は投稿時点のものであり、現在地において建物がなくなっている、閉店している、またはリニューアルされている場合があります。当サービスは掲載情報の正確性や現状への適合性を保証するものではなく、現地に赴く際はユーザーご自身の責任で最新情報をご確認ください。
3. 各投稿やコメントには応援機能および悪質ユーザーの「ブロック（🚫）」機能、ならびにお問い合わせ窓口（wap.support.official@gmail.com）を完備しています。`,
    guideFullText: `[wap 操作ガイド]
1. 現在地への移動（🎯ボタン）
2. マップ操作とズーム
3. メディアの投稿
4. 交流・安全機能`
  },
  en: {
    step1Title: 'Step 1: Select Language',
    step1Desc: 'Choose your preferred language.',
    step2Title: 'Step 2: Select Base Country',
    step2Desc: 'Choose initial country.',
    step3Title: 'Step 3: Create Profile',
    step3TitleEula: 'Step 4: Terms & Policy',
    next: 'Next',
    back: 'Back',
    startApp: '🚀 Start wap',
    eulaAgree: 'I agree to the Terms & Policy (Required)',
    map: 'Map',
    feed: 'Feed',
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
    countrySearchPlaceholder: '🔍 Search country name...',
    settings: '⚙️ Settings',
    langSetting: '🌐 Language',
    baseCountrySetting: '📍 Base Country',
    blockListTitle: '🚫 Blocked Users',
    eulaTitle: '📜 Terms of Service & Support',
    guideTitle: '📖 App Guide',
    translate: '🌐 Translate',
    close: 'Close',
    tabPosts: '📸 Posts',
    tabTimeline: '📅 Log',
    tabSaved: '💛 Saved',
    tabBadges: '🏅 Badges',
    tabFriends: '👥 Friends',
    reportSpot: '🚨 Report this post',
    blockUser: '🚫 Block this user',
    supportContactBtn: '✉️ Contact Support (wap.support.official@gmail.com)',
    scopeWorld: '🌎 World',
    scopeFriends: '👥 Friends',
    scopeMy: '📍 My Map',
    deleteAccountBtn: '⚠️ Delete Account',
    commentPlaceholder: '💬 Write a comment...',
    commentSend: 'Send',
    myQrCode: '📱 My QR Code',
    scanQrCode: '📷 Scan QR Code',
    eulaFullText: `[wap Terms of Service & Location Policy]\nContact: wap.support.official@gmail.com`,
    guideFullText: `[wap Guide]`
  },
  ko: {
    step1Title: 'Step 1: 언어 선택',
    step1Desc: '언어를 선택하세요.',
    step2Title: 'Step 2: 기본 국가 선택',
    step2Desc: '기본 국가를 선택하세요.',
    step3Title: 'Step 3: 프로필 설정',
    step3TitleEula: 'Step 4: 이용약관',
    next: '다음',
    back: '뒤로',
    startApp: '🚀 wap 시작하기',
    eulaAgree: '동의합니다 (필수)',
    map: '지도',
    feed: '피드',
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
    openGoogleMaps: '🧭 길찾기',
    likeSpot: '❤️ 좋아요',
    likedSpot: '❤️ 좋아요 취소',
    report: '⚠️ 신고',
    block: '🚫 차단',
    delete: '🗑️ 삭제',
    edit: '✏️ 수정',
    visited: '방문',
    posts: '게시물',
    friendCode: '친구 코드',
    searchPlaceholder: '🔍 검색',
    countrySearchPlaceholder: '🔍 국가 검색',
    settings: '⚙️ 설정',
    langSetting: '🌐 언어',
    baseCountrySetting: '📍 기본 국가',
    blockListTitle: '🚫 차단 목록',
    eulaTitle: '📜 이용약관',
    guideTitle: '📖 가이드',
    translate: '🌐 번역',
    close: '닫기',
    tabPosts: '📸 게시물',
    tabTimeline: '📅 로그',
    tabSaved: '💛 저장',
    tabBadges: '🏅 배지',
    tabFriends: '👥 친구',
    reportSpot: '🚨 신고',
    blockUser: '🚫 차단',
    supportContactBtn: '✉️ 문의 (wap.support.official@gmail.com)',
    scopeWorld: '🌎 전체',
    scopeFriends: '👥 친구',
    scopeMy: '📍 내 지도',
    deleteAccountBtn: '⚠️ 계정 삭제',
    commentPlaceholder: '💬 댓글 입력...',
    commentSend: '전송',
    myQrCode: '📱 QR',
    scanQrCode: '📷 스캔',
    eulaFullText: `[이용약관]\n문의: wap.support.official@gmail.com`,
    guideFullText: `[가이드]`
  },
  zh: {
    step1Title: '步骤 1: 选择语言',
    step1Desc: '请选择语言。',
    step2Title: 'Step 2: 选择基础国家',
    step2Desc: '请选择国家。',
    step3Title: 'Step 3: 创建个人资料',
    step3TitleEula: 'Step 4: 条款',
    next: '下一步',
    back: '返回',
    startApp: '🚀 开始使用 wap',
    eulaAgree: '同意条款 (必填)',
    map: '地图',
    feed: '动态',
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
    openGoogleMaps: '🧭 导航',
    likeSpot: '❤️ 赞',
    likedSpot: '❤️ 已赞',
    report: '⚠️ 举报',
    block: '🚫 拉黑',
    delete: '🗑️ 删除',
    edit: '编辑',
    visited: '已访问',
    posts: '动态',
    friendCode: '好友码',
    searchPlaceholder: '🔍 搜索...',
    countrySearchPlaceholder: '🔍 搜索国家...',
    settings: '⚙️ 设置',
    langSetting: '🌐 语言',
    baseCountrySetting: '📍 基础国家',
    blockListTitle: '🚫 已屏蔽',
    eulaTitle: '📜 条款',
    guideTitle: '📖 指南',
    translate: '🌐 翻译',
    close: '关闭',
    tabPosts: '📸 动态',
    tabTimeline: '📅 日志',
    tabSaved: '💛 收藏',
    tabBadges: '🏅 徽章',
    tabFriends: '👥 好友',
    reportSpot: '🚨 举报',
    blockUser: '🚫 屏蔽',
    supportContactBtn: '✉️ 客服 (wap.support.official@gmail.com)',
    scopeWorld: '🌎 世界',
    scopeFriends: '👥 好友',
    scopeMy: '📍 我的地图',
    deleteAccountBtn: '⚠️ 注销',
    commentPlaceholder: '💬 输入评论...',
    commentSend: '发送',
    myQrCode: '📱 二维码',
    scanQrCode: '📷 扫描',
    eulaFullText: `[服务条款]\n联系邮箱: wap.support.official@gmail.com`,
    guideFullText: `[指南]`
  }
};

// ==========================================
// 全世界「全196カ国」完全網羅マスターデータ（地域別に整理）
// ==========================================
export const COUNTRIES: Record<string, { names: Record<string, string>; flag: string; region: string; lat: number; lon: number; zoom: number }> = {
  JP: { names: { ja: '日本', en: 'Japan', ko: '일본', zh: '日本' }, flag: '🇯🇵', region: '🌏 アジア', lat: 36.2048, lon: 138.2529, zoom: 5 },
  CN: { names: { ja: '中国', en: 'China', ko: '중국', zh: '中国' }, flag: '🇨🇳', region: '🌏 アジア', lat: 35.8617, lon: 104.1954, zoom: 4 },
  KR: { names: { ja: '韓国', en: 'South Korea', ko: '한국', zh: '한국' }, flag: '🇰🇷', region: '🌏 アジア', lat: 35.9078, lon: 127.7669, zoom: 7 },
  KP: { names: { ja: '北朝鮮', en: 'North Korea', ko: '북한', zh: '朝鲜' }, flag: '🇰🇵', region: '🌏 アジア', lat: 40.3399, lon: 127.5101, zoom: 6 },
  TW: { names: { ja: '台湾', en: 'Taiwan', ko: '대만', zh: '台湾' }, flag: '🇹🇼', region: '🌏 アジア', lat: 23.6978, lon: 120.9605, zoom: 7 },
  MN: { names: { ja: 'モンゴル', en: 'Mongolia', ko: '몽골', zh: '蒙古' }, flag: '🇲🇳', region: '🌏 アジア', lat: 46.8625, lon: 103.8467, zoom: 5 },
  HK: { names: { ja: '香港', en: 'Hong Kong', ko: '홍콩', zh: '香港' }, flag: '🇭🇰', region: '🌏 アジア', lat: 22.3193, lon: 114.1694, zoom: 11 },
  MO: { names: { ja: 'マカオ', en: 'Macau', ko: '마카오', zh: '澳门' }, flag: '🇲🇴', region: '🌏 アジア', lat: 22.1987, lon: 113.5439, zoom: 12 },
  TH: { names: { ja: 'タイ', en: 'Thailand', ko: '태국', zh: '泰国' }, flag: '🇹🇭', region: '🌴 東南アジア', lat: 15.8700, lon: 100.9925, zoom: 6 },
  VN: { names: { ja: 'ベトナム', en: 'Vietnam', ko: '베트남', zh: '越南' }, flag: '🇻🇳', region: '🌴 東南アジア', lat: 14.0583, lon: 108.2772, zoom: 6 },
  SG: { names: { ja: 'シンガポール', en: 'Singapore', ko: '싱가포르', zh: '新加坡' }, flag: '🇸🇬', region: '🌴 東南アジア', lat: 1.3521, lon: 103.8198, zoom: 11 },
  MY: { names: { ja: 'マレーシア', en: 'Malaysia', ko: '말레이시아', zh: '马来西亚' }, flag: '🇲🇾', region: '🌴 東南アジア', lat: 4.2105, lon: 101.9758, zoom: 6 },
  ID: { names: { ja: 'インドネシア', en: 'Indonesia', ko: '인도네시아', zh: '印度尼西亚' }, flag: '🇮🇩', region: '🌴 東南アジア', lat: -0.7893, lon: 113.9213, zoom: 5 },
  PH: { names: { ja: 'フィリピン', en: 'Philippines', ko: '필리핀', zh: '필리핀' }, flag: '🇵🇭', region: '🌴 東南アジア', lat: 12.8797, lon: 121.7740, zoom: 6 },
  KH: { names: { ja: 'カンボジア', en: 'Cambodia', ko: '캄보디아', zh: '柬埔寨' }, flag: '🇰🇭', region: '🌴 東南アジア', lat: 12.5657, lon: 104.9910, zoom: 7 },
  LA: { names: { ja: 'ラオス', en: 'Laos', ko: '라오스', zh: '老挝' }, flag: '🇱🇦', region: '🌴 東南アジア', lat: 19.8563, lon: 102.4955, zoom: 6 },
  MM: { names: { ja: 'ミャンマー', en: 'Myanmar', ko: '미얀마', zh: '缅甸' }, flag: '🇲🇲', region: '🌴 東南アジア', lat: 21.9162, lon: 95.9560, zoom: 5 },
  BN: { names: { ja: 'ブルネイ', en: 'Brunei', ko: '브루네이', zh: '文莱' }, flag: '🇧🇳', region: '🌴 東南アジア', lat: 4.5353, lon: 114.7277, zoom: 9 },
  TL: { names: { ja: '東ティモール', en: 'East Timor', ko: '동티모르', zh: '东帝汶' }, flag: '🇹🇱', region: '🌴 東南アジア', lat: -8.8742, lon: 125.7275, zoom: 9 },
  IN: { names: { ja: 'インド', en: 'India', ko: '인도', zh: '印度' }, flag: '🇮🇳', region: '🍛 南・中央アジア', lat: 20.5937, lon: 78.9629, zoom: 5 },
  PK: { names: { ja: 'パキスタン', en: 'Pakistan', ko: '파키스탄', zh: '巴基斯坦' }, flag: '🇵🇰', region: '🍛 南・中央アジア', lat: 30.3753, lon: 69.3451, zoom: 5 },
  BD: { names: { ja: 'バングラデシュ', en: 'Bangladesh', ko: '방글라데시', zh: '孟加拉国' }, flag: '🇧🇩', region: '🍛 南・中央アジア', lat: 23.6850, lon: 90.3563, zoom: 6 },
  LK: { names: { ja: 'スリランカ', en: 'Sri Lanka', ko: '스리랑카', zh: '斯里兰卡' }, flag: '🇱🇰', region: '🍛 南・中央アジア', lat: 7.8731, lon: 80.7718, zoom: 7 },
  NP: { names: { ja: 'ネパール', en: 'Nepal', ko: '네팔', zh: '尼泊尔' }, flag: '🇳🇵', region: '🍛 南・中央アジア', lat: 28.3949, lon: 84.1240, zoom: 6 },
  BT: { names: { ja: 'ブータン', en: 'Bhutan', ko: '부탄', zh: '不丹' }, flag: '🇧🇹', region: '🍛 南・中央アジア', lat: 27.5142, lon: 90.4336, zoom: 8 },
  MV: { names: { ja: 'モルディブ', en: 'Maldives', ko: '몰디브', zh: '马尔代夫' }, flag: '🇲🇻', region: '🍛 南・中央アジア', lat: 3.2028, lon: 73.2207, zoom: 7 },
  AF: { names: { ja: 'アフガニスタン', en: 'Afghanistan', ko: '아프가니스탄', zh: '阿富汗' }, flag: '🇦🇫', region: '🍛 南・中央アジア', lat: 33.9391, lon: 67.7100, zoom: 6 },
  KZ: { names: { ja: 'カザフスタン', en: 'Kazakhstan', ko: '카자흐스탄', zh: '哈萨克斯坦' }, flag: '🇰🇿', region: '🍛 南・中央アジア', lat: 48.0196, lon: 66.9237, zoom: 4 },
  UZ: { names: { ja: 'ウズベキスタン', en: 'Uzbekistan', ko: '우즈베키스탄', zh: '乌兹别克斯坦' }, flag: '🇺🇿', region: '🍛 南・中央アジア', lat: 41.3775, lon: 64.5853, zoom: 5 },
  TM: { names: { ja: 'トルクメニスタン', en: 'Turkmenistan', ko: '투르크메니스탄', zh: '土库曼斯坦' }, flag: '🇹🇲', region: '🍛 南・中央アジア', lat: 38.9697, lon: 59.5563, zoom: 6 },
  KG: { names: { ja: 'キルギス', en: 'Kyrgyzstan', ko: '키르기스스탄', zh: '吉尔吉斯斯坦' }, flag: '🇰🇬', region: '🍛 南・中央アジア', lat: 41.2044, lon: 74.7661, zoom: 7 },
  TJ: { names: { ja: 'タジキスタン', en: 'Tajikistan', ko: '타지키스탄', zh: '塔吉克斯坦' }, flag: '🇹🇯', region: '🍛 南・中央アジア', lat: 38.8610, lon: 71.2761, zoom: 7 },
  AE: { names: { ja: 'アラブ首長国連邦', en: 'UAE', ko: '아랍에미리트', zh: '아랍에미리트' }, flag: '🇦🇪', region: '🕌 中東', lat: 23.4241, lon: 53.8478, zoom: 7 },
  SA: { names: { ja: 'サウジアラビア', en: 'Saudi Arabia', ko: '사우디아라비아', zh: '沙特阿拉伯' }, flag: '🇸🇦', region: '🕌 中東', lat: 23.8859, lon: 45.0792, zoom: 5 },
  QA: { names: { ja: 'カタール', en: 'Qatar', ko: '카타르', zh: '卡塔尔' }, flag: '🇶🇦', region: '🕌 中東', lat: 25.3548, lon: 51.1839, zoom: 8 },
  OM: { names: { ja: 'オマーン', en: 'Oman', ko: '오만', zh: '阿曼' }, flag: '🇴🇲', region: '🕌 中東', lat: 21.4735, lon: 55.9754, zoom: 6 },
  BH: { names: { ja: 'バーレーン', en: 'Bahrain', ko: '바레인', zh: '巴林' }, flag: '🇧🇭', region: '🕌 中東', lat: 26.0667, lon: 50.5577, zoom: 10 },
  KW: { names: { ja: 'クウェート', en: 'Kuwait', ko: '쿠웨이트', zh: '科威特' }, flag: '🇰🇼', region: '🕌 中東', lat: 29.3117, lon: 47.4818, zoom: 9 },
  JO: { names: { ja: 'ヨルダン', en: 'Jordan', ko: '요르단', zh: '约旦' }, flag: '🇯🇴', region: '🕌 中東', lat: 30.5852, lon: 36.2384, zoom: 7 },
  IL: { names: { ja: 'イスラエル', en: 'Israel', ko: '이스라엘', zh: '이스라엘' }, flag: '🇮🇱', region: '🕌 中東', lat: 31.0461, lon: 34.8516, zoom: 7 },
  LB: { names: { ja: 'レバノン', en: 'Lebanon', ko: '레바논', zh: '黎巴嫩' }, flag: '🇱🇧', region: '🕌 中東', lat: 33.8547, lon: 35.8623, zoom: 8 },
  IQ: { names: { ja: 'イラク', en: 'Iraq', ko: '이라크', zh: '伊拉克' }, flag: '🇮🇶', region: '🕌 中東', lat: 33.2232, lon: 43.6793, zoom: 6 },
  IR: { names: { ja: 'イラン', en: 'Iran', ko: '이란', zh: '伊朗' }, flag: '🇮🇷', region: '🕌 中東', lat: 32.4279, lon: 53.6880, zoom: 5 },
  SY: { names: { ja: 'シリア', en: 'Syria', ko: '시리아', zh: '叙利亚' }, flag: '🇸🇾', region: '🕌 中東', lat: 34.8021, lon: 38.9968, zoom: 7 },
  YE: { names: { ja: 'イエメン', en: 'Yemen', ko: '예멘', zh: '也门' }, flag: '🇾🇪', region: '🕌 中東', lat: 15.5527, lon: 48.5164, zoom: 6 },
  AM: { names: { ja: 'アルメニア', en: 'Armenia', ko: '아르메니아', zh: '亚美尼亚' }, flag: '🇦🇲', region: '🕌 中東', lat: 40.0691, lon: 45.0382, zoom: 8 },
  AZ: { names: { ja: 'アゼルバイジャン', en: 'Azerbaijan', ko: '아제르바이잔', zh: '阿塞拜疆' }, flag: '🇦🇿', region: '🕌 中東', lat: 40.1431, lon: 47.5769, zoom: 7 },
  GE: { names: { ja: 'ジョージア', en: 'Georgia', ko: '조지아', zh: '格鲁吉亚' }, flag: '🇬🇪', region: '🕌 中東', lat: 42.3154, lon: 43.3569, zoom: 7 },
  FR: { names: { ja: 'フランス', en: 'France', ko: '프랑스', zh: '法国' }, flag: '🇫🇷', region: '🇪🇺 ヨーロッパ', lat: 46.6034, lon: 1.8883, zoom: 5 },
  ES: { names: { ja: 'スペイン', en: 'Spain', ko: '스페인', zh: '西班牙' }, flag: '🇪🇸', region: '🇪🇺 ヨーロッパ', lat: 40.4637, lon: -3.7492, zoom: 6 },
  IT: { names: { ja: 'イタリア', en: 'Italy', ko: '이탈리아', zh: '意大利' }, flag: '🇮🇹', region: '🇪🇺 ヨーロッパ', lat: 41.8719, lon: 12.5674, zoom: 6 },
  GB: { names: { ja: 'イギリス', en: 'UK', ko: '영국', zh: '英国' }, flag: '🇬🇧', region: '🇪🇺 ヨーロッパ', lat: 55.3781, lon: -3.4360, zoom: 5 },
  DE: { names: { ja: 'ドイツ', en: 'Germany', ko: '독일', zh: '德国' }, flag: '🇩🇪', region: '🇪🇺 ヨーロッパ', lat: 51.1657, lon: 10.4515, zoom: 5 },
  TR: { names: { ja: 'トルコ', en: 'Turkey', ko: '터키', zh: '土耳其' }, flag: '🇹🇷', region: '🇪🇺 ヨーロッパ', lat: 38.9637, lon: 35.2433, zoom: 6 },
  GR: { names: { ja: 'ギリシャ', en: 'Greece', ko: '그리스', zh: '希腊' }, flag: '🇬🇷', region: '🇪🇺 ヨーロッパ', lat: 39.0742, lon: 21.8243, zoom: 7 },
  AT: { names: { ja: 'オーストリア', en: 'Austria', ko: '오스트리아', zh: '奥地利' }, flag: '🇦🇹', region: '🇪🇺 ヨーロッパ', lat: 47.5162, lon: 14.5501, zoom: 7 },
  PT: { names: { ja: 'ポルトガル', en: 'Portugal', ko: '포르투갈', zh: '葡萄牙' }, flag: '🇵🇹', region: '🇪🇺 ヨーロッパ', lat: 39.3999, lon: -8.2245, zoom: 7 },
  NL: { names: { ja: 'オランダ', en: 'Netherlands', ko: '네덜란드', zh: '荷兰' }, flag: '🇳🇱', region: '🇪🇺 ヨーロッパ', lat: 52.1326, lon: 5.2913, zoom: 8 },
  CH: { names: { ja: 'スイス', en: 'Switzerland', ko: '스위스', zh: '瑞士' }, flag: '🇨🇭', region: '🇪🇺 ヨーロッパ', lat: 46.8182, lon: 8.2275, zoom: 8 },
  PL: { names: { ja: 'ポーランド', en: 'Poland', ko: '폴란드', zh: '波兰' }, flag: '🇵🇱', region: '🇪🇺 ヨーロッパ', lat: 51.9194, lon: 19.1451, zoom: 6 },
  CZ: { names: { ja: 'チェコ', en: 'Czech Republic', ko: '체코', zh: '捷克' }, flag: '🇨🇿', region: '🇪🇺 ヨーロッパ', lat: 49.8175, lon: 15.4730, zoom: 7 },
  HU: { names: { ja: 'ハンガリー', en: 'Hungary', ko: '헝가리', zh: '匈牙利' }, flag: '🇭🇺', region: '🇪🇺 ヨーロッパ', lat: 47.1625, lon: 19.5033, zoom: 7 },
  IE: { names: { ja: 'アイルランド', en: 'Ireland', ko: '아이슬란드', zh: '爱尔兰' }, flag: '🇮🇪', region: '🇪🇺 ヨーロッパ', lat: 53.1424, lon: -7.6921, zoom: 7 },
  BE: { names: { ja: 'ベルギー', en: 'Belgium', ko: '벨기에', zh: '比利时' }, flag: '🇧🇪', region: '🇪🇺 ヨーロッパ', lat: 50.5039, lon: 4.4699, zoom: 8 },
  HR: { names: { ja: 'クロアチア', en: 'Croatia', ko: '크로아티아', zh: 'クロアチア' }, flag: '🇭🇷', region: '🇪🇺 ヨーロッパ', lat: 45.1000, lon: 15.2000, zoom: 7 },
  RO: { names: { ja: 'ルーマニア', en: 'Romania', ko: '루마니아', zh: 'ルーマニア' }, flag: '🇷🇴', region: '🇪🇺 ヨーロッパ', lat: 45.9432, lon: 24.9668, zoom: 6 },
  UA: { names: { ja: 'ウクライナ', en: 'Ukraine', ko: '우크라이나', zh: 'ウクライナ' }, flag: '🇺🇦', region: '🇪🇺 ヨーロッパ', lat: 48.3794, lon: 31.1656, zoom: 6 },
  BG: { names: { ja: 'ブルガリア', en: 'Bulgaria', ko: '불가리아', zh: '保加利亚' }, flag: '🇧🇬', region: '🇪🇺 ヨーロッパ', lat: 42.7339, lon: 25.4858, zoom: 7 },
  RS: { names: { ja: 'セルビア', en: 'Serbia', ko: '세르비아', zh: 'セルビア' }, flag: '🇷🇸', region: '🇪🇺 ヨーロッパ', lat: 44.0165, lon: 21.0059, zoom: 7 },
  SK: { names: { ja: 'スロバキア', en: 'Slovakia', ko: '슬로바키아', zh: '斯洛伐克' }, flag: '🇸🇰', region: '🇪🇺 ヨーロッパ', lat: 48.6690, lon: 19.6990, zoom: 7 },
  SI: { names: { ja: 'スロベニア', en: 'Slovenia', ko: '슬로베니아', zh: '斯ロ베ニア' }, flag: '🇸🇮', region: '🇪🇺 ヨーロッパ', lat: 46.1512, lon: 14.9955, zoom: 8 },
  EE: { names: { ja: 'エストニア', en: 'Estonia', ko: '에스토니아', zh: '爱沙尼亚' }, flag: '🇪🇪', region: '🇪🇺 ヨーロッパ', lat: 58.5953, lon: 25.0136, zoom: 7 },
  LV: { names: { ja: 'ラトビア', en: 'Latvia', ko: '라트비아', zh: '拉脱维亚' }, flag: '🇱🇻', region: '🇪🇺 ヨーロッパ', lat: 56.8796, lon: 24.6032, zoom: 7 },
  LT: { names: { ja: 'リトアニア', en: 'Lithuania', ko: '리투아니아', zh: '立陶宛' }, flag: '🇱🇹', region: '🇪🇺 ヨーロッパ', lat: 55.1694, lon: 23.8813, zoom: 7 },
  LU: { names: { ja: 'ルクセンブルク', en: 'Luxembourg', ko: '룩셈부르크', zh: '卢森堡' }, flag: '🇱🇺', region: '🇪🇺 ヨーロッパ', lat: 49.8153, lon: 6.1296, zoom: 10 },
  MC: { names: { ja: 'モナコ', en: 'Monaco', ko: '모나코', zh: '摩纳哥' }, flag: '🇲🇨', region: '🇪🇺 ヨーロッパ', lat: 43.7384, lon: 7.4246, zoom: 14 },
  VA: { names: { ja: 'バチカン市国', en: 'Vatican City', ko: '바티칸', zh: '梵蒂冈' }, flag: '🇻🇦', region: '🇪🇺 ヨーロッパ', lat: 41.9029, lon: 12.4534, zoom: 15 },
  SM: { names: { ja: 'サンマリノ', en: 'San Marino', ko: '산마리노', zh: '圣马力诺' }, flag: '🇸🇲', region: '🇪🇺 ヨーロッパ', lat: 43.9424, lon: 12.4578, zoom: 12 },
  AD: { names: { ja: 'アンドラ', en: 'Andorra', ko: '안도라', zh: '安道尔' }, flag: '🇦🇩', region: '🇪🇺 ヨーロッパ', lat: 42.5063, lon: 1.5218, zoom: 10 },
  LI: { names: { ja: 'リヒテンシュタイン', en: 'Liechtenstein', ko: '리혼슈타인', zh: '列支敦士登' }, flag: '🇱🇮', region: '🇪🇺 ヨーロッパ', lat: 47.1660, lon: 9.5550, zoom: 11 },
  CY: { names: { ja: 'キプロス', en: 'Cyprus', ko: '키프로스', zh: '塞浦路斯' }, flag: '🇨🇾', region: '🇪🇺 ヨーロッパ', lat: 35.1264, lon: 33.4299, zoom: 8 },
  MT: { names: { ja: 'マルタ', en: 'Malta', ko: '몰타', zh: '马耳他' }, flag: '🇲🇹', region: '🇪🇺 ヨーロッパ', lat: 35.9375, lon: 14.3754, zoom: 11 },
  AL: { names: { ja: 'アルバニア', en: 'Albania', ko: '알바니아', zh: '阿尔巴尼亚' }, flag: '🇦🇱', region: '🇪🇺 ヨーロッパ', lat: 41.1533, lon: 20.1683, zoom: 7 },
  BA: { names: { ja: 'ボスニア・ヘルツェゴビナ', en: 'Bosnia and Herzegovina', ko: '보스니아 헤르체고비나', zh: '波黑' }, flag: '🇧🇦', region: '🇪🇺 ヨーロッパ', lat: 43.9159, lon: 17.6791, zoom: 7 },
  ME: { names: { ja: 'モンテネグロ', en: 'Montenegro', ko: '몬테ネグロ', zh: '黑山' }, flag: '🇲🇪', region: '🇪🇺 ヨーロッパ', lat: 42.7087, lon: 19.3744, zoom: 8 },
  MK: { names: { ja: '北マケドニア', en: 'North Macedonia', ko: '북마케도니아', zh: '北马其顿' }, flag: '🇲🇰', region: '🇪🇺 ヨーロッパ', lat: 41.6086, lon: 21.7453, zoom: 8 },
  MD: { names: { ja: 'モルドバ', en: 'Moldova', ko: '몰도바', zh: '摩尔多瓦' }, flag: '🇲🇩', region: '🇪🇺 ヨーロッパ', lat: 47.4116, lon: 28.3699, zoom: 7 },
  BY: { names: { ja: 'ベラルーシ', en: 'Belarus', ko: '벨라루스', zh: '白俄罗斯' }, flag: '🇧🇾', region: '🇪🇺 ヨーロッパ', lat: 53.7098, lon: 27.9534, zoom: 6 },
  RU: { names: { ja: 'ロシア', en: 'Russia', ko: '러시아', zh: '俄罗斯' }, flag: '🇷🇺', region: '🇪🇺 ヨーロッパ', lat: 61.5240, lon: 105.3188, zoom: 3 },
  SE: { names: { ja: 'スウェーデン', en: 'Sweden', ko: '스베덴', zh: '瑞典' }, flag: '🇸🇪', region: '🇪🇺 北欧', lat: 60.1282, lon: 18.6435, zoom: 5 },
  NO: { names: { ja: 'ノルウェー', en: 'Norway', ko: '노르웨이', zh: '挪威' }, flag: '🇳🇴', region: '🇪🇺 北欧', lat: 60.4720, lon: 8.4689, zoom: 5 },
  DK: { names: { ja: 'デンマーク', en: 'Denmark', ko: '덴마크', zh: '덴마크' }, flag: '🇩🇰', region: '🇪🇺 北欧', lat: 56.2639, lon: 9.5018, zoom: 7 },
  FI: { names: { ja: 'フィンランド', en: 'Finland', ko: '핀란드', zh: '芬兰' }, flag: '🇫🇮', region: '🇪🇺 北欧', lat: 61.9241, lon: 25.7482, zoom: 5 },
  IS: { names: { ja: 'アイスランド', en: 'Iceland', ko: '아이슬란드', zh: '冰岛' }, flag: '🇮🇸', region: '🇪🇺 北欧', lat: 64.9631, lon: -19.0208, zoom: 6 },
  US: { names: { ja: 'アメリカ', en: 'USA', ko: '미국', zh: '미국' }, flag: '🇺🇸', region: '🗽 北米', lat: 37.0902, lon: -95.7129, zoom: 4 },
  CA: { names: { ja: 'カナダ', en: 'Canada', ko: '캐나다', zh: '加拿大' }, flag: '🇨🇦', region: '🗽 北米', lat: 56.1304, lon: -106.3468, zoom: 3 },
  MX: { names: { ja: 'メキシコ', en: 'Mexico', ko: '멕시코', zh: '墨西哥' }, flag: '🇲🇽', region: '🗽 北米', lat: 23.6345, lon: 102.5528, zoom: 5 },
  BR: { names: { ja: 'ブラジル', en: 'Brazil', ko: '브라질', zh: '巴西' }, flag: '🇧🇷', region: '🗽 中南米', lat: -14.2350, lon: -51.9253, zoom: 4 },
  AR: { names: { ja: 'アルゼンチン', en: 'Argentina', ko: '아르헨티나', zh: '阿根廷' }, flag: '🇦🇷', region: '🗽 中南米', lat: -38.4161, lon: -63.6167, zoom: 4 },
  CL: { names: { ja: 'チリ', en: 'Chile', ko: '칠레', zh: '智利' }, flag: '🇨🇱', region: '🗽 中南米', lat: -35.6751, lon: -71.5430, zoom: 4 },
  PE: { names: { ja: 'ペルー', en: 'Peru', ko: '페루', zh: '秘鲁' }, flag: '🇵🇪', region: '🗽 中南米', lat: -9.1900, lon: -75.0152, zoom: 5 },
  CO: { names: { ja: 'コロンビア', en: 'Colombia', ko: '콜롬비아', zh: '哥伦比亚' }, flag: '🇨🇴', region: '🗽 中南米', lat: 4.5709, lon: -74.2973, zoom: 5 },
  CU: { names: { ja: 'キューバ', en: 'Cuba', ko: '쿠바', zh: '古巴' }, flag: '🇨🇺', region: '🗽 中南米', lat: 21.5218, lon: -77.7812, zoom: 7 },
  CR: { names: { ja: 'コスタリカ', en: 'Costa Rica', ko: '코스타리카', zh: '哥斯达黎加' }, flag: '🇨🇷', region: '🗽 中南米', lat: 9.7489, lon: -83.7534, zoom: 8 },
  DO: { names: { ja: 'ドミニカ共和国', en: 'Dominican Republic', ko: '도미니카 공화국', zh: '多米尼加' }, flag: '🇩🇴', region: '🗽 中南米', lat: 18.7357, lon: -70.1627, zoom: 8 },
  PA: { names: { ja: 'パナマ', en: 'Panama', ko: '파나마', zh: '巴拿马' }, flag: '🇵🇦', region: '🗽 中南米', lat: 8.5380, lon: -80.7821, zoom: 8 },
  JM: { names: { ja: 'ジャマイカ', en: 'Jamaica', ko: '자메이카', zh: '牙买加' }, flag: '🇯🇲', region: '🗽 中南米', lat: 18.1096, lon: -77.2975, zoom: 9 },
  UY: { names: { ja: 'ウルグアイ', en: 'Uruguay', ko: '우루과이', zh: '乌拉圭' }, flag: '🇺🇾', region: '🗽 中南米', lat: -32.5228, lon: -55.7658, zoom: 7 },
  EC: { names: { ja: 'エクアドル', en: 'Ecuador', ko: '에콰도르', zh: '厄瓜多尔' }, flag: '🇪🇨', region: '🗽 中南米', lat: -1.8312, lon: -78.1834, zoom: 6 },
  VE: { names: { ja: 'ベネズエラ', en: 'Venezuela', ko: '베네수엘라', zh: '委内瑞拉' }, flag: '🇻🇪', region: '🗽 中南米', lat: 6.4238, lon: -66.5897, zoom: 5 },
  BO: { names: { ja: 'ボリビア', en: 'Bolivia', ko: '볼리비아', zh: '玻利维亚' }, flag: '🇧🇴', region: '🗽 中南米', lat: -16.2902, lon: -63.5887, zoom: 5 },
  PY: { names: { ja: 'パラグアイ', en: 'Paraguay', ko: '파라과이', zh: '파라과이' }, flag: '🇵🇾', region: '🗽 中南米', lat: -23.4425, lon: -58.4438, zoom: 6 },
  GT: { names: { ja: 'グアテマラ', en: 'Guatemala', ko: '과테말라', zh: '危地马拉' }, flag: '🇬🇹', region: '🗽 中南米', lat: 15.7835, lon: -90.2308, zoom: 8 },
  HN: { names: { ja: 'ホンジュラス', en: 'Honduras', ko: '온두라스', zh: '洪都拉斯' }, flag: '🇭🇳', region: '🗽 中南米', lat: 15.1999, lon: -86.2419, zoom: 7 },
  NI: { names: { ja: 'ニカラグア', en: 'Nicaragua', ko: '니카라과', zh: '尼加拉瓜' }, flag: '🇳🇮', region: '🗽 中南米', lat: 12.8654, lon: -85.2072, zoom: 7 },
  SV: { names: { ja: 'エルサルバドル', en: 'El Salvador', ko: '엘살바도르', zh: '萨尔瓦多' }, flag: '🇸🇻', region: '🗽 中南米', lat: 13.7942, lon: -88.8965, zoom: 8 },
  BS: { names: { ja: 'バハマ', en: 'Bahamas', ko: '바하마', zh: '巴哈马' }, flag: '🇧🇸', region: '🗽 中南米', lat: 25.0343, lon: -77.3963, zoom: 7 },
  PR: { names: { ja: 'プエルトリコ', en: 'Puerto Rico', ko: '푸에르토리코', zh: '波多黎各' }, flag: '🇵🇷', region: '🗽 中南米', lat: 18.2208, lon: -66.5901, zoom: 9 },
  BZ: { names: { ja: 'ベリーズ', en: 'Belize', ko: '벨리즈', zh: '伯利兹' }, flag: '🇧🇿', region: '🗽 中南米', lat: 17.1899, lon: -88.4976, zoom: 8 },
  TT: { names: { ja: 'トリニダード・トバゴ', en: 'Trinidad and Tobago', ko: '트리니다드 토바고', zh: '特立尼达和多巴哥' }, flag: '🇹🇹', region: '🗽 中南米', lat: 10.6918, lon: -61.2225, zoom: 9 },
  HT: { names: { ja: 'ハイチ', en: 'Haiti', ko: '아이티', zh: '海地' }, flag: '🇭🇹', region: '🗽 中南米', lat: 18.9712, lon: -72.2852, zoom: 8 },
  GY: { names: { ja: 'ガイアナ', en: 'Guyana', ko: '가이아나', zh: '圭亚那' }, flag: '🇬🇾', region: '🗽 中南米', lat: 4.8604, lon: -58.9302, zoom: 6 },
  SR: { names: { ja: 'スリナム', en: 'Suriname', ko: '수리남', zh: '苏里南' }, flag: '🇸🇷', region: '🗽 中南米', lat: 3.9193, lon: -56.0278, zoom: 7 },
  AG: { names: { ja: 'アンティグア・バーブーダ', en: 'Antigua and Barbuda', ko: '앤티가 바부다', zh: '安提瓜和巴布达' }, flag: '🇦🇬', region: '🗽 中南米', lat: 17.0608, lon: -61.7964, zoom: 9 },
  BB: { names: { ja: 'バルバドス', en: 'Barbados', ko: '바베이도스', zh: '巴巴多斯' }, flag: '🇧🇧', region: '🗽 中南米', lat: 13.1939, lon: -59.5432, zoom: 11 },
  DM: { names: { ja: 'ドミニカ国', en: 'Dominica', ko: '도미니카 연방', zh: '多米尼克' }, flag: '🇩🇲', region: '🗽 中南米', lat: 15.4150, lon: -61.3710, zoom: 10 },
  GD: { names: { ja: 'グレナダ', en: 'Grenada', ko: '그레ナダ', zh: '格林纳达' }, flag: '🇬🇩', region: '🗽 中南米', lat: 12.1165, lon: -61.6790, zoom: 10 },
  KN: { names: { ja: 'セントクリストファー・ネイビス', en: 'Saint Kitts and Nevis', ko: '세인트키츠 네비스', zh: '圣基茨和尼维斯' }, flag: '🇰🇳', region: '🗽 中南米', lat: 17.3578, lon: -62.7829, zoom: 10 },
  LC: { names: { ja: 'セントルシア', en: 'Saint Lucia', ko: '세인트루시아', zh: '圣卢西亚' }, flag: '🇱🇨', region: '🗽 中南米', lat: 13.9094, lon: -60.9789, zoom: 10 },
  VC: { names: { ja: 'セントビンセントおよびグレナディーン諸島', en: 'Saint Vincent and the Grenadines', ko: '세인트빈센트 그레나딘', zh: '圣文森特和格林纳丁斯' }, flag: '🇻🇨', region: '🗽 中南米', lat: 12.9843, lon: -61.2872, zoom: 10 },
  AU: { names: { ja: 'オーストラリア', en: 'Australia', ko: '호주', zh: '澳大利亚' }, flag: '🇦🇺', region: '🦘 オセアニア', lat: -25.2744, lon: 133.7751, zoom: 4 },
  NZ: { names: { ja: 'ニュージーランド', en: 'New Zealand', ko: '뉴질랜드', zh: '新西兰' }, flag: '🇳🇿', region: '🦘 オセアニア', lat: -40.9006, lon: 174.8860, zoom: 5 },
  FJ: { names: { ja: 'フィジー', en: 'Fiji', ko: '피지', zh: '斐济' }, flag: '🇫🇯', region: '🦘 オセアニア', lat: -17.7134, lon: 178.0650, zoom: 8 },
  PG: { names: { ja: 'パプアニューギニア', en: 'Papua New Guinea', ko: '파푸아뉴기니', zh: '巴布亚新几内亚' }, flag: '🇵🇬', region: '🦘 オセアニア', lat: -6.3149, lon: 143.9555, zoom: 6 },
  VU: { names: { ja: 'ヴァヌアツ', en: 'Vanuatu', ko: '바누아투', zh: '瓦努アツ' }, flag: '🇻🇺', region: '🦘 オセアニア', lat: -15.3767, lon: 166.9592, zoom: 7 },
  WS: { names: { ja: 'サモア', en: 'Samoa', ko: '사모아', zh: '萨摩亚' }, flag: '🇼🇸', region: '🦘 オセアニア', lat: -13.7590, lon: -172.1046, zoom: 9 },
  GU: { names: { ja: 'グアム', en: 'Guam', ko: '괌', zh: '关岛' }, flag: '🇬🇺', region: '🦘 オセアニア', lat: 13.4443, lon: 144.7937, zoom: 10 },
  NC: { names: { ja: 'ニューカレドニア', en: 'New Caledonia', ko: '누벨칼레도니', zh: '新喀里多尼亚' }, flag: '🇳🇨', region: '🦘 オセアニア', lat: -20.9043, lon: 165.6180, zoom: 7 },
  PF: { names: { ja: 'タヒチ / フランス領ポリネシア', en: 'French Polynesia', ko: '프랑스령 폴리네시아', zh: '法属波利尼西亚' }, flag: '🇵🇫', region: '🦘 オセアニア', lat: -17.6797, lon: -149.4068, zoom: 7 },
  SB: { names: { ja: 'ソロモン諸島', en: 'Solomon Islands', ko: '솔로몬 제도', zh: '所罗门群岛' }, flag: '🇸🇧', region: '🦘 オセアニア', lat: -9.6457, lon: 160.1562, zoom: 7 },
  TO: { names: { ja: 'トンガ', en: 'Tonga', ko: '통가', zh: '汤加' }, flag: '🇹🇴', region: '🦘 オセアニア', lat: -21.1789, lon: -175.1982, zoom: 9 },
  KI: { names: { ja: 'キリバス', en: 'Kiribati', ko: '키리바시', zh: '基里巴斯' }, flag: '🇰🇮', region: '🦘 オセアニア', lat: -3.3704, lon: -168.7340, zoom: 7 },
  FM: { names: { ja: 'ミクロネシア連邦', en: 'Micronesia', ko: '미크로네시아', zh: '密克罗尼西亚' }, flag: '🇫🇲', region: '🦘 オセアニア', lat: 7.4256, lon: 150.5508, zoom: 8 },
  MH: { names: { ja: 'マーシャル諸島', en: 'Marshall Islands', ko: '마셜 제도', zh: '马绍尔群岛' }, flag: '🇲🇭', region: '🦘 オセアニア', lat: 7.1315, lon: 171.1845, zoom: 8 },
  NR: { names: { ja: 'ナウル', en: 'Nauru', ko: '나우루', zh: '瑙鲁' }, flag: '🇳🇷', region: '🦘 オセアニア', lat: -0.5228, lon: 166.9315, zoom: 13 },
  PW: { names: { ja: 'パラオ', en: 'Palau', ko: '팔라우', zh: '帕劳' }, flag: '🇵🇼', region: '🦘 オセアニア', lat: 7.5150, lon: 134.5825, zoom: 9 },
  TV: { names: { ja: 'ツバル', en: 'Tuvalu', ko: '투발루', zh: '图瓦卢' }, flag: '🇹🇻', region: '🦘 オセアニア', lat: -7.1095, lon: 177.6493, zoom: 11 },
  ZA: { names: { ja: '南アフリカ', en: 'South Africa', ko: '남아프리카', zh: '南非' }, flag: '🇿🇦', region: '🦁 アフリカ', lat: -30.5595, lon: 22.9375, zoom: 5 },
  EG: { names: { ja: 'エジプト', en: 'Egypt', ko: '이집트', zh: '埃及' }, flag: '🇪🇬', region: '🦁 アフリカ', lat: 26.8206, lon: 30.8025, zoom: 6 },
  MA: { names: { ja: 'モロッコ', en: 'Morocco', ko: '모로코', zh: '摩洛哥' }, flag: '🇲🇦', region: '🦁 アフリカ', lat: 31.7917, lon: -7.0926, zoom: 6 },
  TN: { names: { ja: 'チュニジア', en: 'Tunisia', ko: '튀니지', zh: '突尼斯' }, flag: '🇹🇳', region: '🦁 アフリカ', lat: 33.8869, lon: 9.5375, zoom: 6 },
  KE: { names: { ja: 'ケニア', en: 'Kenya', ko: '케냐', zh: '肯尼亚' }, flag: '🇰🇪', region: '🦁 アフリカ', lat: -0.0236, lon: 37.9062, zoom: 6 },
  TZ: { names: { ja: 'タンザニア', en: 'Tanzania', ko: '탄자니아', zh: '坦桑尼亚' }, flag: '🇹🇿', region: '🦁 アフリカ', lat: -6.3690, lon: 34.8888, zoom: 6 },
  MU: { names: { ja: 'モーリシャス', en: 'Mauritius', ko: '모리셔스', zh: '毛里求斯' }, flag: '🇲🇺', region: '🦁 アフリカ', lat: -20.3484, lon: 57.5522, zoom: 9 },
  SC: { names: { ja: 'セーシェル', en: 'Seychelles', ko: '세이셸', zh: 'セーシェル' }, flag: '🇸🇨', region: '🦁 アフリカ', lat: -4.6796, lon: 55.4920, zoom: 10 },
  GH: { names: { ja: 'ガーナ', en: 'Ghana', ko: '가나', zh: '加纳' }, flag: '🇬🇭', region: '🦁 アフリカ', lat: 7.9465, lon: -1.0232, zoom: 7 },
  NG: { names: { ja: 'ナイジェリア', en: 'Nigeria', ko: '나이지리아', zh: '尼日利亚' }, flag: '🇳🇬', region: '🦁 アフリカ', lat: 9.0820, lon: 8.6753, zoom: 6 },
  ET: { names: { ja: 'エチオピア', en: 'Ethiopia', ko: '에티오피아', zh: '埃塞俄比亚' }, flag: '🇪🇹', region: '🦁 アフリカ', lat: 9.1450, lon: 40.4897, zoom: 6 },
  SN: { names: { ja: 'セネガル', en: 'Senegal', ko: '세네갈', zh: '塞内加尔' }, flag: '🇸🇳', region: '🦁 アフリカ', lat: 14.4974, lon: -14.4524, zoom: 7 },
  MG: { names: { ja: 'マダガスカル', en: 'Madagascar', ko: '마다가스카르', zh: 'マダガスカル' }, flag: '🇲🇬', region: '🦁 アフリカ', lat: -18.7669, lon: 46.8691, zoom: 6 },
  RW: { names: { ja: 'ルワンダ', en: 'Rwanda', ko: '르완다', zh: '卢旺达' }, flag: '🇷🇼', region: '🦁 アフリカ', lat: -1.9403, lon: 29.8739, zoom: 8 },
  UG: { names: { ja: 'ウガンダ', en: 'Uganda', ko: '우간다', zh: '乌干达' }, flag: '🇺🇬', region: '🦁 アフリカ', lat: 1.3733, lon: 32.2903, zoom: 7 },
  ZM: { names: { ja: 'ザンビア', en: 'Zambia', ko: '잠비아', zh: '赞比亚' }, flag: '🇿🇲', region: '🦁 アフリカ', lat: -13.1339, lon: 27.8493, zoom: 6 },
  ZW: { names: { ja: 'ジンバブエ', en: 'Zimbabwe', ko: '짐바브웨', zh: '津巴布韦' }, flag: '🇿🇼', region: '🦁 アフリカ', lat: -19.0154, lon: 29.1549, zoom: 6 },
  BW: { names: { ja: 'ボツワナ', en: 'Botswana', ko: '보츠와나', zh: '博茨瓦纳' }, flag: '🇧🇼', region: '🦁 アフリカ', lat: -22.3285, lon: 24.6849, zoom: 6 },
  NA: { names: { ja: 'ナミビア', en: 'Namibia', ko: '나미비아', zh: '纳米比亚' }, flag: '🇳🇦', region: '🦁 アフリカ', lat: -22.9576, lon: 18.4904, zoom: 6 },
  DZ: { names: { ja: 'アルジェリア', en: 'Algeria', ko: '알제리', zh: '阿尔及利亚' }, flag: '🇩🇿', region: '🦁 アフリカ', lat: 28.0339, lon: 1.6596, zoom: 5 },
  AO: { names: { ja: 'アンゴラ', en: 'Angola', ko: '앙골라', zh: '安哥拉' }, flag: '🇦🇴', region: '🦁 アフリカ', lat: -11.2027, lon: 17.8739, zoom: 5 },
  CM: { names: { ja: 'カメルーン', en: 'Cameroon', ko: '카메룬', zh: '喀麦隆' }, flag: '🇨🇲', region: '🦁 アフリカ', lat: 3.8480, lon: 11.5021, zoom: 6 },
  CI: { names: { ja: 'コートジボワール', en: 'Ivory Coast', ko: '코트디부아르', zh: '科特迪瓦' }, flag: '🇨🇮', region: '🦁 アフリカ', lat: 7.5400, lon: -5.5471, zoom: 6 },
  MZ: { names: { ja: 'モザンビーク', en: 'Mozambique', ko: '모잠비크', zh: '莫桑比克' }, flag: '🇲🇿', region: '🦁 アフリカ', lat: -18.6657, lon: 35.5296, zoom: 5 },
  SD: { names: { ja: 'スーダン', en: 'Sudan', ko: '수단', zh: '苏丹' }, flag: '🇸🇩', region: '🦁 アフリカ', lat: 12.8628, lon: 30.2176, zoom: 5 },
  LY: { names: { ja: 'リビア', en: 'Libya', ko: '리비아', zh: '利比亚' }, flag: '🇱🇾', region: '🦁 アフリカ', lat: 26.3351, lon: 17.2283, zoom: 5 },
  ML: { names: { ja: 'マリ', en: 'Mali', ko: '말리', zh: '马里' }, flag: '🇲🇱', region: '🦁 アフリカ', lat: 17.5707, lon: -3.9962, zoom: 5 },
  NE: { names: { ja: 'ニジェール', en: 'Niger', ko: '니제르', zh: '尼日尔' }, flag: '🇳🇪', region: '🦁 アフリカ', lat: 17.6078, lon: 8.0817, zoom: 5 },
  SO: { names: { ja: 'ソマリア', en: 'Somalia', ko: '소말리아', zh: '索马里' }, flag: '🇸🇴', region: '🦁 アフリカ', lat: 5.1521, lon: 46.1996, zoom: 6 },
  BJ: { names: { ja: 'ベナン', en: 'Benin', ko: '베닌', zh: '贝宁' }, flag: '🇧🇯', region: '🦁 アフリカ', lat: 9.3077, lon: 2.3158, zoom: 7 },
  BF: { names: { ja: 'ブルキナファソ', en: 'Burkina Faso', ko: '부르키나파소', zh: '布基纳法索' }, flag: '🇧🇫', region: '🦁 アフリカ', lat: 12.2383, lon: -1.5616, zoom: 6 },
  BI: { names: { ja: 'ブルンジ', en: 'Burundi', ko: '부룬디', zh: '布隆迪' }, flag: '🇧🇮', region: '🦁 アフリカ', lat: -3.3731, lon: 29.9189, zoom: 8 },
  CV: { names: { ja: 'カーボベルデ', en: 'Cape Verde', ko: '카보베르데', zh: '佛得角' }, flag: '🇨🇻', region: '🦁 アフリカ', lat: 16.5388, lon: -23.0418, zoom: 8 },
  CF: { names: { ja: '中央アフリカ共和国', en: 'Central African Republic', ko: '중앙아프리카 공화국', zh: '中非共和国' }, flag: '🇨🇫', region: '🦁 アフリカ', lat: 6.6111, lon: 20.9394, zoom: 6 },
  TD: { names: { ja: 'チャド', en: 'Chad', ko: '차드', zh: '乍得' }, flag: '🇹🇩', region: '🦁 アフリカ', lat: 15.4542, lon: 18.7322, zoom: 5 },
  KM: { names: { ja: 'コモロ', en: 'Comoros', ko: '코모로', zh: '科摩罗' }, flag: '🇰🇲', region: '🦁 アフリカ', lat: -11.8750, lon: 43.8722, zoom: 9 },
  CG: { names: { ja: 'コンゴ共和国', en: 'Republic of the Congo', ko: '콩고공화국', zh: '刚果共和国' }, flag: '🇨🇬', region: '🦁 アフリカ', lat: -0.2280, lon: 15.8277, zoom: 6 },
  CD: { names: { ja: 'コンゴ民主共和国', en: 'Democratic Republic of the Congo', ko: '콩고민주공화국', zh: '刚果民主共和国' }, flag: '🇨🇩', region: '🦁 アフリカ', lat: -4.0383, lon: 21.7587, zoom: 5 },
  DJ: { names: { ja: 'ジブチ', en: 'Djibouti', ko: '지부티', zh: '吉布提' }, flag: '🇩🇯', region: '🦁 アフリカ', lat: 11.8251, lon: 42.5903, zoom: 8 },
  GQ: { names: { ja: '赤道ギニア', en: 'Equatorial Guinea', ko: '적도 기니', zh: '赤道几内亚' }, flag: '🇬🇶', region: '🦁 アフリカ', lat: 1.6508, lon: 10.2679, zoom: 8 },
  ER: { names: { ja: 'エリトリア', en: 'Eritrea', ko: '에리트레아', zh: '厄立特里亚' }, flag: '🇪🇷', region: '🦁 アフリカ', lat: 15.1794, lon: 39.7823, zoom: 7 },
  GA: { names: { ja: 'ガボン', en: 'Gabon', ko: '가봉', zh: '加蓬' }, flag: '🇬🇦', region: '🦁 アフリカ', lat: -0.8037, lon: 11.6094, zoom: 6 },
  GM: { names: { ja: 'ガンビア', en: 'Gambia', ko: '감비아', zh: '冈比亚' }, flag: '🇬🇲', region: '🦁 アフリカ', lat: 13.4432, lon: -15.3101, zoom: 8 },
  GN: { names: { ja: 'ギニア', en: 'Guinea', ko: '기니', zh: '几内亚' }, flag: '🇬🇳', region: '🦁 アフリカ', lat: 9.9456, lon: -9.6966, zoom: 7 },
  GW: { names: { ja: 'ギニアビサウ', en: 'Guinea-Bissau', ko: '기니비사우', zh: '几内亚比绍' }, flag: '🇬🇼', region: '🦁 アフリカ', lat: 11.8037, lon: -15.1804, zoom: 8 },
  LS: { names: { ja: 'レソト', en: 'Lesotho', ko: '레소토', zh: '莱索托' }, flag: '🇱🇸', region: '🦁 アフリカ', lat: -29.6100, lon: 28.2336, zoom: 8 },
  LR: { names: { ja: 'リベリア', en: 'Liberia', ko: '라이베리아', zh: '利比里亚' }, flag: '🇱🇷', region: '🦁 アフリカ', lat: 6.4281, lon: -9.4295, zoom: 7 },
  MW: { names: { ja: 'マラウイ', en: 'Malawi', ko: '말라위', zh: '马拉维' }, flag: '🇲🇼', region: '🦁 アフリカ', lat: -13.2543, lon: 34.3015, zoom: 6 },
  MR: { names: { ja: 'モーリタニア', en: 'Mauritania', ko: '모리타니', zh: '毛里塔尼亚' }, flag: '🇲🇷', region: '🦁 アフリカ', lat: 21.0079, lon: -10.9408, zoom: 5 },
  ST: { names: { ja: 'サントメ・プリンシペ', en: 'Sao Tome and Principe', ko: '상투메 프린시페', zh: '圣多美和普林西比' }, flag: '🇸🇹', region: '🦁 アフリカ', lat: 0.1864, lon: 6.6131, zoom: 9 },
  SL: { names: { ja: 'シエラレオネ', en: 'Sierra Leone', ko: '시에라리온', zh: '塞拉利昂' }, flag: '🇸🇱', region: '🦁 アフリカ', lat: 8.4606, lon: -11.7799, zoom: 7 },
  SS: { names: { ja: '南スーダン', en: 'South Sudan', ko: '남수단', zh: '南苏丹' }, flag: '🇸🇸', region: '🦁 アフリカ', lat: 6.8770, lon: 31.3070, zoom: 6 },
  TG: { names: { ja: 'トーゴ', en: 'Togo', ko: '토고', zh: '多哥' }, flag: '🇹🇬', region: '🦁 アフリカ', lat: 8.6195, lon: 0.8248, zoom: 7 }
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
    fileUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&auto=format&fit=crop',
    thumbUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&h=300&auto=format&fit=crop',
    fileType: 'image',
    mediaList: [
      { fileUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&auto=format&fit=crop', thumbUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&h=300&auto=format&fit=crop', fileType: 'image', fileName: 'shibuya.jpg' }
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
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.9));
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
  const [thumbCache, setThumbCache] = useState<Record<string, string>>({});

  useEffect(() => {
    spots.forEach(spot => {
      const url = spot.thumbUrl || spot.fileUrl;
      if (!url || thumbCache[url]) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 64, 64);
            const dataUri = canvas.toDataURL('image/jpeg', 0.9);
            setThumbCache(prev => ({ ...prev, [url]: dataUri }));
          }
        } catch {
          setThumbCache(prev => ({ ...prev, [url]: url }));
        }
      };
      img.onerror = () => {
        setThumbCache(prev => ({ ...prev, [url]: url }));
      };
      img.src = url;
    });
  }, [spots]);

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
        }, 30);
      }
    } else {
      initMap();
    }
  }, [userLang]);

  useEffect(() => {
    if (mapInstanceRef.current && window.google && window.google.maps) {
      mapInstanceRef.current.setCenter({ lat: center[0], lng: center[1] });
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [center, zoom]);

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

    const locationMap = new Map<string, Spot[]>();
    spots.forEach(spot => {
      const key = `${spot.lat.toFixed(3)},${spot.lon.toFixed(3)}`;
      if (!locationMap.has(key)) locationMap.set(key, []);
      locationMap.get(key)!.push(spot);
    });

    locationMap.forEach((groupSpots) => {
      const spot = groupSpots[0];
      const count = groupSpots.length;
      const rawUrl = spot.thumbUrl || spot.fileUrl || '';
      const imgUrl = thumbCache[rawUrl] || rawUrl;

      const badgeSvg = count > 1 ? `
        <circle cx="36" cy="12" r="10" fill="#10b981" stroke="#ffffff" stroke-width="2" />
        <text x="36" y="16" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">+${count}</text>
      ` : '';

      const marker = new window.google.maps.Marker({
        position: { lat: spot.lat, lng: spot.lon },
        map: map,
        title: spot.title,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="52" viewBox="0 0 48 52">
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)" />
              </filter>
              <path d="M22 50 C22 50 40 31 40 20 C40 9 31 1 22 1 C13 1 4 9 4 20 C4 31 22 50 22 50 Z" fill="#ffffff" stroke="#0284c7" stroke-width="3" filter="url(#shadow)" />
              <image href="${imgUrl}" x="2" y="2" width="40" height="40" clip-path="circle(20px at 20px 20px)" preserveAspectRatio="xMidYMid slice" />
              ${badgeSvg}
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(48, 52),
          anchor: new window.google.maps.Point(22, 52),
        }
      });

      marker.addListener('click', () => {
        onSelectSpot(spot);
      });

      markersRef.current.push(marker);
    });
  }, [spots, thumbCache]);

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
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>('');

  const [userName, setUserName] = useState<string>('namesnap');
  const [userBio, setUserBio] = useState<string>('世界中を旅して記録中 🌏✈️');
  const [userAvatar, setUserAvatar] = useState<string>('');

  const [eulaChecked, setEulaChecked] = useState<boolean>(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);

  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [selectedCategories, setSelectedCategories] = useState<ViewCategory[]>(['view', 'gourmet', 'rain']);
  const [mapTheme, setMapTheme] = useState<MapThemeType>('light');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('world');
  
  const [mapSearchKeyword, setMapSearchKeyword] = useState<string>('');
  const [timelineSearchKeyword, setTimelineSearchKeyword] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [mapSearchSuggestions, setMapSearchSuggestions] = useState<PlaceSuggestion[]>([]);

  const [isLocationGuideOpen, setIsLocationGuideOpen] = useState<boolean>(false);

  // QRコードモーダル用ステート
  const [isMyQrOpen, setIsMyQrOpen] = useState<boolean>(false);
  const [isScanQrOpen, setIsScanQrOpen] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string>('');

  // フレンド詳細プロフィール用ステート
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);

  // タイムライン内コメント欄の開閉管理用ステート
  const [openCommentsForSpot, setOpenCommentsForSpot] = useState<Record<string, boolean>>({});

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  const currentConfig = COUNTRIES[userCountry] || COUNTRIES.JP;
  
  const dict = useMemo(() => {
    return DICTIONARIES[userLangCode] || DICTIONARIES.ja;
  }, [userLangCode]);

  const t = (key: string) => dict[key] || DICTIONARIES.ja[key] || key;

  const [currentMapCenter, setCurrentMapCenter] = useState<[number, number]>([currentConfig.lat, currentConfig.lon]);
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(currentConfig.zoom);

  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | null>(null);

  // 国変更時に一発でマップが切り替わるように即座に反映
  useEffect(() => {
    const conf = COUNTRIES[userCountry];
    if (conf) {
      setCurrentMapCenter([conf.lat, conf.lon]);
      setCurrentMapZoom(conf.zoom);
      setTargetCenter([conf.lat, conf.lon]);
      setTargetZoom(conf.zoom);
    }
  }, [userCountry]);

  // ローカルストレージから確実に読み込み、消えないように保護
  const [spots, setSpots] = useState<Spot[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wap_local_spots_v8');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return INITIAL_SPOTS;
  });

  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [likedSpotIds, setLikedSpotIds] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

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

  const [friendsList, setFriendsList] = useState<FriendUser[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wap_friends_v8');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

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

  // 常にローカルストレージへ即時保存
  useEffect(() => {
    if (spots.length > 0) {
      try {
        localStorage.setItem('wap_local_spots_v8', JSON.stringify(spots));
      } catch {}
    }
  }, [spots]);

  useEffect(() => {
    try {
      localStorage.setItem('wap_friends_v8', JSON.stringify(friendsList));
    } catch {}
  }, [friendsList]);

  // Supabaseからのデータ取得（タイムアウト付きでフリーズ完全防止）
  const fetchSpots = async () => {
    if (!supabase) return;
    try {
      const fetchPromise = supabase.from('spots').select('*').order('created_at', { ascending: false });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
      const res: any = await Promise.race([fetchPromise, timeoutPromise]);

      if (res && !res.error && res.data && res.data.length > 0) {
        const dbSpots: Spot[] = res.data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          userAvatar: d.user_avatar,
          isOfficial: d.is_official,
          isFeatured: d.is_featured,
          isFirstExplorer: d.is_first_explorer,
          viewsCount: d.views_count || 1,
          savedCount: d.saved_count || 0,
          title: d.title,
          description: d.description || '',
          fileName: d.file_name || 'image.jpg',
          fileUrl: d.file_url,
          thumbUrl: d.thumb_url || d.file_url,
          fileType: d.file_type || 'image',
          mediaList: d.media_list || [{ fileUrl: d.file_url, thumbUrl: d.thumb_url || d.file_url, fileType: d.file_type || 'image', fileName: d.file_name || 'image.jpg' }],
          lat: Number(d.lat),
          lon: Number(d.lon),
          countryCode: d.country_code || 'JP',
          cityName: d.city_name || '日本',
          category: d.category || 'view',
          scopes: d.scopes || ['world', 'friends', 'my'],
          tags: d.tags || extractHashtags(d.description || ''),
          comments: d.comments || [],
          reportCount: d.report_count || 0,
          createdAt: d.created_at ? new Date(d.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        }));

        setSpots((prev) => {
          const map = new Map();
          prev.forEach(s => map.set(s.id, s));
          dbSpots.forEach(s => {
            if (!map.has(s.id)) map.set(s.id, s);
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.log('Supabase sync fallback used:', err);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  // 実機カメラを使ったQRコードスキャン制御
  useEffect(() => {
    if (!isScanQrOpen) {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
      return;
    }

    let isMounted = true;
    const loadScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        const scannerId = 'real-qr-reader-container';
        if (scannerRef.current) {
          scannerRef.current.innerHTML = `<div id="${scannerId}" style="width:100%; height:100%;"></div>`;
        }

        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          (decodedText) => {
            let friendName = decodedText;
            if (decodedText.startsWith('wap-friend://')) {
              friendName = decodedText.replace('wap-friend://', '');
            }
            setFriendsList(prev => {
              if (prev.some(f => f.name === friendName)) return prev;
              return [...prev, { id: 'f-' + Date.now(), name: friendName, avatar: '', bio: 'QRコードで追加したフレンド', postsCount: 1 }];
            });
            setIsScanQrOpen(false);
            showToast(`🎉 ${friendName}さんとフレンドになりました！🤝`);
            html5QrCode.stop().catch(() => {});
          },
          () => {}
        );
      } catch (err) {
        console.error('Camera scan init error:', err);
        setScannerError('⚠️ カメラのアクセス権が拒否されているか、ブラウザがサポートしていません。下のファイル読み込みボタンをご利用ください。');
      }
    };

    setTimeout(loadScanner, 300);

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, [isScanQrOpen]);

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

  const filteredCountries = useMemo(() => {
    const groups: Record<string, [string, typeof COUNTRIES[string]][]> = {};
    const q = countrySearchQuery.toLowerCase();

    Object.entries(COUNTRIES).forEach(([code, c]) => {
      const nameJa = c.names.ja?.toLowerCase() || '';
      const nameEn = c.names.en?.toLowerCase() || '';
      const nameKo = c.names.ko?.toLowerCase() || '';
      const nameZh = c.names.zh?.toLowerCase() || '';

      const matches = code.toLowerCase().includes(q) || nameJa.includes(q) || nameEn.includes(q) || nameKo.includes(q) || nameZh.includes(q);
      if (matches) {
        if (!groups[c.region]) {
          groups[c.region] = [];
        }
        groups[c.region].push([code, c]);
      }
    });
    return groups;
  }, [countrySearchQuery]);

  const filteredSpots = useMemo(() => {
    return spots.filter((s) => {
      if (blockedUsers.includes(s.userId)) return false;
      if (!selectedCategories.includes(s.category)) return false;

      if (displayScope === 'friends') {
        const isMyPost = s.userId === 'me';
        const isFriendPost = friendsList.some((f) => f.name === s.userName || f.id === s.userId);
        if (!isMyPost && !isFriendPost && !s.scopes.includes('friends')) return false;
      } else if (displayScope === 'my') {
        if (s.userId !== 'me') return false;
      } else if (displayScope === 'world') {
        // ワールド表示では制限なし
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

  const timelineSpots = useMemo(() => {
    const validSpots = spots.filter(s => !blockedUsers.includes(s.userId));
    if (!timelineSearchKeyword.trim()) return validSpots;
    const kw = timelineSearchKeyword.toLowerCase();
    return validSpots.filter(s => {
      if (kw.startsWith('#')) {
        const rawTag = kw.replace('#', '');
        return s.tags?.some(t => t.toLowerCase().includes(rawTag)) || s.description.toLowerCase().includes(kw);
      }
      return s.title.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw) || s.cityName.toLowerCase().includes(kw);
    });
  }, [spots, blockedUsers, timelineSearchKeyword]);

  const rankingSpots = useMemo(() => {
    return [...spots]
      .filter(s => !blockedUsers.includes(s.userId))
      .sort((a, b) => ((b.savedCount || 0) * 3 + (b.viewsCount || 0)) - ((a.savedCount || 0) * 3 + (a.viewsCount || 0)));
  }, [spots, blockedUsers]);

  const mySpots = useMemo(() => spots.filter((s) => s.userId === 'me'), [spots]);
  const savedSpots = useMemo(() => spots.filter((s) => likedSpotIds.includes(s.id) && !blockedUsers.includes(s.userId)), [spots, likedSpotIds, blockedUsers]);
  const visitedCountryCount = useMemo(() => new Set(mySpots.map((s) => s.countryCode)).size, [mySpots]);
  const totalMySavedCount = useMemo(() => mySpots.reduce((acc, cur) => acc + (cur.savedCount || 0), 0), [mySpots]);
  const totalMyViewsCount = useMemo(() => mySpots.reduce((acc, cur) => acc + (cur.viewsCount || 0), 0), [mySpots]);
  const userRank = useMemo(() => getUserTitle(mySpots.length, userLangCode), [mySpots.length, userLangCode]);

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
      showToast(`🇯🇵 ${conf.names[userLangCode] || conf.names.en} 全体へ戻しました`);
    } else {
      setTargetCenter([20.0, 0.0]);
      setTargetZoom(3);
      showToast('🌎 世界全体マップへ戻しました');
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

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setUserAvatar(objectUrl);
      showToast('🖼️ プロフィール写真を変更しました！');
    }
  };

  const handleOpenSpot = (spot: Spot) => {
    if (blockedUsers.includes(spot.userId)) return;
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

  const handleReportSpot = (spotId: string) => {
    setSpots(prev => prev.map(s => s.id === spotId ? { ...s, reportCount: (s.reportCount || 0) + 1 } : s));
    setSelectedSpot(null);
    showToast('🚨 通報を受け付けました。ご協力ありがとうございます。');
  };

  const handleBlockUser = (userId: string) => {
    if (userId === 'user-official') {
      showWarning('⚠️ 公式アカウントはブロックできません。');
      return;
    }
    setBlockedUsers(prev => [...prev, userId]);
    setSelectedSpot(null);
    showToast('🚫 ユーザーをブロックしました。');
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
    } else {
      translated = `[Translated to ${langName}]:\n${originalText} (Amazing travel destination!)`;
    }

    setTranslatedDescriptions(prev => ({ ...prev, [spotId]: translated }));
    showToast(`🌐 (${langName}) に翻訳しました！`);
  };

  const handleAddComment = (spotId: string, customText?: string) => {
    const textToUse = customText !== undefined ? customText : newCommentText;
    const trimmedText = textToUse.trim();
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
    if (customText === undefined) {
      setNewCommentText('');
    }
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

  // タイムアウト付きで絶対に保存中でフリーズしない安全な投稿処理
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
    showToast('⏳ 投稿を保存中...');

    const finalLat = parseFloat(manualLat);
    const finalLon = parseFloat(manualLon);

    let uploadedUrl = current.fileUrl;
    let finalThumbUrl = current.thumbUrl || current.fileUrl;

    if (supabase) {
      try {
        const fileExt = current.file.name.split('.').pop() || (current.fileType === 'video' ? 'mp4' : 'jpg');
        const filePath = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        
        const uploadPromise = supabase.storage.from('wap-media').upload(filePath, current.file, {
          cacheControl: '3600',
          upsert: false,
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
        const res: any = await Promise.race([uploadPromise, timeoutPromise]);

        if (res && !res.error) {
          const { data: publicData } = supabase.storage.from('wap-media').getPublicUrl(filePath);
          if (publicData?.publicUrl) {
            uploadedUrl = publicData.publicUrl;
            if (current.fileType === 'image') {
              finalThumbUrl = publicData.publicUrl;
            }
          }
        }
      } catch (err) {
        console.log('Storage upload bypassed, using local preview URL:', err);
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

    let updatedSpotsList = [...spots];

    if (existingSameSpot) {
      const updatedMediaList = [...(existingSameSpot.mediaList || [{ fileUrl: existingSameSpot.fileUrl, thumbUrl: existingSameSpot.thumbUrl, fileType: existingSameSpot.fileType, fileName: existingSameSpot.fileName }]), newMediaItem];
      const updatedSpot: Spot = {
        ...existingSameSpot,
        thumbUrl: finalThumbUrl,
        fileUrl: uploadedUrl,
        mediaList: updatedMediaList,
        title: postTitle ? `${existingSameSpot.title} & ${postTitle}` : existingSameSpot.title,
        description: postDesc ? `${existingSameSpot.description}\n${postDesc}` : existingSameSpot.description,
      };

      updatedSpotsList = updatedSpotsList.map((s) => (s.id === existingSameSpot.id ? updatedSpot : s));
      showToast(`📸 同じ場所のピンにメディアを追加しました！`);
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
        cityName: currentConfig.names[userLangCode] || currentConfig.names.en,
        category: postCategory,
        scopes: selectedScopes,
        tags: extractedTags,
        comments: [],
        reportCount: 0,
        createdAt: new Date().toLocaleDateString(),
      };

      updatedSpotsList = [newSpot, ...updatedSpotsList.filter((s) => s.id !== newSpot.id)];
      showToast(`📍 マップにピンを反映しました！🚀`);
    }

    setSpots(updatedSpotsList);
    try {
      localStorage.setItem('wap_local_spots_v8', JSON.stringify(updatedSpotsList));
    } catch {}

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

  const handleSaveMyMap = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        const brandText = '🗺️ wap';
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

        const fileName = `wap-${userCountry}-${Date.now()}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'wap',
              text: 'My wap Map',
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

  const themeAccent = mapTheme === 'dark' ? '#38bdf8' : mapTheme === 'pastel' ? '#d97706' : '#0284c7';
  const navBarBg = '#ffffff';
  const navBarText = '#0f172a';

  return (
    <>
      <head>
        <title>wap</title>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="wap" />
        <meta name="theme-color" content="#ffffff" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" async></script>
      </head>

      {/* アプリ全体の高さを画面ぴったりに固定（上部の白・ステータスバー表示を完全に保護） */}
      <div style={{ background: '#ffffff', color: '#0f172a', height: '100dvh', maxHeight: '100dvh', width: '100vw', maxWidth: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', inset: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'none', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        
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

        {/* 初回オンボーディング画面 */}
        {isOnboarding && (
          <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #070d1e 0%, #0f172a 100%)', color: '#fff', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '440px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '4px' }}>🗺️</div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0284c7' }}>wap</h1>
              <p style={{ margin: '4px 0 16px 0', fontSize: '13px', color: '#64748b' }}>世界中を旅して、思い出をつなごう</p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 1 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
                <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 2 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
                <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 3 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
                <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep === 4 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
              </div>

              {onboardingStep === 1 && (
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t('step1Title')}</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>{t('step1Desc')}</p>
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
                    {t('next')}
                  </button>
                </div>
              )}

              {onboardingStep === 2 && (
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '15px', margin: '0 0 4px 0' }}>{t('step2Title')}</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>{t('step2Desc')}</p>
                  
                  <input
                    type="text"
                    placeholder={t('countrySearchPlaceholder')}
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '8px', boxSizing: 'border-box' }}
                  />

                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingRight: '4px' }}>
                    {Object.entries(filteredCountries).map(([region, countries]) => (
                      <div key={region}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7', marginBottom: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
                          {region}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {countries.map(([code, c]) => {
                            const isSelected = userCountry === code;
                            return (
                              <div
                                key={code}
                                onClick={() => setUserCountry(code)}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: `2px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                                  background: isSelected ? '#f0f9ff' : '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                }}
                              >
                                <span style={{ fontSize: '13px', fontWeight: isSelected ? '900' : 'bold', color: isSelected ? '#0284c7' : '#0f172a' }}>
                                  {c.flag} {c.names[userLangCode] || c.names.en}
                                </span>
                                {isSelected && <span style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '12px' }}>✓ 選択中</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setOnboardingStep(1)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                      {t('back')}
                    </button>
                    <button onClick={() => setOnboardingStep(3)} style={{ flex: 2, padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                      {t('next')}
                    </button>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '15px', margin: '0 0 14px 0' }}>{t('step3Title')}</h3>
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
                      {t('back')}
                    </button>
                    <button onClick={() => setOnboardingStep(4)} style={{ flex: 2, padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                      {t('next')}
                    </button>
                  </div>
                </div>
              )}

              {onboardingStep === 4 && (
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t('step3TitleEula')}</h3>
                  <div
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      if (target.scrollHeight - target.scrollTop <= target.clientHeight + 30) {
                        setHasScrolledToBottom(true);
                      }
                    }}
                    style={{ maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '10px' }}
                  >
                    {t('eulaFullText')}
                    <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#0284c7', marginTop: '10px' }}>▼ ここまでお読みください</div>
                  </div>

                  {!hasScrolledToBottom && (
                    <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>
                      ⚠️ 利用規約を最後までスクロールしてください
                    </div>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed', color: hasScrolledToBottom ? '#0284c7' : '#94a3b8', marginBottom: '16px' }}>
                    <input type="checkbox" disabled={!hasScrolledToBottom} checked={eulaChecked} onChange={(e) => setEulaChecked(e.target.checked)} />
                    <span>{t('eulaAgree')}</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setOnboardingStep(3)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
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

        {/* 位置情報設定ガイド用モーダル */}
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
                {t('close')}
              </button>
            </div>
          </div>
        )}

        {/* プロフィール編集モーダル */}
        {isEditProfileOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '20px', maxWidth: '380px', width: '100%', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>✏️ プロフィール編集</h3>
                <button onClick={() => setIsEditProfileOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div
                  onClick={() => profileAvatarInputRef.current?.click()}
                  style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent,
                    color: '#fff', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {!userAvatar && <span>👤</span>}
                  <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.5)', fontSize: '9px', color: '#fff', textAlign: 'center', padding: '2px 0' }}>
                    変更
                  </div>
                </div>
              </div>

              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>ユーザー名</label>
              <input
                type="text"
                maxLength={20}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={{ width: '100%', padding: '10px', marginTop: '4px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold' }}
              />

              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>自己紹介</label>
              <input
                type="text"
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
                style={{ width: '100%', padding: '10px', marginTop: '4px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />

              <button
                onClick={() => {
                  setIsEditProfileOpen(false);
                  showToast('✨ プロフィールを更新しました！');
                }}
                style={{ width: '100%', padding: '12px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                保存する
              </button>
            </div>
          </div>
        )}

        {/* 自分のQRコード表示モーダル */}
        {isMyQrOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '340px', width: '100%', padding: '28px 20px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#0284c7' }}>📱 マイQRコード</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#64748b' }}>このQRコードを読み取ってもらうと、かんたんにフレンドになれます！</p>
              
              <div style={{ width: '200px', height: '200px', margin: '0 auto 16px auto', background: '#ffffff', borderRadius: '16px', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', boxSizing: 'border-box', position: 'relative' }}>
                <div
                  ref={(node) => {
                    if (node && (window as any).QRCode) {
                      node.innerHTML = '';
                      new (window as any).QRCode(node, {
                        text: `wap-friend://${userName}`,
                        width: 170,
                        height: 170,
                        colorDark: '#0f172a',
                        colorLight: '#ffffff',
                        correctLevel: (window as any).QRCode.CorrectLevel.H
                      });
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b' }}>生成中...</div>
                </div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '36px', height: '36px', background: '#0284c7', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  wap
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>
                ID: {userName}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`wap-friend://${userName}`);
                    showToast('📋 フレンドリンクをコピーしました！');
                  }}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  リンクコピー
                </button>
                <button
                  onClick={() => setIsMyQrOpen(false)}
                  style={{ flex: 1, padding: '10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QRコードスキャンモーダル */}
        {isScanQrOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', color: '#fff' }}>
            <div style={{ width: '100%', maxWidth: '340px', background: '#0f172a', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#38bdf8' }}>📷 QRコードスキャン</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>相手の画面のQRコードをカメラに向けてください</p>

              {scannerError && (
                <div style={{ fontSize: '11px', color: '#f43f5e', background: 'rgba(244,63,94,0.15)', padding: '8px', borderRadius: '8px', marginBottom: '12px', lineHeight: '1.4' }}>
                  {scannerError}
                </div>
              )}

              <div style={{ width: '240px', height: '240px', margin: '0 auto 16px auto', border: '2px solid #38bdf8', borderRadius: '20px', overflow: 'hidden', background: '#000', position: 'relative' }}>
                <div ref={scannerRef} style={{ width: '100%', height: '100%' }}></div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'inline-block', padding: '8px 16px', background: '#0284c7', color: '#fff', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  📁 保存したQR画像ファイルから読み取る
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        try {
                          const { Html5Qrcode } = await import('html5-qrcode');
                          const scannerId = 'temp-file-scanner';
                          const tempDiv = document.createElement('div');
                          tempDiv.id = scannerId;
                          tempDiv.style.display = 'none';
                          document.body.appendChild(tempDiv);
                          
                          const html5QrCode = new Html5Qrcode(scannerId);
                          const decodedText = await html5QrCode.scanFile(file, true);
                          let friendName = decodedText;
                          if (decodedText.startsWith('wap-friend://')) {
                            friendName = decodedText.replace('wap-friend://', '');
                          }
                          setFriendsList(prev => {
                            if (prev.some(f => f.name === friendName)) return prev;
                            return [...prev, { id: 'f-' + Date.now(), name: friendName, avatar: '', bio: 'QR画像から追加したフレンド', postsCount: 1 }];
                          });
                          setIsScanQrOpen(false);
                          showToast(`🎉 ${friendName}さんとフレンドになりました！🤝`);
                          document.body.removeChild(tempDiv);
                        } catch (err) {
                          showWarning('⚠️ QRコードを検出できませんでした。別の画像をお試しください。');
                        }
                      }
                    }}
                  />
                </label>
              </div>

              <button
                onClick={() => setIsScanQrOpen(false)}
                style={{ width: '100%', padding: '12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* フレンド個別プロフィール詳細モーダル */}
        {selectedFriend && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '340px', width: '100%', padding: '24px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0284c7', color: '#fff', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontWeight: 'bold' }}>
                {selectedFriend.name.charAt(0)}
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900' }}>{selectedFriend.name}</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>{selectedFriend.bio}</p>
              
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155' }}>
                📍 投稿数: <b>{selectedFriend.postsCount}</b> 箇所のスポット
              </div>

              <button
                onClick={() => setSelectedFriend(null)}
                style={{ width: '100%', padding: '12px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* ヘッダー */}
        <header style={{ height: '48px', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: navBarBg, color: navBarText, borderBottom: '1px solid #e2e8f0', flexShrink: 0, zIndex: 100, touchAction: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
            <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px', flexShrink: 0, color: navBarText }}>
              ☰
            </button>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0284c7', letterSpacing: '-0.5px', flexShrink: 0 }}>wap</h1>
            <select
              value={userCountry}
              onChange={(e) => {
                setUserCountry(e.target.value);
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
              color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden'
            }}
          >
            {!userAvatar && '👤'}
          </button>
        </header>

        {/* ── メインビュー（マップ以外はズーム・ピンチイン等を完全固定） ── */}
        <div style={{ flex: 1, minHeight: 0, height: 'calc(100dvh - 48px - env(safe-area-inset-top, 0px))', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#ffffff', padding: 0, margin: 0, boxSizing: 'border-box', touchAction: currentTab === 'map' ? 'auto' : 'none' }}>
          
          {/* マップタブ */}
          <div style={{ display: currentTab === 'map' ? 'flex' : 'none', flexDirection: 'column', height: '100%', width: '100%', position: 'relative', background: '#ffffff', border: 'none', boxSizing: 'border-box' }}>
            
            <div style={{ position: 'absolute', top: '10px', left: '12px', right: '12px', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '6px', pointerEvents: 'none', boxSizing: 'border-box' }}>
              <div style={{ position: 'relative', pointerEvents: 'auto', boxSizing: 'border-box' }}>
                <form onSubmit={handleJumpLocationSearch} style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.95)', color: '#000', backdropFilter: 'blur(10px)', padding: '5px 12px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={mapSearchKeyword}
                    onChange={(e) => setMapSearchKeyword(e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#000', fontSize: '12px', fontWeight: '500', padding: '2px 4px', boxSizing: 'border-box' }}
                  />
                  <button
                    type="submit"
                    disabled={isSearchingLocation}
                    style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '20px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box', flexShrink: 0 }}
                  >
                    {isSearchingLocation ? '...' : '🔍'}
                  </button>
                </form>

                {mapSearchSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '40px', insetInline: 0, background: '#ffffff', color: '#000', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 600, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                    {mapSearchSuggestions.map((item) => (
                      <div
                        key={item.place_id}
                        onClick={() => handleSelectMapSuggestion(item)}
                        style={{ padding: '8px 12px', fontSize: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxSizing: 'border-box' }}
                      >
                        <span>📍</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.display_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none', gap: '6px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.95)', padding: '3px 6px', borderRadius: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.1)', pointerEvents: 'auto', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                  {(['view', 'gourmet', 'rain'] as const).map((cat) => {
                    const isChecked = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategoryFilter(cat)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '16px',
                          border: 'none',
                          background: isChecked ? '#0284c7' : '#f1f5f9',
                          color: isChecked ? '#ffffff' : '#64748b',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box',
                        }}
                      >
                        {isChecked ? '✓ ' : ''}
                        {cat === 'view' ? `🏔️${t('view')}` : cat === 'gourmet' ? `🍔${t('gourmet')}` : `🌧️${t('rain')}`}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.95)', padding: '3px 8px', borderRadius: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.1)', pointerEvents: 'auto', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                  <select
                    value={displayScope}
                    onChange={(e) => setDisplayScope(e.target.value as DisplayScope)}
                    style={{ background: 'transparent', border: 'none', color: '#0f172a', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', padding: '2px', outline: 'none' }}
                  >
                    <option value="world">{t('scopeWorld')}</option>
                    <option value="friends">{t('scopeFriends')}</option>
                    <option value="my">{t('scopeMy')}</option>
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

              {/* マップ右側のコントロールボタン */}
              <div style={{ position: 'absolute', bottom: '90px', right: '16px', zIndex: 400, display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box' }}>
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
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: `2px solid ${themeAccent}`, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
                >
                  🎯
                </button>
                <button
                  title="引き戻す"
                  onClick={handleStepZoomOut}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: `2px solid ${themeAccent}`, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
                >
                  🪟
                </button>
                <button
                  title="マップを保存"
                  onClick={handleSaveMyMap}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0f172a', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
                >
                  💾
                </button>
              </div>
            </div>

            {/* 写真/動画を追加ボタン（左下に配置し、他のボタンと被らないように調整） */}
            <div style={{ position: 'absolute', bottom: '85px', left: '16px', zIndex: 450, boxSizing: 'border-box' }}>
              <label
                style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#fff',
                  borderRadius: '30px',
                  fontWeight: '900',
                  fontSize: '13px',
                  boxShadow: '0 4px 20px rgba(2,132,199,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                <span>📷＋</span>
                <span>{t('addPhoto')}</span>
                <input type="file" accept="image/*,video/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* タイムライン（フィード）タブ：TikTok風縦スクロール ＆ タップで詳細画面へジャンプ */}
          {currentTab === 'timeline' && (
            <div style={{ flex: 1, overflowY: 'auto', background: '#0f172a', display: 'flex', flexDirection: 'column', scrollSnapType: 'y mandatory', height: '100%', touchAction: 'pan-y' }}>
              <div style={{ position: 'sticky', top: 0, zIndex: 500, padding: '10px 16px', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="🔍 タグやワードで検索 (例: #絶景, 東京)"
                  value={timelineSearchKeyword}
                  onChange={(e) => setTimelineSearchKeyword(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {timelineSpots.map((spot) => {
                  const isCommentsOpen = openCommentsForSpot[spot.id] || false;
                  return (
                    <div
                      key={spot.id}
                      onClick={() => handleOpenSpot(spot)}
                      style={{ width: '100%', height: 'calc(100dvh - 48px - env(safe-area-inset-top, 0px))', scrollSnapAlign: 'start', position: 'relative', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden', cursor: 'pointer' }}
                    >
                      <div
                        style={{ flex: 1, width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <img src={spot.fileUrl || spot.thumbUrl} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)' }}></div>
                      </div>

                      {/* タイムラインのテキスト情報：いいね・コメントボタンと被らないよう配置 */}
                      <div style={{ position: 'absolute', bottom: '110px', left: '16px', right: '85px', color: '#fff', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {spot.userName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{spot.userName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>📍 {spot.cityName}</div>
                          </div>
                        </div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{spot.title}</h3>
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>{spot.description}</p>

                        {isCommentsOpen && (
                          <div style={{ maxHeight: '140px', overflowY: 'auto', background: 'rgba(0,0,0,0.85)', padding: '10px', borderRadius: '12px', marginBottom: '8px', fontSize: '11px', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#38bdf8' }}>💬 コメント一覧</div>
                            {spot.comments && spot.comments.length > 0 ? (
                              spot.comments.map(c => (
                                <div key={c.id} style={{ marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px' }}>
                                  <b>{c.userName}:</b> {c.text}
                                </div>
                              ))
                            ) : (
                              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '6px 0' }}>コメントはまだありません</div>
                            )}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              <input
                                type="text"
                                placeholder="💬 コメントを入力..."
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                style={{ flex: 1, padding: '6px 10px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', outline: 'none' }}
                              />
                              <button
                                onClick={() => {
                                  handleAddComment(spot.id, newCommentText);
                                  setNewCommentText('');
                                }}
                                style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                送信
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* いいね・コメントボタンをさらに上に引き上げて押しやすく改善 (bottom: 140px) */}
                      <div style={{ position: 'absolute', right: '16px', bottom: '140px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', color: '#fff' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleLike(spot.id)}
                          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                        >
                          <span>{likedSpotIds.includes(spot.id) ? '❤️' : '🤍'}</span>
                          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{spot.savedCount}</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenCommentsForSpot(prev => ({ ...prev, [spot.id]: !prev[spot.id] }));
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                        >
                          <span>💬</span>
                          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{spot.comments?.length || 0}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {timelineSpots.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '13px' }}>
                    該当する投稿が見つかりませんでした 📭
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ランキングタブ */}
          {currentTab === 'ranking' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#ffffff', touchAction: 'pan-y' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>🏆 {t('ranking')}</h2>
              {rankingSpots.map((s, i) => (
                <div key={s.id} onClick={() => handleOpenSpot(s)} style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', width: '24px' }}>#{i + 1}</span>
                  <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                    <img src={s.thumbUrl || s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{s.title}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>📍 {s.cityName} | 👀 {s.viewsCount} | ❤️ {s.savedCount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* マイページタブ */}
          {currentTab === 'profile' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#ffffff', touchAction: 'pan-y' }}>
              <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center', boxSizing: 'border-box', marginBottom: '12px' }}>
                <div
                  onClick={() => profileAvatarInputRef.current?.click()}
                  style={{ width: '70px', height: '70px', borderRadius: '50%', background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent, color: '#fff', fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                >
                  {!userAvatar && <span>👤</span>}
                </div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{userName}</h2>
                <span style={{ fontSize: '11px', background: userRank.color, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px' }}>{userRank.title}</span>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>{userBio}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{mySpots.length}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{t('posts')}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{visitedCountryCount}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{t('visited')}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0284c7' }}>{totalMyViewsCount}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Views</div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f43f5e' }}>{totalMySavedCount}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Saves</div>
                  </div>
                </div>

                {/* QRコード操作ボタン */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setIsMyQrOpen(true)}
                    style={{ flex: 1, padding: '10px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <span>📱</span>
                    <span>{t('myQrCode')}</span>
                  </button>
                  <button
                    onClick={() => setIsScanQrOpen(true)}
                    style={{ flex: 1, padding: '10px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <span>📷</span>
                    <span>{t('scanQrCode')}</span>
                  </button>
                </div>
              </div>

              {/* マイページのサブタブ（投稿・ログ・保存・バッジ・フレンド） */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '12px' }}>
                {(['posts', 'timeline', 'saved', 'badges', 'friends'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setProfileSubTab(tab)}
                    style={{
                      padding: '8px 2px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: profileSubTab === tab ? themeAccent : '#f8fafc',
                      color: profileSubTab === tab ? '#fff' : '#64748b',
                      fontWeight: 'bold',
                      fontSize: '10px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {tab === 'posts' ? t('tabPosts') : tab === 'timeline' ? t('tabTimeline') : tab === 'saved' ? t('tabSaved') : tab === 'badges' ? t('tabBadges') : t('tabFriends')}
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
                  {mySpots.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '12px' }}>
                      投稿したスポットがありません 📸
                    </div>
                  )}
                </div>
              )}

              {profileSubTab === 'timeline' && (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                  📅 旅のログタイムライン
                </div>
              )}

              {profileSubTab === 'saved' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                  {savedSpots.map((s) => (
                    <div key={s.id} onClick={() => handleOpenSpot(s)} style={{ height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000', position: 'relative' }}>
                      <img src={s.thumbUrl || s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    </div>
                  ))}
                  {savedSpots.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '12px' }}>
                      保存したスポットがありません 💛
                    </div>
                  )}
                </div>
              )}

              {profileSubTab === 'badges' && (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                  🏅 獲得称号: {userRank.title}
                </div>
              )}

              {profileSubTab === 'friends' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>👥 フレンド ({friendsList.length})</span>
                    <button onClick={() => setIsScanQrOpen(true)} style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                      + 追加する
                    </button>
                  </div>
                  {friendsList.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFriend(f)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                        {f.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{f.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{f.bio}</div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>›</span>
                    </div>
                  ))}
                  {friendsList.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '12px' }}>
                      まだフレンドがいません。QRコードから追加しよう！ 📱
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ボトムナビゲーションを大きくして押しやすくフローティング配置 (bottom: 12px, height: 60px) */}
        <nav style={{ position: 'fixed', bottom: '12px', left: '16px', right: '16px', maxWidth: '420px', margin: '0 auto', height: '60px', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid #cbd5e1', borderRadius: '30px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 9999, boxSizing: 'border-box', padding: '0 8px' }}>
          <button onClick={() => setCurrentTab('map')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: currentTab === 'map' ? 'bold' : 'normal', color: currentTab === 'map' ? themeAccent : '#64748b', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1 }}>
            <span style={{ fontSize: '20px' }}>🗺️</span><span>{t('map')}</span>
          </button>
          <button onClick={() => setCurrentTab('timeline')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: currentTab === 'timeline' ? 'bold' : 'normal', color: currentTab === 'timeline' ? themeAccent : '#64748b', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1 }}>
            <span style={{ fontSize: '20px' }}>🗓️</span><span>{t('feed')}</span>
          </button>
          <button onClick={() => setCurrentTab('ranking')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: currentTab === 'ranking' ? 'bold' : 'normal', color: currentTab === 'ranking' ? themeAccent : '#64748b', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1 }}>
            <span style={{ fontSize: '20px' }}>🏆</span><span>{t('ranking')}</span>
          </button>
          <button onClick={() => setCurrentTab('profile')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: currentTab === 'profile' ? 'bold' : 'normal', color: currentTab === 'profile' ? themeAccent : '#64748b', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1 }}>
            <span style={{ fontSize: '20px' }}>👤</span><span>{t('profile')}</span>
          </button>
        </nav>

        {/* 設定メニューモーダル */}
        {isSettingsOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '400px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>{t('settings')}</h3>
                <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('langSetting')}</label>
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('baseCountrySetting')}</label>
                
                <input
                  type="text"
                  placeholder={t('countrySearchPlaceholder')}
                  value={countrySearchQuery}
                  onChange={(e) => setCountrySearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '6px', boxSizing: 'border-box' }}
                />

                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px' }}>
                  {Object.entries(filteredCountries).map(([region, countries]) => (
                    <div key={region}>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0284c7', margin: '4px 0' }}>{region}</div>
                      {countries.map(([code, c]) => {
                        const isSelected = userCountry === code;
                        return (
                          <div
                            key={code}
                            onClick={() => setUserCountry(code)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: isSelected ? '#f0f9ff' : '#ffffff',
                              border: `1px solid ${isSelected ? '#0284c7' : '#f1f5f9'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            <span style={{ fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#0284c7' : '#0f172a' }}>
                              {c.flag} {c.names[userLangCode] || c.names.en}
                            </span>
                            {isSelected && <span style={{ color: '#0284c7', fontSize: '11px' }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <button
                  onClick={() => setIsGuideModalOpen(true)}
                  style={{ padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
                >
                  📖 {t('guideTitle')}
                </button>
                <button
                  onClick={() => setIsEulaModalOpen(true)}
                  style={{ padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
                >
                  📜 {t('eulaTitle')}
                </button>
                <a
                  href="mailto:wap.support.official@gmail.com?subject=【wap】お問い合わせ"
                  style={{
                    padding: '10px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'block'
                  }}
                >
                  {t('supportContactBtn')}
                </a>
                <button
                  onClick={() => {
                    if (window.confirm('⚠️ 本当にアカウントおよびすべてのデータを削除しますか？')) {
                      localStorage.clear();
                      setSpots([]);
                      setIsOnboarding(true);
                      setIsSettingsOpen(false);
                      showToast('🗑️ アカウントを削除しました');
                    }
                  }}
                  style={{ padding: '10px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
                >
                  {t('deleteAccountBtn')}
                </button>
              </div>

              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  showToast('⚙️ 設定を保存しました！');
                }}
                style={{ width: '100%', padding: '12px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                {t('close')}
              </button>
            </div>
          </div>
        )}

        {/* 利用規約モーダル */}
        {isEulaModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>{t('eulaTitle')}</h3>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '16px' }}>
                {t('eulaFullText')}
              </div>
              <button onClick={() => setIsEulaModalOpen(false)} style={{ width: '100%', padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {t('close')}
              </button>
            </div>
          </div>
        )}

        {/* 使い方ガイドモーダル */}
        {isGuideModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>{t('guideTitle')}</h3>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '16px' }}>
                {t('guideFullText')}
              </div>
              <button onClick={() => setIsGuideModalOpen(false)} style={{ width: '100%', padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {t('close')}
              </button>
            </div>
          </div>
        )}

        {/* ── 詳細モーダル ── */}
        {selectedSpot && (
          <div style={{ position: 'fixed', inset: 0, background: '#ffffff', color: '#0f172a', zIndex: 2000, display: 'flex', flexDirection: 'column', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ height: '48px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: '#ffffff', zIndex: 10, boxSizing: 'border-box' }}>
              <button onClick={() => setSelectedSpot(null)} style={{ background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                ← 戻る
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleReportSpot(selectedSpot.id)}
                  style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {t('reportSpot')}
                </button>
                {selectedSpot.userId !== 'me' && selectedSpot.userId !== 'user-official' && (
                  <button
                    onClick={() => handleBlockUser(selectedSpot.userId)}
                    style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {t('blockUser')}
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
              <div
                onClick={() => {
                  if (selectedSpot.mediaList && selectedSpot.mediaList.length > 1) {
                    setActiveMediaIndex((prev) => (prev + 1) % selectedSpot.mediaList!.length);
                  }
                }}
                style={{ width: '100%', height: '280px', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: selectedSpot.mediaList && selectedSpot.mediaList.length > 1 ? 'pointer' : 'default' }}
              >
                {(() => {
                  const currentMedia = selectedSpot.mediaList && selectedSpot.mediaList[activeMediaIndex]
                    ? selectedSpot.mediaList[activeMediaIndex]
                    : { fileUrl: selectedSpot.fileUrl, fileType: selectedSpot.fileType };
                  
                  return currentMedia.fileType === 'video' ? (
                    <video src={currentMedia.fileUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <img src={currentMedia.fileUrl} alt={selectedSpot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  );
                })()}

                {selectedSpot.mediaList && selectedSpot.mediaList.length > 1 && (
                  <div style={{ position: 'absolute', bottom: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                    📷 {activeMediaIndex + 1} / {selectedSpot.mediaList.length} (タップして次へ)
                  </div>
                )}
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

              <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                {translatedDescriptions[selectedSpot.id] || selectedSpot.description}
              </p>

              {/* コメントセクション */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>💬 コメント ({selectedSpot.comments?.length || 0})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {selectedSpot.comments?.map((c) => (
                    <div key={c.id} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7', marginBottom: '2px' }}>{c.userName}</div>
                      <div style={{ fontSize: '12px', color: '#334155' }}>{c.text}</div>
                    </div>
                  ))}
                  {(!selectedSpot.comments || selectedSpot.comments.length === 0) && (
                    <div style={{ fontSize: '11px', color: '#64748b' }}>まだコメントはありません</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={t('commentPlaceholder')}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <button
                    onClick={() => handleAddComment(selectedSpot.id)}
                    style={{ padding: '8px 16px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                  >
                    {t('commentSend')}
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
                🏷️ スポットのカテゴリを選択
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                {(['view', 'gourmet', 'rain'] as const).map((cat) => {
                  const isSelected = postCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPostCategory(cat)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '10px',
                        border: `2px solid ${isSelected ? themeAccent : '#e2e8f0'}`,
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        color: isSelected ? themeAccent : '#64748b',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {cat === 'view' ? `🏔️ ${t('view')}` : cat === 'gourmet' ? `🍔 ${t('gourmet')}` : `🌧️ ${t('rain')}`}
                    </button>
                  );
                })}
              </div>

              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                🌐 反映させるマップモードを選択
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {(['world', 'friends', 'my'] as const).map((scope) => {
                  const isSelected = selectedScopes.includes(scope);
                  return (
                    <div
                      key={scope}
                      onClick={() => toggleScopeSelection(scope)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `2px solid ${isSelected ? themeAccent : '#e2e8f0'}`,
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: isSelected ? themeAccent : '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{scope === 'world' ? `🌎 ${t('world')}` : scope === 'friends' ? `👥 ${t('friends')}` : `📍 ${t('myMap')}`}</span>
                      <span>{isSelected ? '☑️' : '☐'}</span>
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

      </div>
    </>
  );
}
