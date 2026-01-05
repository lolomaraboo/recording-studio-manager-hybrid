import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban } from 'lucide-react';

export default function ClientProjects() {
  const { client } = useClientPortalAuth();

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <FolderKanban className="h-8 w-8 text-primary" />
            My Projects
          </h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <FolderKanban className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Projects page for {client?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                This page will display your active and completed projects.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
