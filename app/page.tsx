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

```
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

```

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
const res = await fetch(`[https://nominatim.openstreetmap.org/search?format=json&q=$](https://nominatim.openstreetmap.org/search?format=json&q=$){encodeURIComponent(mapSearchKeyword)}&limit=6`);
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
setTargetZoom(14);
setMapSearchKeyword(item.display_name.split(',')[0]);
setMapSearchSuggestions([]);
showToast(`📍 ${item.display_name.split(',')[0]} へ移動しました`);
};

const handleJumpLocationSearch = async (e?: React.FormEvent) => {
if (e) e.preventDefault();
if (!mapSearchKeyword.trim()) return;

```
if (mapSearchKeyword.startsWith('#')) {
  showToast(`🏷️ タグ「${mapSearchKeyword}」で絞り込みました`);
  setMapSearchSuggestions([]);
  return;
}

if (mapSearchSuggestions.length > 0) {
  handleSelectMapSuggestion(mapSearchSuggestions[0]);
} else {
  try {
    const res = await fetch(`[https://nominatim.openstreetmap.org/search?format=json&q=$](https://nominatim.openstreetmap.org/search?format=json&q=$){encodeURIComponent(mapSearchKeyword)}&limit=1`);
    const data = await res.json();
    if (data && data[0]) {
      handleSelectMapSuggestion(data[0]);
    }
  } catch {}
}

```

};

useEffect(() => {
if (!addressSearchQuery.trim() || addressSearchQuery.startsWith('📍')) {
setAddressSuggestions([]);
return;
}
const timer = setTimeout(async () => {
try {
const res = await fetch(`[https://nominatim.openstreetmap.org/search?format=json&q=$](https://nominatim.openstreetmap.org/search?format=json&q=$){encodeURIComponent(addressSearchQuery)}&limit=6`);
const data = await res.json();
setAddressSuggestions(data || []);
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

```
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

```

}, [countrySearchQuery]);

const filteredSpots = useMemo(() => {
return spots.filter((s) => {
if (blockedUsers.includes(s.userId)) return false;
if (!selectedCategories.includes(s.category)) return false;

```
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

```

}, [spots, blockedUsers, selectedCategories, displayScope, friendsList, mapSearchKeyword]);

const timelineSpots = useMemo(() => {
const validSpots = spots.filter(s => !blockedUsers.includes(s.userId));
const baseCountrySpots = validSpots.filter(s => s.countryCode === userCountry);
const otherCountrySpots = validSpots.filter(s => s.countryCode !== userCountry);
const sortedSpots = [...baseCountrySpots, ...otherCountrySpots];

```
if (!timelineSearchKeyword.trim()) return sortedSpots;
const kw = timelineSearchKeyword.toLowerCase();
return sortedSpots.filter(s => {
  if (kw.startsWith('#')) {
    const rawTag = kw.replace('#', '');
    return s.tags?.some(t => t.toLowerCase().includes(rawTag)) || s.description.toLowerCase().includes(kw);
  }
  return s.title.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw) || s.cityName.toLowerCase().includes(kw);
});

```

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

const handleAvatarFileSelect = async (e: React.ChangeEvent) => {
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

```
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

```

};

const handleAddComment = (spotId: string, customText?: string) => {
const textToUse = customText !== undefined ? customText : newCommentText;
const trimmedText = textToUse.trim();
if (!trimmedText) return;

```
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

```

};

const parseFilesToPendingList = async (files: File[]): Promise<PendingUploadItem[]> => {
const EXIFModule = await import('exif-js');
const EXIF = EXIFModule.default || EXIFModule;
const pendingList: PendingUploadItem[] = [];

```
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
      thumbUrl: thumbUrl || FALLBACK_IMAGE_URL,
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

```

};

const handlePhotoSelect = async (e: React.ChangeEvent) => {
if (!e.target.files || e.target.files.length === 0) return;

```
const files = Array.from(e.target.files);
const pendingList = await parseFilesToPendingList(files);
e.target.value = '';

if (pendingList.length > 0) {
  setPendingUploads(pendingList);
  setCurrentUploadIndex(0);
  setSeparateCaptionsMode(false);
  setPreviewScale(1);
  setPreviewOffset({ x: 0, y: 0 });
  const first = pendingList[0];
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

```

};

const handleAppendMoreMedia = async (e: React.ChangeEvent) => {
if (!e.target.files || e.target.files.length === 0) return;
const files = Array.from(e.target.files);
const addedList = await parseFilesToPendingList(files);
e.target.value = '';

```
if (addedList.length > 0) {
  setPendingUploads(prev => [...prev, ...addedList]);
  showToast(`📸 ${addedList.length}件を追加しました（合計 ${pendingUploads.length + addedList.length}件を1つの投稿にまとめます）`);
}

```

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

```
const hasValidManualLocation = manualLat !== '' && manualLon !== '' && !isNaN(parseFloat(manualLat)) && !isNaN(parseFloat(manualLon));

if (!hasValidManualLocation) {
  showWarning('⚠️ 位置情報が指定されていません。「地名・住所・施設名検索」で必ず場所を選択してください。');
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

let uploadedUrl = sanitizeImageSrc(current.fileUrl);
let finalThumbUrl = sanitizeImageSrc(current.thumbUrl || current.fileUrl);

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
    console.log('Storage upload bypassed, using persistent URL:', err);
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
  setPreviewScale(1);
  setPreviewOffset({ x: 0, y: 0 });
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

```

};

const handleSaveMyMap = async (e: React.MouseEvent) => {
e.preventDefault();
e.stopPropagation();
if (!exportRef.current) return;
showToast('📸 マップ画像を生成中...');

```
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

```

};

const themeAccent = mapTheme === 'dark' ? '#38bdf8' : mapTheme === 'pastel' ? '#d97706' : '#0284c7';

const currentBackgroundColor = '#ffffff';
const headerBgColor = '#ffffff';
const headerTextColor = '#0f172a';

const isAnyTimelineCommentOpen = Object.values(openCommentsForSpot).some(Boolean);

if (!isClient) {
return <div style={{ background: '#ffffff', width: '100vw', height: '100dvh' }}>;
}

return (
<>

wap










```
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

    {isOnboarding && (
      <div style={{ position: 'fixed', inset: 0, background: '#ffffff', color: '#0f172a', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', touchAction: 'none' }}>
        <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '440px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', textAlign: 'center', touchAction: 'pan-y', border: '1px solid #e2e8f0' }}>
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
              <h3 style={{ fontSize: '15px', margin: '0 0 8px 0', color: '#0f172a' }}>{t('step1Title')}</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>{t('step1Desc')}</p>
              <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', touchAction: 'pan-y' }}>
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
            <div style={{ textAlign: 'left', touchAction: 'pan-y' }}>
              <h3 style={{ fontSize: '15px', margin: '0 0 4px 0', color: '#0f172a' }}>{t('step2Title')}</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>{t('step2Desc')}</p>
              <input
                type="text"
                placeholder={t('countrySearchPlaceholder')}
                value={countrySearchQuery}
                onChange={(e) => setCountrySearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', marginBottom: '8px', boxSizing: 'border-box', touchAction: 'manipulation' }}
              />

              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingRight: '4px', touchAction: 'pan-y' }}>
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
            <div style={{ textAlign: 'left', touchAction: 'pan-y' }}>
              <h3 style={{ fontSize: '15px', margin: '0 0 14px 0', color: '#0f172a' }}>{t('step3Title')}</h3>
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
                style={{ width: '100%', padding: '10px 12px', marginTop: '4px', marginBottom: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 'bold', touchAction: 'manipulation' }}
              />
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>自己紹介</label>
              <input
                type="text"
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', marginTop: '4px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', touchAction: 'manipulation' }}
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
            <div style={{ textAlign: 'left', touchAction: 'pan-y' }}>
              <h3 style={{ fontSize: '15px', margin: '0 0 8px 0', color: '#0f172a' }}>{t('step3TitleEula')}</h3>
              <div
                onScroll={(e) => {
                  const target = e.currentTarget;
                  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 30) {
                    setHasScrolledToBottom(true);
                  }
                }}
                style={{ maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '10px', touchAction: 'pan-y' }}
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
            style={{ width: '100%', padding: '10px', marginTop: '4px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 'bold', touchAction: 'manipulation' }}
          />

          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>自己紹介</label>
          <input
            type="text"
            value={userBio}
            onChange={(e) => setUserBio(e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '4px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', touchAction: 'manipulation' }}
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

    {/* 同一場所の複数投稿フルスクリーン一覧画面（下部バー重なり完全解消・左上戻る・上部検索・右上並び替え） */}
    {isMultiPostsModalOpen && (
      <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', background: '#ffffff', color: '#0f172a', zIndex: 100001, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', touchAction: 'pan-y' }}>
        <div style={{ height: '52px', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', background: '#ffffff', flexShrink: 0, gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              setIsMultiPostsModalOpen(false);
              setMultiPostSearchKeyword('');
            }}
            style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '10px', padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}
          >
            ← 戻る
          </button>

          <div style={{ fontSize: '14px', fontWeight: '900', color: '#0284c7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            📍 この場所の投稿 ({sortedAndFilteredMultiPosts.length}件)
          </div>

          <select
            value={multiPostSortType}
            onChange={(e) => setMultiPostSortType(e.target.value as MultiPostSortType)}
            aria-label="並び替え"
            style={{ padding: '6px 8px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}
          >
            <option value="newest">🕒 新着順</option>
            <option value="likes">❤️ いいね順</option>
            <option value="views">👀 閲覧順</option>
          </select>
        </div>

        <div style={{ padding: '10px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <input
            type="text"
            placeholder="🔍 キーワードで投稿を検索（ヒットした投稿が上に来ます）"
            value={multiPostSearchKeyword}
            onChange={(e) => setMultiPostSearchKeyword(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box', touchAction: 'manipulation' }}
          />
        </div>

        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '12px', paddingBottom: '36px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', alignContent: 'start', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', boxSizing: 'border-box' }}>
          {sortedAndFilteredMultiPosts.map(spot => (
            <div
              key={spot.id}
              onClick={() => {
                setIsMultiPostsModalOpen(false);
                setMultiPostSearchKeyword('');
                handleOpenSpot(spot);
              }}
              style={{ background: '#f8fafc', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', flexDirection: 'column', boxShadow: '0 3px 10px rgba(0,0,0,0.05)', touchAction: 'manipulation' }}
            >
              <div style={{ width: '100%', height: '160px', background: '#0f172a', position: 'relative' }}>
                <img
                  src={sanitizeImageSrc(spot.thumbUrl || spot.fileUrl)}
                  alt={spot.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== FALLBACK_IMAGE_URL) {
                      target.src = FALLBACK_IMAGE_URL;
                    }
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                    {spot.userName.charAt(0)}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.userName}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.title}</div>
                <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.description}</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>❤️ {spot.savedCount} ・ 👀 {spot.viewsCount}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* カレンダーログの特定日付押下時モーダル */}
    {selectedCalendarDate && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '24px', maxWidth: '380px', width: '100%', maxHeight: '80vh', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0284c7' }}>📅 {selectedCalendarDate} の旅のログ</h3>
            <button onClick={() => setSelectedCalendarDate(null)} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer' }}>✕</button>
          </div>

          <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
            {(() => {
              const daySpots = mySpots.filter(s => {
                if (s.createdAt === selectedCalendarDate) return true;
                if (s.mediaList?.some(m => m.createdAt === selectedCalendarDate)) return true;
                return false;
              });

              if (daySpots.length === 0) {
                return <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '12px' }}>この日の投稿はありません 📭</div>;
              }

              return daySpots.map(s => (
                <div key={s.id} onClick={() => { setSelectedCalendarDate(null); handleOpenSpot(s); }} style={{ display: 'flex', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', alignItems: 'center' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                    <img
                      src={sanitizeImageSrc(s.thumbUrl || s.fileUrl)}
                      alt={s.title}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== FALLBACK_IMAGE_URL) target.src = FALLBACK_IMAGE_URL;
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>📍 {s.cityName}</div>
                  </div>
                </div>
              ));
            })()}
          </div>

          <button
            onClick={() => setSelectedCalendarDate(null)}
            style={{ width: '100%', marginTop: '12px', padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
          >
            閉じる
          </button>
        </div>
      </div>
    )}

    <header style={{ height: '48px', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: headerBgColor, color: headerTextColor, borderBottom: '1px solid #e2e8f0', flexShrink: 0, zIndex: 100, touchAction: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
        <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px', flexShrink: 0, color: headerTextColor }}>
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

    <div style={{ flex: 1, minHeight: 0, height: 'calc(100dvh - 48px - env(safe-area-inset-top, 0px))', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#ffffff', padding: 0, margin: 0, boxSizing: 'border-box' }}>

      {/* マップタブ */}
      <div style={{ display: currentTab === 'map' ? 'flex' : 'none', flexDirection: 'column', height: '100%', width: '100%', position: 'relative', background: '#ffffff', border: 'none', boxSizing: 'border-box' }}>
        <div style={{ position: 'absolute', top: '10px', left: '12px', right: '12px', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '6px', pointerEvents: 'none', boxSizing: 'border-box' }}>
          <div style={{ position: 'relative', pointerEvents: 'auto', boxSizing: 'border-box', touchAction: 'auto' }}>
            <form onSubmit={handleJumpLocationSearch} style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.95)', color: '#000', backdropFilter: 'blur(10px)', padding: '5px 12px', borderRadius: '30px', boxShadow: '0 4px 18px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={mapSearchKeyword}
                onChange={(e) => setMapSearchKeyword(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#000', fontSize: '16px', fontWeight: '500', padding: '2px 4px', boxSizing: 'border-box', touchAction: 'manipulation' }}
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
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.95)', padding: '3px 6px', borderRadius: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.1)', pointerEvents: 'auto', border: '1px solid #e2e8f0', boxSizing: 'border-box', touchAction: 'manipulation' }}>
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

            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.95)', padding: '3px 8px', borderRadius: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.1)', pointerEvents: 'auto', border: '1px solid #e2e8f0', boxSizing: 'border-box', touchAction: 'manipulation' }}>
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
            onSelectSpot={(spot) => {
              const nearby = spots.filter(s => Math.abs(s.lat - spot.lat) < 0.005 && Math.abs(s.lon - spot.lon) < 0.005);
              if (nearby.length > 1) {
                setMultiPostsList(nearby);
                setMultiPostSearchKeyword('');
                setMultiPostSortType('newest');
                setIsMultiPostsModalOpen(true);
              } else {
                handleOpenSpot(spot);
              }
            }}
            onDoubleTap={handleMapDoubleTap}
          />

          <div style={{ position: 'absolute', bottom: '95px', right: '16px', zIndex: 400, display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box' }}>
            <button
              title="現在地へ移動"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const lat = pos.coords.latitude;
                      const lon = pos.coords.longitude;
                      setTargetCenter([lat, lon]);
                      setTargetZoom(15);
                      if (pendingUploads.length > 0) {
                        setManualLat(lat.toString());
                        setManualLon(lon.toString());
                        setAddressSearchQuery('📍 現在地 (GPS)');
                      }
                      showToast('🎯 現在地を取得しました');
                    },
                    (err) => {
                      console.error(err);
                      setIsLocationGuideOpen(true);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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

        <div style={{ position: 'absolute', bottom: '95px', left: '16px', zIndex: 450, boxSizing: 'border-box' }}>
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

      {/* タイムラインタブ */}
      {currentTab === 'timeline' && (
        <div className="scrollable-content" style={{ flex: 1, overflowY: isAnyTimelineCommentOpen ? 'hidden' : 'auto', background: '#0f172a', display: 'flex', flexDirection: 'column', scrollSnapType: isAnyTimelineCommentOpen ? 'none' : 'y mandatory', height: '100%', WebkitOverflowScrolling: 'touch', touchAction: isAnyTimelineCommentOpen ? 'none' : 'pan-y', paddingBottom: '90px', boxSizing: 'border-box' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 500, padding: '10px 16px', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="🔍 タグやワードで検索 (例: #絶景, 東京)"
              value={timelineSearchKeyword}
              onChange={(e) => setTimelineSearchKeyword(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '16px', outline: 'none', touchAction: 'manipulation' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {timelineSpots.map((spot) => {
              const isCommentsOpen = openCommentsForSpot[spot.id] || false;
              return (
                <div
                  key={spot.id}
                  onClick={() => {
                    if (!isCommentsOpen) handleOpenSpot(spot);
                  }}
                  style={{ width: '100%', height: 'calc(100dvh - 48px - env(safe-area-inset-top, 0px))', scrollSnapAlign: 'start', scrollSnapStop: 'always', position: 'relative', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, touchAction: isCommentsOpen ? 'none' : 'pan-y' }}
                >
                  <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {spot.fileType === 'video' ? (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <video src={spot.fileUrl} autoPlay loop muted={false} playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <img
                        src={sanitizeImageSrc(spot.fileUrl || spot.thumbUrl)}
                        alt={spot.title}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== FALLBACK_IMAGE_URL) target.src = FALLBACK_IMAGE_URL;
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)', pointerEvents: 'none' }}></div>
                  </div>

                  <div style={{ position: 'absolute', bottom: '110px', left: '16px', right: '85px', color: '#fff', pointerEvents: 'auto', touchAction: 'manipulation' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {spot.userName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{spot.userName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>📍 {spot.cityName} {spot.hasParking ? ' | 🅿️ 駐車場あり' : ''}</div>
                      </div>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{spot.title}</h3>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>{spot.description}</p>
                  </div>

                  <div style={{ position: 'absolute', right: '16px', bottom: '140px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', color: '#fff', pointerEvents: 'auto', touchAction: 'manipulation' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleLike(spot.id)}
                      style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '26px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', touchAction: 'manipulation' }}
                    >
                      <span>{likedSpotIds.includes(spot.id) ? '❤️' : '🤍'}</span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{spot.savedCount}</span>
                    </button>

                    <button
                      onClick={() => setOpenCommentsForSpot(prev => ({ ...prev, [spot.id]: !prev[spot.id] }))}
                      style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', touchAction: 'manipulation' }}
                    >
                      <span>💬</span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{spot.comments?.length || 0}</span>
                    </button>
                  </div>

                  {isCommentsOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99990, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease', touchAction: 'none' }} onClick={(e) => { e.stopPropagation(); setOpenCommentsForSpot(prev => ({ ...prev, [spot.id]: false })); }}>
                      <div style={{ background: '#ffffff', color: '#0f172a', width: '100%', maxHeight: '65vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', padding: '16px', boxSizing: 'border-box', touchAction: 'pan-y' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '2px', alignSelf: 'center', marginBottom: '12px' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>{spot.comments?.length || 0}件のコメント</h3>
                          <button onClick={() => setOpenCommentsForSpot(prev => ({ ...prev, [spot.id]: false }))} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', touchAction: 'manipulation' }}>✕</button>
                        </div>

                        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '12px', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
                          {spot.comments && spot.comments.length > 0 ? (
                            spot.comments.map(c => (
                              <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284c7', color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                                  {c.userName.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>{c.userName}</div>
                                  <div style={{ fontSize: '13px', color: '#0f172a', lineHeight: '1.4' }}>{c.text}</div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{c.createdAt}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '12px' }}>コメントはまだありません。最初のコメントを投稿しよう！</div>
                          )}
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', touchAction: 'manipulation' }}>
                          <input
                            type="text"
                            placeholder="すてきなコメントを書く..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            style={{ flex: 1, padding: '10px 14px', borderRadius: '24px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none', touchAction: 'manipulation' }}
                          />
                          <button
                            onClick={() => {
                              handleAddComment(spot.id, newCommentText);
                            }}
                            style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', touchAction: 'manipulation' }}
                          >
                            送信
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '90px', background: '#ffffff', touchAction: 'pan-y', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>🏆 {t('ranking')}</h2>
          {rankingSpots.map((s, i) => (
            <div key={s.id} onClick={() => handleOpenSpot(s)} style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', width: '24px' }}>#{i + 1}</span>
              <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                {s.fileType === 'video' ? (
                  <video src={s.fileUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img
                    src={sanitizeImageSrc(s.thumbUrl || s.fileUrl)}
                    alt={s.title}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== FALLBACK_IMAGE_URL) target.src = FALLBACK_IMAGE_URL;
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{s.title}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>📍 {s.cityName} {s.hasParking ? ' | 🅿️ 駐車場あり' : ''} | 👀 {s.viewsCount} | ❤️ {s.savedCount}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* マイページタブ */}
      {currentTab === 'profile' && (
        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '90px', background: '#ffffff', touchAction: 'pan-y', boxSizing: 'border-box' }}>
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
                  {s.fileType === 'video' ? (
                    <video src={s.fileUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img
                      src={sanitizeImageSrc(s.thumbUrl || s.fileUrl)}
                      alt={s.title}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== FALLBACK_IMAGE_URL) target.src = FALLBACK_IMAGE_URL;
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  )}
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
            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleStepCalendarMonth(-1)}
                  aria-label="前の月へ"
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0284c7', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ◀
                </button>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>🗓️ 旅のログ カレンダー</h3>
                {isViewingPastMonth ? (
                  <button
                    type="button"
                    onClick={() => handleStepCalendarMonth(1)}
                    aria-label="次の月へ"
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #0284c7', background: '#f0f9ff', color: '#0284c7', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ▶
                  </button>
                ) : (
                  <div style={{ width: '32px', height: '32px' }} />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
                <select
                  value={calendarYear}
                  onChange={(e) => setCalendarYear(Number(e.target.value))}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 'bold', fontSize: '13px' }}
                >
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={calendarMonth}
                  onChange={(e) => setCalendarMonth(Number(e.target.value))}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 'bold', fontSize: '13px' }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </div>

              {(() => {
                const year = calendarYear;
                const month = calendarMonth - 1;
                const firstDayIndex = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                const postMap = new Map<string, Spot>();
                mySpots.forEach(s => {
                  if (s.createdAt) postMap.set(s.createdAt, s);
                  s.mediaList?.forEach(m => {
                    if (m.createdAt) postMap.set(m.createdAt, s);
                  });
                });

                const daysArray = [];
                for (let i = 0; i < firstDayIndex; i++) {
                  daysArray.push(null);
                }
                for (let d = 1; d <= daysInMonth; d++) {
                  const mStr = String(month + 1).padStart(2, '0');
                  const dStr = String(d).padStart(2, '0');
                  const dateKey3 = `${year}-${mStr}-${dStr}`;
                  const dateKeyJP = `${year}年${Number(mStr)}月${Number(dStr)}日`;

                  let foundSpot: Spot | undefined = undefined;
                  for (const [k, v] of postMap.entries()) {
                    if (k.includes(`${month + 1}/${d}/${year}`) || k.includes(`${year}/${mStr}/${dStr}`) || k === dateKey3 || k === dateKeyJP) {
                      foundSpot = v;
                      break;
                    }
                  }

                  daysArray.push({ day: d, dateStr: `${year}/${mStr}/${dStr}`, spot: foundSpot });
                }

                return (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      <div>日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div>土</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                      {daysArray.map((item, idx) => {
                        if (!item) return <div key={idx} style={{ height: '44px' }}></div>;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (item.spot) {
                                setSelectedCalendarDate(item.dateStr);
                              } else {
                                showToast('この日の投稿はありません');
                              }
                            }}
                            style={{
                              height: '44px',
                              borderRadius: '8px',
                              background: '#ffffff',
                              color: '#334155',
                              border: `2px solid ${item.spot ? '#0284c7' : '#e2e8f0'}`,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: item.spot ? 'pointer' : 'default',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            {item.spot ? (
                              <>
                                <img
                                  src={sanitizeImageSrc(item.spot.thumbUrl || item.spot.fileUrl)}
                                  alt="thumb"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (target.src !== FALLBACK_IMAGE_URL) target.src = FALLBACK_IMAGE_URL;
                                  }}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                />
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{item.day}</span>
                                </div>
                              </>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.day}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {profileSubTab === 'saved' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
              {savedSpots.map((s) => (
                <div key={s.id} onClick={() => handleOpenSpot(s)} style={{ height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#000', position: 'relative' }}>
                  {s.fileType === 'video' ? (
                    <video src={s.fileUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img
                      src={sanitizeImageSrc(s.thumbUrl || s.fileUrl)}
                      alt={s.title}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== FALLBACK_IMAGE_URL) target.src = FALLBACK_IMAGE_URL;
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
              {savedSpots.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '12px' }}>
                  保存したスポットがありません ❤️
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

    {/* ボトムナビゲーション（複数投稿フルスクリーン一覧表示中は重なり防止のため非表示） */}
    {!isMultiPostsModalOpen && (
      <nav style={{ position: 'fixed', bottom: '12px', left: '16px', right: '16px', maxWidth: '420px', margin: '0 auto', height: '60px', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid #cbd5e1', borderRadius: '30px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 99999, boxSizing: 'border-box', padding: '0 8px', touchAction: 'manipulation' }}>
        <button onClick={() => { setSelectedSpot(null); setCurrentTab('map'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: currentTab === 'map' ? 'bold' : 'normal', color: currentTab === 'map' ? themeAccent : '#64748b', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, touchAction: 'manipulation' }}>
          <span style={{ fontSize: '20px' }}>🗺️</span><span>{t('map')}</span>
        </button>
        <button onClick={() => { setSelectedSpot(null); setCurrentTab('timeline'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: currentTab === 'timeline' ? 'bold' : 'normal', color: currentTab === 'timeline' ? themeAccent : '#64748b', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, touchAction: 'manipulation' }}>
          <span style={{ fontSize: '20px' }}>🗓️</span><span>{t('feed')}</span>
        </button>
        <button onClick={() => { setSelectedSpot(null); setCurrentTab('ranking'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: currentTab === 'ranking' ? 'bold' : 'normal', color: currentTab === 'ranking' ? themeAccent : '#64748b', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, touchAction: 'manipulation' }}>
          <span style={{ fontSize: '20px' }}>🏆</span><span>{t('ranking')}</span>
        </button>
        <button onClick={() => { setSelectedSpot(null); setCurrentTab('profile'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: currentTab === 'profile' ? 'bold' : 'normal', color: currentTab === 'profile' ? themeAccent : '#64748b', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, touchAction: 'manipulation' }}>
          <span style={{ fontSize: '20px' }}>👤</span><span>{t('profile')}</span>
        </button>
      </nav>
    )}

    {isSettingsOpen && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', touchAction: 'manipulation' }}>
        <div className="scrollable-content" style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '400px', width: '100%', maxHeight: '85vh', overflowY: 'auto', touchAction: 'pan-y' }}>
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
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', marginBottom: '6px', boxSizing: 'border-box', touchAction: 'manipulation' }}
            />

            <div className="scrollable-content" style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', touchAction: 'pan-y' }}>
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

    {isEulaModalOpen && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', touchAction: 'manipulation' }}>
        <div className="scrollable-content" style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '80vh', overflowY: 'auto', touchAction: 'pan-y' }}>
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

    {isGuideModalOpen && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', touchAction: 'manipulation' }}>
        <div className="scrollable-content" style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '80vh', overflowY: 'auto', touchAction: 'pan-y', whiteSpace: 'pre-line', fontSize: '13px', lineHeight: '1.6' }}>
          {t('guideFullText')}
          <button onClick={() => setIsGuideModalOpen(false)} style={{ width: '100%', padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' }}>
            {t('close')}
          </button>
        </div>
      </div>
    )}

    {/* 詳細モーダル */}
    {selectedSpot && (
      <div className="scrollable-content" style={{ position: 'fixed', inset: 0, background: '#ffffff', color: '#0f172a', zIndex: 2000, display: 'flex', flexDirection: 'column', overflowY: 'auto', boxSizing: 'border-box', touchAction: 'pan-y', paddingBottom: '90px' }}>
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
                <video src={currentMedia.fileUrl} controls autoPlay loop muted={false} playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <img
                  src={sanitizeImageSrc(currentMedia.fileUrl)}
                  alt={selectedSpot.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== FALLBACK_IMAGE_URL) target.src = FALLBACK_IMAGE_URL;
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              );
            })()}

            {selectedSpot.mediaList && selectedSpot.mediaList.length > 1 && (
              <div style={{ position: 'absolute', bottom: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                📷 {activeMediaIndex + 1} / {selectedSpot.mediaList.length} (タップして次の写真へ)
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', boxSizing: 'border-box' }}>
            <a
              href={`[https://www.google.com/maps/search/?api=1&query=$](https://www.google.com/maps/search/?api=1&query=$){selectedSpot.lat},${selectedSpot.lon}`}
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
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
              {selectedSpot.mediaList && selectedSpot.mediaList[activeMediaIndex]?.title ? selectedSpot.mediaList[activeMediaIndex].title : selectedSpot.title}
            </h2>
            <button
              onClick={() => handleTranslateDescription(selectedSpot.id, selectedSpot.mediaList?.[activeMediaIndex]?.description || selectedSpot.description)}
              style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '16px', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t('translate')}
            </button>
          </div>

          <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
            {translatedDescriptions[selectedSpot.id] || (selectedSpot.mediaList?.[activeMediaIndex]?.description || selectedSpot.description)}
          </p>

          {selectedSpot.hasParking && (
            <div style={{ fontSize: '12px', color: '#15803d', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #bbf7d0', fontWeight: 'bold' }}>
              🅿️ 駐車場ありスポット
            </div>
          )}

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                💬 コメント ({selectedSpot.comments?.length || 0})
              </h3>
              {replyTargetUser && (
                <span onClick={() => setReplyTargetUser(null)} style={{ color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}>返信先: @{replyTargetUser} (解除 ✕)</span>
              )}
            </div>

            <div className="scrollable-content" style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', touchAction: 'pan-y' }}>
              {selectedSpot.comments?.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setReplyTargetUser(c.userName)}
                  style={{ background: replyTargetUser === c.userName ? '#e0f2fe' : '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7', marginBottom: '2px' }}>{c.userName} (タップして返信)</div>
                  <div style={{ fontSize: '12px', color: '#334155' }}>{c.text}</div>
                </div>
              ))}
              {(!selectedSpot.comments || selectedSpot.comments.length === 0) && (
                <div style={{ fontSize: '11px', color: '#64748b' }}>コメントはまだありません</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder={replyTargetUser ? `@${replyTargetUser} への返信...` : t('commentPlaceholder')}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', touchAction: 'manipulation' }}
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

    {/* 投稿作成モーダル（プレビュー枠は2本指操作、フォームはスムーズなスクロール・タップ操作に分離） */}
    {pendingUploads.length > 0 && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', touchAction: 'pan-y' }}>
        <div className="scrollable-content" style={{ background: '#ffffff', color: '#0f172a', padding: '20px', borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '82vh', overflowY: 'auto', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', boxSizing: 'border-box', marginBottom: '40px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              📷 投稿の作成 ({currentUploadIndex + 1}/{pendingUploads.length})
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: userAvatar ? `url(${userAvatar}) center/cover` : themeAccent, color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {!userAvatar && userName.charAt(0)}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>{userName}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px', touchAction: 'manipulation' }}>
            <button
              type="button"
              onClick={() => appendMoreMediaInputRef.current?.click()}
              style={{ flex: 1, padding: '7px 10px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', touchAction: 'manipulation' }}
            >
              ＋ 写真・動画を追加する
            </button>
            {pendingUploads.length > 1 && (
              <button
                type="button"
                onClick={() => setSeparateCaptionsMode(prev => !prev)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  background: separateCaptionsMode ? '#0284c7' : '#f8fafc',
                  color: separateCaptionsMode ? '#ffffff' : '#0f172a',
                  border: `1px solid ${separateCaptionsMode ? '#0284c7' : '#cbd5e1'}`,
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                {separateCaptionsMode ? '✓ キャプションを分けて入力中' : '✏️ キャプションを分けて入力する'}
              </button>
            )}
          </div>

          {/* 2本指ピンチイン・アウト＆ドラッグ移動専用エリア */}
          <div
            onMouseDown={(e) => {
              isDraggingRef.current = true;
              dragStartRef.current = { x: e.clientX - previewOffset.x, y: e.clientY - previewOffset.y };
            }}
            onMouseMove={(e) => {
              if (!isDraggingRef.current) return;
              const newX = e.clientX - dragStartRef.current.x;
              const newY = e.clientY - dragStartRef.current.y;
              const limit = 150 * previewScale;
              setPreviewOffset({
                x: Math.max(-limit, Math.min(limit, newX)),
                y: Math.max(-limit, Math.min(limit, newY))
              });
            }}
            onMouseUp={() => { isDraggingRef.current = false; }}
            onMouseLeave={() => { isDraggingRef.current = false; }}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                isDraggingRef.current = true;
                dragStartRef.current = { x: e.touches[0].clientX - previewOffset.x, y: e.touches[0].clientY - previewOffset.y };
                initialPinchDistRef.current = null;
              } else if (e.touches.length === 2) {
                isDraggingRef.current = false;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
                initialScaleRef.current = previewScale;
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minAllowedScale = 0.8;
                const newScale = Math.max(minAllowedScale, Math.min(4.0, initialScaleRef.current * (dist / initialPinchDistRef.current)));
                setPreviewScale(newScale);
              } else if (isDraggingRef.current && e.touches.length === 1) {
                const newX = e.touches[0].clientX - dragStartRef.current.x;
                const newY = e.touches[0].clientY - dragStartRef.current.y;
                const limit = 150 * previewScale;
                setPreviewOffset({
                  x: Math.max(-limit, Math.min(limit, newX)),
                  y: Math.max(-limit, Math.min(limit, newY))
                });
              }
            }}
            onTouchEnd={() => {
              isDraggingRef.current = false;
              initialPinchDistRef.current = null;
            }}
            style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', background: '#000', marginBottom: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', touchAction: 'none' }}
          >
            {pendingUploads[currentUploadIndex].fileType === 'image' ? (
              <img
                src={pendingUploads[currentUploadIndex].fileUrl}
                alt="preview"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== FALLBACK_IMAGE_URL) target.src = FALLBACK_IMAGE_URL;
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${previewScale}) translate(${previewOffset.x / previewScale}px, ${previewOffset.y / previewScale}px)`,
                  transition: isDraggingRef.current ? 'none' : 'transform 0.15s ease-out'
                }}
              />
            ) : (
              <video
                src={pendingUploads[currentUploadIndex].fileUrl}
                controls={false}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${previewScale}) translate(${previewOffset.x / previewScale}px, ${previewOffset.y / previewScale}px)`,
                  transition: isDraggingRef.current ? 'none' : 'transform 0.15s ease-out'
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', touchAction: 'manipulation' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>🔍 2本指でピンチ＆自由なドラッグ移動が可能</span>
            <button
              type="button"
              onClick={() => { setPreviewScale(1); setPreviewOffset({ x: 0, y: 0 }); }}
              style={{ background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '0 8px', height: '28px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', touchAction: 'manipulation' }}
            >
              位置をリセット
            </button>
          </div>

          {(currentUploadIndex === 0 || separateCaptionsMode) && (
            <>
              {currentUploadIndex === 0 && (
                <>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    🏷️ スポットのカテゴリを選択
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px', touchAction: 'manipulation' }}>
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
                            cursor: 'pointer',
                            touchAction: 'manipulation'
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', touchAction: 'manipulation' }}>
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
                            justifyContent: 'space-between',
                            touchAction: 'manipulation'
                          }}
                        >
                          <span>{scope === 'world' ? `🌎 ${t('world')}` : scope === 'friends' ? `👥 ${t('friends')}` : `📍 ${t('myMap')}`}</span>
                          <span>{isSelected ? '☑️' : '☐'}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '12px', touchAction: 'manipulation' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer', touchAction: 'manipulation' }}>
                  <input
                    type="checkbox"
                    checked={pendingUploads[currentUploadIndex].hasParking}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPendingUploads(prev => prev.map((item, idx) => idx === currentUploadIndex ? { ...item, hasParking: checked } : item));
                    }}
                  />
                  <span>🅿️ 駐車場あり</span>
                </label>
                <div style={{ fontSize: '10px', color: '#0284c7', marginTop: '4px', fontWeight: 'bold' }}>
                  💡 ここを記入することで、ドライブユーザーからの「いいね」がつきやすくなります！
                </div>
              </div>

              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>スポット名（タイトル）</label>
              <input
                type="text"
                placeholder="例: 絶景の展望台カフェ"
                value={pendingUploads[currentUploadIndex].title}
                onChange={(e) => {
                  const val = e.target.value;
                  setPendingUploads(prev => prev.map((item, idx) => idx === currentUploadIndex ? { ...item, title: val } : item));
                }}
                style={{ width: '100%', padding: '8px 10px', marginTop: '3px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', touchAction: 'manipulation', boxSizing: 'border-box' }}
              />

              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>思い出・メモ (#タグ)</label>
              <textarea
                rows={2}
                placeholder="思い出や感想を自由に入力 (#絶景)"
                value={pendingUploads[currentUploadIndex].description}
                onChange={(e) => {
                  const val = e.target.value;
                  setPendingUploads(prev => prev.map((item, idx) => idx === currentUploadIndex ? { ...item, description: val } : item));
                }}
                style={{ width: '100%', padding: '8px 10px', marginTop: '3px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', touchAction: 'manipulation', boxSizing: 'border-box' }}
              />
            </>
          )}

          {currentUploadIndex === 0 && (
            <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '12px', position: 'relative', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#15803d', marginBottom: '6px' }}>
                📍 住所・場所名・大学名などを検索
              </div>
              <input
                type="text"
                placeholder="住所・場所名・大学名を入力"
                value={addressSearchQuery}
                onChange={(e) => setAddressSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px', background: '#ffffff', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', touchAction: 'manipulation', boxSizing: 'border-box' }}
              />

              {addressSuggestions.length > 0 && (
                <div style={{ background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', overflow: 'hidden', marginBottom: '6px', border: '1px solid #cbd5e1', zIndex: 700 }}>
                  {addressSuggestions.map((item) => (
                    <div
                      key={item.place_id}
                      onClick={() => handleSelectAddressSuggestion(item)}
                      style={{ padding: '8px 10px', fontSize: '11px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', touchAction: 'manipulation' }}
                    >
                      <span>📍</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.display_name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="number" step="any" placeholder="緯度" value={manualLat} onChange={(e) => setManualLat(e.target.value)} style={{ flex: 1, width: '50%', padding: '5px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px', background: '#ffffff', touchAction: 'manipulation', boxSizing: 'border-box' }} />
                <input type="number" step="any" placeholder="経度" value={manualLon} onChange={(e) => setManualLon(e.target.value)} style={{ flex: 1, width: '50%', padding: '5px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px', background: '#ffffff', touchAction: 'manipulation', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          {currentUploadIndex > 0 && !separateCaptionsMode && (
            <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '12px', fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>
              ✓ 1枚目の場所・キャプション・モード設定を引き継ぎます（上で2枚目以降も微調整できます）
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', touchAction: 'manipulation' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setPendingUploads([])}
              style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '10px', color: '#0f172a', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', touchAction: 'manipulation' }}
            >
              キャンセル
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmPost}
              style={{ flex: 2, padding: '10px', background: themeAccent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: isSubmitting ? 'not-allowed' : 'pointer', touchAction: 'manipulation' }}
            >
              {isSubmitting
                ? '保存中...'
                : currentUploadIndex + 1 < pendingUploads.length
                  ? (separateCaptionsMode ? '次の写真のキャプションへ ➡️' : '次の写真の微調整へ ➡️')
                  : 'マップに反映する 🚀'}
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
</>

```

);
}

```

```
