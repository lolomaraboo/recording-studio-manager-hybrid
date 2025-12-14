import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Mic, TrendingUp } from 'lucide-react';

const stats = [
  {
    title: 'Total Revenue',
    value: '$12,450',
    change: '+12.5%',
    icon: DollarSign,
    color: 'text-green-600',
  },
  {
    title: 'Active Clients',
    value: '24',
    change: '+3',
    icon: Users,
    color: 'text-blue-600',
  },
  {
    title: 'Sessions This Month',
    value: '18',
    change: '+5',
    icon: Mic,
    color: 'text-purple-600',
  },
  {
    title: 'Pending Invoices',
    value: '7',
    change: '-2',
    icon: TrendingUp,
    color: 'text-orange-600',
  },
];

export function Dashboard() {
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
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>{' '}
                from last month
              </p>
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
            <div className="space-y-4">
              <p className="text-sm text-gray-500">No recent sessions to display.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">No upcoming sessions scheduled.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
