/**
 * Team Page
 *
 * Manage team members, roles, and invitations.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Types
type TeamRole = "admin" | "manager" | "engineer" | "producer" | "assistant" | "intern";

interface TeamMember {
  id: number;
  userId: number | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  title: string | null;
  department: string | null;
  bio: string | null;
  skills: string | null;
  hourlyRate: string | null;
  hiredAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TeamInvitation {
  id: number;
  email: string;
  role: string;
  invitedBy: string;
  token: string;
  status: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

interface MemberFormData {
  name: string;
  email: string;
  phone: string;
  role: TeamRole;
  title: string;
  department: string;
  bio: string;
  skills: string;
  hourlyRate: string;
  hiredAt: string;
}

interface InviteFormData {
  email: string;
  role: TeamRole;
}

const ROLES: { id: TeamRole; name: string; color: string }[] = [
  { id: "admin", name: "Administrator", color: "bg-purple-500" },
  { id: "manager", name: "Manager", color: "bg-blue-500" },
  { id: "engineer", name: "Engineer", color: "bg-green-500" },
  { id: "producer", name: "Producer", color: "bg-orange-500" },
  { id: "assistant", name: "Assistant", color: "bg-yellow-500" },
  { id: "intern", name: "Intern", color: "bg-gray-500" },
];

const defaultMemberFormData: MemberFormData = {
  name: "",
  email: "",
  phone: "",
  role: "engineer",
  title: "",
  department: "",
  bio: "",
  skills: "",
  hourlyRate: "",
  hiredAt: "",
};

const defaultInviteFormData: InviteFormData = {
  email: "",
  role: "engineer",
};

export default function Team() {
  const [activeTab, setActiveTab] = useState("members");
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [cancellingInvite, setCancellingInvite] = useState<TeamInvitation | null>(null);
  const [memberFormData, setMemberFormData] = useState<MemberFormData>(defaultMemberFormData);
  const [inviteFormData, setInviteFormData] = useState<InviteFormData>(defaultInviteFormData);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const utils = trpc.useUtils();

  // Queries
  const { data: membersData, isLoading: membersLoading } = trpc.team.list.useQuery({
    limit: 100,
    role: roleFilter !== "all" ? roleFilter : undefined,
  });
  const { data: invitationsData, isLoading: invitationsLoading } = trpc.team.listInvitations.useQuery();
  const { data: statsData } = trpc.team.stats.useQuery();

  // Mutations
  const createMemberMutation = trpc.team.create.useMutation({
    onSuccess: () => {
      toast.success("Team member added successfully");
      utils.team.list.invalidate();
      utils.team.stats.invalidate();
      handleCloseMemberForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add team member");
    },
  });

  const updateMemberMutation = trpc.team.update.useMutation({
    onSuccess: () => {
      toast.success("Team member updated successfully");
      utils.team.list.invalidate();
      utils.team.stats.invalidate();
      handleCloseMemberForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update team member");
    },
  });

  const deleteMemberMutation = trpc.team.delete.useMutation({
    onSuccess: () => {
      toast.success("Team member removed successfully");
      utils.team.list.invalidate();
      utils.team.stats.invalidate();
      setDeletingMember(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove team member");
    },
  });

  const sendInvitationMutation = trpc.team.sendInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Invitation sent successfully");
      if (data.inviteUrl) {
        navigator.clipboard.writeText(data.inviteUrl);
        toast.info("Invite link copied to clipboard");
      }
      utils.team.listInvitations.invalidate();
      utils.team.stats.invalidate();
      handleCloseInviteForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });

  const cancelInvitationMutation = trpc.team.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation cancelled");
      utils.team.listInvitations.invalidate();
      utils.team.stats.invalidate();
      setCancellingInvite(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel invitation");
    },
  });

  const resendInvitationMutation = trpc.team.resendInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Invitation resent");
      if (data.inviteUrl) {
        navigator.clipboard.writeText(data.inviteUrl);
        toast.info("New invite link copied to clipboard");
      }
      utils.team.listInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend invitation");
    },
  });

  // Handlers
  function handleCreateMember() {
    setEditingMember(null);
    setMemberFormData(defaultMemberFormData);
    setShowMemberForm(true);
  }

  function handleEditMember(member: TeamMember) {
    setEditingMember(member);
    let skillsString = "";
    if (member.skills) {
      try {
        const skillsArr = JSON.parse(member.skills);
        skillsString = Array.isArray(skillsArr) ? skillsArr.join(", ") : "";
      } catch {
        skillsString = member.skills;
      }
    }
    setMemberFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      role: member.role as TeamRole,
      title: member.title || "",
      department: member.department || "",
      bio: member.bio || "",
      skills: skillsString,
      hourlyRate: member.hourlyRate || "",
      hiredAt: member.hiredAt ? new Date(member.hiredAt).toISOString().split("T")[0] : "",
    });
    setShowMemberForm(true);
  }

  function handleCloseMemberForm() {
    setShowMemberForm(false);
    setEditingMember(null);
    setMemberFormData(defaultMemberFormData);
  }

  function handleCloseInviteForm() {
    setShowInviteForm(false);
    setInviteFormData(defaultInviteFormData);
  }

  function handleSubmitMember(e: React.FormEvent) {
    e.preventDefault();

    const skills = memberFormData.skills
      ? memberFormData.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const data = {
      name: memberFormData.name,
      email: memberFormData.email,
      phone: memberFormData.phone || undefined,
      role: memberFormData.role,
      title: memberFormData.title || undefined,
      department: memberFormData.department || undefined,
      bio: memberFormData.bio || undefined,
      skills,
      hourlyRate: memberFormData.hourlyRate ? parseFloat(memberFormData.hourlyRate) : undefined,
      hiredAt: memberFormData.hiredAt || undefined,
    };

    if (editingMember) {
      updateMemberMutation.mutate({ id: editingMember.id, ...data });
    } else {
      createMemberMutation.mutate(data);
    }
  }

  function handleSubmitInvite(e: React.FormEvent) {
    e.preventDefault();
    sendInvitationMutation.mutate({
      email: inviteFormData.email,
      role: inviteFormData.role,
    });
  }

  function handleDeleteMember() {
    if (deletingMember) {
      deleteMemberMutation.mutate({ id: deletingMember.id });
    }
  }

  function handleCancelInvitation() {
    if (cancellingInvite) {
      cancelInvitationMutation.mutate({ id: cancellingInvite.id });
    }
  }

  function getRoleBadge(roleId: string) {
    const role = ROLES.find((r) => r.id === roleId);
    if (!role) return <Badge variant="outline">{roleId}</Badge>;
    return (
      <Badge className={`${role.color} text-white`}>
        {role.name}
      </Badge>
    );
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-500 text-white">Accepted</Badge>;
      case "expired":
        return <Badge className="bg-gray-500 text-white">Expired</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // Table columns for members
  const memberColumns: Column<TeamMember>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-medium text-primary">
              {row.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-medium">{row.name}</span>
            {row.title && (
              <p className="text-sm text-muted-foreground">{row.title}</p>
            )}
          </div>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "email",
      header: "Contact",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Mail className="h-3 w-3" />
            {row.email}
          </div>
          {row.phone && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              {row.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => getRoleBadge(row.role),
    },
    {
      key: "department",
      header: "Department",
      cell: (row) => row.department || "-",
    },
    {
      key: "active",
      header: "Status",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.isActive ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Active</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Inactive</span>
            </>
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
              handleEditMember(row);
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
              setDeletingMember(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ];

  // Table columns for invitations
  const invitationColumns: Column<TeamInvitation>[] = [
    {
      key: "email",
      header: "Email",
      cell: (row) => <span className="font-medium">{row.email}</span>,
      sortable: true,
      sortFn: (a, b) => a.email.localeCompare(b.email),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => getRoleBadge(row.role),
    },
    {
      key: "invitedBy",
      header: "Invited By",
      cell: (row) => row.invitedBy,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => getStatusBadge(row.status),
    },
    {
      key: "expiresAt",
      header: "Expires",
      cell: (row) => {
        const date = new Date(row.expiresAt);
        const isExpired = date < new Date();
        return (
          <span className={isExpired ? "text-red-500" : ""}>
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === "pending" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  resendInvitationMutation.mutate({ id: row.id });
                }}
                disabled={resendInvitationMutation.isPending}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setCancellingInvite(row);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
      className: "w-24",
    },
  ];

  const members = membersData?.members || [];
  const invitations = invitationsData || [];
  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Team</h1>
              <p className="text-muted-foreground">
                Manage your team members and invitations
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowInviteForm(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite
            </Button>
            <Button onClick={handleCreateMember}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{statsData?.total || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Members
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
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">
                  {statsData?.pendingInvitations || 0}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsData?.byRole ? Object.keys(statsData.byRole).length : 0}
              </div>
              <p className="text-xs text-muted-foreground">different roles</p>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution Chart */}
        {statsData?.byRole && Object.keys(statsData.byRole).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="h-64 w-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(statsData.byRole)
                          .filter(([, count]) => count > 0)
                          .map(([role, count]) => {
                            const roleInfo = ROLES.find(r => r.id === role);
                            return {
                              name: roleInfo?.name || role,
                              value: count,
                              role,
                            };
                          })}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {Object.entries(statsData.byRole)
                          .filter(([, count]) => count > 0)
                          .map(([role]) => {
                            const roleInfo = ROLES.find(r => r.id === role);
                            const colorMap: Record<string, string> = {
                              "bg-purple-500": "#a855f7",
                              "bg-blue-500": "#3b82f6",
                              "bg-green-500": "#22c55e",
                              "bg-orange-500": "#f97316",
                              "bg-yellow-500": "#eab308",
                              "bg-gray-500": "#6b7280",
                            };
                            return (
                              <Cell
                                key={role}
                                fill={roleInfo ? colorMap[roleInfo.color] || "#6b7280" : "#6b7280"}
                              />
                            );
                          })}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {ROLES.map((role) => {
                    const count = statsData.byRole[role.id] || 0;
                    if (count === 0) return null;
                    const colorMap: Record<string, string> = {
                      "bg-purple-500": "bg-purple-500",
                      "bg-blue-500": "bg-blue-500",
                      "bg-green-500": "bg-green-500",
                      "bg-orange-500": "bg-orange-500",
                      "bg-yellow-500": "bg-yellow-500",
                      "bg-gray-500": "bg-gray-500",
                    };
                    return (
                      <div key={role.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colorMap[role.color] || 'bg-gray-500'}`} />
                        <span className="text-sm">{role.name}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invitations ({pendingInvitations.length})
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Team Members</CardTitle>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {ROLES.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={members}
                  columns={memberColumns}
                  getRowKey={(row) => row.id}
                  searchable
                  searchPlaceholder="Search members..."
                  searchFilter={(row, query) =>
                    row.name.toLowerCase().includes(query) ||
                    row.email.toLowerCase().includes(query) ||
                    (row.title?.toLowerCase().includes(query) ?? false)
                  }
                  paginated
                  pageSize={10}
                  isLoading={membersLoading}
                  emptyMessage="No team members yet. Add your first member!"
                  onRowClick={handleEditMember}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Invitations</CardTitle>
                <CardDescription>
                  Manage pending and past team invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={invitations}
                  columns={invitationColumns}
                  getRowKey={(row) => row.id}
                  searchable
                  searchPlaceholder="Search invitations..."
                  searchFilter={(row, query) =>
                    row.email.toLowerCase().includes(query)
                  }
                  paginated
                  pageSize={10}
                  isLoading={invitationsLoading}
                  emptyMessage="No invitations sent yet."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Member Form Dialog */}
        <Dialog open={showMemberForm} onOpenChange={setShowMemberForm}>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmitMember}>
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Edit Team Member" : "Add Team Member"}
                </DialogTitle>
                <DialogDescription>
                  {editingMember
                    ? "Update the team member's information."
                    : "Add a new member to your team."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={memberFormData.name}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={memberFormData.email}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, email: e.target.value })
                      }
                      placeholder="john@studio.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={memberFormData.phone}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, phone: e.target.value })
                      }
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={memberFormData.role}
                      onValueChange={(value: TeamRole) =>
                        setMemberFormData({ ...memberFormData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={memberFormData.title}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, title: e.target.value })
                      }
                      placeholder="Senior Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={memberFormData.department}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, department: e.target.value })
                      }
                      placeholder="Recording"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hiredAt">Hire Date</Label>
                    <Input
                      id="hiredAt"
                      type="date"
                      value={memberFormData.hiredAt}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, hiredAt: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={memberFormData.hourlyRate}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, hourlyRate: e.target.value })
                      }
                      placeholder="50.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    value={memberFormData.skills}
                    onChange={(e) =>
                      setMemberFormData({ ...memberFormData, skills: e.target.value })
                    }
                    placeholder="Pro Tools, Mixing, Mastering"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={memberFormData.bio}
                    onChange={(e) =>
                      setMemberFormData({ ...memberFormData, bio: e.target.value })
                    }
                    placeholder="Brief description..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseMemberForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMemberMutation.isPending || updateMemberMutation.isPending}
                >
                  {createMemberMutation.isPending || updateMemberMutation.isPending
                    ? "Saving..."
                    : editingMember
                    ? "Update"
                    : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Invite Form Dialog */}
        <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
          <DialogContent className="sm:max-w-[400px]">
            <form onSubmit={handleSubmitInvite}>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation email to join your team.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email *</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteFormData.email}
                    onChange={(e) =>
                      setInviteFormData({ ...inviteFormData, email: e.target.value })
                    }
                    placeholder="newmember@studio.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role *</Label>
                  <Select
                    value={inviteFormData.role}
                    onValueChange={(value: TeamRole) =>
                      setInviteFormData({ ...inviteFormData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseInviteForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendInvitationMutation.isPending}
                >
                  {sendInvitationMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Member Confirmation */}
        <ConfirmDialog
          open={!!deletingMember}
          onOpenChange={(open) => !open && setDeletingMember(null)}
          title="Remove Team Member"
          description={`Are you sure you want to remove "${deletingMember?.name}" from the team? This action cannot be undone.`}
          confirmLabel="Remove"
          onConfirm={handleDeleteMember}
          variant="danger"
          isLoading={deleteMemberMutation.isPending}
        />

        {/* Cancel Invitation Confirmation */}
        <ConfirmDialog
          open={!!cancellingInvite}
          onOpenChange={(open) => !open && setCancellingInvite(null)}
          title="Cancel Invitation"
          description={`Are you sure you want to cancel the invitation for "${cancellingInvite?.email}"?`}
          confirmLabel="Cancel Invitation"
          onConfirm={handleCancelInvitation}
          variant="warning"
          isLoading={cancelInvitationMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
