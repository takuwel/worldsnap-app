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

// 座標から国判定（簡易判定ロジック）
function getCountryFromCoords(lat: number, lon: number): string {
  // スイスの範囲 (おおよその緯度経度)
  if (lat >= 45.8 && lat <= 47.8 && lon >= 5.9 && lon <= 10.5) {
    return 'Switzerland';
  }
  // 日本の範囲
  if (lat >= 24.0 && lat <= 46.0 && lon >= 122.0 && lon <= 154.0) {
    return 'Japan';
  }
  // ヨーロッパ（その他）
  if (lat >= 35.0 && lat <= 71.0 && lon >= -10.0 && lon <= 40.0) {
    return 'Europe';
  }
  // 北米
  if (lat >= 15.0 && lat <= 72.0 && lon >= -170.0 && lon <= -50.0) {
    return 'North America';
  }
  return 'Other';
}

// 簡単設定用の主要都市・国プリセット（スイスを追加）
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
  const [spots, setSpots] = useState<Spot[]>([]);
  const [unlocatedFiles, setUnlocatedFiles] = useState<PendingFile[]>([]);
  const [currentPendingIndex, setCurrentPendingIndex] = useState<number>(0);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isExportMode, setIsExportMode] = useState(false);

  // 手動入力フォームの状態
  const [manualName, setManualName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  const exportRef = useRef<HTMLDivElement>(null);

  // 登録されている国の一覧（ハイライト用）
  const visitedCountries = new Set(spots.map((s) => s.country));

  // 1. 自動ジオタグ解析による「一括マップ化」(Exif読み取り)
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

    if (newSpots.length > 0) {
      setSpots((prev) => [...prev, ...newSpots]);
    }

    if (pendingList.length > 0) {
      setUnlocatedFiles((prev) => [...prev, ...pendingList]);
      setCurrentPendingIndex(0);
    }
  };

  // 手動で位置情報を割り当てる関数
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

    if (remaining.length > 0) {
      setCurrentPendingIndex((prev) => (prev >= remaining.length ? 0 : prev));
    }
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(manualLat);
    const lonNum = parseFloat(manualLon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      alert('有効な緯度と経度を入力してください。');
      return;
    }

    handleAssignLocation(latNum, lonNum, manualName);
  };

  const handleExportMap = async () => {
    if (!exportRef.current) return;
    setIsExportMode(true);

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const canvas = await html2canvas(exportRef.current, {
        useCORS: true,
        scale: 2,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'worldsnap-map.png';
      link.click();
    } catch (err) {
      console.error('書き出しエラー:', err);
    } finally {
      setIsExportMode(false);
    }
  };

  const currentPending = unlocatedFiles[currentPendingIndex];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto', background: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <h1>WorldSnap - トラベルワールドマップ</h1>

      {/* 1. アップロードエリア */}
      <section style={{ marginBottom: '24px', padding: '16px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
        <h2 style={{ marginTop: 0 }}>写真・動画を選択</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          GPS付き写真は自動で該当国に割り当てられます。位置情報がない画像や動画は手動で国・都市を指定可能です。
        </p>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handlePhotoUpload}
          style={{ padding: '8px', cursor: 'pointer', color: '#f8fafc' }}
        />
      </section>

      {/* 2. 手動設定ダイアログ（スイス含む） */}
      {unlocatedFiles.length > 0 && currentPending && (
        <section
          style={{
            marginBottom: '24px',
            padding: '20px',
            background: '#1e1b4b',
            border: '2px solid #6366f1',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#a5b4fc' }}>
              ⚠️ 位置情報未設定のファイル ({currentPendingIndex + 1} / {unlocatedFiles.length})
            </h3>
            <button
              onClick={() => {
                const remaining = unlocatedFiles.filter((_, idx) => idx !== currentPendingIndex);
                setUnlocatedFiles(remaining);
              }}
              style={{ padding: '4px 12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              スキップ
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '180px', height: '130px', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentPending.fileType === 'image' ? (
                <img src={currentPending.fileUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video src={currentPending.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: '280px' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{currentPending.file.name}</p>

              <p style={{ margin: '8px 0 4px 0', fontSize: '13px', color: '#cbd5e1' }}>国・都市のクイック選択 (日本・スイスなど):</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleAssignLocation(loc.lat, loc.lon, loc.name, loc.country)}
                    style={{
                      padding: '6px 12px',
                      background: loc.country === 'Switzerland' ? '#dc2626' : '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    📍 {loc.name}
                  </button>
                ))}
              </div>

              <form onSubmit={handleManualFormSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="スポット名 (例: マッターホルン)"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="緯度 (lat: 45.97)"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  style={{ padding: '6px 10px', width: '120px', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="経度 (lon: 7.74)"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  style={{ padding: '6px 10px', width: '120px', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
                <button
                  type="submit"
                  style={{ padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  追加
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* 3. 世界地図ビジュアル＆スポット表示エリア */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2>🗺️ 世界地図ビュー（登録国ハイライト）</h2>
        {spots.length > 0 && (
          <button
            onClick={handleExportMap}
            style={{ padding: '8px 16px', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            マップを画像保存
          </button>
        )}
      </div>

      <div
        ref={exportRef}
        style={{
          background: '#020617',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #1e293b',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* SVG 世界地図（未登録の国は薄暗く、登録済みの国は明るく発光） */}
        <div style={{ width: '100%', position: 'relative', marginBottom: '24px', background: '#0b1329', borderRadius: '12px', padding: '16px', border: '1px solid #1e293b' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#94a3b8' }}>
            ステータス: 訪れた国 / 登録済みの国は<span style={{ color: '#38bdf8', fontWeight: 'bold' }}> 明るく点灯 </span>します。（未登録エリアは薄暗い状態です）
          </p>

          <svg viewBox="0 0 1000 500" style={{ width: '100%', height: 'auto', background: '#070d1e', borderRadius: '8px' }}>
            {/* 背景グリッド線 */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="1000" height="500" fill="url(#grid)" />

            {/* 北米エリア */}
            <path
              d="M 100 80 L 300 80 L 250 220 L 120 200 Z"
              fill={visitedCountries.has('North America') ? '#38bdf8' : '#1e293b'}
              stroke={visitedCountries.has('North America') ? '#0284c7' : '#334155'}
              strokeWidth="2"
              opacity={visitedCountries.has('North America') ? '0.9' : '0.3'}
            />

            {/* 南米エリア */}
            <path
              d="M 230 240 L 320 250 L 280 430 L 220 320 Z"
              fill={visitedCountries.has('South America') ? '#38bdf8' : '#1e293b'}
              stroke={visitedCountries.has('South America') ? '#0284c7' : '#334155'}
              strokeWidth="2"
              opacity={visitedCountries.has('South America') ? '0.9' : '0.3'}
            />

            {/* ヨーロッパ全般 */}
            <path
              d="M 460 90 L 580 90 L 570 180 L 450 170 Z"
              fill={visitedCountries.has('Europe') ? '#38bdf8' : '#1e293b'}
              stroke={visitedCountries.has('Europe') ? '#0284c7' : '#334155'}
              strokeWidth="2"
              opacity={visitedCountries.has('Europe') ? '0.9' : '0.3'}
            />

            {/* スイス (Switzerland) 特有ハイライト領域 */}
            <path
              d="M 495 140 L 515 140 L 512 152 L 493 152 Z"
              fill={visitedCountries.has('Switzerland') ? '#ef4444' : '#1e293b'}
              stroke={visitedCountries.has('Switzerland') ? '#f87171' : '#475569'}
              strokeWidth="2"
              opacity={visitedCountries.has('Switzerland') ? '1' : '0.2'}
              filter={visitedCountries.has('Switzerland') ? 'drop-shadow(0 0 6px #ef4444)' : 'none'}
            />

            {/* アフリカエリア */}
            <path
              d="M 450 190 L 570 190 L 550 360 L 470 300 Z"
              fill={visitedCountries.has('Africa') ? '#38bdf8' : '#1e293b'}
              stroke={visitedCountries.has('Africa') ? '#0284c7' : '#334155'}
              strokeWidth="2"
              opacity={visitedCountries.has('Africa') ? '0.9' : '0.3'}
            />

            {/* アジア大陸エリア */}
            <path
              d="M 590 80 L 880 90 L 820 260 L 600 220 Z"
              fill={visitedCountries.has('Asia') ? '#38bdf8' : '#1e293b'}
              stroke={visitedCountries.has('Asia') ? '#0284c7' : '#334155'}
              strokeWidth="2"
              opacity={visitedCountries.has('Asia') ? '0.9' : '0.3'}
            />

            {/* 日本 (Japan) 特有ハイライト領域 */}
            <path
              d="M 850 140 Q 865 130 875 160 L 865 180 Q 855 160 850 140 Z"
              fill={visitedCountries.has('Japan') ? '#22c55e' : '#1e293b'}
              stroke={visitedCountries.has('Japan') ? '#4ade80' : '#475569'}
              strokeWidth="2"
              opacity={visitedCountries.has('Japan') ? '1' : '0.2'}
              filter={visitedCountries.has('Japan') ? 'drop-shadow(0 0 6px #22c55e)' : 'none'}
            />

            {/* オーストラリア/オセアニアエリア */}
            <path
              d="M 780 290 L 890 290 L 870 390 L 770 370 Z"
              fill={visitedCountries.has('Oceania') ? '#38bdf8' : '#1e293b'}
              stroke={visitedCountries.has('Oceania') ? '#0284c7' : '#334155'}
              strokeWidth="2"
              opacity={visitedCountries.has('Oceania') ? '0.9' : '0.3'}
            />

            {/* 世界地図上に各写真のピンプロット */}
            {spots.map((spot) => {
              // 経度/緯度をSVG座標(0-1000, 0-500)に変換
              const x = ((spot.lon + 180) / 360) * 1000;
              const y = ((90 - spot.lat) / 180) * 500;
              return (
                <g key={spot.id} onClick={() => setSelectedSpot(spot)} style={{ cursor: 'pointer' }}>
                  <circle cx={x} cy={y} r="7" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                  <circle cx={x} cy={y} r="12" fill="#f43f5e" opacity="0.4" />
                </g>
              );
            })}
          </svg>
        </div>

        {/* 登録写真グリッド */}
        {spots.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
            写真をアップロードすると、対応する国が地図上で点灯しスポットが登録されます。
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {spots.map((spot) => (
              <div
                key={spot.id}
                onClick={() => setSelectedSpot(spot)}
                style={{
                  background: '#1e293b',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedSpot?.id === spot.id ? '2px solid #38bdf8' : '1px solid #334155',
                }}
              >
                <div style={{ height: '120px', background: '#000' }}>
                  {spot.fileType === 'image' ? (
                    <img src={spot.fileUrl} alt={spot.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <video src={spot.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ padding: '10px' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9' }}>📍 {spot.locationName}</p>
                  <p style={{ margin: 0, color: '#38bdf8', fontSize: '11px', fontWeight: 'bold' }}>国: {spot.country}</p>
                  {spot.dateTime && <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '10px' }}>{spot.dateTime}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. モーダル詳細 */}
      {selectedSpot && (
        <div
          onClick={() => setSelectedSpot(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e293b',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid #475569',
            }}
          >
            <h3 style={{ marginTop: 0 }}>📍 {selectedSpot.locationName} ({selectedSpot.country})</h3>
            <div style={{ width: '100%', maxHeight: '300px', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              {selectedSpot.fileType === 'image' ? (
                <img src={selectedSpot.fileUrl} alt="spot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <video src={selectedSpot.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '14px' }}>ファイル名: {selectedSpot.fileName}</p>
            <p style={{ color: '#cbd5e1', fontSize: '14px' }}>
              座標: 緯度 {selectedSpot.lat}, 経度 {selectedSpot.lon}
            </p>
            <button
              onClick={() => setSelectedSpot(null)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#38bdf8',
                color: '#0f172a',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginTop: '12px',
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
