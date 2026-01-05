import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Calendar,
  FileText,
  Music,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Client Portal Dashboard
 *
 * Overview of client's:
 * - Upcoming bookings
 * - Recent invoices
 * - Active projects
 * - Quick stats
 */
export default function ClientDashboard() {
  const navigate = useNavigate();
  usePageTitle('Dashboard');

  // TODO: Fetch from API
  const stats = {
    upcomingBookings: 2,
    totalBookings: 12,
    unpaidInvoices: 1,
    totalSpent: 4250,
  };

  const upcomingBookings = [
    {
      id: 1,
      title: 'Recording Session - Album Track 3',
      room: 'Studio A',
      date: new Date(2025, 0, 25),
      time: '14:00 - 18:00',
      status: 'confirmed',
    },
    {
      id: 2,
      title: 'Mixing Session',
      room: 'Mix Room',
      date: new Date(2025, 0, 28),
      time: '10:00 - 14:00',
      status: 'pending_deposit',
    },
  ];

  const recentInvoices = [
    {
      id: 1,
      number: 'INV-2025-001',
      description: 'Recording Session - Album Track 2',
      amount: 350,
      status: 'paid',
      date: new Date(2025, 0, 15),
    },
    {
      id: 2,
      number: 'INV-2025-002',
      description: 'Mixing & Mastering',
      amount: 500,
      status: 'pending',
      dueDate: new Date(2025, 0, 30),
    },
  ];

  const projects = [
    {
      id: 1,
      title: 'Album - Urban Vibes',
      tracks: 8,
      status: 'in_progress',
    },
    {
      id: 2,
      title: 'Single - Summer Hit',
      tracks: 2,
      status: 'completed',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      pending_deposit: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Home className="h-8 w-8 text-primary" />
            Dashboard
          </h2>
          <Button onClick={() => navigate('/client-portal/bookings')}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Upcoming Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalBookings} total bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Unpaid Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.unpaidInvoices}</div>
              <p className="text-xs text-muted-foreground">
                Action required
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Active Projects</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">
                {projects.filter((p) => p.status === 'in_progress').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {projects.length} total projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">
                ${stats.totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifetime value
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {/* Upcoming Bookings */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Upcoming Bookings</CardTitle>
                  <CardDescription className="text-sm">Your scheduled studio sessions</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/client-portal/bookings')}
                >
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming bookings</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate('/client-portal/bookings')}
                  >
                    Book a session
                  </Button>
                </div>
              ) : (
                upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/client-portal/bookings/${booking.id}`)}
                >
                  <div className="flex-shrink-0">
                    {booking.status === 'confirmed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{booking.title}</p>
                      <Badge variant="outline" className={getStatusColor(booking.status)}>
                        {formatStatus(booking.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Music className="mr-1 h-3 w-3" />
                        {booking.room}
                      </div>
                      <div className="flex items-center mt-1">
                        <Clock className="mr-1 h-3 w-3" />
                        {booking.date.toLocaleDateString()} • {booking.time}
                      </div>
                    </div>
                  </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Invoices</CardTitle>
                  <CardDescription className="text-sm">Your payment history</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/client-portal/invoices')}
                >
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-start justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => navigate(`/client-portal/invoices/${invoice.id}`)}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{invoice.number}</p>
                    <Badge variant="outline" className={getStatusColor(invoice.status)}>
                      {formatStatus(invoice.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {invoice.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.status === 'paid'
                      ? `Paid on ${invoice.date.toLocaleDateString()}`
                      : `Due ${invoice.dueDate?.toLocaleDateString()}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${invoice.amount}</p>
                  {invoice.status === 'pending' && (
                    <Button size="sm" className="mt-2">
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Your Projects</CardTitle>
                <CardDescription className="text-sm">Tracks and albums in progress</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/client-portal/projects')}
              >
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2 md:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => navigate(`/client-portal/projects/${project.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Music className="h-5 w-5 text-muted-foreground" />
                  <Badge variant="outline" className={getStatusColor(project.status)}>
                    {formatStatus(project.status)}
                  </Badge>
                </div>
                <h3 className="font-medium">{project.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {project.tracks} {project.tracks === 1 ? 'track' : 'tracks'}
                </p>
              </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
