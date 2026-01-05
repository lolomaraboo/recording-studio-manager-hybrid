import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { RefreshCw, FileText } from "lucide-react";

export default function Logs() {
  const [selectedContainer, setSelectedContainer] = useState<string>("");

  const { data: containers } = trpc.superadmin.listContainers.useQuery();

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } =
    trpc.superadmin.getContainerLogs.useQuery(
      { containerId: selectedContainer },
      { enabled: !!selectedContainer }
    );

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Container Logs
            </h2>
            <p className="text-sm text-muted-foreground">View real-time logs from Docker containers</p>
          </div>
          <Button
            onClick={() => refetchLogs()}
            variant="outline"
            size="sm"
            disabled={!selectedContainer}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Container</CardTitle>
            <CardDescription className="text-sm">View last 100 lines of container logs</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
          <Select value={selectedContainer} onValueChange={setSelectedContainer}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a container..." />
            </SelectTrigger>
            <SelectContent>
              {containers?.containers.map((container) => (
                <SelectItem key={container.id} value={container.id}>
                  {container.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedContainer && (
            <div className="border rounded-lg p-4 bg-muted">
              {logsLoading ? (
                <Skeleton className="h-96" />
              ) : logs && logs.logs ? (
                <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[600px]">
                  {logs.logs.join('\n')}
                </pre>
              ) : (
                <p className="text-muted-foreground">No logs available</p>
              )}
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
