'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// ==========================================
// 1. 型定義 & 17カ国マスターデータ (言語・辞書・地名連動)
// ==========================================
export type ViewCategory = 'view' | 'gourmet' | 'rain';
export type DisplayScope = 'my' | 'friends' | 'world';
export type TabType = 'map' | 'home' | 'profile';

export interface Spot {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  lat: number;
  lon: number;
  countryCode: string;
  cityName: string;
  category: ViewCategory;
  scope: DisplayScope;
  createdAt: string;
  isSaved?: boolean;
}

export interface PendingFile {
  id: string;
  file: File;
  fileUrl: string;
  fileType: 'image' | 'video';
  dateTime?: string;
}

export const COUNTRIES: Record<
  string,
  {
    name: string;
    flag: string;
    lang: string; // 地図地名ラベルの言語コード (ja, ko, en, de, fr, es, it, zh, ar, th)
    lat: number;
    lon: number;
    zoom: number;
    dict: Record<string, string>;
  }
> = {
  JP: {
    name: '日本 (Japan)',
    flag: '🇯🇵',
    lang: 'ja',
    lat: 36.2048,
    lon: 138.2529,
    zoom: 5,
    dict: {
      step1Title: 'Step 1: 国籍・メインの国を選択',
      step1Desc: '選択した国に応じて、アプリ内の言語と地図上の地名・国名がすべてローカライズされます。',
      step2Title: 'Step 2: プロフィール作成',
      step3Title: 'Step 3: 利用規約 (EULA) の確認',
      next: '次へ進む', back: '戻る', startApp: '🚀 WorldSnap をはじめる',
      eulaAgree: '利用規約およびコミュニティガイドラインに同意する',
      termsTitle: '📜 WorldSnap 利用規約 (EULA)',
      home: 'ホーム', map: 'マップ', profile: 'マイページ',
      addPhoto: '写真 / 動画を追加', exportMap: 'マップ保存',
      view: 'View (絶景)', gourmet: 'グルメ', rain: '雨の日',
      myMap: 'マイマップ', friends: 'フレンド', world: 'ワールド',
      openGoogleMaps: '🧭 Googleマップでルート案内を開く', saveSpot: '❤️ 行きたい', saved: '❤️ 保存済み',
      report: '⚠️ 通報', block: '🚫 ブロック', delete: '🗑️ 削除', edit: '✏️ 編集',
      visited: '訪問国', countriesUnit: 'カ国', posts: '投稿', friendCode: 'フレンドコード',
      searchPlaceholder: '🔍 スポットを検索（例: 東京 夜景、京都 カフェ）',
      cacheClear: '🧹 地図キャッシュ削除', deleteAccount: '⚠️ アカウントの削除 (退会処理)', logout: '🚪 ログアウト',
      postScopePrompt: '投稿の公開範囲を選択してください:', close: '閉じる'
    },
  },
  CH: {
    name: 'Schweiz (スイス)',
    flag: '🇨🇭',
    lang: 'de',
    lat: 46.8182,
    lon: 8.2275,
    zoom: 8,
    dict: {
      step1Title: 'Schritt 1: Land / Nationalität wählen',
      step1Desc: 'Die App-Sprache und alle Ortsnamen auf der Karte werden auf Deutsch angezeigt.',
      step2Title: 'Schritt 2: Profil erstellen',
      step3Title: 'Schritt 3: Nutzungsbedingungen (EULA)',
      next: 'Weiter', back: 'Zurück', startApp: '🚀 WorldSnap Starten',
      eulaAgree: 'Ich stimme den Nutzungsbedingungen zu',
      termsTitle: '📜 Nutzungsbedingungen (EULA)',
      home: 'Start', map: 'Karte', profile: 'Profil',
      addPhoto: 'Medien hinzufügen', exportMap: 'Speichern',
      view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen',
      myMap: 'Meine Karte', friends: 'Freunde', world: 'Weltweit',
      openGoogleMaps: '🧭 In Google Maps öffnen', saveSpot: '❤️ Merken', saved: '❤️ Gemerkt',
      report: '⚠️ Melden', block: '🚫 Blockieren', delete: '🗑️ Löschen', edit: '✏️ Bearbeiten',
      visited: 'Besucht', countriesUnit: 'Länder', posts: 'Beiträge', friendCode: 'Freundescode',
      searchPlaceholder: '🔍 Suchen (z.B. Zermatt Aussicht)',
      cacheClear: '🧹 Cache leeren', deleteAccount: '⚠️ Konto löschen', logout: '🚪 Abmelden',
      postScopePrompt: 'Sichtbarkeit für diesen Beitrag wählen:', close: 'Schließen'
    },
  },
  KR: {
    name: '대한민국 (韓国)',
    flag: '🇰🇷',
    lang: 'ko',
    lat: 35.9078,
    lon: 127.7669,
    zoom: 7,
    dict: {
      step1Title: 'Step 1: 국적 / 주요 국가 선택',
      step1Desc: '선택한 국가에 맞춰 앱 언어와 지도의 모든 지명이 한국어로 표시됩니다.',
      step2Title: 'Step 2: 프로필 설정',
      step3Title: 'Step 3: 이용약관 (EULA) 동의',
      next: '다음', back: '뒤로', startApp: '🚀 WorldSnap 시작하기',
      eulaAgree: '이용약관 및 커뮤니티 가이드라인에 동의합니다',
      termsTitle: '📜 WorldSnap 이용약관 (EULA)',
      home: '홈', map: '지도', profile: '마이페이지',
      addPhoto: '사진/동영상 추가', exportMap: '지도 저장',
      view: '경치', gourmet: '맛집', rain: '비오는날',
      myMap: '내 지도', friends: '친구', world: '전체',
      openGoogleMaps: '🧭 Google 지도에서 길찾기', saveSpot: '❤️ 가고싶다', saved: '❤️ 저장됨',
      report: '⚠️ 신고', block: '🚫 차단', delete: '🗑️ 삭제', edit: '✏️ 수정',
      visited: '방문 국가', countriesUnit: '개국', posts: '게시물', friendCode: '친구 코드',
      searchPlaceholder: '🔍 명소 검색 (예: 서울 맛집)',
      cacheClear: '🧹 캐시 삭제', deleteAccount: '⚠️ 회원 탈퇴', logout: '🚪 로그아웃',
      postScopePrompt: '게시물 공개 범위를 선택하세요:', close: '닫기'
    },
  },
  US: {
    name: 'USA (アメリカ)',
    flag: '🇺🇸',
    lang: 'en',
    lat: 37.0902,
    lon: -95.7129,
    zoom: 4,
    dict: {
      step1Title: 'Step 1: Select Your Nationality / Country',
      step1Desc: 'The app UI and all map place names will be localized to English.',
      step2Title: 'Step 2: Create Profile',
      step3Title: 'Step 3: Terms of Service (EULA)',
      next: 'Next', back: 'Back', startApp: '🚀 Start WorldSnap',
      eulaAgree: 'I agree to the Terms of Service and Community Guidelines',
      termsTitle: '📜 WorldSnap Terms of Service (EULA)',
      home: 'Home', map: 'Map', profile: 'Profile',
      addPhoto: 'Add Photo / Video', exportMap: 'Save Map',
      view: 'View', gourmet: 'Gourmet', rain: 'Rainy Day',
      myMap: 'My Map', friends: 'Friends', world: 'World',
      openGoogleMaps: '🧭 Open in Google Maps', saveSpot: '❤️ Want to go', saved: '❤️ Saved',
      report: '⚠️ Report', block: '🚫 Block', delete: '🗑️ Delete', edit: '✏️ Edit',
      visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Friend Code',
      searchPlaceholder: '🔍 Search spots (e.g. NYC Night View)',
      cacheClear: '🧹 Clear Map Cache', deleteAccount: '⚠️ Delete Account', logout: '🚪 Log Out',
      postScopePrompt: 'Select visibility for this post:', close: 'Close'
    },
  },
  FR: {
    name: 'France (フランス)',
    flag: '🇫🇷',
    lang: 'fr',
    lat: 46.2276,
    lon: 2.2137,
    zoom: 6,
    dict: {
      step1Title: 'Étape 1 : Choisissez votre pays / nationalité',
      step1Desc: 'L’interface et tous les noms de lieux sur la carte seront traduits en français.',
      step2Title: 'Étape 2 : Créer votre profil',
      step3Title: 'Étape 3 : Conditions d’utilisation (EULA)',
      next: 'Suivant', back: 'Retour', startApp: '🚀 Démarrer WorldSnap',
      eulaAgree: 'J’accepte les conditions d’utilisation',
      termsTitle: '📜 Conditions d’utilisation (EULA)',
      home: 'Accueil', map: 'Carte', profile: 'Profil',
      addPhoto: 'Ajouter média', exportMap: 'Enregistrer la carte',
      view: 'Paysage', gourmet: 'Gourmet', rain: 'Pluie',
      myMap: 'Ma carte', friends: 'Amis', world: 'Monde',
      openGoogleMaps: '🧭 Ouvrir dans Google Maps', saveSpot: '❤️ Enregistrer', saved: '❤️ Enregistré',
      report: '⚠️ Signaler', block: '🚫 Bloquer', delete: '🗑️ Supprimer', edit: '✏️ Modifier',
      visited: 'Visité', countriesUnit: 'pays', posts: 'Publications', friendCode: 'Code ami',
      searchPlaceholder: '🔍 Rechercher (ex : Paris Tour Eiffel)',
      cacheClear: '🧹 Vider le cache', deleteAccount: '⚠️ Supprimer le compte', logout: '🚪 Déconnexion',
      postScopePrompt: 'Choisir la visibilité de cette publication :', close: 'Fermer'
    },
  },
  DE: {
    name: 'Deutschland (ドイツ)',
    flag: '🇩🇪',
    lang: 'de',
    lat: 51.1657,
    lon: 10.4515,
    zoom: 6,
    dict: {
      step1Title: 'Schritt 1: Land / Nationalität wählen',
      step1Desc: 'Die App und alle Kartennamen werden auf Deutsch angezeigt.',
      step2Title: 'Schritt 2: Profil erstellen',
      step3Title: 'Schritt 3: Nutzungsbedingungen (EULA)',
      next: 'Weiter', back: 'Zurück', startApp: '🚀 WorldSnap Starten',
      eulaAgree: 'Nutzungsbedingungen zustimmen',
      termsTitle: '📜 Nutzungsbedingungen (EULA)',
      home: 'Start', map: 'Karte', profile: 'Profil',
      addPhoto: 'Medien hinzufügen', exportMap: 'Speichern',
      view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen',
      myMap: 'Meine Karte', friends: 'Freunde', world: 'Weltweit',
      openGoogleMaps: '🧭 In Google Maps öffnen', saveSpot: '❤️ Merken', saved: '❤️ Gemerkt',
      report: '⚠️ Melden', block: '🚫 Blockieren', delete: '🗑️ Löschen', edit: '✏️ Bearbeiten',
      visited: 'Länder', countriesUnit: 'Länder', posts: 'Beiträge', friendCode: 'Freundescode',
      searchPlaceholder: '🔍 Orte suchen',
      cacheClear: '🧹 Cache leeren', deleteAccount: '⚠️ Konto löschen', logout: '🚪 Abmelden',
      postScopePrompt: 'Sichtbarkeit auswählen:', close: 'Schließen'
    },
  },
  IT: {
    name: 'Italia (イタリア)',
    flag: '🇮🇹',
    lang: 'it',
    lat: 41.8719,
    lon: 12.5674,
    zoom: 6,
    dict: {
      step1Title: 'Passo 1: Seleziona la tua nazionalità',
      step1Desc: 'L’app e i nomi dei luoghi sulla mappa saranno in italiano.',
      step2Title: 'Passo 2: Crea profilo',
      step3Title: 'Passo 3: Termini di servizio',
      next: 'Avanti', back: 'Indietro', startApp: '🚀 Avvia WorldSnap',
      eulaAgree: 'Accetto i termini di servizio',
      termsTitle: '📜 Termini di servizio (EULA)',
      home: 'Home', map: 'Mappa', profile: 'Profilo',
      addPhoto: 'Aggiungi foto/video', exportMap: 'Salva mappa',
      view: 'Panorama', gourmet: 'Gourmet', rain: 'Pioggia',
      myMap: 'Mia mappa', friends: 'Amici', world: 'Mondo',
      openGoogleMaps: '🧭 Apri su Google Maps', saveSpot: '❤️ Salva', saved: '❤️ Salvato',
      report: '⚠️ Segnala', block: '🚫 Blocca', delete: '🗑️ Elimina', edit: '✏️ Modifica',
      visited: 'Visitati', countriesUnit: 'paesi', posts: 'Post', friendCode: 'Codice amico',
      searchPlaceholder: '🔍 Cerca luoghi',
      cacheClear: '🧹 Svuota cache', deleteAccount: '⚠️ Elimina account', logout: '🚪 Esci',
      postScopePrompt: 'Seleziona visibilità del post:', close: 'Chiudi'
    },
  },
  GB: {
    name: 'United Kingdom (イギリス)',
    flag: '🇬🇧',
    lang: 'en',
    lat: 55.3781,
    lon: -3.436,
    zoom: 5,
    dict: {
      step1Title: 'Step 1: Select Nationality',
      step1Desc: 'The app UI and map labels will be localized to English.',
      step2Title: 'Step 2: Profile Setup',
      step3Title: 'Step 3: Terms of Service',
      next: 'Next', back: 'Back', startApp: '🚀 Start WorldSnap',
      eulaAgree: 'I agree to the Terms of Service',
      termsTitle: '📜 Terms of Service',
      home: 'Home', map: 'Map', profile: 'Profile',
      addPhoto: 'Add Media', exportMap: 'Save Map',
      view: 'View', gourmet: 'Gourmet', rain: 'Rainy Day',
      myMap: 'My Map', friends: 'Friends', world: 'World',
      openGoogleMaps: '🧭 Open in Google Maps', saveSpot: '❤️ Save', saved: '❤️ Saved',
      report: '⚠️ Report', block: '🚫 Block', delete: '🗑️ Delete', edit: '✏️ Edit',
      visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Friend Code',
      searchPlaceholder: '🔍 Search spots',
      cacheClear: '🧹 Clear Cache', deleteAccount: '⚠️ Delete Account', logout: '🚪 Log Out',
      postScopePrompt: 'Select post visibility:', close: 'Close'
    },
  },
  ES: {
    name: 'España (スペイン)',
    flag: '🇪🇸',
    lang: 'es',
    lat: 40.4637,
    lon: -3.7492,
    zoom: 6,
    dict: {
      step1Title: 'Paso 1: Selecciona tu nacionalidad',
      step1Desc: 'La aplicación y los nombres del mapa estarán en español.',
      step2Title: 'Paso 2: Crear perfil',
      step3Title: 'Paso 3: Términos de servicio',
      next: 'Siguiente', back: 'Atrás', startApp: '🚀 Comenzar WorldSnap',
      eulaAgree: 'Acepto los términos de servicio',
      termsTitle: '📜 Términos de servicio (EULA)',
      home: 'Inicio', map: 'Mapa', profile: 'Perfil',
      addPhoto: 'Añadir foto/video', exportMap: 'Guardar mapa',
      view: 'Vistas', gourmet: 'Gourmet', rain: 'Lluvia',
      myMap: 'Mi mapa', friends: 'Amigos', world: 'Mundo',
      openGoogleMaps: '🧭 Abrir en Google Maps', saveSpot: '❤️ Guardar', saved: '❤️ Guardado',
      report: '⚠️ Denunciar', block: '🚫 Bloquear', delete: '🗑️ Eliminar', edit: '✏️ Editar',
      visited: 'Visitados', countriesUnit: 'países', posts: 'Publicaciones', friendCode: 'Código amigo',
      searchPlaceholder: '🔍 Buscar lugares',
      cacheClear: '🧹 Borrar caché', deleteAccount: '⚠️ Eliminar cuenta', logout: '🚪 Salir',
      postScopePrompt: 'Seleccionar visibilidad:', close: 'Cerrar'
    },
  },
  TH: {
    name: 'ไทย (タイ)',
    flag: '🇹🇭',
    lang: 'th',
    lat: 15.87,
    lon: 100.9925,
    zoom: 6,
    dict: {
      step1Title: 'ขั้นตอนที่ 1: เลือกสัญชาติ / ประเทศหลัก',
      step1Desc: 'ภาษาในแอปและชื่อสถานที่ทั้งหมดบนแผนที่จะแสดงเป็นภาษาไทย',
      step2Title: 'ขั้นตอนที่ 2: สร้างโปรไฟล์',
      step3Title: 'ขั้นตอนที่ 3: ข้อกำหนดการใช้งาน (EULA)',
      next: 'ถัดไป', back: 'ย้อนกลับ', startApp: '🚀 เริ่ม WorldSnap',
      eulaAgree: 'ฉันยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว',
      termsTitle: '📜 ข้อกำหนดการใช้งาน (EULA)',
      home: 'หน้าแรก', map: 'แผนที่', profile: 'โปรไฟล์',
      addPhoto: 'เพิ่มรูป/วิดีโอ', exportMap: 'บันทึกแผนที่',
      view: 'วิว', gourmet: 'ของกิน', rain: 'วันฝนตก',
      myMap: 'แผนที่ของฉัน', friends: 'เพื่อน', world: 'ทั่วโลก',
      openGoogleMaps: '🧭 เปิดใน Google Maps', saveSpot: '❤️ บันทึก', saved: '❤️ บันทึกแล้ว',
      report: '⚠️ รายงาน', block: '🚫 บล็อก', delete: '🗑️ ลบ', edit: '✏️ แก้ไข',
      visited: 'เยือนแล้ว', countriesUnit: 'ประเทศ', posts: 'โพสต์', friendCode: 'รหัสเพื่อน',
      searchPlaceholder: '🔍 ค้นหาสถานที่',
      cacheClear: '🧹 ล้างแคช', deleteAccount: '⚠️ ลบบัญชี', logout: '🚪 ออกจากระบบ',
      postScopePrompt: 'เลือกการมองเห็นของโพสต์:', close: 'ปิด'
    },
  },
  AU: {
    name: 'Australia (オーストラリア)',
    flag: '🇦🇺',
    lang: 'en',
    lat: -25.2744,
    lon: 133.7751,
    zoom: 4,
    dict: {
      step1Title: 'Step 1: Select Nationality',
      step1Desc: 'Map labels and UI localized to English.',
      step2Title: 'Step 2: Profile Setup',
      step3Title: 'Step 3: Terms of Service',
      next: 'Next', back: 'Back', startApp: '🚀 Start WorldSnap',
      eulaAgree: 'I agree to the Terms',
      termsTitle: '📜 Terms of Service',
      home: 'Home', map: 'Map', profile: 'Profile',
      addPhoto: 'Add Media', exportMap: 'Save Map',
      view: 'View', gourmet: 'Gourmet', rain: 'Rainy Day',
      myMap: 'My Map', friends: 'Friends', world: 'World',
      openGoogleMaps: '🧭 Open in Google Maps', saveSpot: '❤️ Save', saved: '❤️ Saved',
      report: '⚠️ Report', block: '🚫 Block', delete: '🗑️ Delete', edit: '✏️ Edit',
      visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Friend Code',
      searchPlaceholder: '🔍 Search',
      cacheClear: '🧹 Clear Cache', deleteAccount: '⚠️ Delete Account', logout: '🚪 Log Out',
      postScopePrompt: 'Select visibility:', close: 'Close'
    },
  },
  NZ: {
    name: 'New Zealand (NZ)',
    flag: '🇳🇿',
    lang: 'en',
    lat: -40.9006,
    lon: 174.886,
    zoom: 5,
    dict: {
      step1Title: 'Step 1: Select Nationality',
      step1Desc: 'Map labels and UI localized to English.',
      step2Title: 'Step 2: Profile Setup',
      step3Title: 'Step 3: Terms of Service',
      next: 'Next', back: 'Back', startApp: '🚀 Start WorldSnap',
      eulaAgree: 'I agree to the Terms',
      termsTitle: '📜 Terms of Service',
      home: 'Home', map: 'Map', profile: 'Profile',
      addPhoto: 'Add Media', exportMap: 'Save Map',
      view: 'View', gourmet: 'Gourmet', rain: 'Rainy Day',
      myMap: 'My Map', friends: 'Friends', world: 'World',
      openGoogleMaps: '🧭 Open in Google Maps', saveSpot: '❤️ Save', saved: '❤️ Saved',
      report: '⚠️ Report', block: '🚫 Block', delete: '🗑️ Delete', edit: '✏️ Edit',
      visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Friend Code',
      searchPlaceholder: '🔍 Search',
      cacheClear: '🧹 Clear Cache', deleteAccount: '⚠️ Delete Account', logout: '🚪 Log Out',
      postScopePrompt: 'Select visibility:', close: 'Close'
    },
  },
  AT: {
    name: 'Österreich (オーストリア)',
    flag: '🇦🇹',
    lang: 'de',
    lat: 47.5162,
    lon: 14.5501,
    zoom: 7,
    dict: {
      step1Title: 'Schritt 1: Land wählen',
      step1Desc: 'Sprache und Karte auf Deutsch.',
      step2Title: 'Schritt 2: Profil',
      step3Title: 'Schritt 3: AGB (EULA)',
      next: 'Weiter', back: 'Zurück', startApp: '🚀 Starten',
      eulaAgree: 'Zustimmen',
      termsTitle: '📜 AGB (EULA)',
      home: 'Start', map: 'Karte', profile: 'Profil',
      addPhoto: 'Foto', exportMap: 'Speichern',
      view: 'Aussicht', gourmet: 'Gourmet', rain: 'Regen',
      myMap: 'Meine Karte', friends: 'Freunde', world: 'Weltweit',
      openGoogleMaps: '🧭 In Google Maps öffnen', saveSpot: '❤️ Merken', saved: '❤️ Gemerkt',
      report: '⚠️ Melden', block: '🚫 Blockieren', delete: '🗑️ Löschen', edit: '✏️ Bearbeiten',
      visited: 'Länder', countriesUnit: 'Länder', posts: 'Beiträge', friendCode: 'Freundescode',
      searchPlaceholder: '🔍 Suchen',
      cacheClear: '🧹 Cache leeren', deleteAccount: '⚠️ Konto löschen', logout: '🚪 Abmelden',
      postScopePrompt: 'Sichtbarkeit:', close: 'Schließen'
    },
  },
  SG: {
    name: 'Singapore (シンガポール)',
    flag: '🇸🇬',
    lang: 'en',
    lat: 1.3521,
    lon: 103.8198,
    zoom: 11,
    dict: {
      step1Title: 'Step 1: Select Nationality',
      step1Desc: 'Map labels and UI localized to English.',
      step2Title: 'Step 2: Profile Setup',
      step3Title: 'Step 3: Terms of Service',
      next: 'Next', back: 'Back', startApp: '🚀 Start WorldSnap',
      eulaAgree: 'I agree',
      termsTitle: '📜 Terms of Service',
      home: 'Home', map: 'Map', profile: 'Profile',
      addPhoto: 'Add Media', exportMap: 'Save Map',
      view: 'View', gourmet: 'Gourmet', rain: 'Rainy Day',
      myMap: 'My Map', friends: 'Friends', world: 'World',
      openGoogleMaps: '🧭 Open in Google Maps', saveSpot: '❤️ Save', saved: '❤️ Saved',
      report: '⚠️ Report', block: '🚫 Block', delete: '🗑️ Delete', edit: '✏️ Edit',
      visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Friend Code',
      searchPlaceholder: '🔍 Search',
      cacheClear: '🧹 Clear Cache', deleteAccount: '⚠️ Delete Account', logout: '🚪 Log Out',
      postScopePrompt: 'Select visibility:', close: 'Close'
    },
  },
  CA: {
    name: 'Canada (カナダ)',
    flag: '🇨🇦',
    lang: 'en',
    lat: 56.1304,
    lon: -106.3468,
    zoom: 4,
    dict: {
      step1Title: 'Step 1: Select Nationality',
      step1Desc: 'Map labels and UI localized to English.',
      step2Title: 'Step 2: Profile Setup',
      step3Title: 'Step 3: Terms of Service',
      next: 'Next', back: 'Back', startApp: '🚀 Start WorldSnap',
      eulaAgree: 'I agree to Terms',
      termsTitle: '📜 Terms of Service',
      home: 'Home', map: 'Map', profile: 'Profile',
      addPhoto: 'Add Media', exportMap: 'Save Map',
      view: 'View', gourmet: 'Gourmet', rain: 'Rainy Day',
      myMap: 'My Map', friends: 'Friends', world: 'World',
      openGoogleMaps: '🧭 Open in Google Maps', saveSpot: '❤️ Save', saved: '❤️ Saved',
      report: '⚠️ Report', block: '🚫 Block', delete: '🗑️ Delete', edit: '✏️ Edit',
      visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Friend Code',
      searchPlaceholder: '🔍 Search',
      cacheClear: '🧹 Clear Cache', deleteAccount: '⚠️ Delete Account', logout: '🚪 Log Out',
      postScopePrompt: 'Select visibility:', close: 'Close'
    },
  },
  AE: {
    name: 'Dubai / UAE (ドバイ)',
    flag: '🇦🇪',
    lang: 'ar',
    lat: 25.2048,
    lon: 55.2708,
    zoom: 9,
    dict: {
      step1Title: 'الخطوة 1: اختر دولتك / جنسيتك',
      step1Desc: 'سيتم تعريب واجهة التطبيق وأسماء الأماكن على الخريطة بالكامل إلى اللغة العربية.',
      step2Title: 'الخطوة 2: إنشاء الملف الشخصي',
      step3Title: 'الخطوة 3: شروط الخدمة (EULA)',
      next: 'التالي', back: 'رجوع', startApp: '🚀 ابدأ WorldSnap',
      eulaAgree: 'أوافق على شروط الخدمة وإرشادات المجتمع',
      termsTitle: '📜 شروط الخدمة (EULA)',
      home: 'الرئيسية', map: 'الخريطة', profile: 'الملف',
      addPhoto: 'إضافة صورة / فيديو', exportMap: 'حفظ الخريطة',
      view: 'إطلالة', gourmet: 'مطاعم', rain: 'ممطر',
      myMap: 'خريطتي', friends: 'الأصدقاء', world: 'العالم',
      openGoogleMaps: '🧭 خرائط Google', saveSpot: '❤️ حفظ', saved: '❤️ تم الحفظ',
      report: '⚠️ إبلاغ', block: '🚫 حظر', delete: '🗑️ حذف', edit: '✏️ تعديل',
      visited: 'الدول', countriesUnit: 'دولة', posts: 'منشورات', friendCode: 'رمز الصديق',
      searchPlaceholder: '🔍 بحث عن مكان',
      cacheClear: '🧹 مسح الذاكرة', deleteAccount: '⚠️ حذف الحساب', logout: '🚪 خروج',
      postScopePrompt: 'حدد نطاق نشر المنشور:', close: 'إغلاق'
    },
  },
  MV: {
    name: 'Maldives (モルディブ)',
    flag: '🇲🇻',
    lang: 'en',
    lat: 3.2028,
    lon: 73.2207,
    zoom: 7,
    dict: {
      step1Title: 'Step 1: Select Nationality',
      step1Desc: 'Map labels and UI localized to English.',
      step2Title: 'Step 2: Profile Setup',
      step3Title: 'Step 3: Terms of Service',
      next: 'Next', back: 'Back', startApp: '🚀 Start WorldSnap',
      eulaAgree: 'I agree to the Terms',
      termsTitle: '📜 Terms of Service',
      home: 'Home', map: 'Map', profile: 'Profile',
      addPhoto: 'Add Media', exportMap: 'Save Map',
      view: 'View', gourmet: 'Gourmet', rain: 'Rainy Day',
      myMap: 'My Map', friends: 'Friends', world: 'World',
      openGoogleMaps: '🧭 Open in Google Maps', saveSpot: '❤️ Save', saved: '❤️ Saved',
      report: '⚠️ Report', block: '🚫 Block', delete: '🗑️ Delete', edit: '✏️ Edit',
      visited: 'Visited', countriesUnit: 'countries', posts: 'Posts', friendCode: 'Friend Code',
      searchPlaceholder: '🔍 Search',
      cacheClear: '🧹 Clear Cache', deleteAccount: '⚠️ Delete Account', logout: '🚪 Log Out',
      postScopePrompt: 'Select visibility:', close: 'Close'
    },
  },
};

const INITIAL_SPOTS: Spot[] = [
  {
    id: 'mock-1',
    userId: 'user-yuki',
    userName: 'Yuki_Traveler',
    title: 'マッターホルンの絶景朝焼け',
    description: '早朝のツェルマットから眺める黄金色の山頂。息をのむ美しさでした！展望台へは始発電車がおすすめ。',
    fileName: 'matterhorn.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop',
    fileType: 'image',
    lat: 45.9765,
    lon: 7.7491,
    countryCode: 'CH',
    cityName: 'Zermatt',
    category: 'view',
    scope: 'world',
    createdAt: '2026/08/14',
  },
  {
    id: 'mock-2',
    userId: 'user-ken',
    userName: 'Ken_Gourmet',
    title: '京都 鴨川沿いの濃厚抹茶パフェ',
    description: '川床を眺めながらいただく最高のご褒美スイーツ。デートにもぴったり。',
    fileName: 'matcha.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop',
    fileType: 'image',
    lat: 35.0037,
    lon: 135.7712,
    countryCode: 'JP',
    cityName: 'Kyoto',
    category: 'gourmet',
    scope: 'world',
    createdAt: '2026/08/10',
  },
  {
    id: 'mock-3',
    userId: 'user-lisa',
    userName: 'Lisa_Rain',
    title: '雨のルーヴル美術館とピラミッド',
    description: '雨の日は幻想的な光に包まれます。地下入口から入ると並ばずスムーズです！',
    fileName: 'louvre.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop',
    fileType: 'image',
    lat: 48.8606,
    lon: 2.3376,
    countryCode: 'FR',
    cityName: 'Paris',
    category: 'rain',
    scope: 'world',
    createdAt: '2026/08/01',
  },
  {
    id: 'mock-4',
    userId: 'user-ny',
    userName: 'Alex_NYC',
    title: 'タイムズスクエアの夜景',
    description: '夜景とネオンが輝く街。活気あふれる世界最高のストリート！',
    fileName: 'nyc.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
    fileType: 'image',
    lat: 40.758,
    lon: -73.9855,
    countryCode: 'US',
    cityName: 'New York',
    category: 'view',
    scope: 'world',
    createdAt: '2026/08/05',
  },
];

const EULA_FULL_TEXT = `【WorldSnap 利用規約 (EULA)】

第1条（適用および同意）
本規約は、当サービスを利用するすべてのユーザーに適用されます。利用規約およびプライバシーポリシーに同意いただけない場合、当サービス（特に投稿・共有機能）はご利用いただけません。

第2条（ユーザー生成コンテンツの安全方針と禁止事項）
当サービスは、すべてのユーザーが安全かつ快適に旅の思い出を記録・共有できる環境を重視しています。ユーザーは以下のコンテンツの投稿および行為を行ってはなりません。
・性的、暴力的、過度にグロテスク、差別的、または他者に不快感を与える画像・動画・テキストの投稿
・特定の個人・団体への嫌がらせ、名誉毀損、脅迫、いじめ、ストーカー行為
・法令または公序良俗に反する行為、犯罪行為を助長する行為
・第三者の著作権、肖像権、商標権その他の権利を侵害する行為（無断転載・立入禁止区域の撮影等）
・個人情報の無断開示、スパム目的の連投、不正アクセス

第3条（不適切なコンテンツへの対処・モデレーション）
・通報機能（Report）：ユーザーは不適切な写真・ピンを通報できます。通報されたコンテンツは24時間以内に運営モデレーターが確認し、削除等の措置を行います。
・ブロック機能（Block）：ユーザーは特定の他ユーザーをブロックでき、ブロックされたユーザーの投稿やピンは即座に非表示となります。
・利用停止・削除：本規約に違反したユーザーに対し、運営側は事前の通知なく投稿の削除、アカウントの凍結、または強制退会処分を実施します。

第4条（位置情報およびコンテンツの権利）
1. 投稿された写真・動画の著作権は、原則として投稿したユーザーに帰属します。
2. 写真に含まれる位置情報（Exif GPSデータ）の公開はユーザー自身の責任において管理するものとします。

第5条（免責事項）
位置情報・観光地情報等の正確性について運営側はいかなる保証も行いません。

第6条（アカウント削除・退会）
ユーザーは設定画面より、いつでもアカウントおよび投稿データを完全に削除（退会）することができます。`;

function convertDMSToDD(dms: number[], ref: string): number {
  if (!dms || dms.length < 3) return 0;
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') dd *= -1;
  return dd;
}

// ==========================================
// 2. MapLibre GL JS 多言語動的ベクターマップ (SSR完全回避)
// ==========================================
const VectorMapComponent = dynamic(
  () =>
    Promise.resolve(
      ({
        spots,
        center,
        zoom,
        mode,
        lang,
        onSelectSpot,
        onDoubleTap,
      }: {
        spots: Spot[];
        center: [number, number];
        zoom: number;
        mode: ViewCategory;
        lang: string;
        onSelectSpot: (s: Spot) => void;
        onDoubleTap: (lat: number, lon: number) => void;
      }) => {
        const mapContainerRef = useRef<HTMLDivElement>(null);
        const mapInstanceRef = useRef<any>(null);
        const markersRef = useRef<any[]>([]);

        // スタイルURL（OpenFreeMap多言語ベクタータイル / 雨の日はDark）
        const styleUrl =
          mode === 'rain'
            ? 'https://tiles.openfreemap.org/styles/dark'
            : 'https://tiles.openfreemap.org/styles/liberty';

        useEffect(() => {
          let isMounted = true;
          let map: any = null;

          const initMap = async () => {
            const maplibregl = (await import('maplibre-gl')).default;
            await import('maplibre-gl/dist/maplibre-gl.css' as any);

            if (!mapContainerRef.current || !isMounted) return;

            map = new maplibregl.Map({
              container: mapContainerRef.current,
              style: styleUrl,
              center: [center[1], center[0]],
              zoom: zoom,
              minZoom: 1.5,
              maxZoom: 18,
              attributionControl: false,
              doubleClickZoom: false,
            });

            // ダブルタップ（ダブルクリック）で周辺ズーム
            map.on('dblclick', (e: any) => {
              onDoubleTap(e.lngLat.lat, e.lngLat.lng);
            });

            // 言語切替レイヤーの動的適用
            const updateLanguageLabels = () => {
              try {
                const style = map.getStyle();
                if (!style || !style.layers) return;
                style.layers.forEach((layer: any) => {
                  if (layer.layout && layer.layout['text-field']) {
                    map.setLayoutProperty(layer.id, 'text-field', [
                      'coalesce',
                      ['get', `name:${lang}`],
                      ['get', `name_${lang}`],
                      ['get', 'name:latin'],
                      ['get', 'name'],
                    ]);
                  }
                });
              } catch (err) {
                console.warn('Language layer update:', err);
              }
            };

            map.on('load', () => {
              updateLanguageLabels();
            });

            map.on('styledata', () => {
              updateLanguageLabels();
            });

            mapInstanceRef.current = map;
          };

          initMap();

          return () => {
            isMounted = false;
            if (map) map.remove();
          };
        }, [styleUrl]);

        // 地図中心・ズーム移動
        useEffect(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo({
              center: [center[1], center[0]],
              zoom: zoom,
              duration: 1600,
              essential: true,
            });
          }
        }, [center, zoom]);

        // 言語変更時に即座に地名ラベルを再描画
        useEffect(() => {
          if (mapInstanceRef.current && mapInstanceRef.current.isStyleLoaded()) {
            const map = mapInstanceRef.current;
            const style = map.getStyle();
            if (style && style.layers) {
              style.layers.forEach((layer: any) => {
                if (layer.layout && layer.layout['text-field']) {
                  try {
                    map.setLayoutProperty(layer.id, 'text-field', [
                      'coalesce',
                      ['get', `name:${lang}`],
                      ['get', `name_${lang}`],
                      ['get', 'name:latin'],
                      ['get', 'name'],
                    ]);
                  } catch (e) {}
                }
              });
            }
          }
        }, [lang]);

        // 写真ピンの描画（ポラロイド風ピン・接続線なし）
        useEffect(() => {
          const map = mapInstanceRef.current;
          if (!map) return;

          const renderMarkers = async () => {
            const maplibregl = (await import('maplibre-gl')).default;
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];

            spots.forEach((spot) => {
              const rot = ((spot.lat * 10) % 8) - 4;
              const el = document.createElement('div');
              el.className = 'ws-polaroid-pin';
              el.style.width = '48px';
              el.style.height = '56px';
              el.style.background = '#ffffff';
              el.style.borderRadius = '6px';
              el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
              el.style.padding = '4px 4px 14px 4px';
              el.style.cursor = 'pointer';
              el.style.transform = `rotate(${rot}deg)`;
              el.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
              el.style.position = 'relative';

              el.innerHTML = `
                <div style="width: 100%; height: 38px; border-radius: 3px; overflow: hidden; background: #e2e8f0;">
                  <img src="${spot.fileUrl}" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <div style="
                  position: absolute;
                  bottom: -6px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 0;
                  height: 0;
                  border-left: 5px solid transparent;
                  border-right: 5px solid transparent;
                  border-top: 6px solid #ffffff;
                "></div>
              `;

              el.addEventListener('click', (e) => {
                e.stopPropagation();
                onSelectSpot(spot);
              });

              const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([spot.lon, spot.lat])
                .addTo(map);

              markersRef.current.push(marker);
            });
          };

          renderMarkers();
        }, [spots, onSelectSpot]);

        return <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#e2e8f0' }} />;
      }
    ),
  { ssr: false, loading: () => <div style={{ height: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>🗺️ ワールドマップを読み込み中...</div> }
);

// ==========================================
// 3. メインコンポーネント (WorldSnap)
// ==========================================
export default function WorldSnapApp() {
  // 初回3ステップオンボーディング
  const [isOnboarding, setIsOnboarding] = useState<boolean>(true);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [eulaChecked, setEulaChecked] = useState<boolean>(false);

  // ユーザー・国籍・言語状態
  const [userCountry, setUserCountry] = useState<string>('JP');
  const [userName, setUserName] = useState<string>('taku_snap');
  const [userBio, setUserBio] = useState<string>('世界中を旅して記録中 🌏✈️');
  const [friendCode] = useState<string>('WS-8823-X9');

  // UIナビゲーション & モード
  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [viewMode, setViewMode] = useState<ViewCategory>('view');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('world');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 地図状態
  const currentConfig = COUNTRIES[userCountry] || COUNTRIES.JP;
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.0, 0.0]);
  const [mapZoom, setMapZoom] = useState<number>(2);

  // 投稿データ & モーダル状態
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>([]);

  // UGC・設定・通報・アップロード
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isEulaModalOpen, setIsEulaModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('不適切な画像');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 位置未設定ファイル & 投稿公開範囲
  const [unlocatedFiles, setUnlocatedFiles] = useState<PendingFile[]>([]);
  const [currentPendingIndex, setCurrentPendingIndex] = useState<number>(0);
  const [manualTitle, setManualTitle] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [postTargetScope, setPostTargetScope] = useState<DisplayScope>('world');

  // マイページ内タブ
  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'saved' | 'friends'>('posts');
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; avatar: string }[]>([
    { id: 'user-yuki', name: 'Yuki_Traveler', avatar: '🌸' },
    { id: 'user-ken', name: 'Ken_Gourmet', avatar: '☕' },
  ]);
  const [inputFriendCode, setInputFriendCode] = useState('');

  const exportRef = useRef<HTMLDivElement>(null);
  const t = currentConfig.dict;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // フィルタリング処理
  const filteredSpots = spots.filter((s) => {
    if (blockedUsers.includes(s.userId)) return false;
    if (s.category !== viewMode) return false;
    if (displayScope === 'my') return s.userId === 'me';
    if (displayScope === 'friends') return s.userId === 'me' || friendsList.some((f) => f.id === s.userId);
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      return s.title.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw) || s.cityName.toLowerCase().includes(kw);
    }
    return true;
  });

  const visitedCountryCount = new Set(spots.filter((s) => s.userId === 'me').map((s) => s.countryCode)).size;

  // ダブルタップズーム (FlyTo)
  const handleMapDoubleTap = (lat: number, lon: number) => {
    setMapCenter([lat, lon]);
    setMapZoom((prev) => Math.min(prev + 3, 13));
  };

  // オンボーディング完了・選択国へFlyTo
  const handleCompleteOnboarding = () => {
    setIsOnboarding(false);
    const target = COUNTRIES[userCountry] || COUNTRIES.JP;
    setMapCenter([target.lat, target.lon]);
    setMapZoom(target.zoom);
    showToast(`🌍 ${target.name} へフォーカスしました！`);
  };

  // 写真・動画アップロード (EXIF解析)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const EXIFModule = await import('exif-js');
    const EXIF = EXIFModule.default || EXIFModule;

    const files = Array.from(e.target.files);
    const newSpots: Spot[] = [];
    const pendingList: PendingFile[] = [];

    for (const file of files) {
      const fileUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const fileId = 'spot-' + Math.random().toString(36).substring(2, 9);

      if (isVideo) {
        pendingList.push({ id: fileId, file, fileUrl, fileType: 'video', dateTime: new Date().toLocaleDateString() });
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
            newSpots.push({
              id: fileId,
              userId: 'me',
              userName,
              title: file.name.replace(/\.[^/.]+$/, ''),
              description: '旅の思い出',
              fileName: file.name,
              fileUrl,
              fileType: 'image',
              lat: latDecimal,
              lon: lonDecimal,
              countryCode: userCountry,
              cityName: currentConfig.name.split(' ')[0],
              category: viewMode,
              scope: postTargetScope,
              createdAt: new Date().toLocaleDateString(),
            });
          } else {
            pendingList.push({ id: fileId, file, fileUrl, fileType: 'image', dateTime: new Date().toLocaleDateString() });
          }
          resolve();
        });
      });
    }

    if (newSpots.length > 0) {
      setSpots((prev) => [...newSpots, ...prev]);
      showToast(`📸 ${newSpots.length}件のスポットを配置しました`);
    }
    if (pendingList.length > 0) {
      setUnlocatedFiles((prev) => [...prev, ...pendingList]);
      setCurrentPendingIndex(0);
    }
  };

  const handleAssignLocation = (latVal: number, lonVal: number, titleVal?: string) => {
    if (unlocatedFiles.length === 0) return;
    const current = unlocatedFiles[currentPendingIndex];
    if (!current) return;

    const newSpot: Spot = {
      id: current.id,
      userId: 'me',
      userName,
      title: titleVal || manualTitle || current.file.name,
      description: '旅の思い出（手動配置）',
      fileName: current.file.name,
      fileUrl: current.fileUrl,
      fileType: current.fileType,
      lat: latVal,
      lon: lonVal,
      countryCode: userCountry,
      cityName: titleVal || 'カスタム',
      category: viewMode,
      scope: postTargetScope,
      createdAt: current.dateTime || new Date().toLocaleDateString(),
    };

    setSpots((prev) => [newSpot, ...prev]);
    const rem = unlocatedFiles.filter((_, idx) => idx !== currentPendingIndex);
    setUnlocatedFiles(rem);
    setManualTitle('');
    setManualLat('');
    setManualLon('');
    showToast('📍 スポットを配置しました');
  };

  // マップ画像保存 (PNG)
  const handleExportMap = async () => {
    if (!exportRef.current) return;
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const canvas = await html2canvas(exportRef.current, { useCORS: true, scale: 2 });
      const img = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = img;
      a.download = `WorldSnap-Map-${userCountry}.png`;
      a.click();
      showToast('💾 マップを保存しました');
    } catch (e) {
      showToast('❌ 保存に失敗しました');
    }
  };

  const toggleSaveSpot = (spotId: string) => {
    if (savedSpotIds.includes(spotId)) {
      setSavedSpotIds((prev) => prev.filter((id) => id !== spotId));
      showToast('行きたい保存を解除しました');
    } else {
      setSavedSpotIds((prev) => [...prev, spotId]);
      showToast('💛 行きたいリストに保存しました！');
    }
  };

  const handleBlockUser = (userId: string) => {
    if (confirm('このユーザーをブロックしますか？\n相手の投稿がすべて非表示になります。')) {
      setBlockedUsers((prev) => [...prev, userId]);
      setSelectedSpot(null);
      showToast('🚫 ユーザーをブロックしました');
    }
  };

  const handleDeleteSpot = (spotId: string) => {
    if (confirm('このピンを削除しますか？')) {
      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      setSelectedSpot(null);
      showToast('🗑️ ピンを削除しました');
    }
  };

  const themeAccent = viewMode === 'rain' ? '#38bdf8' : viewMode === 'gourmet' ? '#ea580c' : '#0284c7';

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ── トースト通知 ── */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.94)', color: '#fff', padding: '10px 20px', borderRadius: '30px', zIndex: 99999, fontSize: '13px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }}>
          {toastMessage}
        </div>
      )}

      {/* ==================================================== */}
      {/* 0. 初回3ステップオンボーディング (国籍 → プロフィール → EULA全文) */}
      {/* ==================================================== */}
      {isOnboarding && (
        <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #070d1e 0%, #0f172a 100%)', color: '#fff', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '440px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '4px' }}>🗺️</div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0284c7' }}>WorldSnap</h1>
            <p style={{ margin: '4px 0 16px 0', fontSize: '13px', color: '#64748b' }}>世界中を旅して、思い出をつなごう</p>

            {/* プログレスバー */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <span style={{ width: '28px', height: '6px', borderRadius: '3px', background: onboardingStep >= 1 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
              <span style={{ width: '28px', height: '6px', borderRadius: '3px', background: onboardingStep >= 2 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
              <span style={{ width: '28px', height: '6px', borderRadius: '3px', background: onboardingStep === 3 ? '#0284c7' : '#e2e8f0', transition: '0.3s' }}></span>
            </div>

            {/* Step 1: 国籍選択 */}
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
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{c.flag} {c.name}</span>
                      {userCountry === code && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setOnboardingStep(2)} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                  {t.next}
                </button>
              </div>
            )}

            {/* Step 2: プロフィール作成 (Step 1の選択言語で表示) */}
            {onboardingStep === 2 && (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 14px 0' }}>{t.step2Title}</h3>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#0284c7', color: '#fff', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(2,132,199,0.3)' }}>
                    👤
                  </div>
                </div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>ユーザー名 (表示名)</label>
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

            {/* Step 3: 利用規約 (EULA) 全文確認 & 同意 */}
            {onboardingStep === 3 && (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{t.step3Title}</h3>
                <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '14px' }}>
                  {EULA_FULL_TEXT}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#0284c7', marginBottom: '20px' }}>
                  <input type="checkbox" checked={eulaChecked} onChange={(e) => setEulaChecked(e.target.checked)} />
                  <span>{t.eulaAgree}</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setOnboardingStep(2)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                    {t.back}
                  </button>
                  <button
                    disabled={!eulaChecked}
                    onClick={handleCompleteOnboarding}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: eulaChecked ? '#0284c7' : '#94a3b8',
                      color: '#fff',
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: eulaChecked ? 'pointer' : 'not-allowed',
                      boxShadow: eulaChecked ? '0 6px 20px rgba(2,132,199,0.35)' : 'none',
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

      {/* ── ヘッダー ── */}
      <header style={{ height: '52px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
            ☰
          </button>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: themeAccent, letterSpacing: '-0.5px' }}>WorldSnap</h1>
          <select
            value={userCountry}
            onChange={(e) => setUserCountry(e.target.value)}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {Object.entries(COUNTRIES).map(([code, c]) => (
              <option key={code} value={code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={() => setCurrentTab('profile')} style={{ width: '32px', height: '32px', borderRadius: '50%', background: themeAccent, color: '#fff', border: 'none', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          👤
        </button>
      </header>

      {/* ── メインコンテナ ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* ==================================================== */}
        {/* TAB 1: 🗺️ メインマップ (70% マップ + 30% 操作パネル) */}
        {/* ==================================================== */}
        <div style={{ display: currentTab === 'map' ? 'flex' : 'none', flexDirection: 'column', height: '100%', position: 'relative' }}>
          
          {/* マップ上部の3大モード切替 & 表示スコープ バー */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
            {/* View / グルメ / 雨の日 */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)', padding: '4px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.15)', pointerEvents: 'auto' }}>
              {(['view', 'gourmet', 'rain'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '24px',
                    border: 'none',
                    background: viewMode === m ? themeAccent : 'transparent',
                    color: viewMode === m ? '#ffffff' : '#64748b',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: viewMode === m ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  {m === 'view' ? `🏔️ ${t.view}` : m === 'gourmet' ? `🍔 ${t.gourmet}` : `🌧️ ${t.rain}`}
                </button>
              ))}
            </div>

            {/* ワールド / フレンド / マイマップ */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)', padding: '4px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.15)', pointerEvents: 'auto' }}>
              <select
                value={displayScope}
                onChange={(e) => setDisplayScope(e.target.value as DisplayScope)}
                style={{ background: 'transparent', border: 'none', color: '#0f172a', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', padding: '6px 8px' }}
              >
                <option value="world">🌎 {t.world}</option>
                <option value="friends">👥 {t.friends}</option>
                <option value="my">📍 {t.myMap}</option>
              </select>
            </div>
          </div>

          {/* 70% 専有の多言語ベクターマップ本体 */}
          <div ref={exportRef} style={{ flex: '7 1 0%', width: '100%', position: 'relative' }}>
            <VectorMapComponent
              spots={filteredSpots}
              center={mapCenter}
              zoom={mapZoom}
              mode={viewMode}
              lang={currentConfig.lang}
              onSelectSpot={setSelectedSpot}
              onDoubleTap={handleMapDoubleTap}
            />

            {/* 現在地 & マップ保存ボタン */}
            <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 400, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      setMapCenter([pos.coords.latitude, pos.coords.longitude]);
                      setMapZoom(12);
                      showToast('📍 現在地へ移動しました');
                    });
                  }
                }}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.2)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🎯
              </button>
              <button
                onClick={handleExportMap}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0f172a', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.2)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                💾
              </button>
            </div>
          </div>

          {/* 30% 専有のクイック操作 & スポットサマリーパネル */}
          <div style={{ flex: '3 1 0%', background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>📍 {currentConfig.flag} {currentConfig.name}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>表示中: {filteredSpots.length}件のスポット</div>
              </div>

              {/* 投稿前の反映先スコープ選択 & アップロードボタン */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={postTargetScope}
                  onChange={(e) => setPostTargetScope(e.target.value as DisplayScope)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', fontWeight: 'bold' }}
                >
                  <option value="world">🌐 ワールド反映</option>
                  <option value="friends">👥 フレンド限定</option>
                  <option value="my">🔒 マイマップ限定</option>
                </select>

                <label
                  style={{
                    padding: '10px 18px',
                    background: themeAccent,
                    color: '#fff',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📷＋</span>
                  <span>{t.addPhoto}</span>
                  <input type="file" accept="image/*,video/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* 控えめな広告バナースペース */}
            <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
              ✈️ Booking.com / Klook 提携：近くのホテルやツアーをワンタップ予約
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* TAB 2: 🏠 フィード画面 */}
        {/* ==================================================== */}
        <div style={{ display: currentTab === 'home' ? 'flex' : 'none', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '14px 14px 80px 14px', gap: '12px' }}>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px' }}
          />

          {spots.map((spot) => (
            <div
              key={spot.id}
              onClick={() => setSelectedSpot(spot)}
              style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', cursor: 'pointer' }}
            >
              <div style={{ height: '200px', background: '#000' }}>
                <img src={spot.fileUrl} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: themeAccent }}>📍 {COUNTRIES[spot.countryCode]?.flag} {spot.title}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{spot.createdAt}</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{spot.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ==================================================== */}
        {/* TAB 3: 👤 マイページ */}
        {/* ==================================================== */}
        <div style={{ display: currentTab === 'profile' ? 'flex' : 'none', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '14px 14px 80px 14px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: themeAccent, color: '#fff', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  👤
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px' }}>{userName}</h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{userBio}</p>
                </div>
              </div>
              <button onClick={() => setIsEditProfileOpen(true)} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                編集
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '16px 0', textAlign: 'center' }}>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{spots.filter((s) => s.userId === 'me').length}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>📸 {t.posts}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{visitedCountryCount}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>🗺️ {t.visited}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{friendsList.length}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>👥 {t.friends}</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {(['posts', 'saved', 'friends'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setProfileSubTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  border: 'none',
                  background: profileSubTab === tab ? themeAccent : '#ffffff',
                  color: profileSubTab === tab ? '#fff' : '#64748b',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {tab === 'posts' ? `📸 ${t.posts}` : tab === 'saved' ? `💛 ${t.saved}` : `👥 ${t.friends}`}
              </button>
            ))}
          </div>

          {profileSubTab === 'posts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '8px' }}>
              {spots
                .filter((s) => s.userId === 'me')
                .map((s) => (
                  <div key={s.id} onClick={() => setSelectedSpot(s)} style={{ height: '110px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000' }}>
                    <img src={s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
            </div>
          )}

          {profileSubTab === 'saved' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '8px' }}>
              {spots
                .filter((s) => savedSpotIds.includes(s.id))
                .map((s) => (
                  <div key={s.id} onClick={() => setSelectedSpot(s)} style={{ height: '110px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000' }}>
                    <img src={s.fileUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
            </div>
          )}

          {profileSubTab === 'friends' && (
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="友達コードを入力"
                  value={inputFriendCode}
                  onChange={(e) => setInputFriendCode(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px' }}
                />
                <button
                  onClick={() => {
                    if (!inputFriendCode) return;
                    setFriendsList((prev) => [...prev, { id: 'user-' + Date.now(), name: 'Traveler_Buddy', avatar: '✈️' }]);
                    setInputFriendCode('');
                    showToast('👥 友達を追加しました！');
                  }}
                  style={{ padding: '8px 14px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  追加
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {friendsList.map((f) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{f.avatar}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{f.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentTab('map');
                        setDisplayScope('friends');
                      }}
                      style={{ padding: '4px 8px', background: '#f1f5f9', color: themeAccent, border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      マップ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. 投稿詳細画面 (マップを隠して全画面スライド遷移) */}
      {/* ==================================================== */}
      {selectedSpot && (
        <div style={{ position: 'fixed', inset: 0, background: '#ffffff', zIndex: 2000, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ height: '52px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: '#ffffff', zIndex: 10 }}>
            <button onClick={() => setSelectedSpot(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
              ← {t.back}
            </button>
            <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', background: themeAccent, color: '#fff' }}>
              {selectedSpot.category === 'view' ? '🏔️ VIEW' : selectedSpot.category === 'gourmet' ? '🍔 GOURMET' : '🌧️ RAIN'}
            </span>
          </div>

          <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div onClick={() => setIsLightboxOpen(true)} style={{ width: '100%', height: '300px', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px', cursor: 'zoom-in' }}>
              {selectedSpot.fileType === 'image' ? (
                <img src={selectedSpot.fileUrl} alt={selectedSpot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video src={selectedSpot.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold' }}>{selectedSpot.title}</h2>
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

            <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '14px 0 20px 0' }}>{selectedSpot.description}</p>

            {/* Googleマップ連携 (CTAボタン) */}
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
                padding: '14px',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '14px',
                borderRadius: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                marginBottom: '20px',
              }}
            >
              {t.openGoogleMaps}
            </a>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: themeAccent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  👤
                </div>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{selectedSpot.userName}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedSpot.userId === 'me' ? (
                  <button onClick={() => handleDeleteSpot(selectedSpot.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {t.delete}
                  </button>
                ) : (
                  <>
                    <button onClick={() => setIsReportModalOpen(true)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>
                      {t.report}
                    </button>
                    <button onClick={() => handleBlockUser(selectedSpot.userId)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>
                      {t.block}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. フルスクリーン Lightbox */}
      {/* ==================================================== */}
      {isLightboxOpen && selectedSpot && (
        <div onClick={() => setIsLightboxOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <img src={selectedSpot.fileUrl} alt={selectedSpot.title} style={{ maxWidth: '100%', maxHeight: '90%', objectFit: 'contain' }} />
          <button onClick={() => setIsLightboxOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. 位置未設定ファイル補完ダイアログ */}
      {/* ==================================================== */}
      {unlocatedFiles.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#f59e0b' }}>⚠️ 位置情報なし ({currentPendingIndex + 1}/{unlocatedFiles.length})</h3>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>主要都市を選択するか、直接座標を入力して配置してください。</p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button onClick={() => handleAssignLocation(35.6812, 139.7671, '東京')} style={{ padding: '6px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                📍 東京
              </button>
              <button onClick={() => handleAssignLocation(35.0116, 135.7681, '京都')} style={{ padding: '6px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                📍 京都
              </button>
              <button onClick={() => handleAssignLocation(47.3769, 8.5417, 'チューリッヒ')} style={{ padding: '6px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                📍 チューリッヒ
              </button>
              <button onClick={() => handleAssignLocation(40.7128, -74.006, 'ニューヨーク')} style={{ padding: '6px 10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                📍 NY
              </button>
            </div>

            <input
              type="text"
              placeholder="スポット名"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <input
                type="number"
                step="any"
                placeholder="緯度 (例: 35.68)"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
              <input
                type="number"
                step="any"
                placeholder="経度 (例: 139.76)"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setUnlocatedFiles((prev) => prev.filter((_, i) => i !== currentPendingIndex))}
                style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                スキップ
              </button>
              <button
                onClick={() => handleAssignLocation(parseFloat(manualLat) || currentConfig.lat, parseFloat(manualLon) || currentConfig.lon, manualTitle)}
                style={{ flex: 1, padding: '8px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                配置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. 設定画面 (Settings モーダル) */}
      {/* ==================================================== */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '20px', padding: '20px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px' }}>⚙️ 設定</h2>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '16px', color: '#94a3b8', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>▼ アカウント & 言語</div>
              <div onClick={() => setIsEditProfileOpen(true)} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '6px', fontSize: '13px' }}>
                <span>👤 プロフィール編集</span>
                <span style={{ color: '#94a3b8' }}>&gt;</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>▼ 安全対策 & キャッシュ</div>
              <div
                onClick={() => {
                  showToast('✨ キャッシュをクリアしました');
                }}
                style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '6px', fontSize: '13px' }}
              >
                <span>{t.cacheClear}</span>
                <span style={{ color: themeAccent, fontWeight: 'bold' }}>実行</span>
              </div>
              <div
                onClick={() => {
                  if (blockedUsers.length === 0) showToast('ブロック中のユーザーはいません');
                  else {
                    setBlockedUsers([]);
                    showToast('ブロックを解除しました');
                  }
                }}
                style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '6px', fontSize: '13px' }}
              >
                <span>🚫 ブロック管理</span>
                <span style={{ color: '#94a3b8' }}>{blockedUsers.length}人 &gt;</span>
              </div>
              <div
                onClick={() => setIsEulaModalOpen(true)}
                style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px' }}
              >
                <span>📜 {t.termsTitle}</span>
                <span style={{ color: themeAccent, fontWeight: 'bold' }}>開く</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  showToast('🚪 ログアウトしました');
                  setIsSettingsOpen(false);
                }}
                style={{ width: '100%', padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                {t.logout}
              </button>
              <button
                onClick={() => {
                  if (prompt('退会する場合は「削除する」と入力してください:') === '削除する') {
                    setSpots([]);
                    showToast('⚠️ アカウントを削除しました');
                    setIsSettingsOpen(false);
                    setIsOnboarding(true);
                    setOnboardingStep(1);
                  }
                }}
                style={{ width: '100%', padding: '10px', background: '#fee2e2', border: 'none', borderRadius: '10px', color: '#dc2626', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                {t.deleteAccount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 8. プロフィール編集モーダル */}
      {/* ==================================================== */}
      {isEditProfileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>👤 プロフィール編集</h3>
            <label style={{ fontSize: '11px', color: '#64748b' }}>名前</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{ width: '100%', padding: '8px', margin: '4px 0 10px 0', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />
            <label style={{ fontSize: '11px', color: '#64748b' }}>紹介文</label>
            <textarea
              value={userBio}
              onChange={(e) => setUserBio(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '8px', margin: '4px 0 14px 0', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setIsEditProfileOpen(false)} style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                キャンセル
              </button>
              <button
                onClick={() => {
                  setIsEditProfileOpen(false);
                  showToast('✨ 更新しました');
                }}
                style={{ flex: 1, padding: '8px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 9. 利用規約 (EULA) 確認モーダル */}
      {/* ==================================================== */}
      {isEulaModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', maxWidth: '480px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>{t.termsTitle}</h3>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {EULA_FULL_TEXT}
            </div>
            <button
              onClick={() => setIsEulaModalOpen(false)}
              style={{ width: '100%', marginTop: '16px', padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 10. 通報モーダル (UGC安全対策) */}
      {/* ==================================================== */}
      {isReportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>⚠️ 投稿の通報</h3>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '14px', fontSize: '12px' }}
            >
              <option value="不適切な画像">不適切な画像・ポルノ</option>
              <option value="スパム・広告">スパム・宣伝行為</option>
              <option value="誹謗中傷">誹謗中傷・ハラスメント</option>
              <option value="著作権侵害">無断転載・著作権侵害</option>
            </select>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setIsReportModalOpen(false)} style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                キャンセル
              </button>
              <button
                onClick={() => {
                  setIsReportModalOpen(false);
                  showToast('✅ 通報を受け付けました');
                }}
                style={{ flex: 1, padding: '8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                送信
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 11. ボトムナビゲーション (固定) */}
      {/* ==================================================== */}
      <nav
        style={{
          height: '60px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexShrink: 0,
          zIndex: 500,
        }}
      >
        <button
          onClick={() => setCurrentTab('home')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: currentTab === 'home' ? themeAccent : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '18px' }}>🏠</span>
          <span style={{ fontSize: '10px', fontWeight: currentTab === 'home' ? 'bold' : 'normal' }}>{t.home}</span>
        </button>

        <button
          onClick={() => {
            if (currentTab === 'map') {
              const target = COUNTRIES[userCountry];
              if (target) {
                setMapCenter([target.lat, target.lon]);
                setMapZoom(target.zoom);
              }
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
          }}
        >
          <span style={{ fontSize: '18px' }}>🗺️</span>
          <span style={{ fontSize: '10px', fontWeight: currentTab === 'map' ? 'bold' : 'normal' }}>{t.map}</span>
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
          }}
        >
          <span style={{ fontSize: '18px' }}>👤</span>
          <span style={{ fontSize: '10px', fontWeight: currentTab === 'profile' ? 'bold' : 'normal' }}>{t.profile}</span>
        </button>
      </nav>
    </div>
  );
}
