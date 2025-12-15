/**
 * Equipment Page
 *
 * Manage studio equipment inventory with full CRUD operations.
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
import { Switch } from "@/components/ui/switch";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Wrench,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

// Equipment types
type EquipmentCategory =
  | "microphone"
  | "preamp"
  | "compressor"
  | "equalizer"
  | "reverb"
  | "delay"
  | "console"
  | "interface"
  | "monitor"
  | "headphones"
  | "instrument"
  | "amplifier"
  | "cable"
  | "stand"
  | "acoustic"
  | "software"
  | "computer"
  | "storage"
  | "other";

type EquipmentCondition =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "needs_repair"
  | "out_of_service";

interface EquipmentItem {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: string | null;
  condition: string;
  location: string | null;
  notes: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EquipmentFormData {
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  condition: EquipmentCondition;
  location: string;
  notes: string;
}

const CATEGORIES: { id: EquipmentCategory; name: string }[] = [
  { id: "microphone", name: "Microphones" },
  { id: "preamp", name: "Preamps" },
  { id: "compressor", name: "Compressors" },
  { id: "equalizer", name: "Equalizers" },
  { id: "reverb", name: "Reverbs" },
  { id: "delay", name: "Delays" },
  { id: "console", name: "Mixing Consoles" },
  { id: "interface", name: "Audio Interfaces" },
  { id: "monitor", name: "Studio Monitors" },
  { id: "headphones", name: "Headphones" },
  { id: "instrument", name: "Instruments" },
  { id: "amplifier", name: "Amplifiers" },
  { id: "cable", name: "Cables & Connectors" },
  { id: "stand", name: "Stands & Mounts" },
  { id: "acoustic", name: "Acoustic Treatment" },
  { id: "software", name: "Software & Plugins" },
  { id: "computer", name: "Computers & Hardware" },
  { id: "storage", name: "Storage Devices" },
  { id: "other", name: "Other" },
];

const CONDITIONS: { id: EquipmentCondition; name: string; color: string }[] = [
  { id: "excellent", name: "Excellent", color: "bg-green-500" },
  { id: "good", name: "Good", color: "bg-blue-500" },
  { id: "fair", name: "Fair", color: "bg-yellow-500" },
  { id: "poor", name: "Poor", color: "bg-orange-500" },
  { id: "needs_repair", name: "Needs Repair", color: "bg-red-500" },
  { id: "out_of_service", name: "Out of Service", color: "bg-gray-500" },
];

const defaultFormData: EquipmentFormData = {
  name: "",
  category: "other",
  brand: "",
  model: "",
  serialNumber: "",
  purchaseDate: "",
  purchasePrice: "",
  condition: "good",
  location: "",
  notes: "",
};

export default function Equipment() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<EquipmentItem | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>(defaultFormData);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const utils = trpc.useUtils();

  // Queries
  const { data: equipmentData, isLoading } = trpc.equipment.list.useQuery({
    limit: 100,
    category: categoryFilter !== "all" ? (categoryFilter as EquipmentCategory) : undefined,
  });
  const { data: statsData } = trpc.equipment.stats.useQuery();

  // Mutations
  const createMutation = trpc.equipment.create.useMutation({
    onSuccess: () => {
      toast.success("Equipment created successfully");
      utils.equipment.list.invalidate();
      utils.equipment.stats.invalidate();
      handleCloseForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create equipment");
    },
  });

  const updateMutation = trpc.equipment.update.useMutation({
    onSuccess: () => {
      toast.success("Equipment updated successfully");
      utils.equipment.list.invalidate();
      utils.equipment.stats.invalidate();
      handleCloseForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update equipment");
    },
  });

  const deleteMutation = trpc.equipment.delete.useMutation({
    onSuccess: () => {
      toast.success("Equipment deleted successfully");
      utils.equipment.list.invalidate();
      utils.equipment.stats.invalidate();
      setDeletingItem(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete equipment");
    },
  });

  const availabilityMutation = trpc.equipment.setAvailability.useMutation({
    onSuccess: () => {
      toast.success("Availability updated");
      utils.equipment.list.invalidate();
      utils.equipment.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update availability");
    },
  });

  // Handlers
  function handleCreate() {
    setEditingItem(null);
    setFormData(defaultFormData);
    setShowForm(true);
  }

  function handleEdit(item: EquipmentItem) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category as EquipmentCategory,
      brand: item.brand || "",
      model: item.model || "",
      serialNumber: item.serialNumber || "",
      purchaseDate: item.purchaseDate
        ? new Date(item.purchaseDate).toISOString().split("T")[0]
        : "",
      purchasePrice: item.purchasePrice || "",
      condition: item.condition as EquipmentCondition,
      location: item.location || "",
      notes: item.notes || "",
    });
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingItem(null);
    setFormData(defaultFormData);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name: formData.name,
      category: formData.category,
      brand: formData.brand || undefined,
      model: formData.model || undefined,
      serialNumber: formData.serialNumber || undefined,
      purchaseDate: formData.purchaseDate || undefined,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      condition: formData.condition,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleDelete() {
    if (deletingItem) {
      deleteMutation.mutate({ id: deletingItem.id });
    }
  }

  function handleToggleAvailability(item: EquipmentItem) {
    availabilityMutation.mutate({
      id: item.id,
      isAvailable: !item.isAvailable,
    });
  }

  function getCategoryName(categoryId: string): string {
    return CATEGORIES.find((c) => c.id === categoryId)?.name || categoryId;
  }

  function getConditionBadge(conditionId: string) {
    const condition = CONDITIONS.find((c) => c.id === conditionId);
    if (!condition) return <Badge variant="outline">{conditionId}</Badge>;
    return (
      <Badge className={`${condition.color} text-white`}>
        {condition.name}
      </Badge>
    );
  }

  // Table columns
  const columns: Column<EquipmentItem>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div>
          <span className="font-medium">{row.name}</span>
          {row.brand && row.model && (
            <p className="text-sm text-muted-foreground">
              {row.brand} {row.model}
            </p>
          )}
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => getCategoryName(row.category),
    },
    {
      key: "condition",
      header: "Condition",
      cell: (row) => getConditionBadge(row.condition),
    },
    {
      key: "location",
      header: "Location",
      cell: (row) => row.location || "-",
    },
    {
      key: "available",
      header: "Available",
      cell: (row) => (
        <Switch
          checked={row.isAvailable}
          onCheckedChange={() => handleToggleAvailability(row)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: "price",
      header: "Value",
      cell: (row) =>
        row.purchasePrice
          ? `$${parseFloat(row.purchasePrice).toLocaleString()}`
          : "-",
      sortable: true,
      sortFn: (a, b) =>
        parseFloat(a.purchasePrice || "0") - parseFloat(b.purchasePrice || "0"),
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
              setDeletingItem(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ];

  const equipment = equipmentData?.equipment || [];

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Equipment</h1>
              <p className="text-muted-foreground">
                Manage your studio equipment inventory
              </p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{statsData?.total || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {statsData?.available || 0}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Use / Unavailable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold text-orange-600">
                  {statsData?.unavailable || 0}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">
                  ${(statsData?.totalValue || 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {statsData && (statsData.byCategory && Object.keys(statsData.byCategory).length > 0 || statsData.byCondition && Object.keys(statsData.byCondition).length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Category Distribution Chart */}
            {statsData.byCategory && Object.keys(statsData.byCategory).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Equipment by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(statsData.byCategory)
                            .filter(([, count]) => count > 0)
                            .map(([category, count]) => ({
                              name: CATEGORIES.find(c => c.id === category)?.name || category,
                              value: count,
                              category,
                            }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={false}
                        >
                          {Object.entries(statsData.byCategory)
                            .filter(([, count]) => count > 0)
                            .map(([category], index) => (
                              <Cell
                                key={category}
                                fill={[
                                  "hsl(var(--chart-1))",
                                  "hsl(var(--chart-2))",
                                  "hsl(var(--chart-3))",
                                  "hsl(var(--chart-4))",
                                  "hsl(var(--chart-5))",
                                  "#8b5cf6",
                                  "#06b6d4",
                                  "#f59e0b",
                                  "#ef4444",
                                  "#10b981",
                                ][index % 10]}
                              />
                            ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Condition Distribution Chart */}
            {statsData.byCondition && Object.keys(statsData.byCondition).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Equipment by Condition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={CONDITIONS.map((condition) => ({
                          name: condition.name,
                          count: statsData.byCondition[condition.id] || 0,
                          fill: condition.color.replace("bg-", ""),
                        })).filter(d => d.count > 0)}
                        layout="vertical"
                        margin={{ left: 80, right: 20 }}
                      >
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={4}>
                          {CONDITIONS.map((condition) => {
                            const colorMap: Record<string, string> = {
                              "bg-green-500": "#22c55e",
                              "bg-blue-500": "#3b82f6",
                              "bg-yellow-500": "#eab308",
                              "bg-orange-500": "#f97316",
                              "bg-red-500": "#ef4444",
                              "bg-gray-500": "#6b7280",
                            };
                            return (
                              <Cell
                                key={condition.id}
                                fill={colorMap[condition.color] || "#6b7280"}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {CONDITIONS.map((condition) => {
                      const count = statsData.byCondition[condition.id] || 0;
                      if (count === 0) return null;
                      return (
                        <div key={condition.id} className="flex items-center gap-2">
                          <Badge className={`${condition.color} text-white`}>
                            {condition.name}
                          </Badge>
                          <span className="font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Equipment Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Equipment Inventory</CardTitle>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
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
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={equipment}
              columns={columns}
              getRowKey={(row) => row.id}
              searchable
              searchPlaceholder="Search equipment..."
              searchFilter={(row, query) =>
                row.name.toLowerCase().includes(query) ||
                (row.brand?.toLowerCase().includes(query) ?? false) ||
                (row.model?.toLowerCase().includes(query) ?? false) ||
                (row.location?.toLowerCase().includes(query) ?? false)
              }
              paginated
              pageSize={10}
              isLoading={isLoading}
              emptyMessage="No equipment found. Add your first item!"
              onRowClick={handleEdit}
            />
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Equipment" : "Add Equipment"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update the equipment details below."
                    : "Add a new equipment item to your inventory."}
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
                      placeholder="e.g., Neumann U87"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: EquipmentCategory) =>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                      placeholder="e.g., Neumann"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      placeholder="e.g., U87 Ai"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, serialNumber: e.target.value })
                      }
                      placeholder="e.g., 12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="e.g., Studio A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        setFormData({ ...formData, purchaseDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, purchasePrice: e.target.value })
                      }
                      placeholder="e.g., 3200.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value: EquipmentCondition) =>
                      setFormData({ ...formData, condition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((cond) => (
                        <SelectItem key={cond.id} value={cond.id}>
                          {cond.name}
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
                    placeholder="Additional notes about this equipment..."
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
                    : editingItem
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deletingItem}
          onOpenChange={(open) => !open && setDeletingItem(null)}
          title="Delete Equipment"
          description={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
