/**
 * VAT Rates Section Component
 *
 * Displays table of VAT rates with actions:
 * - Create new rate
 * - Set default rate
 * - Edit rate name
 * - Archive rate
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Star, Archive, Edit } from 'lucide-react';
import { CreateVatRateDialog } from './CreateVatRateDialog';
import { EditVatRateDialog } from './EditVatRateDialog';
import { toast } from 'sonner';

export function VatRatesSection() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Queries
  const { data: vatRates, isLoading } = showArchived
    ? trpc.vatRates.listAll.useQuery()
    : trpc.vatRates.list.useQuery();
  const utils = trpc.useContext();

  // Mutations
  const setDefaultMutation = trpc.vatRates.setDefault.useMutation({
    onSuccess: () => {
      utils.vatRates.list.invalidate();
      utils.vatRates.listAll.invalidate();
      toast.success('Taux par défaut modifié');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const archiveMutation = trpc.vatRates.archive.useMutation({
    onSuccess: () => {
      utils.vatRates.list.invalidate();
      utils.vatRates.listAll.invalidate();
      toast.success('Taux de TVA archivé avec succès');
    },
    onError: (error) => {
      toast.error(`Impossible d'archiver: ${error.message}`);
    },
  });

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate({ id });
  };

  const handleArchive = (id: number, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir archiver le taux "${name}" ?`)) {
      archiveMutation.mutate({ id });
    }
  };

  const handleEdit = (rate: any) => {
    setEditingRate(rate);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Chargement...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Taux de TVA</CardTitle>
              <CardDescription className="text-sm">
                Configurez les taux de TVA applicables à vos factures et devis
              </CardDescription>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4 text-primary" />
              Ajouter un taux
            </Button>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived" className="text-sm cursor-pointer">
              Afficher les taux archivés
            </Label>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {vatRates && vatRates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vatRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.name}</TableCell>
                    <TableCell>{rate.rate}%</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {rate.isDefault && (
                          <Badge variant="default" className="gap-1">
                            <Star className="h-3 w-3 text-primary" />
                            Par défaut
                          </Badge>
                        )}
                        {!rate.isActive && (
                          <Badge variant="secondary" className="gap-1">
                            <Archive className="h-3 w-3" />
                            Archivé
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {rate.isActive ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4 text-primary" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!rate.isDefault && (
                              <DropdownMenuItem
                                onClick={() => handleSetDefault(rate.id)}
                              >
                                <Star className="mr-2 h-4 w-4 text-primary" />
                                Définir par défaut
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEdit(rate)}>
                              <Edit className="mr-2 h-4 w-4 text-primary" />
                              Modifier le nom
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleArchive(rate.id, rate.name)}
                              disabled={rate.isDefault}
                            >
                              <Archive className="mr-2 h-4 w-4 text-primary" />
                              Archiver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Aucun taux de TVA configuré
            </div>
          )}
        </CardContent>
      </Card>

      <CreateVatRateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {editingRate && (
        <EditVatRateDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          rate={editingRate}
        />
      )}
    </>
  );
}
