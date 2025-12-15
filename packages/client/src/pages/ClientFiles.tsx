import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { FileAudio, ArrowLeft, Download } from "lucide-react";

export default function ClientFiles() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("clientToken");
    if (!storedToken) {
      navigate("/client/login");
      return;
    }
    setToken(storedToken);
  }, [navigate]);

  const orgId = parseInt(localStorage.getItem("selectedOrganizationId") || "1");
  
  const { data: files, isLoading } = trpc.clientAuth.getClientFiles.useQuery(
    { organizationId: orgId, token },
    { enabled: !!token }
  );

  if (isLoading) return <div className="min-h-screen bg-background p-6"><Skeleton className="h-96" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/client/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Mes Fichiers</h1>
            <p className="text-sm text-muted-foreground">{files?.length || 0} fichiers disponibles</p>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              Fichiers Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!files || files.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun fichier disponible</p>
            ) : (
              files.map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-semibold">{file.fileName}</p>
                    <p className="text-sm text-muted-foreground">{file.category}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
