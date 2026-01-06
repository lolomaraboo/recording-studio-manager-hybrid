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
import { DollarSign, Plus, Search, ArrowLeft, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function Expenses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: expenses, isLoading: expensesLoading } = trpc.expenses.list.useQuery({ limit: 100 });

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = expenses?.slice() || [];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (expense) =>
          expense.description.toLowerCase().includes(query) ||
          expense.vendor?.toLowerCase().includes(query) ||
          expense.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      result = result.filter((expense) => expense.category === categoryFilter);
    }

    // Sort by expense date (most recent first)
    result.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

    return result;
  }, [expenses, searchQuery, categoryFilter]);

  // Calculate stats by category
  const stats = useMemo(() => {
    if (!expenses) return { total: 0, thisMonth: 0, byCategory: {} };

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);
    const thisMonth = expenses
      .filter((exp) => new Date(exp.expenseDate) >= firstDayOfMonth)
      .reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);

    const byCategory = expenses.reduce((acc, exp) => {
      const cat = exp.category;
      acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount || "0");
      return acc;
    }, {} as Record<string, number>);

    return { total, thisMonth, byCategory };
  }, [expenses]);

  const getCategoryBadge = (category: string) => {
    const labels: Record<string, string> = {
      rent: "Loyer",
      utilities: "Services publics",
      insurance: "Assurance",
      maintenance: "Maintenance",
      salary: "Salaire",
      marketing: "Marketing",
      software: "Logiciel",
      supplies: "Fournitures",
      equipment: "Équipement",
      other: "Autre",
    };

    return <Badge variant="outline">{labels[category] || category}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Dépenses</h1>
            </div>
          </div>
          <Button asChild>
            <Link to="/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle dépense
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-6">
          {/* Stats */}
          {expensesLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total dépenses</CardDescription>
                  <CardTitle className="text-3xl">
                    {stats.total.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    €
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Toutes périodes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Ce mois</CardDescription>
                  <CardTitle className="text-3xl text-orange-600">
                    {stats.thisMonth.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    €
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(), "MMMM yyyy", { locale: fr })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Nombre de dépenses</CardDescription>
                  <CardTitle className="text-3xl">{expenses?.length || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Total enregistré</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par description, fournisseur ou catégorie..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      <SelectItem value="rent">Loyer</SelectItem>
                      <SelectItem value="utilities">Services publics</SelectItem>
                      <SelectItem value="insurance">Assurance</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="salary">Salaire</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="software">Logiciel</SelectItem>
                      <SelectItem value="supplies">Fournitures</SelectItem>
                      <SelectItem value="equipment">Équipement</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card>
            <CardHeader>
              <CardTitle>{filteredExpenses.length} dépense(s)</CardTitle>
              <CardDescription>Suivez et analysez vos dépenses professionnelles</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredExpenses.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>TVA</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            {format(new Date(expense.expenseDate), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>{expense.vendor || "-"}</TableCell>
                          <TableCell>{getCategoryBadge(expense.category)}</TableCell>
                          <TableCell className="font-semibold">
                            {parseFloat(expense.amount || "0").toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            € {expense.currency && expense.currency !== "EUR" && `(${expense.currency})`}
                          </TableCell>
                          <TableCell>
                            {expense.taxAmount
                              ? `${parseFloat(expense.taxAmount).toLocaleString("fr-FR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}€`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/expenses/${expense.id}`}>
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
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune dépense</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par enregistrer votre première dépense
                  </p>
                  <Button asChild>
                    <Link to="/expenses/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Nouvelle dépense
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
