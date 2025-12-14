import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Mic, TrendingUp, Calendar, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function Dashboard() {
  // Fetch real data from tRPC
  const { data: sessions, isLoading: sessionsLoading } = trpc.sessions.list.useQuery({ limit: 100 });
  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: invoices, isLoading: invoicesLoading } = trpc.invoices.list.useQuery({ limit: 100 });

  // Calculate stats from real data
  const totalRevenue = invoices?.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0) || 0;
  const activeClients = clients?.length || 0;
  const thisMonthSessions = sessions?.filter(s => {
    const sessionDate = new Date(s.startTime);
    const now = new Date();
    return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
  }).length || 0;
  const pendingInvoices = invoices?.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length || 0;

  // Get recent and upcoming sessions
  const now = new Date();
  const recentSessions = sessions
    ?.filter(s => new Date(s.endTime) < now)
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
    .slice(0, 5) || [];

  const upcomingSessions = sessions
    ?.filter(s => new Date(s.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5) || [];

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: '+12.5%', // TODO: Calculate actual change
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Active Clients',
      value: activeClients.toString(),
      change: `+${activeClients}`,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Sessions This Month',
      value: thisMonthSessions.toString(),
      change: `+${thisMonthSessions}`,
      icon: Mic,
      color: 'text-purple-600',
    },
    {
      title: 'Pending Invoices',
      value: pendingInvoices.toString(),
      change: pendingInvoices > 0 ? `${pendingInvoices} pending` : 'All paid',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  const isLoading = sessionsLoading || clientsLoading || invoicesLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold text-gray-400">Loading...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-500">
                    <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-gray-600'}>
                      {stat.change}
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : recentSessions.length === 0 ? (
              <p className="text-sm text-gray-500">No recent sessions to display.</p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Mic className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{session.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.startTime).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      session.status === 'completed' ? 'bg-green-100 text-green-700' :
                      session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : upcomingSessions.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming sessions scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{session.title}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(session.startTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
