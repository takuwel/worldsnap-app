'use client';

import React, { useState, useRef } from 'react';

// DMS形式を十進法(DD)座標に変換する関数
function convertDMSToDD(dms: number[], ref: string): number {
  if (!dms || dms.length < 3) return 0;
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }
  return dd;
}

// 簡易的な座標→国判別関数
function getCountryFromCoords(lat: number, lon: number): string {
  if (lat >= 45.8 && lat <= 47.8 && lon >= 5.9 && lon <= 10.5) return 'Switzerland';
  if (lat >= 24.0 && lat <= 46.0 && lon >= 122.0 && lon <= 154.0) return 'Japan';
  if (lat >= 35.0 && lat <= 71.0 && lon >= -10.0 && lon <= 40.0) return 'Europe';
  if (lat >= 15.0 && lat <= 72.0 && lon >= -170.0 && lon <= -50.0) return 'North America';
  return 'Other';
}

// クイック選択プリセット
const POPULAR_LOCATIONS = [
  { name: '日本 - 東京 (Tokyo)', lat: 35.6812, lon: 139.7671, country: 'Japan' },
  { name: '日本 - 京都 (Kyoto)', lat: 35.0116, lon: 135.7681, country: 'Japan' },
  { name: '日本 - 大阪 (Osaka)', lat: 34.6937, lon: 135.5023, country: 'Japan' },
  { name: 'スイス - チューリッヒ (Zurich)', lat: 47.3769, lon: 8.5417, country: 'Switzerland' },
  { name: 'スイス - ジュネーブ (Geneva)', lat: 46.2044, lon: 6.1432, country: 'Switzerland' },
  { name: 'スイス - ツェルマット (Zermatt)', lat: 45.9765, lon: 7.7491, country: 'Switzerland' },
];

interface Spot {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  lat: number;
  lon: number;
  country: string;
  locationName?: string;
  dateTime?: string;
}

interface PendingFile {
  id: string;
  file: File;
  fileUrl: string;
  fileType: 'image' | 'video';
  dateTime?: string;
}

export default function TravelMapPage() {
  // ユーザー設定ステート
  const [username, setUsername] = useState('takuwel');
  const [nationality, setNationality] = useState('スイス 🇨🇭');

  // アプリUI状態
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRainMode, setIsRainMode] = useState(false); // 雨の日モード
  const [currentTab, setCurrentTab] = useState<'home' | 'map' | 'gallery'>('home');

  // メディア・マップデータ
  const [spots, setSpots] = useState<Spot[]>([]);
  const [unlocatedFiles, setUnlocatedFiles] = useState<PendingFile[]>([]);
  const [currentPendingIndex, setCurrentPendingIndex] = useState<number>(0);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  // 手動入力フォーム
  const [manualName, setManualName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  const exportRef = useRef<HTMLDivElement>(null);
  const visitedCountries = new Set(spots.map((s) => s.country));

  // ファイルアップロードハンドラ（SSRビルドエラー回避の動的インポート）
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
      const fileId = Math.random().toString(36).substring(2, 9);

      if (isVideo) {
        pendingList.push({
          id: fileId,
          file,
          fileUrl,
          fileType: 'video',
          dateTime: new Date(file.lastModified).toLocaleString('ja-JP'),
        });
        continue;
      }

      await new Promise<void>((resolve) => {
        EXIF.getData(file as any, function (this: any) {
          const lat = EXIF.getTag(this, 'GPSLatitude');
          const lon = EXIF.getTag(this, 'GPSLongitude');
          const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
          const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');
          const dateTime = EXIF.getTag(this, 'DateTimeOriginal');

          if (lat && lon) {
            const latDecimal = convertDMSToDD(lat, latRef);
            const lonDecimal = convertDMSToDD(lon, lonRef);
            const detectedCountry = getCountryFromCoords(latDecimal, lonDecimal);

            newSpots.push({
              id: fileId,
              fileName: file.name,
              fileUrl,
              fileType: 'image',
              lat: latDecimal,
              lon: lonDecimal,
              country: detectedCountry,
              locationName: `スポット (${latDecimal.toFixed(2)}, ${lonDecimal.toFixed(2)})`,
              dateTime: dateTime || new Date(file.lastModified).toLocaleString('ja-JP'),
            });
          } else {
            pendingList.push({
              id: fileId,
              file,
              fileUrl,
              fileType: 'image',
              dateTime: dateTime || new Date(file.lastModified).toLocaleString('ja-JP'),
            });
          }
          resolve();
        });
      });
    }

    if (newSpots.length > 0) setSpots((prev) => [...prev, ...newSpots]);
    if (pendingList.length > 0) {
      setUnlocatedFiles((prev) => [...prev, ...pendingList]);
      setCurrentPendingIndex(0);
    }
  };

  // 位置情報割り当て
  const handleAssignLocation = (latVal: number, lonVal: number, nameVal?: string, countryPreset?: string) => {
    if (unlocatedFiles.length === 0) return;
    const currentFile = unlocatedFiles[currentPendingIndex];
    if (!currentFile) return;

    const country = countryPreset || getCountryFromCoords(latVal, lonVal);

    const newSpot: Spot = {
      id: currentFile.id,
      fileName: currentFile.file.name,
      fileUrl: currentFile.fileUrl,
      fileType: currentFile.fileType,
      lat: latVal,
      lon: lonVal,
      country,
      locationName: nameVal || manualName || `手動設定 (${latVal.toFixed(2)}, ${lonVal.toFixed(2)})`,
      dateTime: currentFile.dateTime,
    };

    setSpots((prev) => [...prev, newSpot]);
    const remaining = unlocatedFiles.filter((_, idx) => idx !== currentPendingIndex);
    setUnlocatedFiles(remaining);

    setManualName('');
    setManualLat('');
    setManualLon('');
    if (remaining.length > 0) setCurrentPendingIndex((prev) => (prev >= remaining.length ? 0 : prev));
  };

  // 画像としてエクスポート
  const handleExportMap = async () => {
    if (!exportRef.current) return;
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const canvas = await html2canvas(exportRef.current, { useCORS: true, scale: 2 });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'worldsnap-map.png';
      link.click();
    } catch (err) {
      console.error('書き出しエラー:', err);
    }
  };

  const currentPending = unlocatedFiles[currentPendingIndex];

  // テーマ別のカラー定義
  const theme = isRainMode
    ? {
        // 雨の日モード（ダーク＆しっとりしたネイビー）
        bg: '#0a0f1d',
        cardBg: '#131c31',
        textMain: '#e2e8f0',
        textSub: '#7d8da6',
        mapOcean: '#0e172a',
        mapLand: '#1e293b',
        mapLandVisited: '#334155',
        mapStroke: '#1e293b',
        highlightBorder: '#38bdf8',
        cardShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      }
    : {
        // 通常モード（画像通りの明るく洗練されたライトブルー）
        bg: '#f1f5f9',
        cardBg: '#ffffff',
        textMain: '#0f172a',
        textSub: '#64748b',
        mapOcean: '#e2eef9',
        mapLand: '#ffffff',
        mapLandVisited: '#e0f2fe',
        mapStroke: '#cbd5e1',
        highlightBorder: '#0284c7',
        cardShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
      };

  return (
    <div style={{ background: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', transition: 'all 0.3s ease' }}>
      {/* ── 1. ナビゲーションバー & ヘッダー ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: theme.cardBg,
          borderBottom: `1px solid ${isRainMode ? '#1e293b' : '#e2e8f0'}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: theme.cardShadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsMenuOpen(true)}
            style={{ background: 'transparent', border: 'none', color: theme.textMain, fontSize: '22px', cursor: 'pointer', padding: '4px' }}
          >
            ☰
          </button>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0284c7', letterSpacing: '-0.5px' }}>
            WorldSnap
          </h1>
        </div>

        <nav style={{ display: 'flex', gap: '8px' }}>
          {(['home', 'map', 'gallery'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: currentTab === tab ? '#0284c7' : isRainMode ? '#1e293b' : '#f1f5f9',
                color: currentTab === tab ? '#ffffff' : theme.textSub,
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: '0.2s ease',
              }}
            >
              {tab === 'home' ? '🏠 ホーム' : tab === 'map' ? '🗺️ マップ' : '🖼️ ギャラリー'}
            </button>
          ))}
        </nav>
      </header>

      {/* ── 2. ドロワーメニュー（左スライドイン） ── */}
      {isMenuOpen && (
        <div onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex' }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '280px',
              background: theme.cardBg,
              height: '100%',
              padding: '24px 20px',
              boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#0284c7' }}>メニュー</h2>
              <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: theme.textMain, fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <hr style={{ borderColor: isRainMode ? '#1e293b' : '#f1f5f9', margin: 0 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => { setCurrentTab('home'); setIsMenuOpen(false); }} style={{ textAlign: 'left', padding: '12px', background: 'transparent', color: theme.textMain, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>🏠 ホーム</button>
              <button onClick={() => { setCurrentTab('map'); setIsMenuOpen(false); }} style={{ textAlign: 'left', padding: '12px', background: 'transparent', color: theme.textMain, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>🗺️ ワールドマップ</button>
              <button onClick={() => { setCurrentTab('gallery'); setIsMenuOpen(false); }} style={{ textAlign: 'left', padding: '12px', background: 'transparent', color: theme.textMain, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>🖼️ ギャラリー</button>
            </div>

            <hr style={{ borderColor: isRainMode ? '#1e293b' : '#f1f5f9', margin: 0 }} />

            {/* 雨の日モードトグル */}
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: theme.textSub }}>表示モード設定</p>
              <button
                onClick={() => setIsRainMode(!isRainMode)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isRainMode ? '#0284c7' : '#e2e8f0',
                  color: isRainMode ? '#ffffff' : '#0f172a',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isRainMode ? '🌧️ 雨の日モード (ON)' : '☀️ 通常モード (OFF)'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
        {/* ── 3. ユーザー情報バナー ── */}
        <section
          style={{
            marginBottom: '20px',
            padding: '16px 24px',
            background: theme.cardBg,
            borderRadius: '16px',
            boxShadow: theme.cardShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#fff', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
              👤
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${theme.textSub}`, color: theme.textMain, fontSize: '18px', fontWeight: 'bold', width: '120px' }}
                />
                <span style={{ color: theme.textSub, fontSize: '14px' }}>さんのマップ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', color: theme.textSub }}>国籍:</span>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  style={{ background: theme.bg, color: theme.textMain, border: `1px solid ${theme.mapStroke}`, borderRadius: '6px', padding: '2px 8px', fontSize: '13px', cursor: 'pointer' }}
                >
                  <option value="スイス 🇨🇭">スイス 🇨🇭</option>
                  <option value="日本 🇯🇵">日本 🇯🇵</option>
                  <option value="アメリカ 🇺🇸">アメリカ 🇺🇸</option>
                  <option value="フランス 🇫🇷">フランス 🇫🇷</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: theme.textSub }}>訪問国数</span>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: 'bold', color: '#0284c7' }}>
              {visitedCountries.size} <span style={{ fontSize: '14px', color: theme.textSub }}>カ国</span>
            </p>
          </div>
        </section>

        {/* ── 4. アップロードエリア ── */}
        <section style={{ marginBottom: '24px', padding: '20px', background: theme.cardBg, borderRadius: '16px', boxShadow: theme.cardShadow }}>
          <h2 style={{ marginTop: 0, fontSize: '16px' }}>写真・動画を選択</h2>
          <p style={{ color: theme.textSub, fontSize: '13px' }}>
            GPS情報がない場合は、スイスや日本などの都市を後から手動設定できます。
          </p>
          <input type="file" accept="image/*,video/*" multiple onChange={handlePhotoUpload} style={{ padding: '8px 0', cursor: 'pointer', color: theme.textMain }} />
        </section>

        {/* ── 5. 位置情報未設定時の補完ダイアログ ── */}
        {unlocatedFiles.length > 0 && currentPending && (
          <section style={{ marginBottom: '24px', padding: '20px', background: isRainMode ? '#1e1b4b' : '#fef3c7', borderRadius: '16px', border: '1px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: isRainMode ? '#a5b4fc' : '#b45309', fontSize: '15px' }}>
                ⚠️ 位置情報未設定ファイル ({currentPendingIndex + 1} / {unlocatedFiles.length})
              </h3>
              <button onClick={() => setUnlocatedFiles((prev) => prev.filter((_, idx) => idx !== currentPendingIndex))} style={{ padding: '4px 12px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>スキップ</button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: '140px', height: '100px', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                {currentPending.fileType === 'image' ? (
                  <img src={currentPending.fileUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <video src={currentPending.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: '280px' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>{currentPending.file.name}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => handleAssignLocation(loc.lat, loc.lon, loc.name, loc.country)}
                      style={{ padding: '6px 12px', background: loc.country === 'Switzerland' ? '#dc2626' : '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      📍 {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 6. ワールドマップ（画像の明るい雰囲気を再現） ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>🗺️ ワールドマップビュー</h2>
          {spots.length > 0 && (
            <button onClick={handleExportMap} style={{ padding: '8px 16px', background: '#0284c7', color: '#ffffff', fontWeight: 'bold', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}>
              マップ保存
            </button>
          )}
        </div>

        <div
          ref={exportRef}
          style={{
            background: theme.mapOcean,
            borderRadius: '24px',
            padding: '20px',
            border: `1px solid ${theme.mapStroke}`,
            position: 'relative',
            boxShadow: theme.cardShadow,
            overflow: 'hidden',
            transition: 'background 0.3s ease',
          }}
        >
          <svg viewBox="0 0 1000 500" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* 背景のグリッド模様 */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isRainMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="1000" height="500" fill="url(#grid)" />

            {/* 大陸（画像に似せた柔らかいシルエット） */}
            {/* 北米 */}
            <path d="M 80 70 Q 220 50 280 120 T 150 220 Z" fill={visitedCountries.has('North America') ? theme.mapLandVisited : theme.mapLand} stroke={theme.mapStroke} strokeWidth="1.5" />
            {/* 南米 */}
            <path d="M 220 240 Q 300 250 280 380 T 210 320 Z" fill={visitedCountries.has('South America') ? theme.mapLandVisited : theme.mapLand} stroke={theme.mapStroke} strokeWidth="1.5" />
            {/* ヨーロッパ */}
            <path d="M 460 90 Q 560 80 570 170 T 450 160 Z" fill={visitedCountries.has('Europe') ? theme.mapLandVisited : theme.mapLand} stroke={theme.mapStroke} strokeWidth="1.5" />
            {/* スイス (Switzerland) 強調表示 */}
            <path d="M 495 140 L 515 140 L 512 152 L 493 152 Z" fill={visitedCountries.has('Switzerland') ? '#ef4444' : theme.mapLand} stroke="#f87171" strokeWidth="2" />
            {/* アフリカ */}
            <path d="M 450 190 Q 570 180 540 340 T 460 280 Z" fill={visitedCountries.has('Africa') ? theme.mapLandVisited : theme.mapLand} stroke={theme.mapStroke} strokeWidth="1.5" />
            {/* アジア */}
            <path d="M 580 80 Q 860 70 820 250 T 600 200 Z" fill={visitedCountries.has('Asia') ? theme.mapLandVisited : theme.mapLand} stroke={theme.mapStroke} strokeWidth="1.5" />
            {/* 日本 (Japan) 強調表示 */}
            <path d="M 850 140 Q 865 130 875 160 L 865 180 Q 855 160 850 140 Z" fill={visitedCountries.has('Japan') ? '#22c55e' : theme.mapLand} stroke="#4ade80" strokeWidth="2" />
            {/* オセアニア */}
            <path d="M 770 290 Q 880 280 860 380 T 760 360 Z" fill={visitedCountries.has('Oceania') ? theme.mapLandVisited : theme.mapLand} stroke={theme.mapStroke} strokeWidth="1.5" />

            {/* スポット同士を結ぶ曲線の描画（画像のようなアーチライン） */}
            {spots.map((spot, idx) => {
              if (idx === 0) return null;
              const prevSpot = spots[idx - 1];
              const x1 = ((prevSpot.lon + 180) / 360) * 1000;
              const y1 = ((90 - prevSpot.lat) / 180) * 500;
              const x2 = ((spot.lon + 180) / 360) * 1000;
              const y2 = ((90 - spot.lat) / 180) * 500;
              const cx = (x1 + x2) / 2;
              const cy = Math.min(y1, y2) - 30; // アーチの高さ

              return (
                <path
                  key={`link-${spot.id}`}
                  d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
              );
            })}

            {/* 各ピン＆ポップアップ写真カードのプロット（画像の見た目を忠実に再現） */}
            {spots.map((spot) => {
              const x = ((spot.lon + 180) / 360) * 1000;
              const y = ((90 - spot.lat) / 180) * 500;
              return (
                <g key={spot.id} onClick={() => setSelectedSpot(spot)} style={{ cursor: 'pointer' }}>
                  {/* ピンマーク */}
                  <circle cx={x} cy={y} r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />

                  {/* 写真サムネイルポップアップカード */}
                  <foreignObject x={x - 30} y={y - 55} width="60" height="45">
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '2px solid #ffffff',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        background: '#000',
                      }}
                    >
                      {spot.fileType === 'image' ? (
                        <img src={spot.fileUrl} alt="pin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <video src={spot.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── 7. モーダル表示 ── */}
      {selectedSpot && (
        <div onClick={() => setSelectedSpot(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', maxWidth: '480px', width: '90%', boxShadow: theme.cardShadow }}>
            <h3 style={{ marginTop: 0, color: theme.textMain }}>📍 {selectedSpot.locationName} ({selectedSpot.country})</h3>
            <div style={{ width: '100%', maxHeight: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              {selectedSpot.fileType === 'image' ? (
                <img src={selectedSpot.fileUrl} alt="spot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <video src={selectedSpot.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
            <p style={{ color: theme.textSub, fontSize: '14px' }}>ファイル名: {selectedSpot.fileName}</p>
            <button onClick={() => setSelectedSpot(null)} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#ffffff', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '12px' }}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
