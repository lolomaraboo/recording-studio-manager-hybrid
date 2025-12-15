/**
 * Shares Page
 *
 * Manage file sharing links with external parties.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Share2,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Link,
  Lock,
  Clock,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Types
type AccessType = "view" | "download" | "comment" | "edit";

interface FileShare {
  id: number;
  shareToken: string;
  name: string;
  accessType: string;
  password: string | null;
  expiresAt: string | null;
  maxDownloads: number | null;
  downloadCount: number;
  allowedEmails: string | null;
  isActive: boolean;
  createdBy: string;
  projectId: number | null;
  fileId: number | null;
  createdAt: string;
  updatedAt: string;
  shareUrl?: string;
  project?: { id: number; name: string } | null;
  file?: { id: number; fileName: string } | null;
}

interface ShareFormData {
  name: string;
  accessType: AccessType;
  password: string;
  expiresAt: string;
  maxDownloads: string;
  allowedEmails: string;
}

const ACCESS_TYPES: { id: AccessType; name: string; icon: React.ElementType }[] = [
  { id: "view", name: "View Only", icon: Eye },
  { id: "download", name: "Download", icon: Download },
  { id: "comment", name: "Comment", icon: Eye },
  { id: "edit", name: "Edit", icon: Pencil },
];

const defaultFormData: ShareFormData = {
  name: "",
  accessType: "view",
  password: "",
  expiresAt: "",
  maxDownloads: "",
  allowedEmails: "",
};

export default function Shares() {
  const [showForm, setShowForm] = useState(false);
  const [editingShare, setEditingShare] = useState<FileShare | null>(null);
  const [deletingShare, setDeletingShare] = useState<FileShare | null>(null);
  const [formData, setFormData] = useState<ShareFormData>(defaultFormData);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const { data: sharesData, isLoading } = trpc.shares.list.useQuery({
    limit: 100,
    isActive: showActiveOnly ? true : undefined,
  });
  const { data: statsData } = trpc.shares.stats.useQuery();

  // Mutations
  const createMutation = trpc.shares.create.useMutation({
    onSuccess: (data) => {
      toast.success("Share link created successfully");
      if (data.shareUrl) {
        navigator.clipboard.writeText(data.shareUrl);
        toast.info("Share link copied to clipboard");
      }
      utils.shares.list.invalidate();
      utils.shares.stats.invalidate();
      handleCloseForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create share link");
    },
  });

  const updateMutation = trpc.shares.update.useMutation({
    onSuccess: () => {
      toast.success("Share link updated successfully");
      utils.shares.list.invalidate();
      utils.shares.stats.invalidate();
      handleCloseForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update share link");
    },
  });

  const deleteMutation = trpc.shares.delete.useMutation({
    onSuccess: () => {
      toast.success("Share link deleted successfully");
      utils.shares.list.invalidate();
      utils.shares.stats.invalidate();
      setDeletingShare(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete share link");
    },
  });

  // Handlers
  function handleCreate() {
    setEditingShare(null);
    setFormData(defaultFormData);
    setShowForm(true);
  }

  function handleEdit(share: FileShare) {
    setEditingShare(share);
    let allowedEmailsStr = "";
    if (share.allowedEmails) {
      try {
        const emails = JSON.parse(share.allowedEmails);
        allowedEmailsStr = Array.isArray(emails) ? emails.join(", ") : "";
      } catch {
        allowedEmailsStr = share.allowedEmails;
      }
    }
    setFormData({
      name: share.name,
      accessType: share.accessType as AccessType,
      password: "", // Don't show existing password
      expiresAt: share.expiresAt ? share.expiresAt.split("T")[0] : "",
      maxDownloads: share.maxDownloads?.toString() || "",
      allowedEmails: allowedEmailsStr,
    });
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingShare(null);
    setFormData(defaultFormData);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const allowedEmails = formData.allowedEmails
      ? formData.allowedEmails.split(",").map((e) => e.trim()).filter(Boolean)
      : undefined;

    if (editingShare) {
      updateMutation.mutate({
        id: editingShare.id,
        name: formData.name,
        accessType: formData.accessType,
        password: formData.password || null,
        expiresAt: formData.expiresAt || null,
        maxDownloads: formData.maxDownloads ? parseInt(formData.maxDownloads) : null,
        allowedEmails: allowedEmails || null,
      });
    } else {
      // Note: Create needs projectId or fileId - for demo we'll show a message
      toast.error("To create a share, please use the project or file detail page");
      handleCloseForm();
    }
  }

  function handleDelete() {
    if (deletingShare) {
      deleteMutation.mutate({ id: deletingShare.id });
    }
  }

  function handleCopyLink(share: FileShare) {
    if (share.shareUrl) {
      navigator.clipboard.writeText(share.shareUrl);
      toast.success("Link copied to clipboard");
    }
  }

  function handleToggleActive(share: FileShare) {
    updateMutation.mutate({
      id: share.id,
      isActive: !share.isActive,
    });
  }

  function getAccessTypeBadge(accessType: string) {
    const type = ACCESS_TYPES.find((t) => t.id === accessType);
    if (!type) return <Badge variant="outline">{accessType}</Badge>;
    const Icon = type.icon;
    return (
      <Badge variant="secondary">
        <Icon className="h-3 w-3 mr-1" />
        {type.name}
      </Badge>
    );
  }

  function getStatusBadge(share: FileShare) {
    if (!share.isActive) {
      return (
        <Badge variant="secondary">
          <XCircle className="h-3 w-3 mr-1" />
          Disabled
        </Badge>
      );
    }
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return (
        <Badge className="bg-red-500 text-white">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
      return (
        <Badge className="bg-orange-500 text-white">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Limit Reached
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500 text-white">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  }

  // Table columns
  const columns: Column<FileShare>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
            <Link className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-medium">{row.name}</span>
            <p className="text-sm text-muted-foreground">
              {row.project?.name || row.file?.fileName || "All Files"}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "access",
      header: "Access",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {getAccessTypeBadge(row.accessType)}
          {row.password && (
            <span title="Password protected">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </span>
          )}
        </div>
      ),
    },
    {
      key: "downloads",
      header: "Downloads",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Download className="h-4 w-4 text-muted-foreground" />
          <span>
            {row.downloadCount}
            {row.maxDownloads && ` / ${row.maxDownloads}`}
          </span>
        </div>
      ),
    },
    {
      key: "expires",
      header: "Expires",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {formatDate(row.expiresAt)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => getStatusBadge(row),
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
              handleCopyLink(row);
            }}
            title="Copy link"
          >
            <Copy className="h-4 w-4" />
          </Button>
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
              setDeletingShare(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-32",
    },
  ];

  const shares = sharesData?.shares || [];

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Share2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Shares</h1>
              <p className="text-muted-foreground">
                Manage secure file sharing links
              </p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Share
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Shares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{statsData?.total || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {statsData?.active || 0}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold text-orange-600">
                  {statsData?.expired || 0}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Downloads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">
                  {statsData?.totalDownloads || 0}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Access (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold text-purple-600">
                  {statsData?.recentAccess || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shares Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Share Links</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="activeOnly" className="text-sm">
                  Active only
                </Label>
                <Switch
                  id="activeOnly"
                  checked={showActiveOnly}
                  onCheckedChange={setShowActiveOnly}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={shares}
              columns={columns}
              getRowKey={(row) => row.id}
              searchable
              searchPlaceholder="Search shares..."
              searchFilter={(row, query) =>
                row.name.toLowerCase().includes(query) ||
                (row.project?.name?.toLowerCase().includes(query) ?? false) ||
                (row.createdBy?.toLowerCase().includes(query) ?? false)
              }
              paginated
              pageSize={10}
              isLoading={isLoading}
              emptyMessage="No share links found. Create one to share your files!"
              onRowClick={handleEdit}
            />
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingShare ? "Edit Share Link" : "Create Share Link"}
                </DialogTitle>
                <DialogDescription>
                  {editingShare
                    ? "Update the share link settings."
                    : "Configure your share link settings."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Final Mix for Review"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessType">Access Type</Label>
                  <Select
                    value={formData.accessType}
                    onValueChange={(value: AccessType) =>
                      setFormData({ ...formData, accessType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={editingShare ? "Leave empty to keep current" : "Enter password"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expires On</Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) =>
                        setFormData({ ...formData, expiresAt: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDownloads">Max Downloads</Label>
                    <Input
                      id="maxDownloads"
                      type="number"
                      value={formData.maxDownloads}
                      onChange={(e) =>
                        setFormData({ ...formData, maxDownloads: e.target.value })
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedEmails">Allowed Emails (optional)</Label>
                  <Input
                    id="allowedEmails"
                    value={formData.allowedEmails}
                    onChange={(e) =>
                      setFormData({ ...formData, allowedEmails: e.target.value })
                    }
                    placeholder="email1@example.com, email2@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of emails that can access this share
                  </p>
                </div>

                {editingShare && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label>Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Share link is accessible
                      </p>
                    </div>
                    <Switch
                      checked={editingShare.isActive}
                      onCheckedChange={() => handleToggleActive(editingShare)}
                    />
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
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingShare
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deletingShare}
          onOpenChange={(open) => !open && setDeletingShare(null)}
          title="Delete Share Link"
          description={`Are you sure you want to delete "${deletingShare?.name}"? Anyone with this link will no longer be able to access the shared content.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
