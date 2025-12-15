/**
 * Audio Files Page
 *
 * Manage audio files and recordings with full CRUD operations.
 */

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileAudio,
  Plus,
  Pencil,
  Trash2,
  HardDrive,
  Clock,
  FolderOpen,
  Archive,
  AlertCircle,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Types
type AudioFormat = "wav" | "aiff" | "flac" | "mp3" | "aac" | "m4a" | "ogg" | "wma" | "raw" | "other";
type AudioStatus = "uploading" | "processing" | "ready" | "error" | "archived";
type AudioCategory = "recording" | "mix" | "master" | "stem" | "bounce" | "reference" | "sample" | "sfx" | "other";

interface AudioFile {
  id: number;
  filename: string;
  originalFilename: string;
  path: string;
  format: string;
  category: string | null;
  sizeBytes: string | null;
  durationMs: number | null;
  sampleRate: number | null;
  bitDepth: number | null;
  channels: number | null;
  waveformData: string | null;
  waveformPeaks: string | null;
  status: string;
  version: number;
  notes: string | null;
  metadata: string | null;
  transcription: string | null;
  tags: string | null;
  uploadedBy: number | null;
  isPublic: boolean;
  projectId: number | null;
  trackId: number | null;
  sessionId: number | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: number; name: string } | null;
  track?: { id: number; title: string } | null;
  session?: { id: number; title: string } | null;
}

interface AudioFileFormData {
  filename: string;
  category: AudioCategory;
  notes: string;
}

const FORMATS: { id: AudioFormat; name: string; lossless: boolean }[] = [
  { id: "wav", name: "WAV", lossless: true },
  { id: "aiff", name: "AIFF", lossless: true },
  { id: "flac", name: "FLAC", lossless: true },
  { id: "mp3", name: "MP3", lossless: false },
  { id: "aac", name: "AAC", lossless: false },
  { id: "m4a", name: "M4A", lossless: false },
  { id: "ogg", name: "OGG", lossless: false },
  { id: "wma", name: "WMA", lossless: false },
  { id: "raw", name: "RAW", lossless: true },
  { id: "other", name: "Other", lossless: false },
];

const CATEGORIES: { id: AudioCategory; name: string }[] = [
  { id: "recording", name: "Recording" },
  { id: "mix", name: "Mix" },
  { id: "master", name: "Master" },
  { id: "stem", name: "Stem" },
  { id: "bounce", name: "Bounce" },
  { id: "reference", name: "Reference" },
  { id: "sample", name: "Sample" },
  { id: "sfx", name: "SFX" },
  { id: "other", name: "Other" },
];

const STATUSES: { id: AudioStatus; name: string; color: string; icon: React.ElementType }[] = [
  { id: "ready", name: "Ready", color: "bg-green-500", icon: CheckCircle2 },
  { id: "processing", name: "Processing", color: "bg-blue-500", icon: Clock },
  { id: "uploading", name: "Uploading", color: "bg-yellow-500", icon: Upload },
  { id: "error", name: "Error", color: "bg-red-500", icon: AlertCircle },
  { id: "archived", name: "Archived", color: "bg-gray-500", icon: Archive },
];

const defaultFormData: AudioFileFormData = {
  filename: "",
  category: "recording",
  notes: "",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDuration(ms: number | null): string {
  if (!ms) return "-";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function AudioFiles() {
  const [showForm, setShowForm] = useState(false);
  const [editingFile, setEditingFile] = useState<AudioFile | null>(null);
  const [deletingFile, setDeletingFile] = useState<AudioFile | null>(null);
  const [formData, setFormData] = useState<AudioFileFormData>(defaultFormData);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const utils = trpc.useUtils();

  // Queries
  const { data: filesData, isLoading } = trpc.audioFiles.list.useQuery({
    limit: 100,
    category: categoryFilter !== "all" ? (categoryFilter as AudioCategory) : undefined,
    format: formatFilter !== "all" ? (formatFilter as AudioFormat) : undefined,
    status: statusFilter !== "all" ? (statusFilter as AudioStatus) : undefined,
  });
  const { data: statsData } = trpc.audioFiles.stats.useQuery();

  // Mutations
  const updateMutation = trpc.audioFiles.update.useMutation({
    onSuccess: () => {
      toast.success("Audio file updated successfully");
      utils.audioFiles.list.invalidate();
      utils.audioFiles.stats.invalidate();
      handleCloseForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update audio file");
    },
  });

  const deleteMutation = trpc.audioFiles.delete.useMutation({
    onSuccess: () => {
      toast.success("Audio file archived successfully");
      utils.audioFiles.list.invalidate();
      utils.audioFiles.stats.invalidate();
      setDeletingFile(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive audio file");
    },
  });

  // Handlers
  function handleEdit(file: AudioFile) {
    setEditingFile(file);
    setFormData({
      filename: file.filename,
      category: (file.category as AudioCategory) || "recording",
      notes: file.notes || "",
    });
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingFile(null);
    setFormData(defaultFormData);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingFile) {
      updateMutation.mutate({
        id: editingFile.id,
        filename: formData.filename,
        category: formData.category,
        notes: formData.notes || undefined,
      });
    }
  }

  function handleDelete() {
    if (deletingFile) {
      deleteMutation.mutate({ id: deletingFile.id });
    }
  }

  function getFormatBadge(format: string) {
    const fmt = FORMATS.find((f) => f.id === format);
    return (
      <Badge variant={fmt?.lossless ? "default" : "secondary"}>
        {fmt?.name || format.toUpperCase()}
      </Badge>
    );
  }

  function getStatusBadge(status: string) {
    const st = STATUSES.find((s) => s.id === status);
    if (!st) return <Badge variant="outline">{status}</Badge>;
    const Icon = st.icon;
    return (
      <Badge className={`${st.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {st.name}
      </Badge>
    );
  }

  function getCategoryName(categoryId: string | null): string {
    if (!categoryId) return "-";
    return CATEGORIES.find((c) => c.id === categoryId)?.name || categoryId;
  }

  // Table columns
  const columns: Column<AudioFile>[] = [
    {
      key: "filename",
      header: "File",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
            <FileAudio className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-medium">{row.filename}</span>
            <p className="text-sm text-muted-foreground">{row.originalFilename}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.filename.localeCompare(b.filename),
    },
    {
      key: "format",
      header: "Format",
      cell: (row) => getFormatBadge(row.format),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => getCategoryName(row.category),
    },
    {
      key: "size",
      header: "Size",
      cell: (row) => formatBytes(parseInt(row.sizeBytes || "0")),
      sortable: true,
      sortFn: (a, b) => parseInt(a.sizeBytes || "0") - parseInt(b.sizeBytes || "0"),
    },
    {
      key: "duration",
      header: "Duration",
      cell: (row) => formatDuration(row.durationMs),
      sortable: true,
      sortFn: (a, b) => (a.durationMs || 0) - (b.durationMs || 0),
    },
    {
      key: "project",
      header: "Project",
      cell: (row) => row.project?.name || "-",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => getStatusBadge(row.status),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingFile(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ];

  const files = filesData?.files || [];

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileAudio className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Audio Files</h1>
              <p className="text-muted-foreground">
                Manage your audio files and recordings
              </p>
            </div>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Upload Files (Coming Soon)
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileAudio className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{statsData?.total || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {statsData?.ready || 0}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">
                  {statsData?.totalSizeFormatted || "0 Bytes"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold text-purple-600">
                  {statsData?.totalDurationFormatted || "0s"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Format & Category Distribution */}
        <div className="grid gap-4 md:grid-cols-2">
          {statsData?.byFormat && Object.keys(statsData.byFormat).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  By Format
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statsData.byFormat).map(([format, count]) => (
                    <div key={format} className="flex items-center gap-2">
                      {getFormatBadge(format)}
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {statsData?.byCategory && Object.keys(statsData.byCategory).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  By Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statsData.byCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center gap-2">
                      <Badge variant="outline">{getCategoryName(category)}</Badge>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Files Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Audio Files</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    {FORMATS.map((fmt) => (
                      <SelectItem key={fmt.id} value={fmt.id}>
                        {fmt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUSES.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={files}
              columns={columns}
              getRowKey={(row) => row.id}
              searchable
              searchPlaceholder="Search files..."
              searchFilter={(row, query) =>
                row.filename.toLowerCase().includes(query) ||
                row.originalFilename.toLowerCase().includes(query) ||
                (row.project?.name?.toLowerCase().includes(query) ?? false)
              }
              paginated
              pageSize={10}
              isLoading={isLoading}
              emptyMessage="No audio files found."
              onRowClick={handleEdit}
            />
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Audio File</DialogTitle>
                <DialogDescription>
                  Update the audio file details below.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="filename">Filename</Label>
                  <Input
                    id="filename"
                    value={formData.filename}
                    onChange={(e) =>
                      setFormData({ ...formData, filename: e.target.value })
                    }
                    placeholder="e.g., track_01_vocals.wav"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: AudioCategory) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes about this file..."
                    rows={3}
                  />
                </div>

                {editingFile && (
                  <div className="rounded-lg border p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Format:</span>
                      <span>{FORMATS.find((f) => f.id === editingFile.format)?.name || editingFile.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{formatBytes(parseInt(editingFile.sizeBytes || "0"))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formatDuration(editingFile.durationMs)}</span>
                    </div>
                    {editingFile.sampleRate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sample Rate:</span>
                        <span>{editingFile.sampleRate} Hz</span>
                      </div>
                    )}
                    {editingFile.bitDepth && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bit Depth:</span>
                        <span>{editingFile.bitDepth} bit</span>
                      </div>
                    )}
                    {editingFile.channels && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Channels:</span>
                        <span>{editingFile.channels === 1 ? "Mono" : editingFile.channels === 2 ? "Stereo" : `${editingFile.channels}ch`}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForm}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deletingFile}
          onOpenChange={(open) => !open && setDeletingFile(null)}
          title="Archive Audio File"
          description={`Are you sure you want to archive "${deletingFile?.filename}"? The file will be moved to archived status but not permanently deleted.`}
          confirmLabel="Archive"
          onConfirm={handleDelete}
          variant="warning"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
