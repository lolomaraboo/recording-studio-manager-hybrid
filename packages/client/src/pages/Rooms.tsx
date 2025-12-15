/**
 * Rooms Page
 *
 * Manage studio rooms with full CRUD operations.
 */

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Home,
  Plus,
  Pencil,
  Trash2,
  Users,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";

// Types
interface Room {
  id: number;
  name: string;
  description: string | null;
  hourlyRate: string;
  capacity: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoomFormData {
  name: string;
  description: string;
  hourlyRate: string;
  capacity: string;
  isActive: boolean;
}

const defaultFormData: RoomFormData = {
  name: "",
  description: "",
  hourlyRate: "",
  capacity: "",
  isActive: true,
};

export default function Rooms() {
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>(defaultFormData);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const { data: roomsData, isLoading } = trpc.rooms.list.useQuery({
    limit: 100,
    activeOnly: showActiveOnly,
  });

  // Mutations
  const createMutation = trpc.rooms.create.useMutation({
    onSuccess: () => {
      toast.success("Room created successfully");
      utils.rooms.list.invalidate();
      handleCloseForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create room");
    },
  });

  const updateMutation = trpc.rooms.update.useMutation({
    onSuccess: () => {
      toast.success("Room updated successfully");
      utils.rooms.list.invalidate();
      handleCloseForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update room");
    },
  });

  const deleteMutation = trpc.rooms.delete.useMutation({
    onSuccess: () => {
      toast.success("Room deleted successfully");
      utils.rooms.list.invalidate();
      setDeletingRoom(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete room");
    },
  });

  // Handlers
  function handleCreate() {
    setEditingRoom(null);
    setFormData(defaultFormData);
    setShowForm(true);
  }

  function handleEdit(room: Room) {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || "",
      hourlyRate: room.hourlyRate,
      capacity: room.capacity?.toString() || "",
      isActive: room.isActive,
    });
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingRoom(null);
    setFormData(defaultFormData);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingRoom) {
      updateMutation.mutate({
        id: editingRoom.id,
        data: {
          name: formData.name,
          description: formData.description || undefined,
          hourlyRate: formData.hourlyRate,
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          isActive: formData.isActive,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
        hourlyRate: formData.hourlyRate,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        isActive: formData.isActive,
      });
    }
  }

  function handleDelete() {
    if (deletingRoom) {
      deleteMutation.mutate({ id: deletingRoom.id });
    }
  }

  function handleToggleActive(room: Room) {
    updateMutation.mutate({
      id: room.id,
      data: { isActive: !room.isActive },
    });
  }

  // Stats
  const rooms = roomsData || [];
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter((r) => r.isActive).length;
  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const avgHourlyRate = totalRooms > 0
    ? rooms.reduce((sum, r) => sum + parseFloat(r.hourlyRate || "0"), 0) / totalRooms
    : 0;

  // Table columns
  const columns: Column<Room>[] = [
    {
      key: "name",
      header: "Room Name",
      cell: (row) => (
        <div>
          <span className="font-medium">{row.name}</span>
          {row.description && (
            <p className="text-sm text-muted-foreground truncate max-w-xs">
              {row.description}
            </p>
          )}
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "hourlyRate",
      header: "Hourly Rate",
      cell: (row) => (
        <span className="font-medium text-green-600">
          ${parseFloat(row.hourlyRate).toLocaleString()}/hr
        </span>
      ),
      sortable: true,
      sortFn: (a, b) => parseFloat(a.hourlyRate) - parseFloat(b.hourlyRate),
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          {row.capacity ? `${row.capacity} people` : "-"}
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => (a.capacity || 0) - (b.capacity || 0),
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
          <Badge variant={row.isActive ? "default" : "secondary"}>
            {row.isActive ? "Active" : "Inactive"}
          </Badge>
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
              setDeletingRoom(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Home className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Rooms</h1>
              <p className="text-muted-foreground">
                Manage your studio rooms and their rates
              </p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{totalRooms}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{activeRooms}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">
                  {totalCapacity} people
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Hourly Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  ${avgHourlyRate.toFixed(2)}/hr
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hourly Rates Chart */}
        {rooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Room Hourly Rates Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rooms.map((room) => ({
                      name: room.name,
                      rate: parseFloat(room.hourlyRate),
                      capacity: room.capacity || 0,
                      isActive: room.isActive,
                    }))}
                    margin={{ left: 20, right: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value}`}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`$${value}/hr`, "Hourly Rate"]}
                    />
                    <Bar
                      dataKey="rate"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                      name="Hourly Rate"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Room Cards Grid */}
        {rooms.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.slice(0, 6).map((room) => (
              <Card
                key={room.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  !room.isActive ? "opacity-60" : ""
                }`}
                onClick={() => handleEdit(room)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <Badge variant={room.isActive ? "default" : "secondary"}>
                      {room.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {room.description && (
                    <CardDescription className="line-clamp-2">
                      {room.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{room.capacity ? `${room.capacity} people` : "No limit"}</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      ${parseFloat(room.hourlyRate).toLocaleString()}/hr
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Rooms Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Rooms</CardTitle>
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
              data={rooms}
              columns={columns}
              getRowKey={(row) => row.id}
              searchable
              searchPlaceholder="Search rooms..."
              searchFilter={(row, query) =>
                row.name.toLowerCase().includes(query) ||
                (row.description?.toLowerCase().includes(query) ?? false)
              }
              paginated
              pageSize={10}
              isLoading={isLoading}
              emptyMessage="No rooms found. Add your first room!"
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
                  {editingRoom ? "Edit Room" : "Add Room"}
                </DialogTitle>
                <DialogDescription>
                  {editingRoom
                    ? "Update the room details below."
                    : "Add a new studio room to your inventory."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Studio A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the room, equipment, features..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData({ ...formData, hourlyRate: e.target.value })
                      }
                      placeholder="e.g., 150.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity (people)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Room is available for booking
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
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
                    : editingRoom
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deletingRoom}
          onOpenChange={(open) => !open && setDeletingRoom(null)}
          title="Delete Room"
          description={`Are you sure you want to delete "${deletingRoom?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
