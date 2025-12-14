import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  File,
  Music,
  FileText,
  Image,
  Video,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface FileUploadProps {
  projectId: number;
  trackId?: number;
  onUploadComplete?: () => void;
}

interface ProjectFile {
  id: number;
  fileName: string;
  fileType: string;
  mimeType: string | null;
  fileSize: number | null;
  version: number;
  isLatest: boolean;
  uploadedBy: string | null;
  notes: string | null;
  createdAt: string;
}

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  audio: Music,
  document: FileText,
  image: Image,
  video: Video,
  other: File,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  audio: 'bg-purple-100 text-purple-800',
  document: 'bg-blue-100 text-blue-800',
  image: 'bg-green-100 text-green-800',
  video: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

export function FileUpload({ projectId, trackId, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Check if S3 is configured
  const { data: config } = trpc.files.config.useQuery();

  // Get files for this project/track
  const { data: files, isLoading: filesLoading } = trpc.files.list.useQuery({
    projectId,
    trackId,
    latestOnly: true,
  });

  // Mutations
  const requestUploadMutation = trpc.files.requestUpload.useMutation();
  const confirmUploadMutation = trpc.files.confirmUpload.useMutation();
  const deleteMutation = trpc.files.delete.useMutation();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    if (!config?.configured) {
      toast.error('File storage is not configured');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Request upload URL
      const uploadRequest = await requestUploadMutation.mutateAsync({
        projectId,
        trackId,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });

      setUploadProgress(20);

      // 2. Upload directly to S3
      const uploadResponse = await fetch(uploadRequest.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      setUploadProgress(80);

      // 3. Confirm upload
      await confirmUploadMutation.mutateAsync({
        projectId,
        trackId,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        storagePath: uploadRequest.storagePath,
        version: uploadRequest.version,
      });

      setUploadProgress(100);
      toast.success(`${file.name} uploaded successfully`);

      // Refresh file list
      utils.files.list.invalidate({ projectId, trackId });
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      // Upload first file (can extend to multiple)
      await uploadFile(droppedFiles[0]);
    },
    [projectId, trackId, config]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    await uploadFile(selectedFiles[0]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (fileId: number) => {
    try {
      const result = await utils.files.getDownloadUrl.fetch({ fileId });
      window.open(result.downloadUrl, '_blank');
    } catch (error) {
      toast.error('Failed to get download URL');
    }
  };

  const handleDelete = async () => {
    if (!deletingFileId) return;

    try {
      await deleteMutation.mutateAsync({ fileId: deletingFileId });
      toast.success('File deleted');
      utils.files.list.invalidate({ projectId, trackId });
      setDeletingFileId(null);
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  if (!config?.configured) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <span>File storage is not configured. Set AWS_S3_BUCKET in environment.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${
              isDragging
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-purple-400'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt"
          />

          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uploading... {uploadProgress}%
              </p>
              <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Audio (500MB), Documents (50MB), Images (10MB)
              </p>
            </>
          )}
        </div>

        {/* File List */}
        {filesLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : files && files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file: ProjectFile) => {
              const Icon = FILE_TYPE_ICONS[file.fileType] || File;
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${FILE_TYPE_COLORS[file.fileType] || FILE_TYPE_COLORS.other}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(file.fileSize)}</span>
                        {file.version > 1 && (
                          <Badge variant="outline" className="text-xs">
                            v{file.version}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingFileId(file.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 py-4">
            No files uploaded yet
          </p>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deletingFileId}
          onOpenChange={(open) => !open && setDeletingFileId(null)}
          title="Delete File"
          description="Are you sure you want to delete this file? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}
