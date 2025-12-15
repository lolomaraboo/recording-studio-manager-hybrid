import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const navigate = useNavigate();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  useEffect(() => {
    const storedOrgId = localStorage.getItem("selectedOrganizationId");
    if (storedOrgId) {
      setSelectedOrgId(parseInt(storedOrgId));
    } else {
      navigate("/select-organization");
    }
  }, [navigate]);

  const { data: organization } = trpc.organizations.get.useQuery(
    { id: selectedOrgId! },
    { enabled: selectedOrgId !== null }
  );

  const { data: previewData, isLoading: isLoadingPreview } = trpc.reports.preview.useQuery(
    {
      organizationId: selectedOrgId!,
      periodType,
    },
    { enabled: selectedOrgId !== null }
  );

  const generateMutation = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Rapport généré avec succès !");
      // Télécharger automatiquement le PDF
      window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la génération du rapport");
    },
  });

  const handleGenerateReport = () => {
    if (!selectedOrgId) return;

    generateMutation.mutate({
      organizationId: selectedOrgId,
      periodType,
    });
  };

  const getPeriodLabel = () => {
    switch (periodType) {
      case "monthly":
        return "Mois en cours";
      case "quarterly":
        return "Trimestre en cours";
      case "yearly":
        return "Année en cours";
      default:
        return "";
    }
  };

  if (!organization) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Rapports d'activité</h1>
          <p className="text-muted-foreground mt-2">
            Générez des rapports PDF détaillés avec graphiques et statistiques
          </p>
        </div>

        {/* Configuration du rapport */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Configuration du rapport
            </CardTitle>
            <CardDescription>Sélectionnez la période et générez votre rapport</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Période</label>
                <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mois en cours</SelectItem>
                    <SelectItem value="quarterly">Trimestre en cours</SelectItem>
                    <SelectItem value="yearly">Année en cours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateReport}
                disabled={generateMutation.isPending}
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Générer le PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Prévisualisation des données */}
        {isLoadingPreview ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Chargement des données...</p>
              </div>
            </CardContent>
          </Card>
        ) : previewData ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Aperçu - {getPeriodLabel()}</h2>
              <p className="text-muted-foreground">
                Du {new Date(previewData.period.startDate).toLocaleDateString("fr-FR")} au{" "}
                {new Date(previewData.period.endDate).toLocaleDateString("fr-FR")}
              </p>
            </div>

            {/* Statistiques principales */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {previewData.revenue.totalRevenue.toFixed(2)} €
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {previewData.revenue.paidInvoices} factures payées
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {previewData.occupancy.occupancyRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {previewData.occupancy.bookedHours.toFixed(0)}h réservées
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ingénieurs actifs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {previewData.engineers.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {previewData.engineers.reduce((sum, eng) => sum + eng.sessionsCount, 0)} sessions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Détails des revenus */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Revenus détaillés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Statistiques financières</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Factures payées</span>
                        <span className="font-medium">{previewData.revenue.paidInvoices}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Factures en attente</span>
                        <span className="font-medium">{previewData.revenue.pendingInvoices}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Factures en retard</span>
                        <span className="font-medium text-red-600">
                          {previewData.revenue.overdueInvoices}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground">Montant moyen</span>
                        <span className="font-medium">
                          {previewData.revenue.averageInvoiceAmount.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Évolution mensuelle</h3>
                    <div className="space-y-2">
                      {previewData.revenue.revenueByMonth.slice(-5).map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-muted-foreground">{item.month}</span>
                          <span className="font-medium">{item.amount.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Occupation des salles */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Occupation des salles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {previewData.occupancy.roomOccupancy.map((room, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{room.roomName}</span>
                        <span className="text-muted-foreground">
                          {room.rate.toFixed(1)}% ({room.bookedHours.toFixed(0)}h / {room.totalHours.toFixed(0)}h)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(room.rate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance des ingénieurs */}
            {previewData.engineers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance des ingénieurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previewData.engineers.slice(0, 10).map((engineer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{engineer.engineerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {engineer.sessionsCount} sessions • {engineer.totalHours.toFixed(1)}h total
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Moy. {engineer.averageSessionDuration.toFixed(1)}h/session
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
