'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// --- 型定義 ---
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

// --- 国情報＆中心座標 ---
const COUNTRY_CONFIGS: Record<string, { lat: number; lon: number; zoom: number; label: string }> = {
  'スイス 🇨🇭': { lat: 46.8182, lon: 8.2275, zoom: 8, label: 'Switzerland' },
  '日本 🇯🇵': { lat: 36.2048, lon: 138.2529, zoom: 6, label: 'Japan' },
  '韓国 🇰🇷': { lat: 35.9078, lon: 127.7669, zoom: 7, label: 'South Korea' },
  'オーストラリア 🇦🇺': { lat: -25.2744, lon: 133.7751, zoom: 4, label: 'Australia' },
  'ドイツ 🇩🇪': { lat: 51.1657, lon: 10.4515, zoom: 6, label: 'Germany' },
  'アメリカ 🇺🇸': { lat: 37.0902, lon: -95.7129, zoom: 4, label: 'USA' },
  'フランス 🇫🇷': { lat: 46.2276, lon: 2.2137, zoom: 6, label: 'France' },
};

// --- クイック選択プリセット ---
const QUICK_LOCATIONS = [
  { name: 'スイス - チューリッヒ', lat: 47.3769, lon: 8.5417, country: 'スイス 🇨🇭' },
  { name: 'スイス - ジュネーブ', lat: 46.2044, lon: 6.1432, country: 'スイス 🇨🇭' },
  { name: 'スイス - ツェルマット', lat: 45.9765, lon: 7.7491, country: 'スイス 🇨🇭' },
  { name: '日本 - 東京', lat: 35.6812, lon: 139.7671, country: '日本 🇯🇵' },
  { name: '日本 - 京都', lat: 35.0116, lon: 135.7681, country: '日本 🇯🇵' },
  { name: '日本 - 大阪', lat: 34.6937, lon: 135.5023, country: '日本 🇯🇵' },
  { name: '韓国 - ソウル', lat: 37.5665, lon: 126.978, country: '韓国 🇰🇷' },
  { name: '韓国 - 釜山', lat: 35.1796, lon: 129.0756, country: '韓国 🇰🇷' },
  { name: 'オーストラリア - シドニー', lat: -33.8688, lon: 151.2093, country: 'オーストラリア 🇦🇺' },
  { name: 'オーストラリア - メルボルン', lat: -37.8136, lon: 144.9631, country: 'オーストラリア 🇦🇺' },
  { name: 'ドイツ - ベルリン', lat: 52.52, lon: 13.405, country: 'ドイツ 🇩🇪' },
  { name: 'ドイツ - ミュンヘン', lat: 48.1351, lon: 11.582, country: 'ドイツ 🇩🇪' },
];

// --- DMS座標変換 ---
function convertDMSToDD(dms: number[], ref: string): number {
  if (!dms || dms.length < 3) return 0;
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') dd *= -1;
  return dd;
}

// --- Dynamic Import 用クライアント限定マップコンポーネント ---
const MapComponent = dynamic(
  () =>
    Promise.resolve(({ spots, center, zoom, mode, onSelectSpot }: { spots: Spot[]; center: [number, number]; zoom: number; mode: 'view' | 'rain' | 'gourmet'; onSelectSpot: (s: Spot) => void }) => {
      // LeafletおよびCSSのクライアント側動的インポート
      const { MapContainer, TileLayer, Marker, Polyline, useMap } = require('react-leaflet');
      const L = require('leaflet');
      require('leaflet/dist/leaflet.css');

      // 地図の中心座標をスムーズに変更する用
      const MapFlyTo = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
        const map = useMap();
        useEffect(() => {
          map.flyTo(center, zoom, { duration: 1.5 });
        }, [center, zoom, map]);
        return null;
      };

      // モードに応じたTileLayerのURL設定
      const tileUrl =
        mode === 'rain'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : mode === 'gourmet'
          ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      // 接続線（Polyline）の座標配列
      const polylineCoords = spots.map((s) => [s.lat, s.lon] as [number, number]);

      return (
        <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '520px', borderRadius: '16px' }} scrollWheelZoom={true}>
          <MapFlyTo center={center} zoom={zoom} />
          <TileLayer url={tileUrl} attribution='&copy; <a href="https://carto.com/">CARTO</a>' />

          {/* 破線接続ライン */}
          {polylineCoords.length > 1 && (
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: mode === 'gourmet' ? '#f97316' : mode === 'rain' ? '#38bdf8' : '#0284c7',
                weight: 3,
                dashArray: '6, 8',
                opacity: 0.8,
              }}
            />
          )}

          {/* カスタムサムネイルピン */}
          {spots.map((spot) => {
            const customIcon = L.divIcon({
              className: 'custom-map-pin',
              html: `
                <div style="
                  width: 44px;
                  height: 44px;
                  border-radius: 50%;
                  border: 3px solid ${mode === 'gourmet' ? '#f97316' : mode === 'rain' ? '#38bdf8' : '#ffffff'};
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                  overflow: hidden;
                  background: #000;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                ">
                  ${
                    spot.fileType === 'image'
                      ? `<img src="${spot.fileUrl}" style="width:100%;height:100%;object-fit:cover;" />`
                      : `<div style="color:#fff;font-size:10px;">🎥</div>`
                  }
                </div>
              `,
              iconSize: [44, 44],
              iconAnchor: [22, 22],
            });

            return (
              <Marker
                key={spot.id}
                position={[spot.lat, spot.lon]}
                icon={customIcon}
                eventHandlers={{
                  click: () => onSelectSpot(spot),
                }}
              />
            );
          })}
        </MapContainer>
      );
    }),
  { ssr: false, loading: () => <div style={{ height: '520px', background: '#1e293b', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>🗺️ マップを読み込み中...</div> }
);

// --- メインコンポーネント ---
export default function TravelMapPage() {
  const [username, setUsername] = useState('takuwel');
  const [nationality, setNationality] = useState('スイス 🇨🇭');

  // 表示モード ('view' | 'rain' | 'gourmet')
  const [viewMode, setViewMode] = useState<'view' | 'rain' | 'gourmet'>('view');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'map' | 'gallery'>('home');

  const [spots, setSpots] = useState<Spot[]>([]);
  const [unlocatedFiles, setUnlocatedFiles] = useState<PendingFile[]>([]);
  const [currentPendingIndex, setCurrentPendingIndex] = useState<number>(0);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  // 手動入力フォーム
  const [manualName, setManualName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  const exportRef = useRef<HTMLDivElement>(null);

  // 国籍変更時のマップ中心座標を取得
  const currentConfig = COUNTRY_CONFIGS[nationality] || COUNTRY_CONFIGS['スイス 🇨🇭'];
  const mapCenter: [number, number] = [currentConfig.lat, currentConfig.lon];

  // 訪問済み国のリスト
  const visitedCountries = new Set(spots.map((s) => s.country));

  // ファイルアップロード (動的インポートでSSRエラー回避)
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

            newSpots.push({
              id: fileId,
              fileName: file.name,
              fileUrl,
              fileType: 'image',
              lat: latDecimal,
              lon: lonDecimal,
              country: nationality,
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

  // 手動で場所を登録
  const handleAssignLocation = (latVal: number, lonVal: number, nameVal?: string, countryPreset?: string) => {
    if (unlocatedFiles.length === 0) return;
    const currentFile = unlocatedFiles[currentPendingIndex];
    if (!currentFile) return;

    const targetCountry = countryPreset || nationality;

    const newSpot: Spot = {
      id: currentFile.id,
      fileName: currentFile.file.name,
      fileUrl: currentFile.fileUrl,
      fileType: currentFile.fileType,
      lat: latVal,
      lon: lonVal,
      country: targetCountry,
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

  // マップ保存 (動的インポート)
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
      console.error('マップ保存エラー:', err);
    }
  };

  const currentPending = unlocatedFiles[currentPendingIndex];

  // モード別のUIテーマカラー
  const theme =
    viewMode === 'rain'
      ? {
          bg: '#0a0f1d',
          cardBg: '#131c31',
          textMain: '#f8fafc',
          textSub: '#94a3b8',
          accent: '#38bdf8',
          border: '#1e293b',
        }
      : viewMode === 'gourmet'
      ? {
          bg: '#fff7ed',
          cardBg: '#ffffff',
          textMain: '#431407',
          textSub: '#9a3412',
          accent: '#ea580c',
          border: '#ffedd5',
        }
      : {
          bg: '#f8fafc',
          cardBg: '#ffffff',
          textMain: '#0f172a',
          textSub: '#64748b',
          accent: '#0284c7',
          border: '#e2e8f0',
        };

  return (
    <div style={{ background: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', transition: 'all 0.3s ease' }}>
      {/* ── ヘッダー ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          background: theme.cardBg,
          borderBottom: `1px solid ${theme.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setIsMenuOpen(true)} style={{ background: 'transparent', border: 'none', color: theme.textMain, fontSize: '22px', cursor: 'pointer' }}>
            ☰
          </button>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: theme.accent, letterSpacing: '-0.5px' }}>WorldSnap</h1>
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
                background: currentTab === tab ? theme.accent : theme.bg,
                color: currentTab === tab ? '#ffffff' : theme.textSub,
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {tab === 'home' ? '🏠 ホーム' : tab === 'map' ? '🗺️ マップ' : '🖼️ ギャラリー'}
            </button>
          ))}
        </nav>
      </header>

      {/* ── ドロワーメニュー ── */}
      {isMenuOpen && (
        <div onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex' }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '300px',
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
              <h2 style={{ margin: 0, fontSize: '18px', color: theme.accent }}>メニュー & モード設定</h2>
              <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: theme.textMain, fontSize: '20px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <hr style={{ borderColor: theme.border, margin: 0 }} />

            {/* モード切り替えボタン */}
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: theme.textSub, fontWeight: 'bold' }}>マップテーマ切り替え</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('view')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: viewMode === 'view' ? '#0284c7' : theme.bg,
                    color: viewMode === 'view' ? '#fff' : theme.textMain,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  🏔️ Viewモード (標準・鮮やか)
                </button>
                <button
                  onClick={() => setViewMode('rain')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: viewMode === 'rain' ? '#38bdf8' : theme.bg,
                    color: viewMode === 'rain' ? '#0f172a' : theme.textMain,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  🌧️ 雨の日モード (シック・ダーク)
                </button>
                <button
                  onClick={() => setViewMode('gourmet')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: viewMode === 'gourmet' ? '#ea580c' : theme.bg,
                    color: viewMode === 'gourmet' ? '#fff' : theme.textMain,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  🍔 グルメモード (暖色・カフェ)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
        {/* ── ユーザーバナー ── */}
        <section
          style={{
            marginBottom: '20px',
            padding: '20px 24px',
            background: theme.cardBg,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff' }}>
              👤
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${theme.accent}`, color: theme.textMain, fontSize: '18px', fontWeight: 'bold', width: '130px' }}
                />
                <span style={{ color: theme.textSub, fontSize: '14px' }}>さんのマップ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '13px', color: theme.textSub }}>国籍フォーカス:</span>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  style={{ background: theme.bg, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '4px 10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {Object.keys(COUNTRY_CONFIGS).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: theme.textSub }}>訪問国数</span>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: theme.accent }}>
              {visitedCountries.size} <span style={{ fontSize: '14px', color: theme.textSub }}>カ国</span>
            </p>
          </div>
        </section>

        {/* ── アップロードエリア ── */}
        <section style={{ marginBottom: '24px', padding: '20px', background: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}` }}>
          <h2 style={{ marginTop: 0, fontSize: '16px' }}>写真・動画を選択 (Exif自動解析)</h2>
          <p style={{ color: theme.textSub, fontSize: '13px' }}>位置情報がない写真・動画は下のダイアログで手動選択（スイス・日本・韓国等）できます。</p>
          <input type="file" accept="image/*,video/*" multiple onChange={handlePhotoUpload} style={{ padding: '8px 0', cursor: 'pointer', color: theme.textMain }} />
        </section>

        {/* ── 位置情報手動補完ダイアログ ── */}
        {unlocatedFiles.length > 0 && currentPending && (
          <section style={{ marginBottom: '24px', padding: '20px', background: viewMode === 'rain' ? '#1e1b4b' : '#fffbe2', borderRadius: '16px', border: '2px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#b45309', fontSize: '15px' }}>
                ⚠️ 位置情報未設定ファイル ({currentPendingIndex + 1} / {unlocatedFiles.length})
              </h3>
              <button onClick={() => setUnlocatedFiles((prev) => prev.filter((_, idx) => idx !== currentPendingIndex))} style={{ padding: '4px 12px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                スキップ
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: '140px', height: '100px', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                {currentPending.fileType === 'image' ? <img src={currentPending.fileUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <video src={currentPending.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>

              <div style={{ flex: 1, minWidth: '280px' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>{currentPending.file.name}</p>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b' }}>ワンタップで都市を選択:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {QUICK_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => handleAssignLocation(loc.lat, loc.lon, loc.name, loc.country)}
                      style={{ padding: '6px 12px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      📍 {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── マップ表示エリア ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>🗺️ インタラクティブ・ワールドマップ</h2>
          {spots.length > 0 && (
            <button onClick={handleExportMap} style={{ padding: '8px 18px', background: theme.accent, color: '#ffffff', fontWeight: 'bold', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}>
              マップ保存 (PNG)
            </button>
          )}
        </div>

        <div ref={exportRef} style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <MapComponent spots={spots} center={mapCenter} zoom={currentConfig.zoom} mode={viewMode} onSelectSpot={setSelectedSpot} />
        </div>
      </div>

      {/* ── スポット詳細モーダル ── */}
      {selectedSpot && (
        <div onClick={() => setSelectedSpot(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', maxWidth: '480px', width: '90%' }}>
            <h3 style={{ marginTop: 0, color: theme.textMain }}>📍 {selectedSpot.locationName} ({selectedSpot.country})</h3>
            <div style={{ width: '100%', maxHeight: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              {selectedSpot.fileType === 'image' ? <img src={selectedSpot.fileUrl} alt="spot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <video src={selectedSpot.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
            </div>
            <p style={{ color: theme.textSub, fontSize: '14px' }}>ファイル名: {selectedSpot.fileName}</p>
            <button onClick={() => setSelectedSpot(null)} style={{ width: '100%', padding: '12px', background: theme.accent, color: '#ffffff', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '12px' }}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
