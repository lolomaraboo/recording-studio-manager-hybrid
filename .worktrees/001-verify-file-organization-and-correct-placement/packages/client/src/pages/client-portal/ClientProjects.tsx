import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';

export default function ClientProjects() {
  const { client } = useClientPortalAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
        <p className="text-muted-foreground">
          View and manage your studio projects
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Projects page for {client?.name}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This page will display your active and completed projects.
        </p>
      </div>
    </div>
  );
}
