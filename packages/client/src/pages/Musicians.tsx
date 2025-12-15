/**
 * Musicians Page
 *
 * Manage musicians and session contributors with full CRUD operations.
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Music2,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Award,
  Guitar,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Types
interface Musician {
  id: number;
  name: string;
  stageName: string | null;
  email: string | null;
  phone: string | null;
  instruments: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MusicianFormData {
  name: string;
  stageName: string;
  email: string;
  phone: string;
  instruments: string;
  bio: string;
}

const defaultFormData: MusicianFormData = {
  name: "",
  stageName: "",
  email: "",
  phone: "",
  instruments: "",
  bio: "",
};

export default function Musicians() {
  const [showForm, setShowForm] = useState(false);
  const [editingMusician, setEditingMusician] = useState<Musician | null>(null);
  const [deletingMusician, setDeletingMusician] = useState<Musician | null>(null);
  const [formData, setFormData] = useState<MusicianFormData>(defaultFormData);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const { data: musiciansData, isLoading } = trpc.musicians.list.useQuery({
    limit: 100,
    isActive: showActiveOnly ? true : undefined,
  });
  const { data: statsData } = trpc.musicians.stats.useQuery();

  // Mutations
  const createMutation = trpc.musicians.create.useMutation({
    onSuccess: () => {
      toast.success("Musician added successfully");
      utils.musicians.list.invalidate();
      utils.musicians.stats.invalidate();
      handleCloseForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add musician");
    },
  });

  const updateMutation = trpc.musicians.update.useMutation({
    onSuccess: () => {
      toast.success("Musician updated successfully");
      utils.musicians.list.invalidate();
      utils.musicians.stats.invalidate();
      handleCloseForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update musician");
    },
  });

  const deleteMutation = trpc.musicians.delete.useMutation({
    onSuccess: () => {
      toast.success("Musician removed successfully");
      utils.musicians.list.invalidate();
      utils.musicians.stats.invalidate();
      setDeletingMusician(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove musician");
    },
  });

  // Handlers
  function handleCreate() {
    setEditingMusician(null);
    setFormData(defaultFormData);
    setShowForm(true);
  }

  function handleEdit(musician: Musician) {
    setEditingMusician(musician);
    setFormData({
      name: musician.name,
      stageName: musician.stageName || "",
      email: musician.email || "",
      phone: musician.phone || "",
      instruments: musician.instruments || "",
      bio: musician.bio || "",
    });
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingMusician(null);
    setFormData(defaultFormData);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const instruments = formData.instruments
      ? formData.instruments.split(",").map((i) => i.trim()).filter(Boolean)
      : undefined;

    const data = {
      name: formData.name,
      stageName: formData.stageName || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      instruments,
      bio: formData.bio || undefined,
    };

    if (editingMusician) {
      updateMutation.mutate({ id: editingMusician.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleDelete() {
    if (deletingMusician) {
      deleteMutation.mutate({ id: deletingMusician.id });
    }
  }

  function handleToggleActive(musician: Musician) {
    updateMutation.mutate({
      id: musician.id,
      isActive: !musician.isActive,
    });
  }

  // Parse instruments string to array
  function getInstrumentsBadges(instrumentsStr: string | null) {
    if (!instrumentsStr) return null;
    const instruments = instrumentsStr.split(",").map((i) => i.trim()).filter(Boolean);
    if (instruments.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {instruments.slice(0, 3).map((inst) => (
          <Badge key={inst} variant="secondary" className="text-xs">
            {inst}
          </Badge>
        ))}
        {instruments.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{instruments.length - 3}
          </Badge>
        )}
      </div>
    );
  }

  // Table columns
  const columns: Column<Musician>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Music2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-medium">{row.name}</span>
            {row.stageName && (
              <p className="text-sm text-muted-foreground">"{row.stageName}"</p>
            )}
          </div>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (row) => (
        <div className="space-y-1">
          {row.email && (
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3" />
              {row.email}
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              {row.phone}
            </div>
          )}
          {!row.email && !row.phone && <span className="text-muted-foreground">-</span>}
        </div>
      ),
    },
    {
      key: "instruments",
      header: "Instruments",
      cell: (row) => getInstrumentsBadges(row.instruments) || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.isActive}
            onCheckedChange={() => handleToggleActive(row)}
            onClick={(e) => e.stopPropagation()}
          />
          {row.isActive ? (
            <Badge className="bg-green-500 text-white">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
      ),
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
              setDeletingMusician(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ];

  const musiciansList = musiciansData?.musicians || [];

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Music2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Musicians</h1>
              <p className="text-muted-foreground">
                Manage your musicians and session contributors
              </p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Musician
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Musicians
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{statsData?.total || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Musicians
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
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">
                  {statsData?.totalCredits || 0}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Instruments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Guitar className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">
                  {statsData?.uniqueInstruments || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instruments Overview */}
        {statsData?.instruments && statsData.instruments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Guitar className="h-5 w-5" />
                Instruments in Your Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {statsData.instruments.map((instrument) => (
                  <Badge key={instrument} variant="outline">
                    {instrument}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Musicians Grid */}
        {musiciansList.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {musiciansList.slice(0, 6).map((musician) => (
              <Card
                key={musician.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  !musician.isActive ? "opacity-60" : ""
                }`}
                onClick={() => handleEdit(musician)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Music2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{musician.name}</CardTitle>
                        {musician.stageName && (
                          <p className="text-sm text-muted-foreground">
                            "{musician.stageName}"
                          </p>
                        )}
                      </div>
                    </div>
                    {musician.isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {musician.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {musician.email}
                      </div>
                    )}
                    {musician.instruments && (
                      <div className="pt-2">
                        {getInstrumentsBadges(musician.instruments)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Musicians Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Musicians</CardTitle>
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
              data={musiciansList}
              columns={columns}
              getRowKey={(row) => row.id}
              searchable
              searchPlaceholder="Search musicians..."
              searchFilter={(row, query) =>
                row.name.toLowerCase().includes(query) ||
                (row.stageName?.toLowerCase().includes(query) ?? false) ||
                (row.email?.toLowerCase().includes(query) ?? false) ||
                (row.instruments?.toLowerCase().includes(query) ?? false)
              }
              paginated
              pageSize={10}
              isLoading={isLoading}
              emptyMessage="No musicians found. Add your first musician!"
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
                  {editingMusician ? "Edit Musician" : "Add Musician"}
                </DialogTitle>
                <DialogDescription>
                  {editingMusician
                    ? "Update the musician's information."
                    : "Add a new musician to your network."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stageName">Stage Name</Label>
                    <Input
                      id="stageName"
                      value={formData.stageName}
                      onChange={(e) =>
                        setFormData({ ...formData, stageName: e.target.value })
                      }
                      placeholder="DJ Smooth"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instruments">Instruments (comma-separated)</Label>
                  <Input
                    id="instruments"
                    value={formData.instruments}
                    onChange={(e) =>
                      setFormData({ ...formData, instruments: e.target.value })
                    }
                    placeholder="Guitar, Bass, Keyboards"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Brief biography or notes about the musician..."
                    rows={3}
                  />
                </div>
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
                    : editingMusician
                    ? "Update"
                    : "Add Musician"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deletingMusician}
          onOpenChange={(open) => !open && setDeletingMusician(null)}
          title="Remove Musician"
          description={`Are you sure you want to remove "${deletingMusician?.name}"? If they have project credits, they will be deactivated instead of deleted.`}
          confirmLabel="Remove"
          onConfirm={handleDelete}
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
