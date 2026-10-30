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
// 1. 型定義 & 多言語マスターデータ
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
  comments?: CommentItem[];
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
    tabSaved: '❤️ Saved',
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
    tabSaved: '❤️ 저장',
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
  RO: { names: { ja: 'ルーマニア', en: 'Romania', ko: 'ルーマニア', zh: '罗马尼亚' }, flag: '🇷🇴', region: '🇪🇺 ヨーロッパ', lat: 45.9432, lon: 24.9668, zoom: 6 },
  UA: { names: { ja: 'ウクライナ', en: 'Ukraine', ko: '우크라이나', zh: 'ウクライナ' }, flag: '🇺🇦', region: '🇪🇺 ヨーロッパ', lat: 48.3794, lon: 31.1656, zoom: 6 },
  BG: { names: { ja: 'ブルガリア', en: 'Bulgaria', ko: '불가리아', zh: '保加利亚' }, flag: '🇧🇬', region: '🇪🇺 ヨーロッパ', lat: 42.7339, lon: 25.4858, zoom: 7 },
  RS: { names: { ja: 'セルビア', en: 'Serbia', ko: '세르비아', zh: 'セルビア' }, flag: '🇷🇸', region: '🇪🇺 ヨーロッパ', lat: 44.0165, lon: 21.0059, zoom: 7 },
  SK: { names: { ja: 'スロバキア', en: 'Slovakia', ko: '슬로바キア', zh: '斯洛伐克' }, flag: '🇸🇰', region: '🇪🇺 ヨーロッパ', lat: 48.6690, lon: 19.6990, zoom: 7 },
  SI: { names: { ja: 'スロベニア', en: 'Slovenia', ko: '슬로베니아', zh: '斯ロ베ニア' }, flag: '🇸🇮', region: '🇪🇺 ヨーロッパ', lat: 46.1512, lon: 14.9955, zoom: 8 },
  EE: { names: { ja: 'エストニア', en: 'Estonia', ko: '에스토니아', zh: '爱沙尼亚' }, flag: '🇪🇪', region: '🇪🇺 ヨーロッパ', lat: 58.5953, lon: 25.0136, zoom: 7 },
  LV: { names: { ja: 'ラトビア', en: 'Latvia', ko: '라트비아', zh: '拉脱维亚' }, flag: '🇱🇻', region: '🇪🇺 ヨーロッパ', lat: 56.8796, lon: 24.6032, zoom: 7 },
  LT: { names: { ja: 'リトアニア', en: 'Lithuania', ko: '리투아니아', zh: '立陶宛' }, flag: '🇱🇹', region: '🇪🇺 ヨーロッパ', lat: 55.1694, lon: 23.8813, zoom: 7 },
  LU: { names: { ja: 'ルクセンブルク', en: 'Luxembourg', ko: '룩셈부르크', zh: '卢森堡' }, flag: '🇱🇺', region: '🇪🇺 ヨーロッパ', lat: 49.8153, lon: 6.1296, zoom: 10 },
  MC: { names: { ja: 'モナコ', en: 'Monaco', ko: '모나코', zh: '摩纳哥' }, flag: '🇲🇨', region: '🇪🇺 ヨーロッパ', lat: 43.7384, lon: 7.4246, zoom: 14 },
  VA: { names: { ja: 'バチカン市国', en: 'Vatican City', ko: '바티칸', zh: '梵蒂冈' }, flag: '🇻🇦', region: '🇪🇺 ヨーロッパ', lat: 41.9029, lon: 12.4534, zoom: 15 },
  SM: { names: { ja: 'サンマリノ', en: 'San Marino', ko: '산마리노', zh: '聖馬力諾' }, flag: '🇸🇲', region: '🇪🇺 ヨーロッパ', lat: 43.9424, lon: 12.4578, zoom: 12 },
  AD: { names: { ja: 'アンドラ', en: 'Andorra', ko: '안도라', zh: '安道尔' }, flag: '🇦🇩', region: '🇪🇺 ヨーロッパ', lat: 42.5063, lon: 1.5218, zoom: 10 },
  LI: { names: { ja: 'リヒテンシュタイン', en: 'Liechtenstein', ko: '리혼슈타인', zh: '列支敦士登' }, flag: '🇱🇮', region: '🇪🇺 ヨーロッパ', lat: 47.1660, lon: 9.5550, zoom: 11 },
  CY: { names: { ja: 'キプロス', en: 'Cyprus', ko: '키프로스', zh: '塞浦路斯' }, flag: '🇨🇾', region: '🇪🇺 ヨーロッパ', lat: 35.1264, lon: 33.4299, zoom: 8 },
  MT: { names: { ja: 'マルタ', en: 'Malta', ko: '몰타', zh: '马耳他' }, flag: '🇲🇹', region: '🇪🇺 ヨーロッパ', lat: 35.9375, lon: 14.3754, zoom: 11 },
  AL: { names: { ja: 'アルバニア', en: 'Albania', ko: '알바니아', zh: '阿尔巴尼亚' }, flag: '🇦🇱', region: '🇪🇺 ヨーロッパ', lat: 41.1533, lon: 20.1683, zoom: 7 },
  BA: { names: { ja: 'ボスニア・ヘルツェゴビナ', en: 'Bosnia and Herzegovina', ko: '보스니아 헤르체고비나', zh: '波黑' }, flag: '🇧🇦', region: '🇪🇺 ヨーロッパ', lat: 43.9159, lon: 17.6791, zoom: 7 },
  ME: { names: { ja: 'モンテネグロ', en: 'Montenegro', ko: '몬테네グロ', zh: '黑山' }, flag: '🇲🇪', region: '🇪🇺 ヨーロッパ', lat: 42.7087, lon: 19.3744, zoom: 8 },
  MK: { names: { ja: '北マケドニア', en: 'North Macedonia', ko: '북마케도니아', zh: '北马其顿' }, flag: '🇲🇰', region: '🇪🇺 ヨーロッパ', lat: 41.6086, lon: 21.7453, zoom: 8 },
  MD: { names: { ja: 'モルド바', en: 'Moldova', ko: '몰도바', zh: '摩尔多瓦' }, flag: '🇲🇩', region: '🇪🇺 ヨーロッパ', lat: 47.4116, lon: 28.3699, zoom: 7 },
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
  PY: { names: { ja: 'パラグアイ', en: 'Paraguay', ko: '파라과이', zh: '파ラグアイ' }, flag: '🇵🇾', region: '🗽 中南米', lat: -23.4425, lon: -58.4438, zoom: 6 },
  GT: { names: { ja: 'グアテマラ', en: 'Guatemala', ko: '과테말라', zh: '危地马拉' }, flag: '🇬🇹', region: '🗽 中南米', lat: 15.7835, lon: -90.2308, zoom: 8 },
  HN: { names: { ja: 'ホンジュラス', en: 'Honduras', ko: '온두라스', zh: 'ホンジュラス' }, flag: '🇭🇳', region: '🗽 中南米', lat: 15.1999, lon: -86.2419, zoom: 7 },
  NI: { names: { ja: 'ニカラグア', en: 'Nicaragua', ko: '니카라과', zh: 'ニカラグア' }, flag: '🇳🇮', region: '🗽 中南米', lat: 12.8654, lon: -85.2072, zoom: 7 },
  SV: { names: { ja: 'エルサルバドル', en: 'El Salvador', ko: '엘살바도르', zh: 'エルサルバドル' }, flag: '🇸🇻', region: '🗽 中南米', lat: 13.7942, lon: -88.8965, zoom: 8 },
  BS: { names: { ja: 'バハマ', en: 'Bahamas', ko: '바하마', zh: 'バハマ' }, flag: '🇧🇸', region: '🗽 中南米', lat: 25.0343, lon: -77.3963, zoom: 7 },
  PR: { names: { ja: 'プエルトリコ', en: 'Puerto Rico', ko: '푸에르토리코', zh: '푸エルトリコ' }, flag: '🇵🇷', region: '🗽 中南米', lat: 18.2208, lon: -66.5901, zoom: 9 },
  BZ: { names: { ja: 'ベリーズ', en: 'Belize', ko: '벨리즈', zh: 'ベリーズ' }, flag: '🇧🇿', region: '🗽 中南米', lat: 17.1899, lon: -88.4976, zoom: 8 },
  TT: { names: { ja: 'トリニダード・トバゴ', en: 'Trinidad and Tobago', ko: '트리니다드 토바고', zh: '特立尼达和多巴哥' }, flag: '🇹🇹', region: '🗽 中南米', lat: 10.6918, lon: -61.2225, zoom: 9 },
  HT: { names: { ja: 'ハイチ', en: 'Haiti', ko: '아이티', zh: '海地' }, flag: '🇭🇹', region: '🗽 中南米', lat: 18.9712, lon: -72.2852, zoom: 8 },
  GY: { names: { ja: 'ガイアナ', en: 'Guyana', ko: '가이아나', zh: '圭亚那' }, flag: '🇬🇾', region: '🗽 中南米', lat: 4.8604, lon: -58.9302, zoom: 6 },
  SR: { names: { ja: 'スリナム', en: 'Suriname', ko: '수리남', zh: '苏里南' }, flag: '🇸🇷', region: '🗽 中南米', lat: 3.9193, lon: -56.0278, zoom: 7 },
  AG: { names: { ja: 'アンティグア・バーブーダ', en: 'Antigua and Barbuda', ko: '앤티가 바부다', zh: '安提瓜和巴布达' }, flag: '🇦🇬', region: '🗽 中南米', lat: 17.0608, lon: -61.7964, zoom: 9 },
  BB: { names: { ja: 'バルバドス', en: 'Barbados', ko: '바베이도스', zh: '巴巴多斯' }, flag: '🇧🇧', region: '🗽 中南米', lat: 13.1939, lon: -59.5432, zoom: 11 },
  DM: { names: { ja: 'ドミニカ国', en: 'Dominica', ko: '도미니카 연방', zh: '多米尼克' }, flag: '🇩🇲', region: '🗽 中南米', lat: 15.4150, lon: -61.3710, zoom: 10 },
  GD: { names: { ja: 'グレナダ', en: 'Grenada', ko: '그레ナダ', zh: '格林纳达' }, flag: '🇬🇩', region: '🗽 中南米', lat: 12.1165, lon: -61.6790, zoom: 10 },
  KN: { names: { ja: 'セントクリストファー・ネイビス', en: 'Saint Kitts and Nevis', ko: '세인트키츠 네비스', zh: '圣基茨和尼维斯' }, flag: '🇰🇳', region: '🗽 中南米', lat: 17.3578, lon: -62.7829, zoom: 10 },
  LC: { names: { ja: 'セントルシア', en: 'Saint Lucia', ko: '세인트루シア', zh: '圣卢西亚' }, flag: '🇱🇨', region: '🗽 中南米', lat: 13.9094, lon: -60.9789, zoom: 10 },
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
  MA: { names: { ja: 'モロッコ', en: 'Morocco', ko: '모로코', zh: 'モロッコ' }, flag: '🇲🇦', region: '🦁 アフリカ', lat: 31.7917, lon: -7.0926, zoom: 6 },
  TN: { names: { ja: 'チュニジア', en: 'Tunisia', ko: '튀니지', zh: '突尼斯' }, flag: '🇹🇳', region: '🦁 アフリカ', lat: 33.8869, lon: 9.5375, zoom: 6 },
  KE: { names: { ja: 'ケニア', en: 'Kenya', ko: 'ケニア', zh: 'ケニア' }, flag: '🇰🇪', region: '🦁 アフリカ', lat: -0.0236, lon: 37.9062, zoom: 6 },
  TZ: { names: { ja: 'タンザニア', en: 'Tanzania', ko: '탄자니아', zh: 'タンザニア' }, flag: '🇹🇿', region: '🦁 アフリカ', lat: -6.3690, lon: 34.8888, zoom: 6 },
  MU: { names: { ja: 'モーリシャス', en: 'Mauritius', ko: '모리셔스', zh: 'モーリシャス' }, flag: '🇲🇺', region: '🦁 アフリカ', lat: -20.3484, lon: 57.5522, zoom: 9 },
  SC: { names: { ja: 'セーシェル', en: 'Seychelles', ko: '세이셸', zh: 'セーシェル' }, flag: '🇸🇨', region: '🦁 アフリカ', lat: -4.6796, lon: 55.4920, zoom: 10 },
  GH: { names: { ja: 'ガーナ', en: 'Ghana', ko: '가나', zh: '加纳' }, flag: '🇬🇭', region: '🦁 アフリカ', lat: 7.9465, lon: -1.0232, zoom: 7 },
  NG: { names: { ja: 'ナイジェリア', en: 'Nigeria', ko: '나이지리아', zh: '尼日利亚' }, flag: '🇳🇬', region: '🦁 アフリカ', lat: 9.0820, lon: 8.6753, zoom: 6 },
  ET: { names: { ja: 'エチオピア', en: 'Ethiopia', ko: '에티오피아', zh: '埃塞俄比亚' }, flag: '🇪🇹', region: '🦁 アフリカ', lat: 9.1450, lon: 40.4897, zoom: 6 },
  SN: { names: { ja: 'セネガル', en: 'Senegal', ko: '세네갈', zh: 'セネガル' }, flag: '🇸🇳', region: '🦁 アフリカ', lat: 14.4974, lon: -14.4524, zoom: 7 },
  MG: { names: { ja: 'マダガスカル', en: 'Madagascar', ko: '마다가스카르', zh: 'マダガスカル' }, flag: '🇲🇬', region: '🦁 アフリカ', lat: -18.7669, lon: 46.8691, zoom: 6 },
  RW: { names: { ja: 'ルワンダ', en: 'Rwanda', ko: '르완다', zh: 'ルワンダ' }, flag: '🇷🇼', region: '🦁 アフリカ', lat: -1.9403, lon: 29.8739, zoom: 8 },
  UG: { names: { ja: 'ウガンダ', en: 'Uganda', ko: '우간다', zh: 'ウガンダ' }, flag: '🇺🇬', region: '🦁 アフリカ', lat: 1.3733, lon: 32.2903, zoom: 7 },
  ZM: { names: { ja: 'ザンビア', en: 'Zambia', ko: '잠비아', zh: 'ザンビア' }, flag: '🇿🇲', region: '🦁 アフリカ', lat: -13.1339, lon: 27.8493, zoom: 6 },
  ZW: { names: { ja: 'ジンバブエ', en: 'Zimbabwe', ko: '짐바브웨', zh: 'ジンバブエ' }, flag: '🇿🇼', region: '🦁 アフリカ', lat: -19.0154, lon: 29.1549, zoom: 6 },
  BW: { names: { ja: 'ボツワナ', en: 'Botswana', ko: '보츠와나', zh: 'ボツワナ' }, flag: '🇧🇼', region: '🦁 アフリカ', lat: -22.3285, lon: 24.6849, zoom: 6 },
  NA: { names: { ja: 'ナミビア', en: 'Namibia', ko: '나미비아', zh: 'ナミビア' }, flag: '🇳🇦', region: '🦁 アフリカ', lat: -22.9576, lon: 18.4904, zoom: 6 },
  DZ: { names: { ja: 'アルジェリア', en: 'Algeria', ko: '알제리', zh: 'アルジェリア' }, flag: '🇩🇿', region: '🦁 アフリカ', lat: 28.0339, lon: 1.6596, zoom: 5 },
  AO: { names: { ja: 'アンゴラ', en: 'Angola', ko: '앙골라', zh: 'アンゴラ' }, flag: '🇦🇴', region: '🦁 アフリカ', lat: -11.2027, lon: 17.8739, zoom: 5 },
  CM: { names: { ja: 'カメルーン', en: 'Cameroon', ko: '카메룬', zh: 'カメルーン' }, flag: '🇨🇲', region: '🦁 アフリカ', lat: 3.8480, lon: 11.5021, zoom: 6 },
  CI: { names: { ja: 'コートジボワール', en: 'Ivory Coast', ko: '코트디부아르', zh: 'コートジボワール' }, flag: '🇨🇮', region: '🦁 アフリカ', lat: 7.5400, lon: -5.5471, zoom: 6 },
  MZ: { names: { ja: 'モザンビーク', en: 'Mozambique', ko: '모잠비크', zh: 'モザンビーク' }, flag: '🇲🇿', region: '🦁 アフリカ', lat: -18.6657, lon: 35.5296, zoom: 5 },
  SD: { names: { ja: 'スーダン', en: 'Sudan', ko: '수단', zh: 'スーダン' }, flag: '🇸🇩', region: '🦁 アフリカ', lat: 12.8628, lon: 30.2176, zoom: 5 },
  LY: { names: { ja: 'リビア', en: 'Libya', ko: '리비아', zh: 'リビア' }, flag: '🇱🇾', region: '🦁 アフリカ', lat: 26.3351, lon: 17.2283, zoom: 5 },
  ML: { names: { ja: 'マリ', en: 'Mali', ko: '말리', zh: 'マリ' }, flag: '🇲🇱', region: '🦁 アフリカ', lat: 17.5707, lon: -3.9962, zoom: 5 },
  NE: { names: { ja: 'ニジェール', en: 'Niger', ko: '니제르', zh: 'ニジェール' }, flag: '🇳🇪', region: '🦁 アフリカ', lat: 17.6078, lon: 8.0817, zoom: 5 },
  SO: { names: { ja: 'ソマリア', en: 'Somalia', ko: '소말리아', zh: 'ソマリア' }, flag: '🇸🇴', region: '🦁 アフリカ', lat: 5.1521, lon: 46.1996, zoom: 6 },
  BJ: { names: { ja: 'ベナン', en: 'Benin', ko: '베닌', zh: 'ベナン' }, flag: '🇧🇯', region: '🦁 アフリカ', lat: 9.3077, lon: 2.3158, zoom: 7 },
  BF: { names: { ja: 'ブルキナファソ', en: 'Burkina Faso', ko: '부르키나파소', zh: 'ブルキナファソ' }, flag: '🇧🇫', region: '🦁 アフリカ', lat: 12.2383, lon: -1.5616, zoom: 6 },
  BI: { names: { ja: 'ブルンジ', en: 'Burundi', ko: '부룬디', zh: 'ブルンジ' }, flag: '🇧🇮', region: '🦁 アフリカ', lat: -3.3731, lon: 29.9189, zoom: 8 },
  CV: { names: { ja: 'カーボベルデ', en: 'Cape Verde', ko: '카보베르데', zh: 'カーボベルデ' }, flag: '🇨🇻', region: '🦁 アフリカ', lat: 16.5388, lon: -23.0418, zoom: 8 },
  CF: { names: { ja: '中央アフリカ共和国', en: 'Central African Republic', ko: '중앙아프리카 공화국', zh: '中非共和国' }, flag: '🇨🇫', region: '🦁 アフリカ', lat: 6.6111, lon: 20.9394, zoom: 6 },
  TD: { names: { ja: 'チャド', en: 'Chad', ko: '차드', zh: 'チャド' }, flag: '🇹🇩', region: '🦁 アフリカ', lat: 15.4542, lon: 18.7322, zoom: 5 },
  KM: { names: { ja: 'コモロ', en: 'Comoros', ko: '코모로', zh: 'コモロ' }, flag: '🇰🇲', region: '🦁 アフリカ', lat: -11.8750, lon: 43.8722, zoom: 9 },
  CG: { names: { ja: 'コンゴ共和国', en: 'Republic of the Congo', ko: '콩고공화국', zh: '刚果共和国' }, flag: '🇨🇬', region: '🦁 アフリカ', lat: -0.2280, lon: 15.8277, zoom: 6 },
  CD: { names: { ja: 'コンゴ民主共和国', en: 'Democratic Republic of the Congo', ko: '콩고민주공화국', zh: '刚果民主共和国' }, flag: '🇨🇩', region: '🦁 アフリカ', lat: -4.0383, lon: 21.7587, zoom: 5 },
  DJ: { names: { ja: 'ジブチ', en: 'Djibouti', ko: '지부티', zh: '吉布提' }, flag: '🇩🇯', region: '🦁 アフリカ', lat: 11.8251, lon: 42.5903, zoom: 8 },
  GQ: { names: { ja: '赤道ギニア', en: 'Equatorial Guinea', ko: '적도 기니', zh: '赤道几内亚' }, flag: '🇬🇶', region: '🦁 アフリカ', lat: 1.6508, lon: 10.2679, zoom: 8 },
  ER: { names: { ja: 'エリトリア', en: 'Eritrea', ko: '에리트레아', zh: '厄立特里亚' }, flag: '🇪🇷', region: '🦁 アフリカ', lat: 15.1794, lon: 39.7823, zoom: 7 },
  GA: { names: { ja: 'ガボン', en: 'Gabon', ko: '가봉', zh: '加蓬' }, flag: '🇬🇦', region: '🦁 アフリカ', lat: -0.8037, lon: 11.6094, zoom: 6 },
  GM: { names: { ja: 'ガンビア', en: 'Gambia', ko: '감비아', zh: 'ガンビア' }, flag: '🇬🇲', region: '🦁 アフリカ', lat: 13.4432, lon: -15.3101, zoom: 8 },
  GN: { names: { ja: 'ギニア', en: 'Guinea', ko: '기니', zh: 'ギニア' }, flag: '🇬🇳', region: '🦁 アフリカ', lat: 9.9456, lon: -9.6966, zoom: 7 },
  GW: { names: { ja: 'ギニアビサウ', en: 'Guinea-Bissau', ko: '기니비사우', zh: 'ギニアビサウ' }, flag: '🇬🇼', region: '🦁 アフリカ', lat: 11.8037, lon: -15.1804, zoom: 8 },
  LS: { names: { ja: 'レソト', en: 'Lesotho', ko: '레소토', zh: 'レソト' }, flag: '🇱🇸', region: '🦁 アフリカ', lat: -29.6100, lon: 28.2336, zoom: 8 },
  LR: { names: { ja: 'リベリア', en: 'Liberia', ko: '라이베리아', zh: 'リベリア' }, flag: '🇱🇷', region: '🦁 アフリカ', lat: 6.4281, lon: -9.4295, zoom: 7 },
  MW: { names: { ja: 'マラウイ', en: 'Malawi', ko: '말라위', zh: 'マラウイ' }, flag: '🇲🇼', region: '🦁 アフリカ', lat: -13.2543, lon: 34.3015, zoom: 6 },
  MR: { names: { ja: 'モーリタニア', en: 'Mauritania', ko: '모리타니', zh: 'モーリタニア' }, flag: '🇲🇷', region: '🦁 アフリカ', lat: 21.0079, lon: -10.9408, zoom: 5 },
  ST: { names: { ja: 'サントメ・プリンシペ', en: 'Sao Tome and Principe', ko: '상투메 프린시페', zh: '圣多美和普林西比' }, flag: '🇸🇹', region: '🦁 アフリカ', lat: 0.1864, lon: 6.6131, zoom: 9 },
  SL: { names: { ja: 'シエラレオネ', en: 'Sierra Leone', ko: '시에라리온', zh: 'シエラレオネ' }, flag: '🇸🇱', region: '🦁 アフリカ', lat: 8.4606, lon: -11.7799, zoom: 7 },
  SS: { names: { ja: '南スーダン', en: 'South Sudan', ko: '남수단', zh: '南スーダン' }, flag: '🇸🇸', region: '🦁 アフリカ', lat: 6.8770, lon: 31.3070, zoom: 6 },
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
      { fileUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&auto=format&fit=crop', thumbUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&h=300&auto=format&fit=crop', fileType: 'image', fileName: 'shibuya.jpg', comments: [] }
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
    const currentZoom = map.getZoom() || zoom;

    const precision = currentZoom < 6 ? 1 : currentZoom < 9 ? 2 : 3;

    const locationMap = new Map<string, Spot[]>();
    spots.forEach(spot => {
      const key = `${spot.lat.toFixed(precision)},${spot.lon.toFixed(precision)}`;
      if (!locationMap.has(key)) locationMap.set(key, []);
      locationMap.get(key)!.push(spot);
    });

    locationMap.forEach((groupSpots) => {
      const spot = groupSpots[0];
      const count = groupSpots.length;
      const rawUrl = spot.thumbUrl || spot.fileUrl || '';
      const imgUrl = thumbCache[rawUrl] || rawUrl;

      const badgeSvg = count > 1 ? `
        <circle cx="38" cy="10" r="10" fill="#10b981" stroke="#ffffff" stroke-width="2" />
        <text x="38" y="14" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">+${count}</text>
      ` : '';

      const marker = new window.google.maps.Marker({
        position: { lat: spot.lat, lng: spot.lon },
        map: map,
        title: spot.title,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="50" viewBox="0 0 48 50">
              <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)" />
              </filter>
              <path d="M23 50 C23 50 41 31 41 19 C41 8.5 32.8 0 23 0 C13.2 0 5 8.5 5 19 C5 31 23 50 23 50 Z" fill="#ffffff" stroke="#0284c7" stroke-width="3" filter="url(#shadow)" />
              <image href="${imgUrl}" x="5" y="5" width="36" height="36" clip-path="circle(18px at 18px 18px)" preserveAspectRatio="xMidYMid slice" />
              ${badgeSvg}
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(48, 50),
          anchor: new window.google.maps.Point(23, 50),
        }
      });

      marker.addListener('click', () => {
        onSelectSpot(spot);
      });

      markersRef.current.push(marker);
    });
  }, [spots, thumbCache, zoom]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: '#ffffff', touchAction: 'auto' }} />;
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

  // どのコメントに対する返信かを保持するステート
  const [replyTargetUser, setReplyTargetUser] = useState<string | null>(null);

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

  // 国変更時に即座にマップの中心とズームを更新
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

  // 投稿プレビューでのピンチイン・ドラッグ操作用ステート
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [previewOffset, setPreviewOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 5000);
  };

  // 常にローカルストレージへ即時保存（データ完全保護）
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

  // マップ画面以外でのピンチイン・ズーム等を完全にブロックするイベントリスナー
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
