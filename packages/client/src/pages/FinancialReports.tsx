/**
 * Page Rapports Financiers
 * 
 * Tableaux de bord avec graphiques interactifs :
 * - Revenus par période (mois, trimestre, année)
 * - Taux de recouvrement
 * - Analyse des paiements par méthode
 * - Revenus par client
 * - Export PDF/Excel
 */

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  Calendar,
  Users,
  CreditCard,
  PieChart as PieChartIcon,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type PeriodType = "month" | "quarter" | "year";

export default function FinancialReports() {
  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const organizationId = Number(localStorage.getItem("currentOrganizationId"));

  // Récupérer les données de revenus
  const { data: revenueData, isLoading: revenueLoading } = trpc.reports.getRevenue.useQuery({
    organizationId,
    period,
    startDate: startOfMonth(new Date(selectedMonth)).toISOString(),
    endDate: endOfMonth(new Date(selectedMonth)).toISOString(),
  });

  // Récupérer le taux de recouvrement
  const { data: collectionRate } = trpc.reports.getCollectionRate.useQuery({
    organizationId,
    startDate: startOfMonth(subMonths(new Date(), 12)).toISOString(),
    endDate: new Date().toISOString(),
  });

  // Récupérer les paiements par méthode
  const { data: paymentMethods } = trpc.reports.getPaymentsByMethod.useQuery({
    organizationId,
    startDate: startOfMonth(subMonths(new Date(), 12)).toISOString(),
    endDate: new Date().toISOString(),
  });

  // Récupérer les revenus par client
  const { data: topClients } = trpc.reports.getTopClients.useQuery({
    organizationId,
    limit: 10,
    startDate: startOfMonth(subMonths(new Date(), 12)).toISOString(),
    endDate: new Date().toISOString(),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(20);
      doc.text("Rapport Financier", 14, 22);
      doc.setFontSize(11);
      doc.text(`Période: ${format(new Date(selectedMonth), "MMMM yyyy", { locale: fr })}`, 14, 30);
      doc.text(`Généré le: ${format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}`, 14, 36);
      
      let yPos = 50;
      
      // KPIs
      doc.setFontSize(14);
      doc.text("Indicateurs Clés", 14, yPos);
      yPos += 10;
      
      const kpiData = [
        ["Revenus Totaux", revenueData ? formatCurrency(revenueData.total) : "—"],
        ["Taux de Recouvrement", collectionRate ? formatPercentage(collectionRate.rate) : "—"],
        ["Factures Émises", revenueData?.invoiceCount?.toString() || "0"],
        ["Clients Actifs", revenueData?.activeClients?.toString() || "0"],
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [["Indicateur", "Valeur"]],
        body: kpiData,
        theme: "striped",
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Paiements par méthode
      if (paymentMethods && paymentMethods.length > 0) {
        doc.setFontSize(14);
        doc.text("Paiements par Méthode", 14, yPos);
        yPos += 10;
        
        const paymentData = paymentMethods.map((method: any) => [
          method.method || "Non spécifié",
          method.count.toString(),
          formatCurrency(method.total),
          formatPercentage(method.percentage),
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [["Méthode", "Transactions", "Montant", "Pourcentage"]],
          body: paymentData,
          theme: "striped",
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Top Clients
      if (topClients && topClients.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text("Top 10 Clients", 14, yPos);
        yPos += 10;
        
        const clientData = topClients.map((client: any, index: number) => [
          (index + 1).toString(),
          client.clientName,
          client.invoiceCount.toString(),
          formatCurrency(client.totalRevenue),
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [["#", "Client", "Factures", "Revenus"]],
          body: clientData,
          theme: "striped",
        });
      }
      
      // Sauvegarder le PDF
      doc.save(`rapport-financier-${selectedMonth}.pdf`);
      toast.success("Rapport PDF téléchargé avec succès");
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast.error("Erreur lors de l'export PDF");
    }
  };

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Feuille 1: KPIs
      const kpiData = [
        ["Rapport Financier"],
        [`Période: ${format(new Date(selectedMonth), "MMMM yyyy", { locale: fr })}`],
        [`Généré le: ${format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}`],
        [],
        ["Indicateur", "Valeur"],
        ["Revenus Totaux", revenueData ? formatCurrency(revenueData.total) : "—"],
        ["Taux de Recouvrement", collectionRate ? formatPercentage(collectionRate.rate) : "—"],
        ["Factures Émises", revenueData?.invoiceCount || 0],
        ["Clients Actifs", revenueData?.activeClients || 0],
        ["Montant Moyen Facture", revenueData ? formatCurrency(revenueData.averageInvoice) : "—"],
        ["Revenu Moyen par Client", revenueData ? formatCurrency(revenueData.revenuePerClient) : "—"],
      ];
      
      const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(workbook, kpiSheet, "KPIs");
      
      // Feuille 2: Paiements par méthode
      if (paymentMethods && paymentMethods.length > 0) {
        const paymentData = [
          ["Méthode", "Transactions", "Montant (€)", "Pourcentage"],
          ...paymentMethods.map((method: any) => [
            method.method || "Non spécifié",
            method.count,
            method.total / 100,
            method.percentage,
          ]),
        ];
        
        const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
        XLSX.utils.book_append_sheet(workbook, paymentSheet, "Paiements");
      }
      
      // Feuille 3: Top Clients
      if (topClients && topClients.length > 0) {
        const clientData = [
          ["Rang", "Client", "Factures", "Revenus (€)"],
          ...topClients.map((client: any, index: number) => [
            index + 1,
            client.clientName,
            client.invoiceCount,
            client.totalRevenue / 100,
          ]),
        ];
        
        const clientSheet = XLSX.utils.aoa_to_sheet(clientData);
        XLSX.utils.book_append_sheet(workbook, clientSheet, "Top Clients");
      }
      
      // Sauvegarder le fichier Excel
      XLSX.writeFile(workbook, `rapport-financier-${selectedMonth}.xlsx`);
      toast.success("Rapport Excel téléchargé avec succès");
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      toast.error("Erreur lors de l'export Excel");
    }
  };

  return (
    <AppLayout>
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rapports Financiers</h1>
          <p className="text-muted-foreground">
            Analyse détaillée de vos revenus et paiements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mois</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Année</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Mois</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueData ? formatCurrency(revenueData.total) : "—"}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {revenueData && revenueData.growth > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{formatPercentage(revenueData.growth)}</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{formatPercentage(revenueData?.growth || 0)}</span>
                </>
              )}
              <span>vs période précédente</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Recouvrement</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collectionRate ? formatPercentage(collectionRate.rate) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {collectionRate?.paid || 0} factures payées sur {collectionRate?.total || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures Émises</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueData?.invoiceCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Montant moyen : {revenueData ? formatCurrency(revenueData.averageInvoice) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueData?.activeClients || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenu moyen par client : {revenueData ? formatCurrency(revenueData.revenuePerClient) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs avec graphiques */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="payments">Méthodes de Paiement</TabsTrigger>
          <TabsTrigger value="clients">Top Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Revenus</CardTitle>
              <CardDescription>
                Revenus mensuels sur les 12 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData && revenueData.monthlyData && revenueData.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="month"
                      stroke="#a3a3a3"
                      tick={{ fill: "#a3a3a3" }}
                    />
                    <YAxis
                      stroke="#a3a3a3"
                      tick={{ fill: "#a3a3a3" }}
                      tickFormatter={(value) => `${(value / 100).toFixed(0)}€`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "6px",
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#dc2626"
                      strokeWidth={2}
                      name="Revenus"
                      dot={{ fill: "#dc2626", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground">Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Méthode de Paiement</CardTitle>
              <CardDescription>
                Distribution des paiements par méthode
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods && paymentMethods.length > 0 && (
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, percentage }: any) => `${method || "Autre"} (${percentage.toFixed(1)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="total"
                      >
                        {paymentMethods.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={["#dc2626", "#525252", "#737373", "#a3a3a3", "#d4d4d4"][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333",
                          borderRadius: "6px",
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="space-y-4">
                {paymentMethods && paymentMethods.length > 0 ? (
                  paymentMethods.map((method: any) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{method.method || "Non spécifié"}</p>
                          <p className="text-sm text-muted-foreground">
                            {method.count} transaction{method.count > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(method.total)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPercentage(method.percentage)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune donnée disponible
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Clients</CardTitle>
              <CardDescription>
                Clients générant le plus de revenus
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topClients && topClients.length > 0 && (
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topClients} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        type="number"
                        stroke="#a3a3a3"
                        tick={{ fill: "#a3a3a3" }}
                        tickFormatter={(value) => `${(value / 100).toFixed(0)}€`}
                      />
                      <YAxis
                        dataKey="clientName"
                        type="category"
                        stroke="#a3a3a3"
                        tick={{ fill: "#a3a3a3" }}
                        width={150}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333",
                          borderRadius: "6px",
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Bar dataKey="totalRevenue" fill="#dc2626" name="Revenus" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="space-y-4">
                {topClients && topClients.length > 0 ? (
                  topClients.map((client: any, index: number) => (
                    <div key={client.clientId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{client.clientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.invoiceCount} facture{client.invoiceCount > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(client.totalRevenue)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune donnée disponible
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AppLayout>
  );
}
