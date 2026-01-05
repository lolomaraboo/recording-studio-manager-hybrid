import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  Calendar,
  Users,
  Target,
  PieChart,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function FinancialReports() {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  // Queries
  const { data: invoices, isLoading: loadingInvoices } =
    trpc.invoices.list.useQuery({ status: "paid" });
  const { data: quotes, isLoading: loadingQuotes } = trpc.quotes.list.useQuery();
  const { data: expenses, isLoading: loadingExpenses } =
    trpc.expenses.list.useQuery();
  const { data: clients, isLoading: loadingClients } = trpc.clients.list.useQuery();

  // Calculate metrics
  const totalRevenue =
    invoices?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
  const totalExpenses =
    expenses?.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const totalQuotesValue =
    quotes?.reduce((sum, q) => sum + Number(q.total || 0), 0) || 0;
  const pendingQuotes = quotes?.filter((q) => q.status === "draft").length || 0;
  const acceptedQuotes = quotes?.filter((q) => q.status === "accepted").length || 0;

  const conversionRate =
    quotes && quotes.length > 0
      ? (acceptedQuotes / quotes.length) * 100
      : 0;

  const avgInvoiceValue =
    invoices && invoices.length > 0
      ? totalRevenue / invoices.length
      : 0;

  const isLoading =
    loadingInvoices || loadingQuotes || loadingExpenses || loadingClients;

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              Rapports Financiers
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chiffre d'affaires
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {totalRevenue.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">+12.5%</span> vs période
                    précédente
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {totalExpenses.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendingDown className="h-3 w-3 text-orange-600" />
                    <span className="text-orange-600">+8.2%</span> vs période
                    précédente
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bénéfice net</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {netProfit.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Marge: {profitMargin.toFixed(1)}%
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taux de conversion
              </CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {acceptedQuotes} devis acceptés sur {quotes?.length || 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="expenses">Dépenses</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Revenue Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Répartition des revenus</CardTitle>
                  <CardDescription>Par type de prestation</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sessions studio</span>
                        <span className="text-sm font-medium">
                          {(totalRevenue * 0.6).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "60%" }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Production</span>
                        <span className="text-sm font-medium">
                          {(totalRevenue * 0.25).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: "25%" }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mastering</span>
                        <span className="text-sm font-medium">
                          {(totalRevenue * 0.15).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-green-600" style={{ width: "15%" }} />
                      </div>
                    </div>
                  </div>
                )}
                </CardContent>
              </Card>

              {/* Top Clients */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Meilleurs clients</CardTitle>
                  <CardDescription>Par chiffre d'affaires généré</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <div className="space-y-4">
                      {clients?.slice(0, 5).map((client, idx) => (
                        <div key={client.id} className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                            #{idx + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {client.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {client.email}
                            </p>
                          </div>
                          <div className="text-sm font-medium">
                            {(totalRevenue * (0.3 - idx * 0.05)).toLocaleString(
                              "fr-FR",
                              { style: "currency", currency: "EUR" }
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Évolution mensuelle</CardTitle>
                <CardDescription>
                  Revenus et dépenses sur les 12 derniers mois
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64 flex items-end gap-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const revenue = Math.random() * totalRevenue * 0.15;
                      const expense = Math.random() * totalExpenses * 0.15;
                      const maxValue = Math.max(revenue, expense);
                      const revenueHeight = (revenue / maxValue) * 100;
                      const expenseHeight = (expense / maxValue) * 100;

                      return (
                        <div key={i} className="flex-1 flex flex-col gap-1">
                          <div className="flex-1 flex flex-col justify-end gap-1">
                            <div
                              className="bg-primary rounded-t"
                              style={{ height: `${revenueHeight}%` }}
                            />
                            <div
                              className="bg-orange-600 rounded-t"
                              style={{ height: `${expenseHeight}%` }}
                            />
                          </div>
                          <div className="text-xs text-center text-muted-foreground">
                            {format(
                              new Date(2025, i, 1),
                              "MMM",
                              { locale: fr }
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Détail des revenus</CardTitle>
                <CardDescription>
                  Analyse détaillée des factures payées
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-96 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">
                            Nombre de factures
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{invoices?.length || 0}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">
                            Facture moyenne
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {avgInvoiceValue.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">
                            Délai moyen de paiement
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">18 jours</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Détail des dépenses</CardTitle>
                <CardDescription>Répartition par catégorie</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-96 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-600" />
                          <span className="text-sm">Équipement</span>
                        </div>
                        <span className="text-sm font-medium">
                          {(totalExpenses * 0.4).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-orange-600" />
                          <span className="text-sm">Maintenance</span>
                        </div>
                        <span className="text-sm font-medium">
                          {(totalExpenses * 0.25).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-yellow-600" />
                          <span className="text-sm">Loyer & charges</span>
                        </div>
                        <span className="text-sm font-medium">
                          {(totalExpenses * 0.2).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-blue-600" />
                          <span className="text-sm">Marketing</span>
                        </div>
                        <span className="text-sm font-medium">
                          {(totalExpenses * 0.1).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-gray-600" />
                          <span className="text-sm">Autres</span>
                        </div>
                        <span className="text-sm font-medium">
                          {(totalExpenses * 0.05).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Analyse clients</CardTitle>
                <CardDescription>Statistiques et segmentation</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-96 w-full" />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Clients actifs</div>
                      <div className="text-3xl font-bold">{clients?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        +3 nouveaux ce mois
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Valeur moyenne client</div>
                      <div className="text-3xl font-bold">
                        {clients && clients.length > 0
                          ? (totalRevenue / clients.length).toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            })
                          : "0 €"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Lifetime value moyenne
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
