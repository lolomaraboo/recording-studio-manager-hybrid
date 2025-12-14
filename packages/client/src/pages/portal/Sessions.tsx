import { Link } from 'react-router-dom';
import { useClientAuth } from '@/lib/clientAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, MapPin, Music, LogOut } from 'lucide-react';

/**
 * Client Portal Sessions Page
 *
 * Shows all sessions for the authenticated client.
 */
export function PortalSessions() {
  const { client, logout } = useClientAuth();
  const { data: sessions, isLoading } = trpc.clientPortal.sessions.useQuery({ limit: 50 });

  const handleLogout = async () => {
    await logout();
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/portal">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="border-l pl-3">
                <h1 className="text-lg font-semibold">My Sessions</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {client?.artistName || client?.name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Recording Sessions</h2>
          <p className="text-gray-500">View all your past and upcoming sessions</p>
        </div>

        {sessions && sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3">
                        <Music className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{session.title}</h3>
                        {session.description && (
                          <p className="text-gray-500 mt-1">{session.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(session.startTime), 'EEEE, MMMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(session.startTime), 'h:mm a')} -{' '}
                            {format(new Date(session.endTime), 'h:mm a')}
                          </div>
                          {session.roomName && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {session.roomName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getStatusVariant(session.status)}>
                        {session.status.replace('_', ' ')}
                      </Badge>
                      {session.totalAmount && (
                        <span className="text-lg font-semibold">
                          ${session.totalAmount}
                        </span>
                      )}
                    </div>
                  </div>
                  {session.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {session.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
              <p className="text-gray-500 mb-4">
                You don't have any recording sessions scheduled.
              </p>
              <p className="text-sm text-gray-400">
                Contact the studio to book your first session!
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
