import { Link } from 'react-router-dom';
import { useClientAuth } from '@/lib/clientAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Calendar,
  FileText,
  FolderOpen,
  DollarSign,
  Clock,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';

/**
 * Client Portal Dashboard
 *
 * Overview of client's sessions, invoices, and projects.
 */
export function PortalDashboard() {
  const { client, logout } = useClientAuth();
  const { data: dashboardData, isLoading } = trpc.clientPortal.dashboard.useQuery();

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    upcomingSessionsCount: 0,
    unpaidInvoicesCount: 0,
    unpaidTotal: '0.00',
    activeProjectsCount: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                <User className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">
                  Welcome, {client?.artistName || client?.name}
                </h1>
                {client?.isVip && (
                  <Badge variant="secondary" className="text-xs">VIP Client</Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingSessionsCount}</div>
              <p className="text-xs text-muted-foreground">scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unpaidInvoicesCount}</div>
              <p className="text-xs text-muted-foreground">pending payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.unpaidTotal}</div>
              <p className="text-xs text-muted-foreground">total outstanding</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjectsCount}</div>
              <p className="text-xs text-muted-foreground">in progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Sessions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your next scheduled recording sessions</CardDescription>
              </div>
              <Link to="/portal/sessions">
                <Button variant="ghost" size="sm">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {dashboardData?.upcomingSessions && dashboardData.upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                          <Clock className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                        </div>
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-gray-500">
                            {session.roomName} - {format(new Date(session.startTime), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming sessions</p>
                  <p className="text-sm">Contact the studio to book a session</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Your latest billing activity</CardDescription>
              </div>
              <Link to="/portal/invoices">
                <Button variant="ghost" size="sm">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {dashboardData?.recentInvoices && dashboardData.recentInvoices.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-2">
                          <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${invoice.total}</p>
                        <Badge
                          variant={
                            invoice.status === 'paid'
                              ? 'default'
                              : invoice.status === 'overdue'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No invoices yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/portal/sessions">
              <Card className="hover:border-purple-500 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">View Sessions</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/portal/invoices">
              <Card className="hover:border-purple-500 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">View Invoices</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/portal/projects">
              <Card className="hover:border-purple-500 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">View Projects</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/portal/profile">
              <Card className="hover:border-purple-500 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">Edit Profile</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
