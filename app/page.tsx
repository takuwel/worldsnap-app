'use client';

import React, { useState } from 'react';
import EXIF from 'exif-js';
import html2canvas from 'html2canvas';

export default function TravelMapPage() {
  const [spots, setSpots] = useState<any[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [isExportMode, setIsExportMode] = useState(false);

  // 1. 自動ジオタグ解析による「一括マップ化」（Exif読み取り）
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const parsedSpots: any[] = [];

    files.forEach((file) => {
      EXIF.getData(file as any, function (this: any) {
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const lon = EXIF.getTag(this, 'GPSLongitude');
        const dateTime = EXIF.getTag(this, 'DateTimeOriginal');

        if (lat && lon) {
          const latDecimal = convertDMSToDD(lat, EXIF.getTag(this, 'GPSLatitudeRef'));
          const lonDecimal = convertDMSToDD(lon, EXIF.getTag(this, 'GPSLongitudeRef'));

          parsedSpots.push({
            id: Math.random().toString(36).substr(2, 9),
            title: file.name.replace(/\.[^/.]+$/, ""),
            lat: latDecimal,
            lng: lonDecimal,
            timestamp: dateTime || new Date().toISOString(),
            mediaUrl: URL.createObjectURL(file),
            isVideo: file.type.startsWith('video/')
          });
        }
      });
    });

    setTimeout(() => {
      const sorted = parsedSpots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setSpots(sorted);
      if (sorted.length > 0) setSelectedSpot(sorted[0]);
    }, 500);
  };

  // DMS(度分秒) -> 十進法(Decimal Degree) 変換
  const convertDMSToDD = (dms: number[], ref: string) => {
    let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
    if (ref === "S" || ref === "W") dd = dd * -1;
    return dd;
  };

  // 2. SNS向け 9:16 画像書き出し
  const exportForSNS = async () => {
    const element = document.getElementById('sns-card-template');
    if (!element) return;
    
    const canvas = await html2canvas(element, { scale: 2 });
    const image = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.href = image;
    link.download = `travel-map-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-white font-sans overflow-hidden">
      <div className="relative flex-1 h-full">
        
        {/* アクションバー */}
        <div className="absolute top-4 left-4 z-20 flex gap-3">
          <label className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full font-bold text-sm cursor-pointer shadow-lg flex items-center gap-2">
            <span>📷 写真/動画を選択して一括マップ化</span>
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
          </label>

          {spots.length > 0 && (
            <button 
              onClick={() => setIsExportMode(!isExportMode)}
              className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
              {isExportMode ? "マップに戻る" : "✨ SNS用に書き出し (9:16)"}
            </button>
          )}
        </div>

        {/* メイン画面 */}
        {!isExportMode ? (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
            <div className="text-center text-slate-400">
              {spots.length === 0 ? (
                <p>写真や動画を選択すると、位置情報から自動でスポットが読み込まれます</p>
              ) : (
                <p>📍 {spots.length} 箇所のスポットを読み込みました</p>
              )}
            </div>

            {/* 動画/写真プレビューシート */}
            {selectedSpot && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700 shadow-2xl flex gap-4 items-center">
                <div className="w-24 h-32 rounded-xl overflow-hidden bg-black flex-shrink-0">
                  {selectedSpot.isVideo ? (
                    <video src={selectedSpot.mediaUrl} autoPlay loop muted className="w-full h-full object-cover" />
                  ) : (
                    <img src={selectedSpot.mediaUrl} alt={selectedSpot.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-xs text-blue-400 font-bold uppercase">選択中のスポット</span>
                  <h3 className="font-bold text-lg leading-snug">{selectedSpot.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(selectedSpot.timestamp).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 9:16 書き出しプレビュー */
          <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4">
            <div 
              id="sns-card-template" 
              className="w-[360px] h-[640px] bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-6 flex flex-col justify-between border border-slate-700 shadow-2xl relative overflow-hidden"
            >
              <div>
                <span className="text-xs font-bold tracking-widest text-purple-400 uppercase">MY TRAVEL LOG</span>
                <h2 className="text-2xl font-black mt-1">TRIP MEMORIES</h2>
                <p className="text-xs text-slate-400">{spots.length} SPOTS VISITED</p>
              </div>

              <div className="grid grid-cols-2 gap-2 my-auto">
                {spots.slice(0, 4).map((spot) => (
                  <div key={spot.id} className="h-28 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                    <img src={spot.mediaUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              <div className="text-center pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>Created with TravelMap</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <button 
              onClick={exportForSNS}
              className="mt-4 bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-full font-bold text-sm">
              画像を保存する
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
