import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Link } from "react-router-dom";
import { FileText, Plus, Search, ArrowLeft, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function Contracts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: contracts, isLoading: contractsLoading } = trpc.contracts.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });

  // Create a map of client IDs to client names
  const clientMap = useMemo(() => {
    return (
      clients?.reduce((acc, client) => {
        acc[client.id] = client.name;
        return acc;
      }, {} as Record<number, string>) || {}
    );
  }, [clients]);

  // Filter and sort contracts
  const filteredContracts = useMemo(() => {
    let result = contracts?.slice() || [];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (contract) =>
          contract.contractNumber.toLowerCase().includes(query) ||
          contract.title.toLowerCase().includes(query) ||
          clientMap[contract.clientId]?.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter((contract) => contract.type === typeFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((contract) => contract.status === statusFilter);
    }

    // Sort by created date (most recent first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [contracts, searchQuery, typeFilter, statusFilter, clientMap]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!contracts) return { total: 0, active: 0, pending: 0 };

    return {
      total: contracts.length,
      active: contracts.filter((c) => c.status === "active").length,
      pending: contracts.filter((c) => c.status === "pending" || c.status === "draft").length,
    };
  }, [contracts]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      pending: { variant: "outline", label: "En attente" },
      active: { variant: "default", label: "Actif" },
      completed: { variant: "default", label: "Complété" },
      terminated: { variant: "destructive", label: "Résilié" },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      recording: "Enregistrement",
      mixing: "Mixage",
      mastering: "Mastering",
      production: "Production",
      exclusivity: "Exclusivité",
      distribution: "Distribution",
      studio_rental: "Location studio",
      services: "Services",
      partnership: "Partenariat",
      other: "Autre",
    };

    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Contrats
            </h2>
          </div>
          <Button asChild>
            <Link to="/contracts/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau contrat
            </Link>
          </Button>
        </div>
        {/* Stats */}
        {contractsLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total contrats</CardDescription>
                  <CardTitle className="text-3xl">{stats.total}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Tous statuts</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Actifs</CardDescription>
                  <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {stats.active === 1 ? "contrat actif" : "contrats actifs"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>En attente</CardDescription>
                  <CardTitle className="text-3xl text-orange-600">{stats.pending}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    À signer ou brouillon
                  </p>
                </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par numéro, titre ou client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="recording">Enregistrement</SelectItem>
                      <SelectItem value="mixing">Mixage</SelectItem>
                      <SelectItem value="mastering">Mastering</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="exclusivity">Exclusivité</SelectItem>
                      <SelectItem value="distribution">Distribution</SelectItem>
                      <SelectItem value="studio_rental">Location studio</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="partnership">Partenariat</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="completed">Complété</SelectItem>
                      <SelectItem value="terminated">Résilié</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{filteredContracts.length} contrat(s)</CardTitle>
            <CardDescription className="text-sm">Gérez vos contrats et accords commerciaux</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
              {contractsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredContracts.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contrat #</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContracts.map((contract) => (
                        <TableRow key={contract.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                          <TableCell>{contract.title}</TableCell>
                          <TableCell>{clientMap[contract.clientId] || "Client inconnu"}</TableCell>
                          <TableCell>{getTypeBadge(contract.type)}</TableCell>
                          <TableCell>
                            {format(new Date(contract.createdAt), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell>{getStatusBadge(contract.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/contracts/${contract.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-medium mb-1">Aucun contrat</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Commencez par créer votre premier contrat
                </p>
                <Button asChild size="sm">
                  <Link to="/contracts/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau contrat
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
