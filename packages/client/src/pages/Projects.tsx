import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  DollarSign,
  Pencil,
  FolderOpen,
  Clock,
  Archive,
  Eye,
} from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Project type from API (dates are serialized as strings)
 */
interface Project {
  id: number;
  clientId: number;
  name: string;
  projectType: string;
  status: string;
  clientName?: string | null;
  clientArtistName?: string | null;
  description?: string | null;
  genre?: string | null;
  startDate?: string | null;
  targetEndDate?: string | null;
  actualEndDate?: string | null;
  budget?: string | null;
  spentAmount?: string | null;
  notes?: string | null;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pre_production: 'bg-blue-100 text-blue-800',
  recording: 'bg-purple-100 text-purple-800',
  mixing: 'bg-orange-100 text-orange-800',
  mastering: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  on_hold: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pre_production: 'Pre-Production',
  recording: 'Recording',
  mixing: 'Mixing',
  mastering: 'Mastering',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

const TYPE_LABELS: Record<string, string> = {
  album: 'Album',
  ep: 'EP',
  single: 'Single',
  compilation: 'Compilation',
  soundtrack: 'Soundtrack',
  other: 'Other',
};

export function Projects() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const utils = trpc.useUtils();
  const { data: projects, isLoading } = trpc.projects.list.useQuery({
    includeArchived: showArchived,
  });
  const { data: stats } = trpc.projects.stats.useQuery();

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success('Project archived successfully');
      utils.projects.list.invalidate();
      utils.projects.stats.invalidate();
      setDeletingProject(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to archive project');
    },
  });

  // Calculate progress percentage
  const getProgressPercentage = (project: Project): number => {
    const statusOrder = [
      'pre_production',
      'recording',
      'mixing',
      'mastering',
      'completed',
    ];
    const currentIndex = statusOrder.indexOf(project.status);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  // DataTable columns
  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Project',
      cell: (row) => (
        <div>
          <span className="font-medium">{row.name}</span>
          <p className="text-xs text-gray-500">
            {row.clientArtistName || row.clientName}
          </p>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row) => TYPE_LABELS[row.projectType] || row.projectType,
    },
    {
      key: 'genre',
      header: 'Genre',
      cell: (row) => row.genre || '-',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge className={STATUS_COLORS[row.status] || 'bg-gray-100'}>
          {STATUS_LABELS[row.status] || row.status}
        </Badge>
      ),
      sortable: true,
      sortFn: (a, b) => a.status.localeCompare(b.status),
    },
    {
      key: 'progress',
      header: 'Progress',
      cell: (row) => {
        const progress = getProgressPercentage(row);
        return (
          <div className="w-24">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{progress.toFixed(0)}%</span>
          </div>
        );
      },
    },
    {
      key: 'budget',
      header: 'Budget',
      cell: (row) => {
        const budget = parseFloat(row.budget || '0');
        const spent = parseFloat(row.spentAmount || '0');
        const remaining = budget - spent;
        return (
          <div className="text-right">
            <span className="font-medium">
              ${budget.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
            {spent > 0 && (
              <p className={`text-xs ${remaining < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                ${remaining.toLocaleString('en-US', { minimumFractionDigits: 0 })} remaining
              </p>
            )}
          </div>
        );
      },
      sortable: true,
      sortFn: (a, b) =>
        parseFloat(a.budget || '0') - parseFloat(b.budget || '0'),
    },
    {
      key: 'dates',
      header: 'Timeline',
      cell: (row) => (
        <div className="text-sm">
          {row.startDate && (
            <p>{format(new Date(row.startDate), 'MMM d, yyyy')}</p>
          )}
          {row.targetEndDate && (
            <p className="text-xs text-gray-500">
              Target: {format(new Date(row.targetEndDate), 'MMM d')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${row.id}`);
            }}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingProject(row);
            }}
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-32',
    },
  ];

  function handleEdit(project: Project) {
    setEditingProject(project);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingProject(null);
    setShowForm(true);
  }

  function handleDelete() {
    if (deletingProject) {
      deleteMutation.mutate({ id: deletingProject.id });
    }
  }

  // Group projects by status for Kanban-like view
  const projectsByStatus = useMemo(() => {
    const grouped: Record<string, Project[]> = {
      pre_production: [],
      recording: [],
      mixing: [],
      mastering: [],
      completed: [],
    };
    projects?.forEach((project) => {
      if (
        project.status !== 'on_hold' &&
        project.status !== 'cancelled' &&
        grouped[project.status]
      ) {
        grouped[project.status].push(project);
      }
    });
    return grouped;
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-500">
            Manage music production projects and tracks
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              <FolderOpen className="h-4 w-4 inline mr-2" />
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalProjects || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              <Clock className="h-4 w-4 inline mr-2" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {stats?.activeProjects || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              $
              {parseFloat(stats?.totalBudget || '0').toLocaleString('en-US', {
                minimumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              $
              {parseFloat(stats?.totalSpent || '0').toLocaleString('en-US', {
                minimumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban-style Pipeline View */}
      <Card>
        <CardHeader>
          <CardTitle>Production Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(projectsByStatus).map(([status, statusProjects]) => (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={STATUS_COLORS[status]}>
                    {STATUS_LABELS[status]}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {statusProjects.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[200px] bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  {statusProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleEdit(project)}
                      className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <p className="font-medium text-sm truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {project.clientArtistName || project.clientName}
                      </p>
                      {project.genre && (
                        <p className="text-xs text-purple-600 mt-1">
                          {project.genre}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={projects || []}
            columns={columns}
            getRowKey={(row) => row.id}
            searchable
            searchPlaceholder="Search projects..."
            searchFilter={(row, query) =>
              row.name.toLowerCase().includes(query) ||
              (row.clientName?.toLowerCase().includes(query) ?? false) ||
              (row.clientArtistName?.toLowerCase().includes(query) ?? false) ||
              (row.genre?.toLowerCase().includes(query) ?? false)
            }
            paginated
            pageSize={10}
            isLoading={isLoading}
            emptyMessage="No projects found. Create your first project!"
            onRowClick={(project) => navigate(`/projects/${project.id}`)}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <ProjectFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        project={editingProject}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        title="Archive Project"
        description={`Are you sure you want to archive "${deletingProject?.name}"? You can restore it later from the archived projects view.`}
        confirmLabel="Archive"
        onConfirm={handleDelete}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
