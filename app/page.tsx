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
// 1. 型定義 & 15言語辞書 & 140カ国マスターデータ
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
  'nigger', 'faggot', 'retard', 'suicide', 'kill', 'rape', 'cocaine', 'heroin', 'nazi', 'hitler'
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

// 称号の完全多言語対応システム
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

export const DICTIONaries: Record<string, Record<string, string>> = {
  ja: {
    step1Title: 'Step 1: 表示言語を選択',
    step1Desc: '世界中の人々が使えるよう、お好みの言語を選択してください。',
    step2Title: 'Step 2: ベースの国（初期マップ）を選択',
    step2Desc: 'マップの初期表示位置となるメインの国を選んでください（140カ国以上対応）。',
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
    supportContact: '✉️ 運営サポート・通報窓口 (24時間以内対応): support@wap-app.com',
    scopeWorld: '🌎 ワールド',
    scopeFriends: '👥 フレンド',
    scopeMy: '📍 マイマップ',
    eulaFullText: `【wap 利用規約および位置情報ポリシー（Apple審査対応版）】

第1条（目的および同意）
本規約は、マップ共有アプリ「wap」の利用条件を定めるものです。すべてのユーザーは、本規約および位置情報の取得・利用に同意した上で本サービスを利用するものとします。

第2条（位置情報の取得・利用について）
1. 当サービスは、ユーザーがマップ画面の「現在地ボタン（🎯）」をタップした際に、デバイスのGPS等の位置情報を一時的に取得します。
2. 取得した位置情報は、ユーザーの現在の現在地をマップの中心に表示する機能、および周辺の旅のスポットを検索・閲覧する機能の提供にのみ使用されます。
3. 当サービスは、ユーザーの明示的な許可なしにバックグラウンドでの位置情報追跡を行わず、位置情報を第三者に販売・提供することはありません。

第3条（コンテンツの安全性と免責事項・情報の正確性について）
1. 本アプリでは、ユーザー生成コンテンツ（UGC）の安全性を保つため、暴言、ヘイトスピーチ、差別的表現、過度な性的表現などの不適切な投稿を厳禁としています。
2. 掲載されているスポットの写真や店舗情報は投稿時点のものであり、現在地において建物がなくなっている、閉店している、またはリニューアルされている場合があります。当サービスは掲載情報の正確性や現状への適合性を保証するものではなく、現地に赴く際はユーザーご自身の責任で最新情報をご確認ください。
3. 各投稿やコメントには「通報（🚨）」機能および悪質ユーザーの「ブロック（🚫）」機能を完備しています。運営チームは通報を受けたコンテンツについて24時間以内に審査し、削除やアカウント凍結措置を行います。

【運営サポート・通報窓口】
ご質問、不具合のご報告、規約違反コンテンツの削除依頼などは以下の窓口までご連絡ください。
✉️ support@wap-app.com`,
    guideFullText: `【wap の詳細な操作説明と全機能ガイド】
1. 現在地への移動（🎯ボタン）: デバイスのGPSを利用して現在地へ一瞬で移動します。
2. マップ操作とズーム: ダブルタップで拡大（ズームイン）します。
3. メディアの投稿: 写真や動画を選択して投稿できます。店舗や建物情報は投稿時点のものであるため、現在の状況と異なる場合があります。
4. 交流・安全機能: いいね、コメント、翻訳、通報、ブロック機能が使えます。`
  },
  en: {
    step1Title: 'Step 1: Select Language',
    step1Desc: 'Choose your preferred language for the application.',
    step2Title: 'Step 2: Select Base Country',
    step2Desc: 'Choose your initial country for the map view (Top tourist destinations & 140+ countries).',
    step3Title: 'Step 3: Create Profile',
    step3TitleEula: 'Step 4: Terms of Service & Location Policy',
    next: 'Next',
    back: 'Back',
    startApp: '🚀 Start wap',
    eulaAgree: 'I agree to the Terms of Service & Location Policy (Required)',
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
    supportContact: '✉️ Support & Report Contact (24h response): support@wap-app.com',
    scopeWorld: '🌎 World',
    scopeFriends: '👥 Friends',
    scopeMy: '📍 My Map',
    eulaFullText: `[wap Terms of Service & Location Policy]
Article 1: Purpose.
Article 2: Location data via GPS is used solely upon user request.
Article 3: Spot information is as of the posting time and may have changed. Users visit locations at their own discretion and responsibility.
Support Contact: support@wap-app.com`,
    guideFullText: `[wap Detailed User Guide & Features]
1. Current Location: Tap to center the map on your GPS coordinates.
2. Zoom & View: Double tap to zoom in.
3. Media Posting: Share photos/videos with custom location.
4. Community & Safety: Like, comment, translate, report, or block users easily.`
  },
  ko: {
    step1Title: 'Step 1: 언어 선택',
    step1Desc: '앱에서 사용할 언어를 선택하세요.',
    step2Title: 'Step 2: 기본 국가 선택',
    step2Desc: '지도의 중심이 될 기본 국가를 선택하세요 (관광 1위 국가들 포함 140개국 이상).',
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
    tabFriends: '👥 친구',
    reportSpot: '🚨 게시물 신고',
    blockUser: '🚫 사용자 차단',
    supportContact: '✉️ 고객센터 및 신고 창구: support@wap-app.com',
    scopeWorld: '🌎 전체',
    scopeFriends: '👥 친구',
    scopeMy: '📍 내 지도',
    eulaFullText: `[wap 이용약관 및 위치정보 정책]
제1조 목적으로 본 서비스를 제공합니다.
제2조 위치정보는 GPS를 통해 요청시에만 활용됩니다.
제3조 장소 정보는 게시 시점 기준이며 변경될 수 있습니다. 방문 시 본인 책임하에 확인하세요.`,
    guideFullText: `[wap 상세 가이드 및 기능 설명]
1. 현재 위치: GPS를 통해 지도 중심을 이동합니다.
2. 지도 조작: 더블탭으로 확대 가능합니다.
3. 미디어 업로드: 사진과 영상을 위치 정보와 함께 공유합니다.
4. 커뮤니티 및 안전: 좋아요, 댓글, 번역, 신고 및 차단 기능 제공.`
  },
  zh: {
    step1Title: '步骤 1: 选择语言',
    step1Desc: '请选择您的首选应用语言。',
    step2Title: 'Step 2: 选择基础国家',
    step2Desc: '请选择地图初始显示的国家（包含热门旅游国及140多个国家）。',
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
    tabFriends: '👥 好友',
    reportSpot: '🚨 举报此内容',
    blockUser: '🚫 屏蔽此用户',
    supportContact: '✉️ 客服与举报邮箱: support@wap-app.com',
    scopeWorld: '🌎 世界',
    scopeFriends: '👥 好友',
    scopeMy: '📍 我的地图',
    eulaFullText: `[wap 服务条款与位置政策]
第一条 目的：规范本应用的使用条件。
第二条 位置：仅在用户请求时获取GPS数据。
第三条 景点信息仅供参考，可能存在变更，访问时请自行确认。`,
    guideFullText: `[wap 详细操作指南]
1. 当前位置：快速定位您的GPS坐标。
2. 地图缩放：双击放大。
3. 发布动态：上传照片或视频并标记地点。
4. 社区互动：支持点赞、评论、翻译、举报及屏蔽功能。`
  }
};

// ==========================================
// 観光客数上位国ランキングに基づく「厳選140カ国マスターデータ」
// ==========================================
export const COUNTRIES: Record<string, { names: Record<string, string>; flag: string; region: string; lat: number; lon: number; zoom: number }> = {
  // ── 🇪🇺 ヨーロッパ (Europe) ──
  FR: { names: { ja: 'フランス', en: 'France', ko: '프랑스', zh: '法国' }, flag: '🇫🇷', region: '🇪🇺 ヨーロッパ', lat: 46.6034, lon: 1.8883, zoom: 5 },
  ES: { names: { ja: 'スペイン', en: 'Spain', ko: '스페인', zh: '西班牙' }, flag: '🇪🇸', region: '🇪🇺 ヨーロッパ', lat: 40.4637, lon: -3.7492, zoom: 6 },
  IT: { names: { ja: 'イタリア', en: 'Italy', ko: '이탈리아', zh: '意大利' }, flag: '🇮🇹', region: '🇪🇺 ヨーロッパ', lat: 41.8719, lon: 12.5674, zoom: 6 },
  TR: { names: { ja: 'トルコ', en: 'Turkey', ko: '터키', zh: '土耳其' }, flag: '🇹🇷', region: '🇪🇺 ヨーロッパ', lat: 38.9637, lon: 35.2433, zoom: 6 },
  GB: { names: { ja: 'イギリス', en: 'UK', ko: '영국', zh: '英国' }, flag: '🇬🇧', region: '🇪🇺 ヨーロッパ', lat: 55.3781, lon: -3.4360, zoom: 5 },
  DE: { names: { ja: 'ドイツ', en: 'Germany', ko: '독일', zh: '德国' }, flag: '🇩🇪', region: '🇪🇺 ヨーロッパ', lat: 51.1657, lon: 10.4515, zoom: 5 },
  GR: { names: { ja: 'ギリシャ', en: 'Greece', ko: '그리스', zh: '希腊' }, flag: '🇬🇷', region: '🇪🇺 ヨーロッパ', lat: 39.0742, lon: 21.8243, zoom: 7 },
  AT: { names: { ja: 'オーストリア', en: 'Austria', ko: '오스트리아', zh: '奥地利' }, flag: '🇦🇹', region: '🇪🇺 ヨーロッパ', lat: 47.5162, lon: 14.5501, zoom: 7 },
  PT: { names: { ja: 'ポルトガル', en: 'Portugal', ko: '포르투갈', zh: '葡萄牙' }, flag: '🇵🇹', region: '🇪🇺 ヨーロッパ', lat: 39.3999, lon: -8.2245, zoom: 7 },
  NL: { names: { ja: 'オランダ', en: 'Netherlands', ko: '네덜란드', zh: '荷兰' }, flag: '🇳🇱', region: '🇪🇺 ヨーロッパ', lat: 52.1326, lon: 5.2913, zoom: 8 },
  CH: { names: { ja: 'スイス', en: 'Switzerland', ko: '스위스', zh: '瑞士' }, flag: '🇨🇭', region: '🇪🇺 ヨーロッパ', lat: 46.8182, lon: 8.2275, zoom: 8 },
  SE: { names: { ja: 'スウェーデン', en: 'Sweden', ko: '스베덴', zh: '瑞典' }, flag: '🇸🇪', region: '🇪🇺 ヨーロッパ', lat: 60.1282, lon: 18.6435, zoom: 5 },
  NO: { names: { ja: 'ノルウェー', en: 'Norway', ko: '노르웨이', zh: '挪威' }, flag: '🇳🇴', region: '🇪🇺 ヨーロッパ', lat: 60.4720, lon: 8.4689, zoom: 5 },
  DK: { names: { ja: 'デンマーク', en: 'Denmark', ko: '덴마크', zh: '丹麦' }, flag: '🇩🇰', region: '🇪🇺 ヨーロッパ', lat: 56.2639, lon: 9.5018, zoom: 7 },
  FI: { names: { ja: 'フィンランド', en: 'Finland', ko: '핀란드', zh: '芬兰' }, flag: '🇫🇮', region: '🇪🇺 ヨーロッパ', lat: 61.9241, lon: 25.7482, zoom: 5 },
  PL: { names: { ja: 'ポーランド', en: 'Poland', ko: '폴란드', zh: '波兰' }, flag: '🇵🇱', region: '🇪🇺 ヨーロッパ', lat: 51.9194, lon: 19.1451, zoom: 6 },
  CZ: { names: { ja: 'チェコ', en: 'Czech Republic', ko: '체코', zh: '捷克' }, flag: '🇨🇿', region: '🇪🇺 ヨーロッパ', lat: 49.8175, lon: 15.4730, zoom: 7 },
  HU: { names: { ja: 'ハンガリー', en: 'Hungary', ko: '헝가리', zh: '匈牙利' }, flag: '🇭🇺', region: '🇪🇺 ヨーロッパ', lat: 47.1625, lon: 19.5033, zoom: 7 },
  IE: { names: { ja: 'アイルランド', en: 'Ireland', ko: '아이슬란드', zh: '爱尔兰' }, flag: '🇮🇪', region: '🇪🇺 ヨーロッパ', lat: 53.1424, lon: -7.6921, zoom: 7 },
  IS: { names: { ja: 'アイスランド', en: 'Iceland', ko: '아이슬란드', zh: '冰岛' }, flag: '🇮🇸', region: '🇪🇺 ヨーロッパ', lat: 64.9631, lon: -19.0208, zoom: 6 },
  BE: { names: { ja: 'ベルギー', en: 'Belgium', ko: '벨기에', zh: '比利时' }, flag: '🇧🇪', region: '🇪🇺 ヨーロッパ', lat: 50.5039, lon: 4.4699, zoom: 8 },
  HR: { names: { ja: 'クロアチア', en: 'Croatia', ko: '크로아티아', zh: '克罗地亚' }, flag: '🇭🇷', region: '🇪🇺 ヨーロッパ', lat: 45.1, lon: 15.2, zoom: 7 },
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
  LI: { names: { ja: 'リヒテンシュタイン', en: 'Liechtenstein', ko: '리히텐슈타인', zh: '列支敦士登' }, flag: '🇱🇮', region: '🇪🇺 ヨーロッパ', lat: 47.166, lon: 9.555, zoom: 11 },
  CY: { names: { ja: 'キプロス', en: 'Cyprus', ko: '키프로스', zh: '塞浦路斯' }, flag: '🇨🇾', region: '🇪🇺 ヨーロッパ', lat: 35.1264, lon: 33.4299, zoom: 8 },
  MT: { names: { ja: 'マルタ', en: 'Malta', ko: '몰타', zh: '马耳他' }, flag: '🇲🇹', region: '🇪🇺 ヨーロッパ', lat: 35.9375, lon: 14.3754, zoom: 11 },
  AL: { names: { ja: 'アルバニア', en: 'Albania', ko: '알바니아', zh: '阿尔巴尼亚' }, flag: '🇦🇱', region: '🇪🇺 ヨーロッパ', lat: 41.1533, lon: 20.1683, zoom: 7 },

  // ── 🌏 アジア (Asia) ──
  JP: { names: { ja: '日本', en: 'Japan', ko: '일본', zh: '日本' }, flag: '🇯🇵', region: '🌏 アジア', lat: 36.2048, lon: 138.2529, zoom: 5 },
  CN: { names: { ja: '中国', en: 'China', ko: '중국', zh: '中国' }, flag: '🇨🇳', region: '🌏 アジア', lat: 35.8617, lon: 104.1954, zoom: 4 },
  TH: { names: { ja: 'タイ', en: 'Thailand', ko: '태국', zh: '泰国' }, flag: '🇹🇭', region: '🌏 アジア', lat: 15.8700, lon: 100.9925, zoom: 6 },
  MY: { names: { ja: 'マレーシア', en: 'Malaysia', ko: '말레이시아', zh: '马来西亚' }, flag: '🇲🇾', region: '🌏 アジア', lat: 4.2105, lon: 101.9758, zoom: 6 },
  SG: { names: { ja: 'シンガポール', en: 'Singapore', ko: '싱가포르', zh: '新加坡' }, flag: '🇸🇬', region: '🌏 アジア', lat: 1.3521, lon: 103.8198, zoom: 11 },
  KR: { names: { ja: '韓国', en: 'South Korea', ko: '한국', zh: '韩国' }, flag: '🇰🇷', region: '🌏 アジア', lat: 35.9078, lon: 127.7669, zoom: 7 },
  VN: { names: { ja: 'ベトナム', en: 'Vietnam', ko: '베트남', zh: '越南' }, flag: '🇻🇳', region: '🌏 アジア', lat: 14.0583, lon: 108.2772, zoom: 6 },
  HK: { names: { ja: '香港', en: 'Hong Kong', ko: '홍콩', zh: '香港' }, flag: '🇭🇰', region: '🌏 アジア', lat: 22.3193, lon: 114.1694, zoom: 11 },
  MO: { names: { ja: 'マカオ', en: 'Macau', ko: '마카오', zh: '澳门' }, flag: '🇲🇴', region: '🌏 アジア', lat: 22.1987, lon: 113.5439, zoom: 12 },
  ID: { names: { ja: 'インドネシア', en: 'Indonesia', ko: '인도네시아', zh: '印度尼西亚' }, flag: '🇮🇩', region: '🌏 アジア', lat: -0.7893, lon: 113.9213, zoom: 5 },
  PH: { names: { ja: 'フィリピン', en: 'Philippines', ko: '필리핀', zh: '菲律宾' }, flag: '🇵🇭', region: '🌏 アジア', lat: 12.8797, lon: 121.7740, zoom: 6 },
  IN: { names: { ja: 'インド', en: 'India', ko: '인도', zh: '印度' }, flag: '🇮🇳', region: '🌏 アジア', lat: 20.5937, lon: 78.9629, zoom: 5 },
  TW: { names: { ja: '台湾', en: 'Taiwan', ko: '대만', zh: '台湾' }, flag: '🇹🇼', region: '🌏 アジア', lat: 23.6978, lon: 120.9605, zoom: 7 },
  AE: { names: { ja: 'アラブ首長国連邦', en: 'UAE', ko: '아랍에미리트', zh: '阿联酋' }, flag: '🇦🇪', region: '🌏 アジア', lat: 23.4241, lon: 53.8478, zoom: 7 },
  SA: { names: { ja: 'サウジアラビア', en: 'Saudi Arabia', ko: '사우디아라비아', zh: '沙特阿拉伯' }, flag: '🇸🇦', region: '🌏 アジア', lat: 23.8859, lon: 45.0792, zoom: 5 },
  IL: { names: { ja: 'イスラエル', en: 'Israel', ko: '이스라엘', zh: '以色列' }, flag: '🇮🇱', region: '🌏 アジア', lat: 31.0461, lon: 34.8516, zoom: 7 },
  QA: { names: { ja: 'カタール', en: 'Qatar', ko: '카타르', zh: '卡塔尔' }, flag: '🇶🇦', region: '🌏 アジア', lat: 25.3548, lon: 51.1839, zoom: 8 },
  OM: { names: { ja: 'オマーン', en: 'Oman', ko: '오만', zh: '阿曼' }, flag: '🇴🇲', region: '🌏 アジア', lat: 21.4735, lon: 55.9754, zoom: 6 },
  KH: { names: { ja: 'カンボジア', en: 'Cambodia', ko: '캄보디아', zh: '柬埔寨' }, flag: '🇰🇭', region: '🌏 アジア', lat: 12.5657, lon: 104.9910, zoom: 7 },
  LK: { names: { ja: 'スリランカ', en: 'Sri Lanka', ko: '스리랑카', zh: '斯里兰卡' }, flag: '🇱🇰', region: '🌏 アジア', lat: 7.8731, lon: 80.7718, zoom: 7 },
  NP: { names: { ja: 'ネパール', en: 'Nepal', ko: '네팔', zh: '尼泊尔' }, flag: '🇳🇵', region: '🌏 アジア', lat: 28.3949, lon: 84.1240, zoom: 6 },
  MV: { names: { ja: 'モルディブ', en: 'Maldives', ko: '몰디브', zh: '马尔代夫' }, flag: '🇲🇻', region: '🌏 アジア', lat: 3.2028, lon: 73.2207, zoom: 7 },
  KZ: { names: { ja: 'カザフスタン', en: 'Kazakhstan', ko: '카자흐스탄', zh: '哈萨克斯坦' }, flag: '🇰🇿', region: '🌏 アジア', lat: 48.0196, lon: 66.9237, zoom: 4 },
  UZ: { names: { ja: 'ウズベキスタン', en: 'Uzbekistan', ko: '우즈베키스탄', zh: '乌兹别克斯坦' }, flag: '🇺🇿', region: '🌏 アジア', lat: 41.3775, lon: 64.5853, zoom: 5 },
  GE: { names: { ja: 'ジョージア', en: 'Georgia', ko: '조지아', zh: '格鲁吉亚' }, flag: '🇬🇪', region: '🌏 アジア', lat: 42.3154, lon: 43.3569, zoom: 7 },
  AZ: { names: { ja: 'アゼルバイジャン', en: 'Azerbaijan', ko: '아제르바이잔', zh: '阿塞拜疆' }, flag: '🇦🇿', region: '🌏 アジア', lat: 40.1431, lon: 47.5769, zoom: 6 },
  AM: { names: { ja: 'アルメニア', en: 'Armenia', ko: '아르메니아', zh: '亚美尼亚' }, flag: '🇦🇲', region: '🌏 アジア', lat: 40.0691, lon: 45.0382, zoom: 8 },
  MN: { names: { ja: 'モンゴル', en: 'Mongolia', ko: '몽골', zh: '蒙古' }, flag: '🇲🇳', region: '🌏 アジア', lat: 46.8625, lon: 103.8467, zoom: 5 },
  BN: { names: { ja: 'ブルネイ', en: 'Brunei', ko: '브루네이', zh: '文莱' }, flag: '🇧🇳', region: '🌏 アジア', lat: 4.5353, lon: 114.7277, zoom: 9 },
  LA: { names: { ja: 'ラオス', en: 'Laos', ko: '라오스', zh: '老挝' }, flag: '🇱🇦', region: '🌏 アジア', lat: 19.8563, lon: 102.4955, zoom: 6 },
  MM: { names: { ja: 'ミャンマー', en: 'Myanmar', ko: '미얀마', zh: '缅甸' }, flag: '🇲🇲', region: '🌏 アジア', lat: 21.9162, lon: 95.9560, zoom: 5 },
  BD: { names: { ja: 'バングラデシュ', en: 'Bangladesh', ko: '방글라데시', zh: '孟加拉国' }, flag: '🇧🇩', region: '🌏 アジア', lat: 23.6850, lon: 90.3563, zoom: 6 },
  PK: { names: { ja: 'パキスタン', en: 'Pakistan', ko: '파키스탄', zh: '巴基斯坦' }, flag: '🇵🇰', region: '🌏 アジア', lat: 30.3753, lon: 69.3451, zoom: 5 },
  BH: { names: { ja: 'バーレーン', en: 'Bahrain', ko: '바레인', zh: '巴林' }, flag: '🇧🇭', region: '🌏 アジア', lat: 26.0667, lon: 50.5577, zoom: 10 },
  JO: { names: { ja: 'ヨルダン', en: 'Jordan', ko: '요르단', zh: '约旦' }, flag: '🇯🇴', region: '🌏 アジア', lat: 30.5852, lon: 36.2384, zoom: 7 },

  // ── 🗽 北米・中南米 (Americas) ──
  US: { names: { ja: 'アメリカ', en: 'USA', ko: '미국', zh: '美国' }, flag: '🇺🇸', region: '🗽 北米・中南米', lat: 37.0902, lon: -95.7129, zoom: 4 },
  MX: { names: { ja: 'メキシコ', en: 'Mexico', ko: '멕시코', zh: '墨西哥' }, flag: '🇲🇽', region: '🗽 北米・中南米', lat: 23.6345, lon: 102.5528, zoom: 5 },
  CA: { names: { ja: 'カナダ', en: 'Canada', ko: '캐나다', zh: '加拿大' }, flag: '🇨🇦', region: '🗽 北米・中南米', lat: 56.1304, lon: -106.3468, zoom: 3 },
  BR: { names: { ja: 'ブラジル', en: 'Brazil', ko: '브라질', zh: '巴西' }, flag: '🇧🇷', region: '🗽 北米・中南米', lat: -14.2350, lon: -51.9253, zoom: 4 },
  AR: { names: { ja: 'アルゼンチン', en: 'Argentina', ko: '아르헨티나', zh: '阿根廷' }, flag: '🇦🇷', region: '🗽 北米・中南米', lat: -38.4161, lon: -63.6167, zoom: 4 },
  CL: { names: { ja: 'チリ', en: 'Chile', ko: '칠레', zh: '智利' }, flag: '🇨🇱', region: '🗽 北米・中南米', lat: -35.6751, lon: -71.5430, zoom: 4 },
  PE: { names: { ja: 'ペルー', en: 'Peru', ko: '페루', zh: '秘鲁' }, flag: '🇵🇪', region: '🗽 北米・中南米', lat: -9.1900, lon: -75.0152, zoom: 5 },
  CO: { names: { ja: 'コロンビア', en: 'Colombia', ko: '콜롬비아', zh: '哥伦比亚' }, flag: '🇨🇴', region: '🗽 北米・中南米', lat: 4.5709, lon: -74.2973, zoom: 5 },
  CU: { names: { ja: 'キューバ', en: 'Cuba', ko: '쿠바', zh: '古巴' }, flag: '🇨🇺', region: '🗽 北米・中南米', lat: 21.5218, lon: -77.7812, zoom: 7 },
  CR: { names: { ja: 'コスタリカ', en: 'Costa Rica', ko: '코스타리카', zh: '哥斯达黎加' }, flag: '🇨🇷', region: '🗽 北米・中南米', lat: 9.7489, lon: -83.7534, zoom: 8 },
  DO: { names: { ja: 'ドミニカ共和国', en: 'Dominican Republic', ko: '도미니카 공화국', zh: '多米尼加' }, flag: '🇩🇴', region: '🗽 北米・中南米', lat: 18.7357, lon: -70.1627, zoom: 8 },
  PA: { names: { ja: 'パナマ', en: 'Panama', ko: '파나마', zh: '巴拿马' }, flag: '🇵🇦', region: '🗽 北米・中南米', lat: 8.5380, lon: -80.7821, zoom: 8 },
  JM: { names: { ja: 'ジャマイカ', en: 'Jamaica', ko: '자메이카', zh: '牙买加' }, flag: '🇯🇲', region: '🗽 北米・中南米', lat: 18.1096, lon: -77.2975, zoom: 9 },
  UY: { names: { ja: 'ウルグアイ', en: 'Uruguay', ko: '우루과이', zh: '乌拉圭' }, flag: '🇺🇾', region: '🗽 北米・中南米', lat: -32.5228, lon: -55.7658, zoom: 7 },
  EC: { names: { ja: 'エクアドル', en: 'Ecuador', ko: '에콰도르', zh: '厄瓜多尔' }, flag: '🇪🇨', region: '🗽 北米・中南米', lat: -1.8312, lon: -78.1834, zoom: 6 },
  VE: { names: { ja: 'ベネズエラ', en: 'Venezuela', ko: '베네수엘라', zh: '委内瑞拉' }, flag: '🇻🇪', region: '🗽 北米・中南米', lat: 6.4238, lon: -66.5897, zoom: 5 },
  BO: { names: { ja: 'ボリビア', en: 'Bolivia', ko: '볼리비아', zh: '玻利维亚' }, flag: '🇧🇴', region: '🗽 北米・中南米', lat: -16.2902, lon: -63.5887, zoom: 5 },
  PY: { names: { ja: 'パラグアイ', en: 'Paraguay', ko: '파라과이', zh: '巴拉圭' }, flag: '🇵🇾', region: '🗽 北米・中南米', lat: -23.4425, lon: -58.4438, zoom: 6 },
  GT: { names: { ja: 'グアテマラ', en: 'Guatemala', ko: '과테말라', zh: '危地马拉' }, flag: '🇬🇹', region: '🗽 北米・中南米', lat: 15.7835, lon: -90.2308, zoom: 8 },
  HN: { names: { ja: 'ホンジュラス', en: 'Honduras', ko: '온두라스', zh: '洪都拉斯' }, flag: '🇭🇳', region: '🗽 北米・中南米', lat: 15.2, lon: -86.2, zoom: 7 },
  NI: { names: { ja: 'ニカラグア', en: 'Nicaragua', ko: '니카라과', zh: '尼加拉瓜' }, flag: '🇳🇮', region: '🗽 北米・中南米', lat: 12.8654, lon: -85.2072, zoom: 7 },
  SV: { names: { ja: 'エルサルバドル', en: 'El Salvador', ko: '엘살바도르', zh: '萨尔瓦多' }, flag: '🇸🇻', region: '🗽 北米・中南米', lat: 13.7942, lon: -88.8965, zoom: 8 },
  BS: { names: { ja: 'バハマ', en: 'Bahamas', ko: '바하마', zh: '巴哈马' }, flag: '🇧🇸', region: '🗽 北米・中南米', lat: 25.0343, lon: -77.3963, zoom: 7 },
  PR: { names: { ja: 'プエルトリコ', en: 'Puerto Rico', ko: '푸에르토리코', zh: '波多黎各' }, flag: '🇵🇷', region: '🗽 北米・中南米', lat: 18.2208, lon: -66.5901, zoom: 9 },

  // ── 🦘 オセアニア (Oceania) ──
  AU: { names: { ja: 'オーストラリア', en: 'Australia', ko: '호주', zh: '澳大利亚' }, flag: '🇦🇺', region: '🦘 オセアニア', lat: -25.2744, lon: 133.7751, zoom: 4 },
  NZ: { names: { ja: 'ニュージーランド', en: 'New Zealand', ko: '뉴질랜드', zh: '新西兰' }, flag: '🇳🇿', region: '🦘 オセアニア', lat: -40.9006, lon: 174.8860, zoom: 5 },
  FJ: { names: { ja: 'フィジー', en: 'Fiji', ko: '피지', zh: '斐济' }, flag: '🇫🇯', region: '🦘 オセアニア', lat: -17.7134, lon: 178.0650, zoom: 8 },
  PG: { names: { ja: 'パプアニューギニア', en: 'Papua New Guinea', ko: '파푸아뉴기니', zh: '巴布亚新几内亚' }, flag: '🇵🇬', region: '🦘 オセアニア', lat: -6.3149, lon: 143.9555, zoom: 6 },
  VU: { names: { ja: 'ヴァヌアツ', en: 'Vanuatu', ko: '바누아투', zh: '瓦努阿图' }, flag: '🇻🇺', region: '🦘 オセアニア', lat: -15.3767, lon: 166.9592, zoom: 7 },
  WS: { names: { ja: 'サモア', en: 'Samoa', ko: '사모아', zh: '萨摩亚' }, flag: '🇼🇸', region: '🦘 オセアニア', lat: -13.7590, lon: -172.1046, zoom: 9 },
  GU: { names: { ja: 'グアム', en: 'Guam', ko: '괌', zh: '关岛' }, flag: '🇬🇺', region: '🦘 オセアニア', lat: 13.4443, lon: 144.7937, zoom: 10 },

  // ── 🦁 アフリカ (Africa) ──
  MA: { names: { ja: 'モロッコ', en: 'Morocco', ko: '모로코', zh: '摩洛哥' }, flag: '🇲🇦', region: '🦁 アフリカ', lat: 31.7917, lon: -7.0926, zoom: 6 },
  ZA: { names: { ja: '南アフリカ', en: 'South Africa', ko: '남아프리카', zh: '南非' }, flag: '🇿🇦', region: '🦁 アフリカ', lat: -30.5595, lon: 22.9375, zoom: 5 },
  EG: { names: { ja: 'エジプト', en: 'Egypt', ko: '이집트', zh: '埃及' }, flag: '🇪🇬', region: '🦁 アフリカ', lat: 26.8206, lon: 30.8025, zoom: 6 },
  TN: { names: { ja: 'チュニジア', en: 'Tunisia', ko: '튀니지', zh: '突尼斯' }, flag: '🇹🇳', region: '🦁 アフリカ', lat: 33.8869, lon: 9.5375, zoom: 6 },
  KE: { names: { ja: 'ケニア', en: 'Kenya', ko: '케냐', zh: '肯尼亚' }, flag: '🇰🇪', region: '🦁 アフリカ', lat: -0.0236, lon: 37.9062, zoom: 6 },
  TZ: { names: { ja: 'タンザニア', en: 'Tanzania', ko: '탄자니아', zh: '坦桑尼亚' }, flag: '🇹🇿', region: '🦁 アフリカ', lat: -6.3690, lon: 34.8888, zoom: 6 },
  MU: { names: { ja: 'モーリシャス', en: 'Mauritius', ko: '모리셔스', zh: '毛里求斯' }, flag: '🇲🇺', region: '🦁 アフリカ', lat: -20.3484, lon: 57.5522, zoom: 9 }
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
// 2. Google Maps API コンポーネント (サムネイル付きピン)
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
        }, 30);
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
      const imgUrl = spot.thumbUrl || spot.fileUrl;
      const marker = new window.google.maps.Marker({
        position: { lat: spot.lat, lng: spot.lon },
        map: map,
        title: spot.title,
        icon: {
          url: imgUrl,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
        }
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
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);

  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [selectedCategories, setSelectedCategories] = useState<ViewCategory[]>(['view', 'gourmet', 'rain']);
  const [mapTheme, setMapTheme] = useState<MapThemeType>('light');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('world');
  
  const [mapSearchKeyword, setMapSearchKeyword] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
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
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'timeline' | 'saved' | 'badges'>('posts');

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
    const hasCompleted = localStorage.getItem('wap_onboarded_v1');
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
          .from('wap-media')
          .upload(filePath, current.file, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (uploadError) {
          console.error('Supabase storage upload error:', uploadError);
          showToast('⚠️ ストレージ制限のためオフライン・ローカルモードとして反映しました');
        } else {
          const { data: publicData } = supabase.storage.from('wap-media').getPublicUrl(filePath);
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
        cityName: currentConfig.names[userLangCode] || currentConfig.names.en,
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
            city_name: currentConfig.names[userLangCode] || currentConfig.names.en,
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

  const handleShareSpot = (spot: Spot) => {
    const shareText = `wapで発見したスポット「${spot.title}」をチェック！ 📍 (${spot.cityName})`;
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
  const navBarBg = '#ffffff';
  const navBarText = '#0f172a';

  return (
    <>
      <head>
        <title>wap</title>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>

      <div style={{ background: '#ffffff', color: '#0f172a', height: '100dvh', maxHeight: '100dvh', width: '100vw', maxWidth: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', inset: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', touchAction: 'manipulation', userSelect: 'none' }}>
        
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
                  <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t('step2Title')}</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>{t('step2Desc')}</p>
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
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{c.flag} {c.names[userLangCode] || c.names.en} <span style={{ fontSize: '11px', color: '#64748b' }}>({c.region})</span></span>
                        {userCountry === code && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
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
                      if (target.scrollHeight - target.scrollTop <= target.clientHeight + 15) {
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
              color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden'
            }}
          >
            {!userAvatar && '👤'}
          </button>
        </header>

        {/* ── メインビュー ── */}
        <div style={{ flex: 1, minHeight: 0, maxHeight: 'calc(100dvh - 48px - 54px - env(safe-area-inset-top, 0px))', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#ffffff', padding: 0, margin: 0, boxSizing: 'border-box' }}>
          
          {/* マップタブ */}
          <div style={{ display: currentTab === 'map' ? 'flex' : 'none', flexDirection: 'column', height: '100%', width: '100%', position: 'relative', background: '#ffffff', border: 'none', boxSizing: 'border-box' }}>
            
            <div style={{ position: 'absolute', top: '10px', left: '12px', right: '12px', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', boxSizing: 'border-box' }}>
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

                {mapSearchSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '44px', insetInline: 0, background: '#ffffff', color: '#000', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 600, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
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
                        {cat === 'view' ? `🏔️ ${t('view')}` : cat === 'gourmet' ? `🍔 ${t('gourmet')}` : `🌧️ ${t('rain')}`}
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
                <span>{t('addPhoto')}</span>
                <input type="file" accept="image/*,video/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* ランキングタブ */}
          {currentTab === 'ranking' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#ffffff' }}>
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#ffffff' }}>
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
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
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
              </div>

              {/* マイページのサブタブ（投稿・ログ・保存・バッジ） */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
                {(['posts', 'timeline', 'saved', 'badges'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setProfileSubTab(tab)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: profileSubTab === tab ? themeAccent : '#f8fafc',
                      color: profileSubTab === tab ? '#fff' : '#64748b',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {tab === 'posts' ? t('tabPosts') : tab === 'timeline' ? t('tabTimeline') : tab === 'saved' ? t('tabSaved') : t('tabBadges')}
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
            </div>
          )}
        </div>

        {/* ボトムナビ */}
        <nav style={{ height: 'calc(54px + env(safe-area-inset-bottom, 0px))', minHeight: 'calc(54px + env(safe-area-inset-bottom, 0px))', maxHeight: 'calc(54px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)', background: navBarBg, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexShrink: 0, zIndex: 1000, touchAction: 'none', margin: 0, boxSizing: 'border-box' }}>
          <button onClick={() => setCurrentTab('map')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: currentTab === 'map' ? 'bold' : 'normal', color: currentTab === 'map' ? themeAccent : '#94a3b8' }}>🗺️ {t('map')}</button>
          <button onClick={() => setCurrentTab('ranking')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: currentTab === 'ranking' ? 'bold' : 'normal', color: currentTab === 'ranking' ? themeAccent : '#94a3b8' }}>🏆 {t('ranking')}</button>
          <button onClick={() => setCurrentTab('profile')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: currentTab === 'profile' ? 'bold' : 'normal', color: currentTab === 'profile' ? themeAccent : '#94a3b8' }}>👤 {t('profile')}</button>
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('baseCountrySetting')}</label>
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
                      {c.flag} {c.names[userLangCode] || c.names.en} ({c.region})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
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

              {/* サポート窓口 */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                {t('supportContact')}
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
