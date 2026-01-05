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
              <DollarSign className="h-8 w-8 text-primary" />
              Dépenses
            </h2>
          </div>
          <Button asChild>
            <Link to="/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle dépense
            </Link>
          </Button>
        </div>
        {/* Stats */}
        {expensesLoading ? (
          <div className="grid gap-2 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
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
              <CardHeader className="pb-3">
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
              <CardHeader className="pb-3">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{filteredExpenses.length} dépense(s)</CardTitle>
            <CardDescription className="text-sm">Suivez et analysez vos dépenses professionnelles</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
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
                <div className="text-center py-6">
                  <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-sm font-medium mb-1">Aucune dépense</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Commencez par enregistrer votre première dépense
                  </p>
                  <Button asChild size="sm">
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
    </div>
  );
}
