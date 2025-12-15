import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Link, useNavigate } from "react-router-dom";
import { Music2, Plus, ArrowRight, Building2 } from "lucide-react";
import { useEffect } from "react";

interface Organization {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  subscriptionPlan?: string | null;
  isActive: boolean;
}

export default function SelectOrganization() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: organizations, isLoading } = trpc.organizations.list.useQuery();

  // Si l'utilisateur n'a qu'une seule organisation, rediriger automatiquement
  useEffect(() => {
    if (organizations && Array.isArray(organizations)) {
      if (organizations.length === 1 && organizations[0]) {
        // Stocker l'organisation sélectionnée dans le localStorage
        localStorage.setItem("selectedOrganizationId", organizations[0].id.toString());
        navigate("/dashboard");
      }
    }
  }, [organizations, navigate]);

  const handleSelectOrganization = (orgId: number) => {
    localStorage.setItem("selectedOrganizationId", orgId.toString());
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const orgList: Organization[] = Array.isArray(organizations) ? organizations : [];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Music2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Bienvenue, {user?.name}</h1>
          <p className="text-muted-foreground">Sélectionnez un studio ou créez-en un nouveau</p>
        </div>

        <div className="space-y-8">
          {/* Organizations */}
          {orgList.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Mes studios
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {orgList.map((org) => (
                  <Card
                    key={org.id}
                    className="hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleSelectOrganization(org.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{org.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {org.subdomain}.studio.space
                          </CardDescription>
                        </div>
                        <Badge variant={org.isActive ? "default" : "secondary"}>
                          {org.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div>
                          <Badge variant="outline" className="capitalize">
                            {org.subscriptionPlan || "free"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant="outline">
                        Accéder au studio
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Create New Organization */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle>Créer un nouveau studio</CardTitle>
              <CardDescription>
                Commencez avec un essai gratuit de 14 jours
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link to="/onboarding">
                  Créer un studio
                  <Plus className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
