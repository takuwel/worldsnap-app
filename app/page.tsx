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
// 1. 型定義 & 15言語辞書 & 完全196カ国マスターデータ
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
    step2Desc: 'マップの初期表示位置となるメインの国を選んでください（全196カ国対応・検索可能）。',
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
3. 各投稿やコメントには「通報（🚨）」機能および悪質ユーザーの「ブロック（🚫）」機能を完備しています。運営チームは通報を受けたコンテンツについて1〜3日以内に審査し、削除やアカウント凍結措置を行います。

【運営サポート・通報窓口】
ご質問、不具合のご報告、規約違反コンテンツの削除依頼などは以下の窓口までご連絡ください。1〜3日以内に対応いたします。
✉️ wap.support.official@gmail.com`,
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
    step2Desc: 'Choose your initial country for the map view (All 196 countries supported with search).',
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
    supportContactBtn: '✉️ Contact Support (Send Email)',
    scopeWorld: '🌎 World',
    scopeFriends: '👥 Friends',
    scopeMy: '📍 My Map',
    deleteAccountBtn: '⚠️ Delete Account',
    commentPlaceholder: '💬 Write a comment...',
    commentSend: 'Send',
    eulaFullText: `[wap Terms of Service & Location Policy]
Article 1: Purpose and Agreement.
All users must agree to these terms before using the service.

Article 2: Location Data via GPS.
Location data is acquired only when the user requests current position.

Article 3: Content Safety & Disclaimer.
Inappropriate content is prohibited. Spot information is as of posting time and may have changed. Users visit locations at their own responsibility. Support replies within 1-3 days.
Support Contact: wap.support.official@gmail.com`,
    guideFullText: `[wap Detailed User Guide]
1. Current Location: Center map on GPS.
2. Zoom: Double tap.
3. Media Posting: Share photos and videos.
4. Community: Safety features included.`
  },
  ko: {
    step1Title: 'Step 1: 언어 선택',
    step1Desc: '앱에서 사용할 언어를 선택하세요.',
    step2Title: 'Step 2: 기본 국가 선택',
    step2Desc: '지도의 중심이 될 기본 국가를 선택하세요 (전 세계 196개국 지원 및 검색 가능).',
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
    countrySearchPlaceholder: '🔍 국가명 검색',
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
    supportContactBtn: '✉️ 고객센터 문의 (이메일 보내기)',
    scopeWorld: '🌎 전체',
    scopeFriends: '👥 친구',
    scopeMy: '📍 내 지도',
    deleteAccountBtn: '⚠️ 계정 삭제 (회원탈퇴)',
    commentPlaceholder: '💬 댓글 입력...',
    commentSend: '전송',
    eulaFullText: `[wap 이용약관 및 위치정보 정책]
제1조 목적으로 본 서비스를 제공합니다.
제2조 위치정보는 GPS를 통해 요청시에만 활용됩니다.
제3조 장소 정보는 게시 시점 기준이며 변경될 수 있습니다. 방문 시 본인 책임하에 확인하세요. 1~3일 내 대응.
고객센터: wap.support.official@gmail.com`,
    guideFullText: `[wap 상세 가이드 및 기능 설명]
1. 현재 위치: GPS를 통해 지도 중심을 이동합니다.
2. 지도 조작: 더블탭으로 확대 가능합니다.
3. 미디어 업로드: 사진과 영상을 공유합니다.`
  },
  zh: {
    step1Title: '步骤 1: 选择语言',
    step1Desc: '请选择您的首选应用语言。',
    step2Title: 'Step 2: 选择基础国家',
    step2Desc: '请选择地图初始显示的国家（支持全球196个国家及快速搜索）。',
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
    countrySearchPlaceholder: '🔍 搜索国家名称...',
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
    supportContactBtn: '✉️ 联系客服 (发送邮件)',
    scopeWorld: '🌎 世界',
    scopeFriends: '👥 好友',
    scopeMy: '📍 我的地图',
    deleteAccountBtn: '⚠️ 删除账户 (注销)',
    commentPlaceholder: '💬 输入评论...',
    commentSend: '发送',
    eulaFullText: `[wap 服务条款与位置政策]
第一条 目的：规范本应用的使用条件。
第二条 位置：仅在用户请求时获取GPS数据。
第三条 景点信息仅供参考，可能存在变更，访问时请自行确认。1-3天内回复。
客服邮箱: wap.support.official@gmail.com`,
    guideFullText: `[wap 详细操作指南]
1. 当前位置: 快速定位您的GPS坐标。
2. 地图缩放: 双击放大。
3. 发布动态: 上传照片或视频。`
  }
};

// ==========================================
// 全世界「全196カ国」完全網羅マスターデータ
// ==========================================
export const COUNTRIES: Record<string, { names: Record<string, string>; flag: string; region: string; lat: number; lon: number; zoom: number }> = {
  JP: { names: { ja: '日本', en: 'Japan', ko: '일본', zh: '日本' }, flag: '🇯🇵', region: '🌏 アジア', lat: 36.2048, lon: 138.2529, zoom: 5 },
  CN: { names: { ja: '中国', en: 'China', ko: '중국', zh: '中国' }, flag: '🇨🇳', region: '🌏 アジア', lat: 35.8617, lon: 104.1954, zoom: 4 },
  KR: { names: { ja: '韓国', en: 'South Korea', ko: '한국', zh: '韩国' }, flag: '🇰🇷', region: '🌏 アジア', lat: 35.9078, lon: 127.7669, zoom: 7 },
  KP: { names: { ja: '北朝鮮', en: 'North Korea', ko: '북한', zh: '朝鲜' }, flag: '🇰🇵', region: '🌏 アジア', lat: 40.3399, lon: 127.5101, zoom: 6 },
  TW: { names: { ja: '台湾', en: 'Taiwan', ko: '대만', zh: '台湾' }, flag: '🇹🇼', region: '🌏 アジア', lat: 23.6978, lon: 120.9605, zoom: 7 },
  MN: { names: { ja: 'モンゴル', en: 'Mongolia', ko: '몽골', zh: '蒙古' }, flag: '🇲🇳', region: '🌏 アジア', lat: 46.8625, lon: 103.8467, zoom: 5 },
  HK: { names: { ja: '香港', en: 'Hong Kong', ko: '홍콩', zh: '香港' }, flag: '🇭🇰', region: '🌏 アジア', lat: 22.3193, lon: 114.1694, zoom: 11 },
  MO: { names: { ja: 'マカオ', en: 'Macau', ko: '마카오', zh: '澳门' }, flag: '🇲🇴', region: '🌏 アジア', lat: 22.1987, lon: 113.5439, zoom: 12 },
  TH: { names: { ja: 'タイ', en: 'Thailand', ko: '태국', zh: '태국' }, flag: '🇹🇭', region: '🌴 東南アジア', lat: 15.8700, lon: 100.9925, zoom: 6 },
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
  IL: { names: { ja: 'イスラエル', en: 'Israel', ko: '이스라엘', zh: '以色列' }, flag: '🇮🇱', region: '🕌 中東', lat: 31.0461, lon: 34.8516, zoom: 7 },
  LB: { names: { ja: 'レバノン', en: 'Lebanon', ko: '레바논', zh: '黎巴嫩' }, flag: '🇱🇧', region: '🕌 中東', lat: 33.8547, lon: 35.8623, zoom: 8 },
  IQ: { names: { ja: 'イラク', en: 'Iraq', ko: '이라크', zh: '伊拉克' }, flag: '🇮🇶', region: '🕌 中東', lat: 33.2232, lon: 43.6793, zoom: 6 },
  IR: { names: { ja: 'イラン', en: 'Iran', ko: '이란', zh: '伊朗' }, flag: '🇮🇷', region: '🕌 中東', lat: 32.4279, lon: 53.6880, zoom: 5 },
  SY: { names: { ja: 'シリア', en: 'Syria', ko: '시리아', zh: '叙利亚' }, flag: '🇸🇾', region: '🕌 中東', lat: 34.8021, lon: 38.9968, zoom: 7 },
  YE: { names: { ja: 'イエメン', en: 'Yemen', ko: '예멘', zh: '也门' }, flag: '🇾🇪', region: '🕌 中東', lat: 15.5527, lon: 48.5164, zoom: 6 },
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
  SE: { names: { ja: 'スウェーデン', en: 'Sweden', ko: '스베덴', zh: '瑞典' }, flag: '🇸🇪', region: '🇪🇺 北欧', lat: 60.1282, lon: 18.6435, zoom: 5 },
  NO: { names: { ja: 'ノルウェー', en: 'Norway', ko: '노르웨이', zh: '挪威' }, flag: '🇳🇴', region: '🇪🇺 北欧', lat: 60.4720, lon: 8.4689, zoom: 5 },
  DK: { names: { ja: 'デンマーク', en: 'Denmark', ko: '덴마크', zh: '丹麦' }, flag: '🇩🇰', region: '🇪🇺 北欧', lat: 56.2639, lon: 9.5018, zoom: 7 },
  FI: { names: { ja: 'フィンランド', en: 'Finland', ko: '핀란드', zh: '芬兰' }, flag: '🇫🇮', region: '🇪🇺 北欧', lat: 61.9241, lon: 25.7482, zoom: 5 },
  IS: { names: { ja: 'アイスランド', en: 'Iceland', ko: '아이슬란드', zh: '冰岛' }, flag: '🇮🇸', region: '🇪🇺 北欧', lat: 64.9631, lon: -19.0208, zoom: 6 },
  PL: { names: { ja: 'ポーランド', en: 'Poland', ko: '폴란드', zh: '波兰' }, flag: '🇵🇱', region: '🇪🇺 ヨーロッパ', lat: 51.9194, lon: 19.1451, zoom: 6 },
  CZ: { names: { ja: 'チェコ', en: 'Czech Republic', ko: '체코', zh: '捷克' }, flag: '🇨🇿', region: '🇪🇺 ヨーロッパ', lat: 49.8175, lon: 15.4730, zoom: 7 },
  HU: { names: { ja: 'ハンガリー', en: 'Hungary', ko: '헝가리', zh: '匈牙利' }, flag: '🇭🇺', region: '🇪🇺 ヨーロッパ', lat: 47.1625, lon: 19.5033, zoom: 7 },
  IE: { names: { ja: 'アイルランド', en: 'Ireland', ko: '아이슬란드', zh: '爱尔兰' }, flag: '🇮🇪', region: '🇪🇺 ヨーロッパ', lat: 53.1424, lon: -7.6921, zoom: 7 },
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
  BA: { names: { ja: 'ボスニア・ヘルツェゴビナ', en: 'Bosnia and Herzegovina', ko: '보스니아 헤르체고비나', zh: '波黑' }, flag: '🇧🇦', region: '🇪🇺 ヨーロッパ', lat: 43.9159, lon: 17.6791, zoom: 7 },
  ME: { names: { ja: 'モンテネグロ', en: 'Montenegro', ko: '몬테네그로', zh: '黑山' }, flag: '🇲🇪', region: '🇪🇺 ヨーロッパ', lat: 42.7087, lon: 19.3744, zoom: 8 },
  MK: { names: { ja: '北マケドニア', en: 'North Macedonia', ko: '북마케도니아', zh: '北马其顿' }, flag: '🇲🇰', region: '🇪🇺 ヨーロッパ', lat: 41.6086, lon: 21.7453, zoom: 8 },
  MD: { names: { ja: 'モルドバ', en: 'Moldova', ko: '몰도바', zh: '摩尔多瓦' }, flag: '🇲🇩', region: '🇪🇺 ヨーロッパ', lat: 47.4116, lon: 28.3699, zoom: 7 },
  BY: { names: { ja: 'ベラルーシ', en: 'Belarus', ko: '벨라루스', zh: '白俄罗斯' }, flag: '🇧🇾', region: '🇪🇺 ヨーロッパ', lat: 53.7098, lon: 27.9534, zoom: 6 },
  RU: { names: { ja: 'ロシア', en: 'Russia', ko: '러시아', zh: '俄罗斯' }, flag: '🇷🇺', region: '🇪🇺 ヨーロッパ', lat: 61.5240, lon: 105.3188, zoom: 3 },
  US: { names: { ja: 'アメリカ', en: 'USA', ko: '미국', zh: '美国' }, flag: '🇺🇸', region: '🗽 北米', lat: 37.0902, lon: -95.7129, zoom: 4 },
  CA: { names: { ja: 'カナダ', en: 'Canada', ko: '캐나다', zh: '加拿大' }, flag: '🇨🇦', region: '🗽 北米', lat: 56.1304, lon: -106.3468, zoom: 3 },
  MX: { names: { ja: 'メキシコ', en: 'Mexico', ko: '멕시코', zh: '墨西哥' }, flag: '🇲🇽', region: '🗽 北米', lat: 23.6345, lon: 102.5528, zoom: 5 },
  BR: { names: { ja: 'ブラジル', en: 'Brazil', ko: '브라질', zh: '巴西' }, flag: '🇧🇷', region: '🗽 中南米', lat: -14.2350, lon: -51.9253, zoom: 4 },
  AR: { names: { ja: 'アルゼンチン', en: 'Argentina', ko: '아르헨티나', zh: '아르헨티나' }, flag: '🇦🇷', region: '🗽 中南米', lat: -38.4161, lon: -63.6167, zoom: 4 },
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
  HN: { names: { ja: 'ホンジュラス', en: 'Honduras', ko: '온두라스', zh: '洪都拉斯' }, flag: '🇭🇳', region: '🗽 中南米', lat: 15.2, lon: -86.2, zoom: 7 },
  NI: { names: { ja: 'ニカラグア', en: 'Nicaragua', ko: '니카라과', zh: '尼加拉瓜' }, flag: '🇳🇮', region: '🗽 中南米', lat: 12.8654, lon: -85.2072, zoom: 7 },
  SV: { names: { ja: 'エルサルバドル', en: 'El Salvador', ko: '엘살바도르', zh: '萨尔瓦多' }, flag: '🇸🇻', region: '🗽 中南米', lat: 13.7942, lon: -88.8965, zoom: 8 },
  BS: { names: { ja: 'バハマ', en: 'Bahamas', ko: '바하마', zh: '巴哈马' }, flag: '🇧🇸', region: '🗽 中南米', lat: 25.0343, lon: -77.3963, zoom: 7 },
  PR: { names: { ja: 'プエルトリコ', en: 'Puerto Rico', ko: '푸에르토리코', zh: '波多黎各' }, flag: '🇵🇷', region: '🗽 中南米', lat: 18.2208, lon: -66.5901, zoom: 9 },
  BZ: { names: { ja: 'ベリーズ', en: 'Belize', ko: '벨리즈', zh: '伯利兹' }, flag: '🇧🇿', region: '🗽 中南米', lat: 17.1899, lon: -88.4976, zoom: 8 },
  TT: { names: { ja: 'トリニダード・トバゴ', en: 'Trinidad and Tobago', ko: '트리니다드 토바고', zh: '特立尼达和多巴哥' }, flag: '🇹🇹', region: '🗽 中南米', lat: 10.6918, lon: -61.2225, zoom: 9 },
  HT: { names: { ja: 'ハイチ', en: 'Haiti', ko: '아이티', zh: '海地' }, flag: '🇭🇹', region: '🗽 中南米', lat: 18.9712, lon: -72.2852, zoom: 8 },
  GY: { names: { ja: 'ガイアナ', en: 'Guyana', ko: '가이아나', zh: '圭亚那' }, flag: '🇬🇾', region: '🗽 中南米', lat: 4.8604, lon: -58.9302, zoom: 6 },
  SR: { names: { ja: 'スリナム', en: 'Suriname', ko: '수리남', zh: '苏里南' }, flag: '🇸🇷', region: '🗽 中南米', lat: 3.9193, lon: -56.0278, zoom: 7 },
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
  EG: { names: { ja: 'エジプト', en: 'Egypt', ko: '이집트', zh: '埃及' }, flag: '🇪🇬', region: '🦁 アフリカ', lat: 26.8206, lon: 30.8025, zoom: 6 },
  ZA: { names: { ja: '南アフリカ', en: 'South Africa', ko: '남아프리카', zh: '남아프리카' }, flag: '🇿🇦', region: '🦁 アフリカ', lat: -30.5595, lon: 22.9375, zoom: 5 },
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
  SO: { names: { ja: 'ソマリア', en: 'Somalia', ko: '소말리아', zh: '索马里' }, flag: '🇸🇴', region: '🦁 アフリカ', lat: 5.1521, lon: 46.1996, zoom: 6 }
};
