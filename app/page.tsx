'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 0. Supabase クライアント初期化 & メディアURLヘルパー
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop';
const PIN_BLUE_COLOR = '#0284c7';

function readFileAsPersistentDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    } catch {
      resolve('');
    }
  });
}

function resolveMediaSrc(primary?: string, secondary?: string): string {
  if (primary && primary.trim() !== '') return primary;
  if (secondary && secondary.trim() !== '') return secondary;
  return FALLBACK_IMAGE_URL;
}

function clampPreviewTransform(
  scale: number,
  offset: { x: number; y: number },
  containerWidth = 360,
  containerHeight = 180
): { scale: number; offset: { x: number; y: number } } {
  const safeScale = Math.max(1, Math.min(3.5, scale));
  const maxX = Math.max(0, ((safeScale - 1) * containerWidth) / 2);
  const maxY = Math.max(0, ((safeScale - 1) * containerHeight) / 2);
  const clampedX = Math.max(-maxX, Math.min(maxX, offset.x));
  const clampedY = Math.max(-maxY, Math.min(maxY, offset.y));
  return { scale: safeScale, offset: { x: clampedX, y: clampedY } };
}

// ==========================================
// 1. 型定義 & 多言語マスターデータ
// ==========================================
export type ViewCategory = 'view' | 'gourmet' | 'rain' | 'cafe' | 'onsen' | 'shopping';
export type DisplayScope = 'my' | 'friends' | 'world';
export type TabType = 'map' | 'timeline' | 'ranking' | 'profile';
export type MapThemeType = 'light' | 'dark' | 'pastel';
export type MultiPostSortType = 'newest' | 'likes' | 'views';

export interface CommentItem {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  replyTo?: string;
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
  title?: string;
  description?: string;
  createdAt?: string;
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
  hasParking?: boolean;
  tags?: string[];
  comments?: CommentItem[];
  reportCount?: number;
  createdAt: string;
}

export interface PendingUploadItem {
  id: string;
  file: File;
  fileUrl: string;
  thumbUrl?: string;
  fileType: 'image' | 'video';
  lat?: number;
  lon?: number;
  hasGps: boolean;
  dateTime?: string;
  title: string;
  description: string;
  hasParking: boolean;
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
  } else if (lang === 'zh' || lang === 'zh_tw') {
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
    filterBtn: 'ピンを絞り込む',
    selectedModesLabel: '選択中のモード',
    clearModesBtn: 'クリア',
    view: '景色',
    gourmet: 'グルメ',
    rain: '雨の日',
    cafe: 'カフェ',
    onsen: '温泉',
    shopping: 'ショッピング',
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
    mapColorSetting: '🎨 マップの色',
    mapColorWhite: '⬜ ホワイト',
    mapColorDark: '⬛ ダーク',
    mapColorBase: '🌿 ナチュラル',
    baseCountrySetting: '📍 ベースの国 (初期マップ)',
    blockListTitle: '🚫 ブロック中ユーザー管理',
    eulaTitle: '📜 利用規約 (EULA)',
    guideTitle: '📖 アプリの操作説明',
    translate: '🌐 翻訳する',
    close: '閉じる',
    tabPosts: '📸 投稿',
    tabTimeline: '📅 ログ',
    tabSaved: '❤️ 保存',
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
    guideFullText: `📖【wap（ワップ）のわかりやすい使い方ガイド】

1️⃣ **マップ画面で地図を見る・探す**
- 下のメニューの「🗺️ マップ」を押すと、世界地図や日本地図が開くよ！
- 画面の上にある🔍「検索バー」に、行きたい場所の名前（例: 京都）やハッシュタグ（例: #絶景）を入力して虫眼鏡ボタンを押すと、その場所へビューンと飛べるよ。
- 左上の「☰」ボタンを押すと、言語の変更や設定ができるよ。

2️⃣ **すてきな写真や動画をマップに投稿する（カンタン！）**
- マップ画面の左下にある「📷＋ 写真/動画を追加」ボタンを押してね。
- スマホの中にある写真や動画を選ぶと、自動的に場所（位置情報）がマップにセットされるよ！（※場所が違うときは「地名・住所検索」で正しい場所をえらんでね）
- プレビュー画面で、iPhoneの写真アプリと同じように**「二本指で広げたり縮めたり（ピンチイン・アウト）」**して大きさを自由に変えたり、指でスワイプして位置を微調整できるよ！
- タイトルや思い出メモを入力して、「マップに反映する 🚀」を押すだけ！

3️⃣ **みんなの投稿を見る（タイムライン）**
- 下のメニューの「🗓️ タイムライン」を押すと、あなたのベース国の投稿が優先されて、みんなの写真や動画がTikTokみたいに縦に流れてくるよ！
- 動画は音声つきでスムーズに再生されるよ。画面のどこを上下にスワイプしても次の投稿へサクサク進むよ！投稿をタップすれば詳しい情報が見られるよ。

4️⃣ **ランキングと自分のページ**
- 「🏆 ランキング」では、みんなに大人気のスポットがわかるよ。
- 「👤 マイページ」では、自分の投稿した数や、訪問した国の数、自分だけの「QRコード」を確認して友達とフレンドになれるよ！マイページの「投稿」や「保存」にある写真を押すと、いつでも投稿の詳細を確認できるよ。`
  },
  en: {
    step1Title: 'Step 1: Select Language',
    step1Desc: 'Choose your preferred language.',
    step2Title: 'Step 2: Select Base Country',
    step2Desc: 'Choose your main country for the initial map.',
    step3Title: 'Step 3: Create Profile',
    step3TitleEula: 'Step 4: Terms & Location Policy',
    next: 'Next',
    back: 'Back',
    startApp: '🚀 Start wap',
    eulaAgree: 'I agree to the Terms & Location Policy (Required)',
    map: 'Map',
    feed: 'Timeline',
    ranking: 'Ranking',
    profile: 'Profile',
    addPhoto: 'Add Photo / Video',
    exportMap: 'Save Map',
    filterBtn: 'Filter Pins',
    selectedModesLabel: 'Selected Modes',
    clearModesBtn: 'Clear',
    view: 'View',
    gourmet: 'Gourmet',
    rain: 'Rainy',
    cafe: 'Cafe',
    onsen: 'Onsen',
    shopping: 'Shopping',
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
    visited: 'Countries',
    posts: 'Posts',
    friendCode: 'Friend Code',
    searchPlaceholder: '🔍 Search city, place, #tag',
    countrySearchPlaceholder: '🔍 Search country name',
    settings: '⚙️ Settings',
    langSetting: '🌐 Display Language',
    mapColorSetting: '🎨 Map Color',
    mapColorWhite: '⬜ White',
    mapColorDark: '⬛ Dark',
    mapColorBase: '🌿 Natural',
    baseCountrySetting: '📍 Base Country',
    blockListTitle: '🚫 Blocked Users',
    eulaTitle: '📜 Terms & Policy (EULA)',
    guideTitle: '📖 How to Use',
    translate: '🌐 Translate',
    close: 'Close',
    tabPosts: '📸 Posts',
    tabTimeline: '📅 Log',
    tabSaved: '❤️ Saved',
    tabBadges: '🏅 Badges',
    tabFriends: '👥 Friends',
    reportSpot: '🚨 Report post',
    blockUser: '🚫 Block user',
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
    step1Title: 'Step 1: 표시 언어 선택',
    step1Desc: '원하는 언어를 선택하세요.',
    step2Title: 'Step 2: 기본 국가 선택',
    step2Desc: '초기 지도에 표시할 기본 국가를 선택하세요.',
    step3Title: 'Step 3: 프로필 만들기',
    step3TitleEula: 'Step 4: 이용약관 및 위치정보 정책',
    next: '다음',
    back: '뒤로',
    startApp: '🚀 wap 시작하기',
    eulaAgree: '이용약관 및 위치정보 정책에 동의합니다 (필수)',
    map: '지도',
    feed: '타임라인',
    ranking: '랭킹',
    profile: '마이페이지',
    addPhoto: '사진 / 영상 추가',
    exportMap: '지도 저장',
    filterBtn: '핀 필터링',
    selectedModesLabel: '선택된 모드',
    clearModesBtn: '초기화',
    view: '풍경',
    gourmet: '맛집',
    rain: '비 오는 날',
    cafe: '카페',
    onsen: '온천',
    shopping: '쇼핑',
    myMap: '내 지도',
    friends: '친구',
    world: '전체',
    openGoogleMaps: '🧭 Google 지도로 길찾기',
    likeSpot: '❤️ 좋아요',
    likedSpot: '❤️ 좋아요 완료',
    report: '⚠️ 신고',
    block: '🚫 차단',
    delete: '🗑️ 삭제',
    edit: '✏️ 수정',
    visited: '방문국',
    posts: '게시물',
    friendCode: '친구 코드',
    searchPlaceholder: '🔍 도시, 장소, #태그 검색',
    countrySearchPlaceholder: '🔍 국가명 검색',
    settings: '⚙️ 설정 메뉴',
    langSetting: '🌐 표시 언어',
    mapColorSetting: '🎨 지도 색상',
    mapColorWhite: '⬜ 화이트',
    mapColorDark: '⬛ 다크',
    mapColorBase: '🌿 내추럴',
    baseCountrySetting: '📍 기본 국가',
    blockListTitle: '🚫 차단된 사용자',
    eulaTitle: '📜 이용약관',
    guideTitle: '📖 앱 사용 안내',
    translate: '🌐 번역하기',
    close: '닫기',
    tabPosts: '📸 게시물',
    tabTimeline: '📅 로그',
    tabSaved: '❤️ 저장',
    tabBadges: '🏅 배지',
    tabFriends: '👥 친구',
    reportSpot: '🚨 게시물 신고',
    blockUser: '🚫 사용자 차단',
    supportContactBtn: '✉️ 고객지원 문의 (wap.support.official@gmail.com)',
    scopeWorld: '🌎 전체',
    scopeFriends: '👥 친구',
    scopeMy: '📍 내 지도',
    deleteAccountBtn: '⚠️ 계정 삭제',
    commentPlaceholder: '💬 댓글 입력...',
    commentSend: '전송',
    myQrCode: '📱 내 QR코드',
    scanQrCode: '📷 QR코드 스캔',
    eulaFullText: `[wap 이용약관 및 위치정보 정책]\n문의: wap.support.official@gmail.com`,
    guideFullText: `[wap 사용 가이드]`
  },
  zh: {
    step1Title: 'Step 1: 选择显示语言',
    step1Desc: '请选择您偏好的语言。',
    step2Title: 'Step 2: 选择基础国家',
    step2Desc: '请选择初始地图所在的国家。',
    step3Title: 'Step 3: 创建个人资料',
    step3TitleEula: 'Step 4: 服务条款与位置政策',
    next: '下一步',
    back: '返回',
    startApp: '🚀 开始使用 wap',
    eulaAgree: '同意服务条款和位置信息政策（必填）',
    map: '地图',
    feed: '时间线',
    ranking: '排行榜',
    profile: '我的主页',
    addPhoto: '添加照片 / 视频',
    exportMap: '保存地图',
    filterBtn: '筛选图钉',
    selectedModesLabel: '已选模式',
    clearModesBtn: '清除',
    view: '风景',
    gourmet: '美食',
    rain: '雨天',
    cafe: '咖啡',
    onsen: '温泉',
    shopping: '购物',
    myMap: '我的地图',
    friends: '好友',
    world: '世界',
    openGoogleMaps: '🧭 使用 Google 地图导航',
    searchPlaceholder: '🔍 搜索城市、地点、#标签',
    countrySearchPlaceholder: '🔍 搜索国家名称',
    settings: '⚙️ 设置菜单',
    langSetting: '🌐 显示语言',
    mapColorSetting: '🎨 地图颜色',
    mapColorWhite: '⬜ 白色',
    mapColorDark: '⬛ 深色',
    mapColorBase: '🌿 自然色',
    baseCountrySetting: '📍 基础国家',
    close: '关闭',
  },
  zh_tw: {
    step1Title: 'Step 1: 選擇顯示語言',
    step1Desc: '請選擇您偏好的語言。',
    step2Title: 'Step 2: 選擇基礎國家',
    step2Desc: '請選擇初始地圖所在的國家。',
    step3Title: 'Step 3: 建立個人資料',
    step3TitleEula: 'Step 4: 服務條款與位置政策',
    next: '下一步',
    back: '返回',
    startApp: '🚀 開始使用 wap',
    eulaAgree: '同意服務條款與位置資訊政策（必填）',
    map: '地圖',
    feed: '動態',
    ranking: '排行榜',
    profile: '個人主頁',
    addPhoto: '新增照片 / 影片',
    exportMap: '儲存地圖',
    filterBtn: '篩選地標',
    selectedModesLabel: '已選模式',
    clearModesBtn: '清除',
    view: '風景',
    gourmet: '美食',
    rain: '雨天',
    cafe: '咖啡',
    onsen: '溫泉',
    shopping: '購物',
    myMap: '我的地圖',
    friends: '好友',
    world: '世界',
    openGoogleMaps: '🧭 使用 Google 地圖導航',
    searchPlaceholder: '🔍 搜尋城市、地點、#標籤',
    countrySearchPlaceholder: '🔍 搜尋國家名稱',
    settings: '⚙️ 設定選單',
    langSetting: '🌐 顯示語言',
    mapColorSetting: '🎨 地圖顏色',
    mapColorWhite: '⬜ 白色',
    mapColorDark: '⬛ 深色',
    mapColorBase: '🌿 自然色',
    baseCountrySetting: '📍 基礎國家',
    close: '關閉',
  },
  es: {
    map: 'Mapa',
    feed: 'Cronología',
    ranking: 'Ranking',
    profile: 'Perfil',
    addPhoto: 'Añadir foto / video',
    filterBtn: 'Filtrar pines',
    selectedModesLabel: 'Modos elegidos',
    clearModesBtn: 'Limpiar',
    view: 'Vista',
    gourmet: 'Gastronomía',
    rain: 'Lluvia',
    cafe: 'Café',
    onsen: 'Onsen',
    shopping: 'Compras',
    myMap: 'Mi Mapa',
    friends: 'Amigos',
    world: 'Mundo',
    openGoogleMaps: '🧭 Abrir en Google Maps',
    searchPlaceholder: '🔍 Buscar ciudad, lugar, #etiqueta',
    settings: '⚙️ Ajustes',
    langSetting: '🌐 Idioma',
    mapColorSetting: '🎨 Color del mapa',
    mapColorWhite: '⬜ Blanco',
    mapColorDark: '⬛ Oscuro',
    mapColorBase: '🌿 Natural',
    baseCountrySetting: '📍 País base',
    close: 'Cerrar',
  },
  fr: {
    map: 'Carte',
    feed: 'Fil',
    ranking: 'Classement',
    profile: 'Profil',
    addPhoto: 'Ajouter photo / vidéo',
    filterBtn: 'Filtrer repères',
    selectedModesLabel: 'Modes choisis',
    clearModesBtn: 'Effacer',
    view: 'Paysage',
    gourmet: 'Gastronomie',
    rain: 'Pluie',
    cafe: 'Café',
    onsen: 'Onsen',
    shopping: 'Shopping',
    myMap: 'Ma Carte',
    friends: 'Amis',
    world: 'Monde',
    openGoogleMaps: '🧭 Itinéraire Google Maps',
    searchPlaceholder: '🔍 Rechercher ville, lieu, #tag',
    settings: '⚙️ Paramètres',
    langSetting: '🌐 Langue',
    mapColorSetting: '🎨 Couleur de la carte',
    mapColorWhite: '⬜ Blanc',
    mapColorDark: '⬛ Sombre',
    mapColorBase: '🌿 Naturel',
    baseCountrySetting: '📍 Pays de base',
    close: 'Fermer',
  },
  de: {
    map: 'Karte',
    feed: 'Verlauf',
    ranking: 'Rangliste',
    profile: 'Profil',
    addPhoto: 'Foto / Video hinzufügen',
    filterBtn: 'Pins filtern',
    selectedModesLabel: 'Gewählte Modi',
    clearModesBtn: 'Zurücksetzen',
    view: 'Aussicht',
    gourmet: 'Kulinarik',
    rain: 'Regen',
    cafe: 'Café',
    onsen: 'Onsen',
    shopping: 'Shopping',
    myMap: 'Meine Karte',
    friends: 'Freunde',
    world: 'Welt',
    openGoogleMaps: '🧭 Mit Google Maps navigieren',
    searchPlaceholder: '🔍 Ort, Stadt, #Tag suchen',
    settings: '⚙️ Einstellungen',
    langSetting: '🌐 Sprache',
    mapColorSetting: '🎨 Kartenfarbe',
    mapColorWhite: '⬜ Weiß',
    mapColorDark: '⬛ Dunkel',
    mapColorBase: '🌿 Natürlich',
    baseCountrySetting: '📍 Basisland',
    close: 'Schließen',
  },
  pt: {
    map: 'Mapa',
    feed: 'Linha do tempo',
    ranking: 'Ranking',
    profile: 'Perfil',
    addPhoto: 'Adicionar foto / vídeo',
    filterBtn: 'Filtrar pinos',
    selectedModesLabel: 'Modos escolhidos',
    clearModesBtn: 'Limpar',
    view: 'Vista',
    gourmet: 'Gastronomia',
    rain: 'Chuva',
    cafe: 'Café',
    onsen: 'Onsen',
    shopping: 'Compras',
    myMap: 'Meu Mapa',
    friends: 'Amigos',
    world: 'Mundo',
    openGoogleMaps: '🧭 Navegar no Google Maps',
    searchPlaceholder: '🔍 Buscar cidade, local, #tag',
    settings: '⚙️ Configurações',
    langSetting: '🌐 Idioma',
    mapColorSetting: '🎨 Cor do mapa',
    mapColorWhite: '⬜ Branco',
    mapColorDark: '⬛ Escuro',
    mapColorBase: '🌿 Natural',
    baseCountrySetting: '📍 País base',
    close: 'Fechar',
  },
  it: {
    map: 'Mappa',
    feed: 'Feed',
    ranking: 'Classifica',
    profile: 'Profilo',
    addPhoto: 'Aggiungi foto / video',
    filterBtn: 'Filtra pin',
    selectedModesLabel: 'Modalità scelte',
    clearModesBtn: 'Pulisci',
    view: 'Panorama',
    gourmet: 'Gourmet',
    rain: 'Pioggia',
    cafe: 'Caffè',
    onsen: 'Onsen',
    shopping: 'Shopping',
    myMap: 'La Mia Mappa',
    friends: 'Amici',
    world: 'Mondo',
    openGoogleMaps: '🧭 Naviga con Google Maps',
    searchPlaceholder: '🔍 Cerca città, luogo, #tag',
    settings: '⚙️ Impostazioni',
    langSetting: '🌐 Lingua',
    mapColorSetting: '🎨 Colore mappa',
    mapColorWhite: '⬜ Bianco',
    mapColorDark: '⬛ Scuro',
    mapColorBase: '🌿 Naturale',
    baseCountrySetting: '📍 Paese base',
    close: 'Chiudi',
  },
  ru: {
    map: 'Карта',
    feed: 'Лента',
    ranking: 'Рейтинг',
    profile: 'Профиль',
    addPhoto: 'Добавить фото / видео',
    filterBtn: 'Фильтр меток',
    selectedModesLabel: 'Выбранные режимы',
    clearModesBtn: 'Сброс',
    view: 'Виды',
    gourmet: 'Еда',
    rain: 'Дождь',
    cafe: 'Кафе',
    onsen: 'Онсэн',
    shopping: 'Шоппинг',
    myMap: 'Моя карта',
    friends: 'Друзья',
    world: 'Мир',
    openGoogleMaps: '🧭 Маршрут в Google Картах',
    searchPlaceholder: '🔍 Поиск города, места, #тега',
    settings: '⚙️ Настройки',
    langSetting: '🌐 Язык',
    mapColorSetting: '🎨 Цвет карты',
    mapColorWhite: '⬜ Белый',
    mapColorDark: '⬛ Тёмный',
    mapColorBase: '🌿 Природный',
    baseCountrySetting: '📍 Базовая страна',
    close: 'Закрыть',
  },
  ar: {
    map: 'الخريطة',
    feed: 'الخلاصة',
    ranking: 'الترتيب',
    profile: 'الملف الشخصي',
    addPhoto: 'إضافة صورة / فيديو',
    filterBtn: 'تصفية الدبابيس',
    selectedModesLabel: 'الأوضاع المختارة',
    clearModesBtn: 'مسح',
    view: 'منظر',
    gourmet: 'طعام',
    rain: 'مطر',
    cafe: 'مقهى',
    onsen: 'ينابيع',
    shopping: 'تسوق',
    myMap: 'خريطتي',
    friends: 'الأصدقاء',
    world: 'العالم',
    openGoogleMaps: '🧭 الانتقال عبر خرائط Google',
    searchPlaceholder: '🔍 ابحث عن مدينة أو مكان أو #وسم',
    settings: '⚙️ الإعدادات',
    langSetting: '🌐 اللغة',
    mapColorSetting: '🎨 لون الخريطة',
    mapColorWhite: '⬜ أبيض',
    mapColorDark: '⬛ داكن',
    mapColorBase: '🌿 طبيعي',
    baseCountrySetting: '📍 البلد الأساسي',
    close: 'إغلاق',
  },
  hi: {
    map: 'मानचित्र',
    feed: 'फ़ीड',
    ranking: 'रैंकिंग',
    profile: 'प्रोफ़ाइल',
    addPhoto: 'फ़ोटो / वीडियो जोड़ें',
    filterBtn: 'पिन फ़िल्टर करें',
    selectedModesLabel: 'चयनित मोड',
    clearModesBtn: 'साफ़ करें',
    view: 'दृश्य',
    gourmet: 'भोजन',
    rain: 'बारिश',
    cafe: 'कैफ़े',
    onsen: 'ऑनसेन',
    shopping: 'शॉपिंग',
    myMap: 'मेरा मानचित्र',
    friends: 'मित्र',
    world: 'विश्व',
    openGoogleMaps: '🧭 Google Maps से नेविगेट करें',
    searchPlaceholder: '🔍 शहर, जगह या #टैग खोजें',
    settings: '⚙️ सेटिंग्स',
    langSetting: '🌐 भाषा',
    mapColorSetting: '🎨 मानचित्र का रंग',
    mapColorWhite: '⬜ सफ़ेद',
    mapColorDark: '⬛ डार्क',
    mapColorBase: '🌿 प्राकृतिक',
    baseCountrySetting: '📍 मुख्य देश',
    close: 'बंद करें',
  },
  th: {
    map: 'แผนที่',
    feed: 'ไทม์ไลน์',
    ranking: 'อันดับ',
    profile: 'โปรไฟล์',
    addPhoto: 'เพิ่มรูป / วิดีโอ',
    filterBtn: 'กรองหมุด',
    selectedModesLabel: 'โหมดที่เลือก',
    clearModesBtn: 'ล้าง',
    view: 'วิว',
    gourmet: 'ของอร่อย',
    rain: 'วันฝนตก',
    cafe: 'คาเฟ่',
    onsen: 'ออนเซ็น',
    shopping: 'ช้อปปิ้ง',
    myMap: 'แผนที่ของฉัน',
    friends: 'เพื่อน',
    world: 'ทั่วโลก',
    openGoogleMaps: '🧭 นำทางด้วย Google Maps',
    searchPlaceholder: '🔍 ค้นหาเมือง สถานที่ หรือ #แท็ก',
    settings: '⚙️ ตั้งค่า',
    langSetting: '🌐 ภาษา',
    mapColorSetting: '🎨 สีแผนที่',
    mapColorWhite: '⬜ ขาว',
    mapColorDark: '⬛ มืด',
    mapColorBase: '🌿 ธรรมชาติ',
    baseCountrySetting: '📍 ประเทศหลัก',
    close: 'ปิด',
  },
  vi: {
    map: 'Bản đồ',
    feed: 'Dòng thời gian',
    ranking: 'Xếp hạng',
    profile: 'Hồ sơ',
    addPhoto: 'Thêm ảnh / video',
    filterBtn: 'Lọc ghim',
    selectedModesLabel: 'Chế độ đã chọn',
    clearModesBtn: 'Xóa lọc',
    view: 'Cảnh đẹp',
    gourmet: 'Ẩm thực',
    rain: 'Ngày mưa',
    cafe: 'Cà phê',
    onsen: 'Suối nước nóng',
    shopping: 'Mua sắm',
    myMap: 'Bản đồ của tôi',
    friends: 'Bạn bè',
    world: 'Thế giới',
    openGoogleMaps: '🧭 Chỉ đường bằng Google Maps',
    searchPlaceholder: '🔍 Tìm thành phố, địa điểm, #thẻ',
    settings: '⚙️ Cài đặt',
    langSetting: '🌐 Ngôn ngữ',
    mapColorSetting: '🎨 Màu bản đồ',
    mapColorWhite: '⬜ Trắng',
    mapColorDark: '⬛ Tối',
    mapColorBase: '🌿 Tự nhiên',
    baseCountrySetting: '📍 Quốc gia mặc định',
    close: 'Đóng',
  },
  id: {
    map: 'Peta',
    feed: 'Linimasa',
    ranking: 'Peringkat',
    profile: 'Profil',
    addPhoto: 'Tambah foto / video',
    filterBtn: 'Filter pin',
    selectedModesLabel: 'Mode terpilih',
    clearModesBtn: 'Hapus',
    view: 'Pemandangan',
    gourmet: 'Kuliner',
    rain: 'Hari hujan',
    cafe: 'Kafe',
    onsen: 'Onsen',
    shopping: 'Belanja',
    myMap: 'Petaku',
    friends: 'Teman',
    world: 'Dunia',
    openGoogleMaps: '🧭 Navigasi dengan Google Maps',
    searchPlaceholder: '🔍 Cari kota, tempat, #tagar',
    settings: '⚙️ Pengaturan',
    langSetting: '🌐 Bahasa',
    mapColorSetting: '🎨 Warna peta',
    mapColorWhite: '⬜ Putih',
    mapColorDark: '⬛ Gelap',
    mapColorBase: '🌿 Alami',
    baseCountrySetting: '📍 Negara utama',
    close: 'Tutup',
  },
  ms: {
    map: 'Peta',
    feed: 'Garis masa',
    ranking: 'Kedudukan',
    profile: 'Profil',
    addPhoto: 'Tambah foto / video',
    filterBtn: 'Tapis pin',
    selectedModesLabel: 'Mod dipilih',
    clearModesBtn: 'Kosongkan',
    view: 'Pemandangan',
    gourmet: 'Makanan',
    rain: 'Hari hujan',
    cafe: 'Kafe',
    onsen: 'Onsen',
    shopping: 'Membeli-belah',
    myMap: 'Peta Saya',
    friends: 'Rakan',
    world: 'Dunia',
    openGoogleMaps: '🧭 Pandu arah dengan Google Maps',
    searchPlaceholder: '🔍 Cari bandar, tempat, #tag',
    settings: '⚙️ Tetapan',
    langSetting: '🌐 Bahasa',
    mapColorSetting: '🎨 Warna peta',
    mapColorWhite: '⬜ Putih',
    mapColorDark: '⬛ Gelap',
    mapColorBase: '🌿 Semula jadi',
    baseCountrySetting: '📍 Negara utama',
    close: 'Tutup',
  },
  tl: {
    map: 'Mapa',
    feed: 'Timeline',
    ranking: 'Ranking',
    profile: 'Profile',
    addPhoto: 'Magdagdag ng photo / video',
    filterBtn: 'I-filter ang pin',
    selectedModesLabel: 'Napiling mode',
    clearModesBtn: 'I-clear',
    view: 'Tanawin',
    gourmet: 'Pagkain',
    rain: 'Maulan',
    cafe: 'Cafe',
    onsen: 'Onsen',
    shopping: 'Shopping',
    myMap: 'Aking Mapa',
    friends: 'Mga Kaibigan',
    world: 'Mundo',
    openGoogleMaps: '🧭 Mag-navigate gamit ang Google Maps',
    searchPlaceholder: '🔍 Maghanap ng lungsod, lugar, #tag',
    settings: '⚙️ Mga Setting',
    langSetting: '🌐 Wika',
    mapColorSetting: '🎨 Kulay ng mapa',
    mapColorWhite: '⬜ Puti',
    mapColorDark: '⬛ Madilim',
    mapColorBase: '🌿 Natural',
    baseCountrySetting: '📍 Pangunahing bansa',
    close: 'Isara',
  },
  tr: {
    map: 'Harita',
    feed: 'Akış',
    ranking: 'Sıralama',
    profile: 'Profil',
    addPhoto: 'Fotoğraf / video ekle',
    filterBtn: 'Pin filtrele',
    selectedModesLabel: 'Seçili modlar',
    clearModesBtn: 'Temizle',
    view: 'Manzara',
    gourmet: 'Gurme',
    rain: 'Yağmurlu',
    cafe: 'Kafe',
    onsen: 'Kaplıca',
    shopping: 'Alışveriş',
    myMap: 'Haritam',
    friends: 'Arkadaşlar',
    world: 'Dünya',
    openGoogleMaps: '🧭 Google Haritalar ile yol tarifi',
    searchPlaceholder: '🔍 Şehir, mekan, #etiket ara',
    settings: '⚙️ Ayarlar',
    langSetting: '🌐 Dil',
    mapColorSetting: '🎨 Harita rengi',
    mapColorWhite: '⬜ Beyaz',
    mapColorDark: '⬛ Koyu',
    mapColorBase: '🌿 Doğal',
    baseCountrySetting: '📍 Ana ülke',
    close: 'Kapat',
  },
  nl: {
    map: 'Kaart',
    feed: 'Tijdlijn',
    ranking: 'Ranglijst',
    profile: 'Profiel',
    addPhoto: 'Foto / video toevoegen',
    filterBtn: 'Pins filteren',
    selectedModesLabel: 'Gekozen modi',
    clearModesBtn: 'Wissen',
    view: 'Uitzicht',
    gourmet: 'Gastronomie',
    rain: 'Regen',
    cafe: 'Café',
    onsen: 'Onsen',
    shopping: 'Shoppen',
    myMap: 'Mijn Kaart',
    friends: 'Vrienden',
    world: 'Wereld',
    openGoogleMaps: '🧭 Navigeren met Google Maps',
    searchPlaceholder: '🔍 Zoek stad, plek, #tag',
    settings: '⚙️ Instellingen',
    langSetting: '🌐 Taal',
    mapColorSetting: '🎨 Kaartkleur',
    mapColorWhite: '⬜ Wit',
    mapColorDark: '⬛ Donker',
    mapColorBase: '🌿 Natuurlijk',
    baseCountrySetting: '📍 Basisland',
    close: 'Sluiten',
  },
  pl: {
    map: 'Mapa',
    feed: 'Oś czasu',
    ranking: 'Ranking',
    profile: 'Profil',
    addPhoto: 'Dodaj zdjęcie / wideo',
    filterBtn: 'Filtruj pinezki',
    selectedModesLabel: 'Wybrane tryby',
    clearModesBtn: 'Wyczyść',
    view: 'Widok',
    gourmet: 'Kulinaria',
    rain: 'Deszcz',
    cafe: 'Kawiarnia',
    onsen: 'Onsen',
    shopping: 'Zakupy',
    myMap: 'Moja Mapa',
    friends: 'Znajomi',
    world: 'Świat',
    openGoogleMaps: '🧭 Nawiguj w Google Maps',
    searchPlaceholder: '🔍 Szukaj miasta, miejsca, #tagu',
    settings: '⚙️ Ustawienia',
    langSetting: '🌐 Język',
    mapColorSetting: '🎨 Kolor mapy',
    mapColorWhite: '⬜ Biały',
    mapColorDark: '⬛ Ciemny',
    mapColorBase: '🌿 Naturalny',
    baseCountrySetting: '📍 Kraj bazowy',
    close: 'Zamknij',
  },
  sv: {
    map: 'Karta',
    feed: 'Flöde',
    ranking: 'Topplista',
    profile: 'Profil',
    addPhoto: 'Lägg till foto / video',
    filterBtn: 'Filtrera nålar',
    selectedModesLabel: 'Valda lägen',
    clearModesBtn: 'Rensa',
    view: 'Vy',
    gourmet: 'Mat',
    rain: 'Regn',
    cafe: 'Café',
    onsen: 'Onsen',
    shopping: 'Shopping',
    myMap: 'Min Karta',
    friends: 'Vänner',
    world: 'Världen',
    openGoogleMaps: '🧭 Navigera med Google Maps',
    searchPlaceholder: '🔍 Sök stad, plats, #tagg',
    settings: '⚙️ Inställningar',
    langSetting: '🌐 Språk',
    mapColorSetting: '🎨 Kartfärg',
    mapColorWhite: '⬜ Vit',
    mapColorDark: '⬛ Mörk',
    mapColorBase: '🌿 Naturlig',
    baseCountrySetting: '📍 Basland',
    close: 'Stäng',
  },
  uk: {
    map: 'Карта',
    feed: 'Стрічка',
    ranking: 'Рейтинг',
    profile: 'Профіль',
    addPhoto: 'Додати фото / відео',
    filterBtn: 'Фільтр міток',
    selectedModesLabel: 'Обрані режими',
    clearModesBtn: 'Очистити',
    view: 'Краєвид',
    gourmet: 'Їжа',
    rain: 'Дощ',
    cafe: 'Кафе',
    onsen: 'Онсен',
    shopping: 'Шопінг',
    myMap: 'Моя карта',
    friends: 'Друзі',
    world: 'Світ',
    openGoogleMaps: '🧭 Навігація в Google Картах',
    searchPlaceholder: '🔍 Пошук міста, місця, #тегу',
    settings: '⚙️ Налаштування',
    langSetting: '🌐 Мова',
    mapColorSetting: '🎨 Колір карти',
    mapColorWhite: '⬜ Білий',
    mapColorDark: '⬛ Темний',
    mapColorBase: '🌿 Природний',
    baseCountrySetting: '📍 Базова країна',
    close: 'Закрити',
  }
};

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
  PK: { names: { ja: 'パキスタン', en: 'Pakistan', ko: '파키스탄', zh: '파키스탄' }, flag: '🇵🇰', region: '🍛 南・中央アジア', lat: 30.3753, lon: 69.3451, zoom: 5 },
  BD: { names: { ja: 'バングラデシュ', en: 'Bangladesh', ko: '방글라데시', zh: '孟加拉国' }, flag: '🇧🇩', region: '🍛 南・中央アジア', lat: 23.6850, lon: 90.3563, zoom: 6 },
  LK: { names: { ja: 'スリランカ', en: 'Sri Lanka', ko: '스리랑카', zh: '斯里兰卡' }, flag: '🇱🇰', region: '🍛 南・中央アジア', lat: 7.8731, lon: 80.7718, zoom: 7 },
  NP: { names: { ja: 'ネパール', en: 'Nepal', ko: '네팔', zh: '尼泊尔' }, flag: '🇳🇵', region: '🍛 南・中央アジア', lat: 28.3949, lon: 84.1240, zoom: 6 },
  BT: { names: { ja: 'ブータン', en: 'Bhutan', ko: '부탄', zh: '不丹' }, flag: '🇧🇹', region: '🍛 南・中央アジア', lat: 27.5142, lon: 90.4336, zoom: 8 },
  MV: { names: { ja: 'モルディブ', en: 'Maldives', ko: '몰디브', zh: '马尔代夫' }, flag: '🇲🇻', region: '🍛 南・中央アジア', lat: 3.2028, lon: 73.2207, zoom: 7 },
  AF: { names: { ja: 'アフガニスタン', en: 'Afghanistan', ko: '아프가니스탄', zh: '阿富汗' }, flag: '🇦🇫', region: '🍛 南・中央アジア', lat: 33.9391, lon: 67.7100, zoom: 6 },
  KZ: { names: { ja: 'カザフスタン', en: 'Kazakhstan', ko: '카자흐스탄', zh: '哈萨克斯坦' }, flag: '🇰🇿', region: '🍛 南・中央アジア', lat: 48.0196, lon: 66.9237, zoom: 4 },
  UZ: { names: { ja: 'ウズベキスタン', en: 'Uzbekistan', ko: '우즈베키スタン', zh: '乌兹别克斯坦' }, flag: '🇺🇿', region: '🍛 南・中央アジア', lat: 41.3775, lon: 64.5853, zoom: 5 },
  TM: { names: { ja: 'トルクメニスタン', en: 'Turkmenistan', ko: '투르크메니스탄', zh: '土库曼斯坦' }, flag: '🇹🇲', region: '🍛 南・中央アジア', lat: 38.9697, lon: 59.5563, zoom: 6 },
  KG: { names: { ja: 'キルギス', en: 'Kyrgyzstan', ko: '키르기스스탄', zh: '吉尔吉斯斯坦' }, flag: '🇰🇬', region: '🍛 南・中央アジア', lat: 41.2044, lon: 74.7661, zoom: 7 },
  TJ: { names: { ja: 'タジキスタン', en: 'Tajikistan', ko: '타지키스탄', zh: '塔吉克斯坦' }, flag: '🇹🇯', region: '🍛 南・中央アジア', lat: 38.8610, lon: 71.2761, zoom: 7 },
  AE: { names: { ja: 'アラブ首長国連邦', en: 'UAE', ko: '아랍에미리트', zh: '阿联酋' }, flag: '🇦🇪', region: '🕌 中東', lat: 23.4241, lon: 53.8478, zoom: 7 },
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
  GB: { names: { ja: 'イギリス', en: 'UK', ko: '영국', zh: '영국' }, flag: '🇬🇧', region: '🇪🇺 ヨーロッパ', lat: 55.3781, lon: -3.4360, zoom: 5 },
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
  HR: { names: { ja: 'クロアチア', en: 'Croatia', ko: '크로아티아', zh: '克罗地亚' }, flag: '🇭🇷', region: '🇪🇺 ヨーロッパ', lat: 45.1000, lon: 15.2000, zoom: 7 },
  RO: { names: { ja: 'ルーマニア', en: 'Romania', ko: '루마니아', zh: '罗马尼亚' }, flag: '🇷🇴', region: '🇪🇺 ヨーロッパ', lat: 45.9432, lon: 24.9668, zoom: 6 },
  UA: { names: { ja: 'ウクライナ', en: 'Ukraine', ko: '우크라이나', zh: '乌克兰' }, flag: '🇺🇦', region: '🇪🇺 ヨーロッパ', lat: 48.3794, lon: 31.1656, zoom: 6 },
  BG: { names: { ja: 'ブルガリア', en: 'Bulgaria', ko: '불가리아', zh: '保加利亚' }, flag: '🇧🇬', region: '🇪🇺 ヨーロッパ', lat: 42.7339, lon: 25.4858, zoom: 7 },
  RS: { names: { ja: 'セルビア', en: 'Serbia', ko: '세르비아', zh: '塞尔维亚' }, flag: '🇷🇸', region: '🇪🇺 ヨーロッパ', lat: 44.0165, lon: 21.0059, zoom: 7 },
  SK: { names: { ja: 'スロバキア', en: 'Slovakia', ko: '슬로바키아', zh: '斯洛伐克' }, flag: '🇸🇰', region: '🇪🇺 ヨーロッパ', lat: 48.6690, lon: 19.6990, zoom: 7 },
  SI: { names: { ja: 'スロベニア', en: 'Slovenia', ko: '슬로베니아', zh: '斯洛文尼亚' }, flag: '🇸🇮', region: '🇪🇺 ヨーロッパ', lat: 46.1512, lon: 14.9955, zoom: 8 },
  EE: { names: { ja: 'エストニア', en: 'Estonia', ko: '에스토니아', zh: '爱沙尼亚' }, flag: '🇪🇪', region: '🇪🇺 ヨーロッパ', lat: 58.5953, lon: 25.0136, zoom: 7 },
  LV: { names: { ja: 'ラトビア', en: 'Latvia', ko: '라트비아', zh: '拉脱维亚' }, flag: '🇱🇻', region: '🇪🇺 ヨーロッパ', lat: 56.8796, lon: 24.6032, zoom: 7 },
  LT: { names: { ja: 'リトアニア', en: 'Lithuania', ko: '리투아니아', zh: '立陶宛' }, flag: '🇱🇹', region: '🇪🇺 ヨーロッパ', lat: 55.1694, lon: 23.8813, zoom: 7 },
  LU: { names: { ja: 'ルクセンブルク', en: 'Luxembourg', ko: '룩셈부르크', zh: '卢森堡' }, flag: '🇱🇺', region: '🇪🇺 ヨーロッパ', lat: 49.8153, lon: 6.1296, zoom: 10 },
  MC: { names: { ja: 'モナコ', en: 'Monaco', ko: '모나코', zh: '摩纳哥' }, flag: '🇲🇨', region: '🇪🇺 ヨーロッパ', lat: 43.7384, lon: 7.4246, zoom: 14 },
  VA: { names: { ja: 'バチカン市国', en: 'Vatican City', ko: '바티칸', zh: '梵蒂冈' }, flag: '🇻🇦', region: '🇪🇺 ヨーロッパ', lat: 41.9029, lon: 12.4534, zoom: 15 },
  SM: { names: { ja: 'サンマリノ', en: 'San Marino', ko: '산마리노', zh: '圣马力诺' }, flag: '🇸🇲', region: '🇪🇺 ヨーロッパ', lat: 43.9424, lon: 12.4578, zoom: 12 },
  AD: { names: { ja: 'アンドラ', en: 'Andorra', ko: '안도라', zh: '安道尔' }, flag: '🇦🇩', region: '🇪🇺 ヨーロッパ', lat: 42.5063, lon: 1.5218, zoom: 10 },
  LI: { names: { ja: 'リヒテンシュタイン', en: 'Liechtenstein', ko: '리히텐슈타인', zh: '列支敦士登' }, flag: '🇱🇮', region: '🇪🇺 ヨーロッパ', lat: 47.1660, lon: 9.5550, zoom: 11 },
  CY: { names: { ja: 'キプロス', en: 'Cyprus', ko: '키프로스', zh: '塞浦路斯' }, flag: '🇨🇾', region: '🇪🇺 ヨーロッパ', lat: 35.1264, lon: 33.4299, zoom: 8 },
  MT: { names: { ja: 'マルタ', en: 'Malta', ko: '몰타', zh: '马耳他' }, flag: '🇲🇹', region: '🇪🇺 ヨーロッパ', lat: 35.9375, lon: 14.3754, zoom: 11 },
  AL: { names: { ja: 'アルバニア', en: 'Albania', ko: '알바니아', zh: '阿尔巴尼亚' }, flag: '🇦🇱', region: '🇪🇺 ヨーロッパ', lat: 41.1533, lon: 20.1683, zoom: 7 },
  BA: { names: { ja: 'ボスニア・ヘルツェゴビナ', en: 'Bosnia and Herzegovina', ko: '보스니아 헤르체고비나', zh: '波黑' }, flag: '🇧🇦', region: '🇪🇺 ヨーロッパ', lat: 43.9159, lon: 17.6791, zoom: 7 },
  ME: { names: { ja: 'モンテネグロ', en: 'Montenegro', ko: '몬테네그로', zh: '黑山' }, flag: '🇲🇪', region: '🇪🇺 ヨーロッパ', lat: 42.7087, lon: 19.3744, zoom: 8 },
  MK: { names: { ja: '北マケドニア', en: 'North Macedonia', ko: '북마케도니아', zh: '北马其顿' }, flag: '🇲🇰', region: '🇪🇺 ヨーロッパ', lat: 41.6086, lon: 21.7453, zoom: 8 },
  MD: { names: { ja: 'モルドバ', en: 'Moldova', ko: '몰도바', zh: '摩尔多瓦' }, flag: '🇲🇩', region: '🇪🇺 ヨーロッパ', lat: 47.4116, lon: 28.3699, zoom: 7 },
  BY: { names: { ja: 'ベラルーシ', en: 'Belarus', ko: '벨라루스', zh: '白俄罗斯' }, flag: '🇧🇾', region: '🇪🇺 ヨーロッパ', lat: 53.7098, lon: 27.9534, zoom: 6 },
  RU: { names: { ja: 'ロシア', en: 'Russia', ko: '러시아', zh: '俄罗斯' }, flag: '🇷🇺', region: '🇪🇺 ヨーロッパ', lat: 61.5240, lon: 105.3188, zoom: 3 },
  SE: { names: { ja: 'スウェーデン', en: 'Sweden', ko: '스베덴', zh: '瑞典' }, flag: '🇸🇪', region: '🇪🇺 北欧', lat: 60.1282, lon: 18.6435, zoom: 5 },
  NO: { names: { ja: 'ノルウェー', en: 'Norway', ko: '노르웨이', zh: '挪威' }, flag: '🇳🇴', region: '🇪🇺 北欧', lat: 60.4720, lon: 8.4689, zoom: 5 },
  DK: { names: { ja: 'デンマーク', en: 'Denmark', ko: '덴마크', zh: '丹麦' }, flag: '🇩🇰', region: '🇪🇺 北欧', lat: 56.2639, lon: 9.5018, zoom: 7 },
  FI: { names: { ja: 'フィンランド', en: 'Finland', ko: '핀란드', zh: '芬兰' }, flag: '🇫🇮', region: '🇪🇺 北欧', lat: 61.9241, lon: 25.7482, zoom: 5 },
  IS: { names: { ja: 'アイスランド', en: 'Iceland', ko: '아이슬란드', zh: '冰岛' }, flag: '🇮🇸', region: '🇪🇺 北欧', lat: 64.9631, lon: -19.0208, zoom: 6 },
  US: { names: { ja: 'アメリカ', en: 'USA', ko: '미국', zh: '美国' }, flag: '🇺🇸', region: '🗽 北米', lat: 37.0902, lon: -95.7129, zoom: 4 },
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
  PY: { names: { ja: 'パラグアイ', en: 'Paraguay', ko: '파라과이', zh: '巴拉圭' }, flag: '🇵🇾', region: '🗽 中南米', lat: -23.4425, lon: -58.4438, zoom: 6 },
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
  GD: { names: { ja: 'グレナダ', en: 'Grenada', ko: '그레나다', zh: '格林纳达' }, flag: '🇬🇩', region: '🗽 中南米', lat: 12.1165, lon: -61.6790, zoom: 10 },
  KN: { names: { ja: 'セントクリストファー・ネイビス', en: 'Saint Kitts and Nevis', ko: '세인트키츠 네비스', zh: '圣基茨和尼维斯' }, flag: '🇰🇳', region: '🗽 中南米', lat: 17.3578, lon: -62.7829, zoom: 10 },
  LC: { names: { ja: 'セントルシア', en: 'Saint Lucia', ko: '세인트루시아', zh: '圣卢西亚' }, flag: '🇱🇨', region: '🗽 中南米', lat: 13.9094, lon: -60.9789, zoom: 10 },
  VC: { names: { ja: 'セントビンセントおよびグレナディーン諸島', en: 'Saint Vincent and the Grenadines', ko: '세인트빈센트 그레나딘', zh: '圣文森特和格林纳丁斯' }, flag: '🇻🇨', region: '🗽 中南米', lat: 12.9843, lon: -61.2872, zoom: 10 },
  AU: { names: { ja: 'オーストラリア', en: 'Australia', ko: '호주', zh: '澳大利亚' }, flag: '🇦🇺', region: '🦘 オセアニア', lat: -25.2744, lon: 133.7751, zoom: 4 },
  NZ: { names: { ja: 'ニュージーランド', en: 'New Zealand', ko: '뉴질랜드', zh: '新西兰' }, flag: '🇳🇿', region: '🦘 オセアニア', lat: -40.9006, lon: 174.8860, zoom: 5 },
  FJ: { names: { ja: 'フィジー', en: 'Fiji', ko: '피지', zh: '斐济' }, flag: '🇫🇯', region: '🦘 オセアニア', lat: -17.7134, lon: 178.0650, zoom: 8 },
  PG: { names: { ja: 'パプアニューギニア', en: 'Papua New Guinea', ko: '파푸아뉴기니', zh: '巴布亚新几内亚' }, flag: '🇵🇬', region: '🦘 オセアニア', lat: -6.3149, lon: 143.9555, zoom: 6 },
  VU: { names: { ja: 'ヴァヌアツ', en: 'Vanuatu', ko: '바누아투', zh: '瓦努阿图' }, flag: '🇻🇺', region: '🦘 オセアニア', lat: -15.3767, lon: 166.9592, zoom: 7 },
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
  SC: { names: { ja: 'セーシェル', en: 'Seychelles', ko: '세이셸', zh: '塞舌尔' }, flag: '🇸🇨', region: '🦁 アフリカ', lat: -4.6796, lon: 55.4920, zoom: 10 },
  GH: { names: { ja: 'ガーナ', en: 'Ghana', ko: '가나', zh: '加纳' }, flag: '🇬🇭', region: '🦁 アフリカ', lat: 7.9465, lon: -1.0232, zoom: 7 },
  NG: { names: { ja: 'ナイジェリア', en: 'Nigeria', ko: '나이지리아', zh: '尼日利亚' }, flag: '🇳🇬', region: '🦁 アフリカ', lat: 9.0820, lon: 8.6753, zoom: 6 },
  ET: { names: { ja: 'エチオピア', en: 'Ethiopia', ko: '에티오피아', zh: '埃塞俄比亚' }, flag: '🇪🇹', region: '🦁 アフリカ', lat: 9.1450, lon: 40.4897, zoom: 6 },
  SN: { names: { ja: 'セネガル', en: 'Senegal', ko: '세네갈', zh: '塞内加尔' }, flag: '🇸🇳', region: '🦁 アフリカ', lat: 14.4974, lon: -14.4524, zoom: 7 },
  MG: { names: { ja: 'マダガスカル', en: 'Madagascar', ko: '마다가스카르', zh: '马达加斯加' }, flag: '🇲🇬', region: '🦁 アフリカ', lat: -18.7669, lon: 46.8691, zoom: 6 },
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
      { fileUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&auto=format&fit=crop', thumbUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&h=300&auto=format&fit=crop', fileType: 'image', fileName: 'shibuya.jpg', createdAt: '2026/08/12' }
    ],
    lat: 35.6595,
    lon: 139.7005,
    countryCode: 'JP',
    cityName: '東京',
    category: 'view',
    scopes: ['world', 'friends', 'my'],
    hasParking: false,
    tags: ['東京', '公式スポット'],
    comments: [],
    reportCount: 0,
    createdAt: '2026/08/12',
  },
];

const ALL_MODES: { cat: ViewCategory; emoji: string; labelKey: string }[] = [
  { cat: 'view', emoji: '🏔️', labelKey: 'view' },
  { cat: 'gourmet', emoji: '🍔', labelKey: 'gourmet' },
  { cat: 'rain', emoji: '🌧️', labelKey: 'rain' },
  { cat: 'cafe', emoji: '☕', labelKey: 'cafe' },
  { cat: 'onsen', emoji: '♨️', labelKey: 'onsen' },
  { cat: 'shopping', emoji: '🛍️', labelKey: 'shopping' },
];

// APIキー不要で動作する OpenStreetMap タイルを使用
function getLeafletTileConfig(theme: MapThemeType): { url: string; filterCss: string } {
  const osmUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  if (theme === 'dark') {
    return {
      url: osmUrl,
      filterCss: 'invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.05)',
    };
  }
  if (theme === 'pastel') {
    return {
      url: osmUrl,
      filterCss: 'sepia(0.28) saturate(1.25) brightness(1.03)',
    };
  }
  return {
    url: osmUrl,
    filterCss: 'none',
  };
}

function getMapContainerBgColor(theme: MapThemeType): string {
  if (theme === 'dark') return '#0f172a';
  if (theme === 'pastel') return '#fef9c3';
  return '#ffffff';
}

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

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ==========================================
// 2. Leaflet コンポーネント（完全無料・APIキー不要）
// ==========================================
const LeafletMapComponent = ({
  spots,
  center,
  zoom,
  targetCenter,
  targetZoom,
  theme,
  isVisibleTab,
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
  userLang?: string;
  isVisibleTab?: boolean;
  onMoveEnd: (center: [number, number], zoom: number) => void;
  onSelectSpot: (s: Spot) => void;
  onDoubleTap: (lat: number, lon: number) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const leafletLibRef = useRef<any>(null);
  const onMoveEndRef = useRef(onMoveEnd);
  const onSelectSpotRef = useRef(onSelectSpot);
  const onDoubleTapRef = useRef(onDoubleTap);

  onMoveEndRef.current = onMoveEnd;
  onSelectSpotRef.current = onSelectSpot;
  onDoubleTapRef.current = onDoubleTap;

  const [thumbCache, setThumbCache] = useState<Record<string, string>>({});
  const [currentZoomForCluster, setCurrentZoomForCluster] = useState<number>(zoom);
  const bgColor = getMapContainerBgColor(theme);
  const tileConfig = useMemo(() => getLeafletTileConfig(theme), [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const cssId = 'leaflet-css-cdn';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    spots.forEach((spot) => {
      const url = resolveMediaSrc(spot.thumbUrl, spot.fileUrl);
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
            ctx.fillStyle = PIN_BLUE_COLOR;
            ctx.fillRect(0, 0, 64, 64);
            ctx.drawImage(img, 0, 0, 64, 64);
            const dataUri = canvas.toDataURL('image/jpeg', 0.9);
            setThumbCache((prev) => ({ ...prev, [url]: dataUri }));
          }
        } catch {
          setThumbCache((prev) => ({ ...prev, [url]: url }));
        }
      };
      img.onerror = () => {
        setThumbCache((prev) => ({ ...prev, [url]: url }));
      };
      img.src = url;
    });
  }, [spots, thumbCache]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    let isCancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const setupMap = async () => {
      const LModule = await import('leaflet');
      const L = LModule.default || LModule;
      if (isCancelled || !mapRef.current || mapInstanceRef.current) return;

      leafletLibRef.current = L;

      const map = L.map(mapRef.current, {
        center: [center[0], center[1]],
        zoom: zoom,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
        doubleClickZoom: false,
      });

      mapInstanceRef.current = map;

      const layer = L.tileLayer(tileConfig.url, {
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = layer;

      const markerGroup = L.layerGroup().addTo(map);
      markerLayerRef.current = markerGroup;

      map.on('moveend', () => {
        const c = map.getCenter();
        const z = map.getZoom();
        setCurrentZoomForCluster(z);
        onMoveEndRef.current([c.lat, c.lng], z);
      });

      map.on('dblclick', (e: any) => {
        if (e?.latlng) {
          onDoubleTapRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      if (typeof ResizeObserver !== 'undefined' && mapRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(mapRef.current);
      }

      setTimeout(() => {
        if (!isCancelled && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 120);
    };

    setupMap();

    return () => {
      isCancelled = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markerLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = leafletLibRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileConfig.url);
    } else {
      tileLayerRef.current = L.tileLayer(tileConfig.url, {
        maxZoom: 19,
      }).addTo(map);
    }
  }, [tileConfig.url]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setTimeout(() => {
      map.invalidateSize();
    }, 80);
  }, [theme, isVisibleTab]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !targetCenter || targetZoom === null) return;
    map.setView([targetCenter[0], targetCenter[1]], targetZoom, { animate: true });
    setCurrentZoomForCluster(targetZoom);
  }, [targetCenter, targetZoom]);

  useEffect(() => {
    const L = leafletLibRef.current;
    const markerGroup = markerLayerRef.current;
    if (!L || !markerGroup) return;

    markerGroup.clearLayers();

    const activeZoom = currentZoomForCluster || 5;
    const precision = activeZoom < 6 ? 1 : activeZoom < 9 ? 2 : 3;

    const locationMap = new Map<string, Spot[]>();
    spots.forEach((spot) => {
      const key = `${spot.lat.toFixed(precision)},${spot.lon.toFixed(precision)}`;
      if (!locationMap.has(key)) locationMap.set(key, []);
      locationMap.get(key)!.push(spot);
    });

    locationMap.forEach((groupSpots) => {
      const spot = groupSpots[0];
      const count = groupSpots.length;
      const rawUrl = resolveMediaSrc(spot.thumbUrl, spot.fileUrl);
      const imgUrl = escapeHtmlAttr(thumbCache[rawUrl] || rawUrl);
      const safeTitle = escapeHtmlAttr(spot.title || '');

      const badgeSvg =
        count > 1
          ? `
<circle cx="37" cy="10" r="9.5" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
<text x="37" y="13.8" fill="#ffffff" font-size="10.5" font-weight="bold" text-anchor="middle">+${count}</text>
`
          : '';

      const html = `
<div title="${safeTitle}" style="width:44px;height:48px;position:relative;cursor:pointer;">
  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="48" viewBox="0 0 44 48">
    <defs>
      <clipPath id="wapPinClip-${spot.id}">
        <circle cx="22" cy="18" r="14.2" />
      </clipPath>
    </defs>
    <path d="M22 46 C22 46 38.5 29.5 38.5 18 C38.5 8.8 31.1 1.5 22 1.5 C12.9 1.5 5.5 8.8 5.5 18 C5.5 29.5 22 46 22 46 Z" fill="${PIN_BLUE_COLOR}" stroke="#ffffff" stroke-width="2.5" />
    <circle cx="22" cy="18" r="14.2" fill="${PIN_BLUE_COLOR}" />
    <image href="${imgUrl}" xlink:href="${imgUrl}" x="7.8" y="3.8" width="28.4" height="28.4" clip-path="url(#wapPinClip-${spot.id})" preserveAspectRatio="xMidYMid slice" />
    ${badgeSvg}
  </svg>
</div>
`;

      const icon = L.divIcon({
        html,
        className: 'wap-leaflet-pin-icon',
        iconSize: [44, 48],
        iconAnchor: [22, 46],
      });

      const marker = L.marker([spot.lat, spot.lon], { icon });
      marker.on('click', () => {
        onSelectSpotRef.current(spot);
      });
      marker.addTo(markerGroup);
    });
  }, [spots, thumbCache, currentZoomForCluster]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: bgColor, touchAction: 'auto' }}>
      <style>{`
        .wap-leaflet-pin-icon {
          background: transparent !important;
          border: none !important;
        }
        .wap-leaflet-tile-pane .leaflet-tile-pane {
          filter: ${tileConfig.filterCss};
          transition: filter 0.25s ease;
        }
      `}</style>
      <div
        ref={mapRef}
        className="wap-leaflet-tile-pane"
        style={{ width: '100%', height: '100%', minHeight: '200px', background: bgColor }}
      />
    </div>
  );
};

// ==========================================
// 3. メインコンポーネント
// ==========================================
export default function WapApp() {
  const [isClient, setIsClient] = useState<boolean>(false);
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
  const [selectedCategories, setSelectedCategories] = useState<ViewCategory[]>(['view', 'gourmet', 'rain', 'cafe', 'onsen', 'shopping']);
  const [isModeSelectScreenOpen, setIsModeSelectScreenOpen] = useState<boolean>(false);
  const [mapTheme, setMapTheme] = useState<MapThemeType>('light');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('world');
  const [mapSearchKeyword, setMapSearchKeyword] = useState<string>('');
  const [timelineSearchKeyword, setTimelineSearchKeyword] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [mapSearchSuggestions, setMapSearchSuggestions] = useState<PlaceSuggestion[]>([]);

  const [isLocationGuideOpen, setIsLocationGuideOpen] = useState<boolean>(false);

  const [isMyQrOpen, setIsMyQrOpen] = useState<boolean>(false);
  const [isScanQrOpen, setIsScanQrOpen] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string>('');

  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const nowDateObj = useMemo(() => new Date(), []);
  const currentActualYear = nowDateObj.getFullYear();
  const currentActualMonth = nowDateObj.getMonth() + 1;
  const [calendarYear, setCalendarYear] = useState<number>(currentActualYear);
  const [calendarMonth, setCalendarMonth] = useState<number>(currentActualMonth);

  const isViewingPastMonth = useMemo(() => {
    if (calendarYear < currentActualYear) return true;
    if (calendarYear === currentActualYear && calendarMonth < currentActualMonth) return true;
    return false;
  }, [calendarYear, calendarMonth, currentActualYear, currentActualMonth]);

  const [isMultiPostsModalOpen, setIsMultiPostsModalOpen] = useState<boolean>(false);
  const [multiPostsList, setMultiPostsList] = useState<Spot[]>([]);
  const [multiPostSearchKeyword, setMultiPostSearchKeyword] = useState<string>('');
  const [multiPostSortType, setMultiPostSortType] = useState<MultiPostSortType>('newest');

  const [replyTargetUser, setReplyTargetUser] = useState<string | null>(null);
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

  useEffect(() => {
    setIsClient(true);
    const hasCompleted = localStorage.getItem('wap_onboarded_v1');
    if (hasCompleted) {
      setIsOnboarding(false);
    }
  }, []);

  useEffect(() => {
    const conf = COUNTRIES[userCountry];
    if (conf) {
      setCurrentMapCenter([conf.lat, conf.lon]);
      setCurrentMapZoom(conf.zoom);
      setTargetCenter([conf.lat, conf.lon]);
      setTargetZoom(conf.zoom);
    }
  }, [userCountry]);

  const [spots, setSpots] = useState<Spot[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wap_local_spots_v13');
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

  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(0);

  const [separateCaptionsMode, setSeparateCaptionsMode] = useState<boolean>(false);

  const [postCategory, setPostCategory] = useState<ViewCategory>('view');
  const [selectedScopes, setSelectedScopes] = useState<DisplayScope[]>(['world', 'friends', 'my']);
  const [addressSearchQuery, setAddressSearchQuery] = useState<string>('');
  const [addressSuggestions, setAddressSuggestions] = useState<PlaceSuggestion[]>([]);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLon, setManualLon] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [previewScale, setPreviewScale] = useState<number>(1);
  const [previewOffset, setPreviewOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isEulaModalOpen, setIsEulaModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [friendsList, setFriendsList] = useState<FriendUser[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wap_friends_v13');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [translatedDescriptions, setTranslatedDescriptions] = useState<Record<string, string>>({});

  const exportRef = useRef<HTMLDivElement>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement>(null);
  const onboardingAvatarInputRef = useRef<HTMLInputElement>(null);
  const appendMoreMediaInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 5000);
  };

  const resetPreviewToSafeCenter = () => {
    setPreviewScale(1);
    setPreviewOffset({ x: 0, y: 0 });
  };

  const applySafePreviewMove = (nextScale: number, rawOffset: { x: number; y: number }) => {
    const rect = previewBoxRef.current?.getBoundingClientRect();
    const w = rect?.width || 360;
    const h = rect?.height || 180;
    const clamped = clampPreviewTransform(nextScale, rawOffset, w, h);
    setPreviewScale(clamped.scale);
    setPreviewOffset(clamped.offset);
  };

  const handleStepCalendarMonth = (delta: number) => {
    const targetDate = new Date(calendarYear, calendarMonth - 1 + delta, 1);
    setCalendarYear(targetDate.getFullYear());
    setCalendarMonth(targetDate.getMonth() + 1);
  };

  const sortedAndFilteredMultiPosts = useMemo(() => {
    const kw = multiPostSearchKeyword.trim().toLowerCase();

    const baseSorted = [...multiPostsList].sort((a, b) => {
      if (multiPostSortType === 'likes') {
        return (b.savedCount || 0) - (a.savedCount || 0);
      }
      if (multiPostSortType === 'views') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      return b.id.localeCompare(a.id);
    });

    if (!kw) return baseSorted;

    const isMatch = (s: Spot) => {
      const titleHit = (s.title || '').toLowerCase().includes(kw);
      const descHit = (s.description || '').toLowerCase().includes(kw);
      const userHit = (s.userName || '').toLowerCase().includes(kw);
      const tagHit = (s.tags || []).some((tag) => tag.toLowerCase().includes(kw.replace(/^#/, '')));
      return titleHit || descHit || userHit || tagHit;
    };

    const matched = baseSorted.filter(isMatch);
    const unmatched = baseSorted.filter((s) => !isMatch(s));
    return [...matched, ...unmatched];
  }, [multiPostsList, multiPostSearchKeyword, multiPostSortType]);

  useEffect(() => {
    if (spots.length > 0) {
      try {
        localStorage.setItem('wap_local_spots_v13', JSON.stringify(spots));
      } catch {}
    }
  }, [spots]);

  useEffect(() => {
    try {
      localStorage.setItem('wap_friends_v13', JSON.stringify(friendsList));
    } catch {}
  }, [friendsList]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (currentTab !== 'map') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.closest('button') || target.closest('nav') || target.closest('form') || target.closest('.scrollable-content'))) {
          return;
        }
        e.preventDefault();
      }
    };

    const preventGesture = (e: Event) => {
      if (currentTab !== 'map') {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    document.addEventListener('gesturestart', preventGesture);
    document.addEventListener('gesturechange', preventGesture);

    return () => {
      document.removeEventListener('touchstart', preventDefaultTouch);
      document.removeEventListener('touchmove', preventDefaultTouch);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
    };
  }, [currentTab]);

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
          mediaList: d.media_list || [{ fileUrl: d.file_url, thumbUrl: d.thumb_url || d.file_url, fileType: d.file_type || 'image', fileName: d.file_name || 'image.jpg', createdAt: d.created_at ? new Date(d.created_at).toLocaleDateString() : '2026/08/12' }],
          lat: Number(d.lat),
          lon: Number(d.lon),
          countryCode: d.country_code || 'JP',
          cityName: d.city_name || '日本',
          category: d.category || 'view',
          scopes: d.scopes || ['world', 'friends', 'my'],
          hasParking: d.has_parking || false,
          tags: d.tags || extractHashtags(d.description || ''),
          comments: d.comments || [],
          reportCount: d.report_count || 0,
          createdAt: d.created_at ? new Date(d.created_at).toLocaleDateString() : '2026/08/12',
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
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) {
          showToast('⚠️ 最低1つのモードを選択してください');
          return prev;
        }
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  const handleClearCategoryFilter = () => {
    setSelectedCategories(ALL_MODES.map((m) => m.cat));
    showToast('✓ 全モードを表示します');
  };

  const searchPlacesByQuery = async (rawQuery: string): Promise<PlaceSuggestion[]> => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return [];
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=8&addressdetails=1`
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
    if (!mapSearchKeyword.trim() || mapSearchKeyword.startsWith('#')) {
      setMapSearchSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await searchPlacesByQuery(mapSearchKeyword);
        setMapSearchSuggestions(data);
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
    setTargetZoom(14);
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
    } else {
      setIsSearchingLocation(true);
      try {
        const data = await searchPlacesByQuery(mapSearchKeyword);
        if (data && data[0]) {
          handleSelectMapSuggestion(data[0]);
        } else {
          showToast('該当する場所が見つかりませんでした');
        }
      } catch {
        showToast('検索に失敗しました');
      } finally {
        setIsSearchingLocation(false);
      }
    }
  };

  useEffect(() => {
    if (!addressSearchQuery.trim() || addressSearchQuery.startsWith('📍')) {
      setAddressSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await searchPlacesByQuery(addressSearchQuery);
        setAddressSuggestions(data);
      } catch {
        setAddressSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addressSearchQuery]);

  const handleSelectAddressSuggestion = (item: PlaceSuggestion) => {
    const placeLabel = item.display_name.split(',')[0];
    setManualLat(item.lat);
    setManualLon(item.lon);
    setAddressSearchQuery(`📍 ${placeLabel}`);
    setAddressSuggestions([]);
    showToast(`📍 位置を「${placeLabel}」に設定しました`);
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
    const baseCountrySpots = validSpots.filter(s => s.countryCode === userCountry);
    const otherCountrySpots = validSpots.filter(s => s.countryCode !== userCountry);
    const sortedSpots = [...baseCountrySpots, ...otherCountrySpots];

    if (!timelineSearchKeyword.trim()) return sortedSpots;
    const kw = timelineSearchKeyword.toLowerCase();
    return sortedSpots.filter(s => {
      if (kw.startsWith('#')) {
        const rawTag = kw.replace('#', '');
        return s.tags?.some(t => t.toLowerCase().includes(rawTag)) || s.description.toLowerCase().includes(kw);
      }
      return s.title.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw) || s.cityName.toLowerCase().includes(kw);
    });
  }, [spots, blockedUsers, timelineSearchKeyword, userCountry]);

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

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await readFileAsPersistentDataUrl(file);
      setUserAvatar(dataUrl || URL.createObjectURL(file));
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
    } else if (userLangCode === 'zh' || userLangCode === 'zh_tw') {
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

    const commentTextFinal = replyTargetUser ? `@${replyTargetUser} ${trimmedText}` : trimmedText;

    const newComment: CommentItem = {
      id: 'com-' + Date.now(),
      userName: userName,
      userAvatar: userAvatar || '',
      text: commentTextFinal,
      replyTo: replyTargetUser || undefined,
      createdAt: new Date().toLocaleDateString(),
    };

    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === spotId) {
          const spotComments = s.comments ? [...s.comments, newComment] : [newComment];
          const target = { ...s, comments: spotComments };
          if (selectedSpot && selectedSpot.id === spotId) {
            setSelectedSpot(target);
          }
          return target;
        }
        return s;
      })
    );
    setNewCommentText('');
    setReplyTargetUser(null);
    showToast('💬 コメントを投稿しました！');
  };

  const parseFilesToPendingList = async (files: File[]): Promise<PendingUploadItem[]> => {
    const EXIFModule = await import('exif-js');
    const EXIF = EXIFModule.default || EXIFModule;
    const pendingList: PendingUploadItem[] = [];

    for (const file of files) {
      const previewBlobUrl = URL.createObjectURL(file);
      const persistentDataUrl = !file.type.startsWith('video/') && file.size < 2500000
        ? await readFileAsPersistentDataUrl(file)
        : '';
      const usableUrl = persistentDataUrl || previewBlobUrl;
      const isVideo = file.type.startsWith('video/');
      const fileId = 'spot-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

      if (isVideo) {
        const thumbUrl = await generateVideoThumbnail(file);
        pendingList.push({
          id: fileId,
          file,
          fileUrl: usableUrl,
          thumbUrl: thumbUrl || usableUrl,
          fileType: 'video',
          hasGps: false,
          dateTime: new Date().toLocaleDateString(),
          title: '',
          description: '',
          hasParking: false,
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
            pendingList.push({ id: fileId, file, fileUrl: usableUrl, thumbUrl: usableUrl, fileType: 'image', lat: latDecimal, lon: lonDecimal, hasGps: true, dateTime: new Date().toLocaleDateString(), title: '', description: '', hasParking: false });
          } else {
            pendingList.push({ id: fileId, file, fileUrl: usableUrl, thumbUrl: usableUrl, fileType: 'image', hasGps: false, dateTime: new Date().toLocaleDateString(), title: '', description: '', hasParking: false });
          }
          resolve();
        });
      });
    }

    return pendingList;
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const pendingList = await parseFilesToPendingList(files);
    e.target.value = '';

    if (pendingList.length > 0) {
      setPendingUploads(pendingList);
      setCurrentUploadIndex(0);
      setSeparateCaptionsMode(false);
      resetPreviewToSafeCenter();
      const first = pendingList[0];
      setPostCategory('view');
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

  const handleAppendMoreMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const addedList = await parseFilesToPendingList(files);
    e.target.value = '';

    if (addedList.length > 0) {
      setPendingUploads(prev => [...prev, ...addedList]);
      showToast(`📸 ${addedList.length}件を追加しました（合計 ${pendingUploads.length + addedList.length}件を1つの投稿にまとめます）`);
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

    const firstItem = pendingUploads[0];
    const effectiveTitle = separateCaptionsMode
      ? (current.title || firstItem?.title || '無題のスポット')
      : (firstItem?.title || current.title || '無題のスポット');
    const effectiveDescription = separateCaptionsMode
      ? (current.description || firstItem?.description || '旅の思い出')
      : (firstItem?.description || current.description || '旅の思い出');

    const checkTitle = checkInappropriateContent(effectiveTitle);
    const checkDesc = checkInappropriateContent(effectiveDescription);
    if (checkTitle.isViolating || checkDesc.isViolating) {
      showWarning('⚠️ 暴言・差別発言・不適切な表現が含まれているため投稿できません。');
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
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
        console.log('Storage upload bypassed, using local/data URL:', err);
      }
    }

    const todayStr = new Date().toLocaleDateString();
    const newMediaItem: MediaItem = {
      fileUrl: uploadedUrl,
      thumbUrl: finalThumbUrl,
      fileType: current.fileType,
      fileName: current.file.name,
      title: effectiveTitle,
      description: effectiveDescription,
      createdAt: todayStr,
    };

    const isNearbyExists = spots.some((s) => Math.abs(s.lat - finalLat) < 0.05 && Math.abs(s.lon - finalLon) < 0.05);
    const isFirstExplorer = !isNearbyExists;
    const extractedTags = extractHashtags(effectiveDescription);

    let updatedSpotsList = [...spots];

    if (currentUploadIndex === 0) {
      const newSpot: Spot = {
        id: `${current.id}-${Date.now()}`,
        userId: 'me',
        userName,
        userAvatar,
        isFirstExplorer,
        viewsCount: 1,
        savedCount: 0,
        title: effectiveTitle,
        description: effectiveDescription,
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
        hasParking: current.hasParking,
        tags: extractedTags,
        comments: [],
        reportCount: 0,
        createdAt: todayStr,
      };
      updatedSpotsList = [newSpot, ...updatedSpotsList];
    } else {
      const targetSpot = updatedSpotsList[0];
      if (targetSpot && targetSpot.userId === 'me') {
        const updatedMediaList = [...(targetSpot.mediaList || []), newMediaItem];
        const updatedSpot = {
          ...targetSpot,
          mediaList: updatedMediaList,
          hasParking: targetSpot.hasParking || current.hasParking,
        };
        updatedSpotsList[0] = updatedSpot;
      }
    }

    setSpots(updatedSpotsList);
    try {
      localStorage.setItem('wap_local_spots_v13', JSON.stringify(updatedSpotsList));
    } catch {}

    setIsSubmitting(false);

    if (currentUploadIndex + 1 < pendingUploads.length) {
      const nextIndex = currentUploadIndex + 1;
      setCurrentUploadIndex(nextIndex);
      resetPreviewToSafeCenter();
      setManualLat(finalLat.toString());
      setManualLon(finalLon.toString());
    } else {
      setPendingUploads([]);
      setCurrentUploadIndex(0);
      showToast(
        pendingUploads.length > 1
          ? `📍 写真・動画を1つの投稿にまとめてマップに反映しました！🚀`
          : `📍 マップにピンを反映しました！🚀`
      );
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
        ctx.fillStyle = PIN_BLUE_COLOR;
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

  const themeAccent = mapTheme === 'dark' ? '#38bdf8' : mapTheme === 'pastel' ? '#d97706' : PIN_BLUE_COLOR;

  const currentBackgroundColor = '#ffffff';
  const headerBgColor = '#ffffff';
  const headerTextColor = '#0f172a';

  const isAnyTimelineCommentOpen = Object.values(openCommentsForSpot).some(Boolean);
  const isAllModesSelected = ALL_MODES.every((m) => selectedCategories.includes(m.cat));
  const selectedModeLabels = ALL_MODES
    .filter((m) => selectedCategories.includes(m.cat))
    .map((m) => `${m.emoji}${t(m.labelKey)}`);

  const filterButtonDisplayText = isAllModesSelected
    ? `🎛️ ${t('filterBtn')}`
    : `${t('selectedModesLabel')}: ${selectedModeLabels.join(', ')}`;

  if (!isClient) {
    return <div style={{ background: '#ffffff', width: '100vw', height: '100dvh' }}></div>;
  }

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
        <meta name="theme-color" content={currentBackgroundColor} />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" async></script>
      </head>

      <div style={{ background: currentBackgroundColor, color: '#0f172a', height: '100dvh', maxHeight: '100dvh', width: '100vw', maxWidth: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', inset: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'none', WebkitUserSelect: 'none', touchAction: currentTab === 'map' ? 'auto' : 'pan-y', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
        <input type="file" ref={appendMoreMediaInputRef} accept="image/*,video/*" multiple onChange={handleAppendMoreMedia} style={{ display: 'none' }} />

        {/* 全6モード一括選択画面（左上「←」で戻る・クリアボタン付き） */}
        {isModeSelectScreenOpen && (
          <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', background: '#ffffff', color: '#0f172a', zIndex: 100002, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', touchAction: 'pan-y' }}>
            <div style={{ height: '54px', padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', background: '#ffffff', flexShrink: 0, gap: '8px' }}>
              <button
                type="button"
                aria-label="戻る"
                onClick={() => setIsModeSelectScreenOpen(false)}
                style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '10px', padding: '7px 12px', fontSize: '15px', fontWeight: '900', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}
              >
                ←
              </button>

              <div style={{ fontSize: '15px', fontWeight: '900', color: PIN_BLUE_COLOR, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('filterBtn')}
              </div>

              <button
                type="button"
                onClick={handleClearCategoryFilter}
                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '10px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}
              >
                {t('clearModesBtn')}
              </button>
            </div>

            <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', alignContent: 'start', touchAction: 'pan-y', boxSizing: 'border-box' }}>
              {ALL_MODES.map(({ cat, emoji, labelKey }) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategoryFilter(cat)}
                    style={{
                      padding: '18px 14px',
                      borderRadius: '16px',
                      border: `2px solid ${isSelected ? PIN_BLUE_COLOR : '#e2e8f0'}`,
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      color: isSelected ? PIN_BLUE_COLOR : '#334155',
                      fontWeight: '900',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      boxShadow: isSelected ? '0 4px 14px rgba(2,132,199,0.14)' : 'none',
                      touchAction: 'manipulation',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '20px' }}>{emoji}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(labelKey)}</span>
                    </span>
                    <span>{isSelected ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isOnboarding && (
          <div style={{ position: 'fixed', inset: 0, background: '#ffffff', color: '#0f172a', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', touchAction: 'none' }}>
            <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '440px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', textAlign: 'center', touchAction: 'pan-y', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '36px', marginBottom: '4px' }}>🗺️</div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: PIN_BLUE_COLOR }}>wap</h1>
              <p style={{ margin: '4px 0 16px 0', fontSize: '13px', color: '#64748b' }}>世界中を旅して、思い出をつなごう</p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 1 ? PIN_BLUE_COLOR : '#e2e8f0', transition: '0.3s' }}></span>
                <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 2 ? PIN_BLUE_COLOR : '#e2e8f0', transition: '0.3s' }}></span>
                <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep >= 3 ? PIN_BLUE_COLOR : '#e2e8f0', transition: '0.3s' }}></span>
                <span style={{ width: '24px', height: '6px', borderRadius: '3px', background: onboardingStep === 4 ? PIN_BLUE_COLOR : '#e2e8f0', transition:
