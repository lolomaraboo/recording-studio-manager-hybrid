import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock, Pencil, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SessionFormDialog } from '@/components/sessions/SessionFormDialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Session type from API with client/room names
 */
interface SessionWithDetails {
  id: number;
  clientId: number;
  roomId: number;
  title: string;
  description: string | null;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  totalAmount: string | null;
  notes: string | null;
  clientName: string;
  roomName: string;
  duration: number; // in hours
}

export function Sessions() {
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionWithDetails | null>(null);
  const [deletingSession, setDeletingSession] = useState<SessionWithDetails | null>(null);

  const utils = trpc.useUtils();
  const { data: sessions, isLoading } = trpc.sessions.list.useQuery({ limit: 100 });
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: rooms } = trpc.rooms.list.useQuery({});

  const deleteMutation = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      toast.success('Session deleted successfully');
      utils.sessions.list.invalidate();
      setDeletingSession(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete session');
    },
  });

  // Create lookup maps
  const clientMap = useMemo(() => {
    return clients?.reduce((acc, client) => {
      acc[client.id] = client.name;
      return acc;
    }, {} as Record<number, string>) || {};
  }, [clients]);

  const roomMap = useMemo(() => {
    return rooms?.reduce((acc, room) => {
      acc[room.id] = room.name;
      return acc;
    }, {} as Record<number, string>) || {};
  }, [rooms]);

  // Sessions with enriched data
  const sessionsWithDetails: SessionWithDetails[] = useMemo(() => {
    return sessions?.map(session => {
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      return {
        ...session,
        clientName: clientMap[session.clientId] || 'Unknown Client',
        roomName: roomMap[session.roomId] || 'Unknown Room',
        duration,
      };
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) || [];
  }, [sessions, clientMap, roomMap]);

  // Calculate stats
  const totalSessions = sessionsWithDetails.length;
  const scheduledSessions = sessionsWithDetails.filter(s => s.status === 'scheduled').length;
  const completedSessions = sessionsWithDetails.filter(s => s.status === 'completed').length;
  const totalHours = sessionsWithDetails.reduce((sum, s) => sum + s.duration, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTime: Date | string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // DataTable columns
  const columns: Column<SessionWithDetails>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (row) => <span className="font-medium">{row.title}</span>,
      sortable: true,
      sortFn: (a, b) => a.title.localeCompare(b.title),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (row) => row.clientName,
    },
    {
      key: 'room',
      header: 'Room',
      cell: (row) => row.roomName,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (row) => {
        const { date, time } = formatDateTime(row.startTime);
        return (
          <div>
            <div>{date}</div>
            <div className="text-sm text-gray-500">{time}</div>
          </div>
        );
      },
      sortable: true,
      sortFn: (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    },
    {
      key: 'duration',
      header: 'Duration',
      cell: (row) => `${row.duration.toFixed(1)}h`,
      sortable: true,
      sortFn: (a, b) => a.duration - b.duration,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (row) => row.totalAmount ? (
        <span className="text-green-600 font-medium">
          ${parseFloat(row.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ) : '-',
      sortable: true,
      sortFn: (a, b) => (parseFloat(a.totalAmount || '0')) - (parseFloat(b.totalAmount || '0')),
    },
    {
      key: 'actions',
      header: '',
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
              setDeletingSession(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  function handleEdit(session: SessionWithDetails) {
    setEditingSession(session);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingSession(null);
    setShowForm(true);
  }

  function handleDelete() {
    if (deletingSession) {
      deleteMutation.mutate({ id: deletingSession.id });
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-gray-500">Manage your recording sessions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{scheduledSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{completedSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      {sessionsWithDetails.filter(s => s.status === 'scheduled').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessionsWithDetails
                .filter(s => s.status === 'scheduled')
                .slice(0, 6)
                .map((session) => {
                  const { date, time } = formatDateTime(session.startTime);
                  return (
                    <Card
                      key={session.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleEdit(session)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{session.title}</h3>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{session.clientName}</p>
                        <p className="text-sm text-gray-500">{session.roomName}</p>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {time}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sessionsWithDetails}
            columns={columns}
            getRowKey={(row) => row.id}
            searchable
            searchPlaceholder="Search sessions..."
            searchFilter={(row, query) =>
              row.title.toLowerCase().includes(query) ||
              row.clientName.toLowerCase().includes(query) ||
              row.roomName.toLowerCase().includes(query)
            }
            paginated
            pageSize={10}
            isLoading={isLoading}
            emptyMessage="No sessions found. Create your first session!"
            onRowClick={handleEdit}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <SessionFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        session={editingSession}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingSession}
        onOpenChange={(open) => !open && setDeletingSession(null)}
        title="Delete Session"
        description={`Are you sure you want to delete "${deletingSession?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
