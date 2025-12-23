import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadButtonProps {
  onUploadSuccess: (url: string, result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  versionType: 'demo' | 'roughMix' | 'finalMix' | 'master';
  trackId?: number;
  currentUrl?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  duration?: number;
  bytes: number;
}

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function FileUploadButton({
  onUploadSuccess,
  onUploadError,
  versionType,
  trackId,
  currentUrl,
  accept = 'audio/*',
  maxSizeMB = 100,
  className,
  disabled = false,
}: FileUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const error = `File size exceeds ${maxSizeMB}MB limit`;
      setUploadStatus('error');
      onUploadError?.(error);
      setTimeout(() => setUploadStatus('idle'), 3000);
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('versionType', versionType);
      if (trackId) {
        formData.append('trackId', trackId.toString());
      }

      // Upload to backend
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || 'Upload failed'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', `${BACKEND_URL}/api/upload/audio`);
        xhr.send(formData);
      });

      const result = await uploadPromise;

      setUploadStatus('success');
      onUploadSuccess(result.secureUrl, result);

      // Reset status after 2 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 2000);
    } catch (error: any) {
      console.error('[FileUpload] Upload failed:', error);
      setUploadStatus('error');
      onUploadError?.(error.message || 'Upload failed');

      // Reset status after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 3000);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getButtonIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  const getButtonText = () => {
    if (uploadStatus === 'uploading') {
      return `Uploading ${uploadProgress}%`;
    }
    if (uploadStatus === 'success') {
      return 'Uploaded!';
    }
    if (uploadStatus === 'error') {
      return 'Upload Failed';
    }
    return currentUrl ? 'Replace File' : 'Upload File';
  };

  const getButtonVariant = () => {
    if (uploadStatus === 'success') return 'default';
    if (uploadStatus === 'error') return 'destructive';
    return currentUrl ? 'secondary' : 'outline';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant={getButtonVariant()}
        size="sm"
        onClick={handleFileSelect}
        disabled={disabled || uploading}
        className={cn('gap-2', className)}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
    </>
  );
}
