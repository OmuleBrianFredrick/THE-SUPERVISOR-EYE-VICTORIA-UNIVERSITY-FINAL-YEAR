import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storage, ref, uploadBytesResumable, getDownloadURL } from '../../lib/firebase';
import { Camera, Image as ImageIcon, FileText, UploadCloud, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EvidenceUploaderProps {
  reportId: string;
  onUploadComplete?: () => void;
}

export default function EvidenceUploader({ reportId, onUploadComplete }: EvidenceUploaderProps) {
  const { getToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setSuccess(false);
      setProgress(0);
      
      if (selected.type.startsWith('image/')) {
        const url = URL.createObjectURL(selected);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const getFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Process Metadata
      const fileHash = await getFileHash(file);
      const thumbnailDataUrl = await generateThumbnail(file);
      const isVideo = file.type.startsWith('video/');
      const isDocument = file.type.startsWith('application/pdf');
      const mediaType = isVideo ? 'VIDEO' : (isDocument ? 'DOCUMENT' : 'PHOTO');
      
      // We simulate GPS capture from Exif/Browser
      let simulatedLat = 0.3476;
      let simulatedLng = 32.5825; // Kampala
      let capturedAt = new Date(file.lastModified);

      // 2. Upload to Firebase
      const fileName = `reports/${reportId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (error) => {
          console.error('Upload failed:', error);
          setError('Failed to upload file to storage');
          setUploading(false);
        },
        async () => {
          // 3. Get Download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // 4. Save Record to Backend
          const token = await getToken();
          const res = await fetch(`/api/v1/reports/${reportId}/evidence`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              mediaUrl: downloadURL,
              thumbnailUrl: thumbnailDataUrl || downloadURL, // Fallback
              mediaType,
              fileHash,
              outsideGeofence: false, // In real app, calculate distance to task loc
              capturedLat: simulatedLat,
              capturedLng: simulatedLng,
              capturedAt: capturedAt.toISOString()
            })
          });

          if (!res.ok) {
            throw new Error('Failed to save evidence metadata');
          }

          setSuccess(true);
          onUploadComplete?.();
          setTimeout(() => {
            setFile(null);
            setPreviewUrl(null);
            setSuccess(false);
            setProgress(0);
          }, 2000);
          setUploading(false);
        }
      );
    } catch (e: any) {
      setError(e.message);
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
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 relative overflow-hidden">
            {progress > 0 && progress < 100 && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-emerald-100 transition-all duration-300 ease-out z-0" 
                style={{ width: `${progress}%` }} 
              />
            )}
            
            <div className="flex items-center gap-3 z-10">
              {previewUrl ? (
                <img src={previewUrl} className="w-12 h-12 object-cover rounded shadow-sm" alt="Preview" />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center text-slate-500">
                  <FileText className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            
            <div className="z-10 flex items-center gap-3">
              {success ? (
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              ) : uploading ? (
                <span className="text-xs font-bold text-slate-600">{Math.round(progress)}%</span>
              ) : (
                <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded border border-red-200">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {!success && (
            <button 
              onClick={handleUpload} 
              disabled={uploading}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:bg-slate-400"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'UPLOAD EVIDENCE'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
