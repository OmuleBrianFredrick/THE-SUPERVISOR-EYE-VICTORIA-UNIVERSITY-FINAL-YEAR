import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storage, ref, uploadBytesResumable, getDownloadURL } from '../../lib/firebase';
import { Camera, Image as ImageIcon, FileText, UploadCloud, X, CheckCircle, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { enqueueSync } from '../../lib/syncQueue';

interface EvidenceUploaderProps {
  reportId: string;
  onUploadComplete?: (newEvidence?: any) => void;
  onUploadSuccess?: (newEvidence?: any) => void;
}

export default function EvidenceUploader({ reportId, onUploadComplete, onUploadSuccess }: EvidenceUploaderProps) {
  const { getToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [locationName, setLocationName] = useState<string>('');
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
       window.removeEventListener('online', handleOnline);
       window.removeEventListener('offline', handleOffline);
    }
  }, []);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setError(null);
      setSuccess(false);
      setProgress(0);

      // Validate File Type
      const isImage = selected.type.startsWith('image/');
      const isVideo = selected.type.startsWith('video/');
      const isDoc = selected.type === 'application/pdf';

      if (!isImage && !isVideo && !isDoc) {
        setError('Invalid file type. Only Images, Videos, and PDFs are allowed.');
        return;
      }

      // Validate File Size (Max 50MB)
      const MAX_SIZE = 50 * 1024 * 1024;
      if (selected.size > MAX_SIZE) {
        setError('File size exceeds the 50MB limit.');
        return;
      }

      setFile(selected);
      
      if (isImage) {
        const url = URL.createObjectURL(selected);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const getFileHash = async (file: File): Promise<string> => {
    try {
      if (!window.crypto || !window.crypto.subtle) {
        return `${file.name}-${file.size}-${file.lastModified}`;
      }
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Hash generation failed, using fallback hash format', e);
      return `${file.name}-${file.size}-${file.lastModified}`;
    }
  };

  const generateThumbnail = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) return resolve(null);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compressed thumbnail
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleCaptureLocation = () => {
    setIsCapturingLocation(true);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsCapturingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // In a real app, you would use a reverse-geocoding service here
        // like Google Maps API or Nominatim to get the area name.
        // For now we just set the exact coordinates as string, 
        // or a simulated area name.
        setLocationName(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setIsCapturingLocation(false);
      },
      (err) => {
        setError('Failed to capture location.');
        setIsCapturingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(5);

    try {
      // 1. Process Metadata
      const fileHash = await getFileHash(file);
      const thumbnailDataUrl = await generateThumbnail(file);
      const isVideo = file.type.startsWith('video/');
      const isDocument = file.type.startsWith('application/pdf');
      const mediaType = isVideo ? 'VIDEO' : (isDocument ? 'DOCUMENT' : 'PHOTO');
      
      let capturedAt = new Date(file.lastModified);

      // Get actual GPS location if possible, else fallback to default coordinates
      let capturedLat = 0.3476;
      let capturedLng = 32.5825; // Kampala
      
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        capturedLat = pos.coords.latitude;
        capturedLng = pos.coords.longitude;
      } catch (err) {
        console.warn('Geolocation failed or denied, using default coordinates');
      }

      const token = await getToken();

      if (locationName && !reportId.startsWith('offline_')) {
        try {
          await fetch(`/api/v1/reports/${reportId}/status`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ locationName })
          });
        } catch (e) {
          console.error("Failed to patch location Name", e);
        }
      }

      if (!navigator.onLine || reportId.startsWith('offline_')) {
         // Queue offline upload
         await enqueueSync('UPLOAD_EVIDENCE', {
            reportId,
            file,
            fileHash,
            thumbnailDataUrl,
            mediaType,
            capturedLat,
            capturedLng,
            capturedAt: capturedAt.toISOString()
         });
         setProgress(100);
         setSuccess(true);
         onUploadComplete?.();
         onUploadSuccess?.();
         setTimeout(() => {
           setFile(null);
           setPreviewUrl(null);
           setSuccess(false);
           setProgress(0);
         }, 2000);
         setUploading(false);
         return;
      }

      // 2. Read file as Data URL with progress tracking (10% -> 45%)
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const p = 10 + Math.round((e.loaded / e.total) * 35);
            setProgress(p);
          }
        };
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file contents'));
        reader.readAsDataURL(file);
      });

      setProgress(48);

      // 3. Upload payload via XHR to track HTTP upload progress (50% -> 98%)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const p = 50 + Math.round((e.loaded / e.total) * 45); // 50% -> 95%
            setProgress(p);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const newEv = JSON.parse(xhr.responseText);
              setProgress(100);
              setSuccess(true);
              onUploadComplete?.(newEv);
              onUploadSuccess?.(newEv);
              setTimeout(() => {
                setFile(null);
                setPreviewUrl(null);
                setSuccess(false);
                setProgress(0);
              }, 2000);
              resolve();
            } catch (err) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            let errMsg = 'Failed to upload evidence';
            try {
              const errData = JSON.parse(xhr.responseText);
              if (errData.error) errMsg = errData.error;
            } catch (e) {}
            reject(new Error(errMsg));
          }
        };

        xhr.onerror = () => reject(new Error('Network connection error while uploading evidence'));

        xhr.open('POST', `/api/v1/reports/${reportId}/evidence`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(JSON.stringify({
          fileData,
          fileName: file.name,
          thumbnailUrl: thumbnailDataUrl,
          mediaType,
          fileHash,
          outsideGeofence: false,
          capturedLat,
          capturedLng,
          capturedAt: capturedAt.toISOString()
        }));
      });

    } catch (e: any) {
      console.error("Evidence upload error:", e);
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-slate-500" />
        Add Evidence
      </h3>

      {!file ? (
        <div 
           className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition"
           onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex gap-4 mb-4 text-slate-400">
            <Camera className="w-8 h-8" />
            <ImageIcon className="w-8 h-8" />
            <FileText className="w-8 h-8" />
          </div>
          <p className="font-bold text-slate-700">Click to capture or upload</p>
          <p className="text-xs text-slate-500 mt-2">JPEG, PNG, MP4, or PDF (Max 20MB)</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*,application/pdf"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 relative overflow-hidden shadow-xs">
            {uploading && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-emerald-200/60 transition-all duration-300 ease-out z-0" 
                style={{ width: `${Math.max(4, Math.min(100, progress))}%` }} 
              />
            )}
            
            <div className="flex items-center gap-3 z-10">
              {previewUrl ? (
                <img src={previewUrl} className="w-12 h-12 object-cover rounded-lg shadow-sm border border-slate-200" alt="Preview" />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-bold border border-slate-300">
                  <FileText className="w-6 h-6 text-slate-500" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{file.name}</p>
                <p className="text-xs text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            
            <div className="z-10 flex items-center gap-2">
              {success ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-black text-xs bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 shadow-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>100% Uploaded</span>
                </div>
              ) : uploading ? (
                <div className="flex items-center gap-1.5 font-black text-xs text-emerald-900 bg-emerald-200/90 px-3 py-1 rounded-full border border-emerald-400 shadow-xs animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  <span>{Math.round(progress)}%</span>
                </div>
              ) : (
                <button type="button" onClick={() => { setFile(null); setPreviewUrl(null); }} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {uploading && (
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div 
                className="bg-emerald-500 h-full transition-all duration-200 ease-out"
                style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
              />
            </div>
          )}

          {error && (
            <div className="text-xs text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded border border-red-200">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {!success && (
            <>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Location / Area"
                  className="flex-1 text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button 
                  type="button"
                  onClick={handleCaptureLocation} 
                  disabled={isCapturingLocation}
                  className="px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  {isCapturingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'SHARE GPS'}
                </button>
              </div>
              <button 
                type="button"
                onClick={handleUpload} 
                disabled={uploading}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:bg-slate-400"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'UPLOAD EVIDENCE'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
