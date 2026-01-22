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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Star, Archive, Edit } from 'lucide-react';
import { CreateVatRateDialog } from './CreateVatRateDialog';
import { EditVatRateDialog } from './EditVatRateDialog';
import { useToast } from '@/hooks/use-toast';

export function VatRatesSection() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);

  // Queries
  const { data: vatRates, isLoading } = trpc.vatRates.list.useQuery();
  const utils = trpc.useContext();

  // Mutations
  const setDefaultMutation = trpc.vatRates.setDefault.useMutation({
    onSuccess: () => {
      utils.vatRates.list.invalidate();
      toast({
        title: 'Taux par défaut modifié',
        description: 'Le nouveau taux par défaut a été enregistré.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const archiveMutation = trpc.vatRates.archive.useMutation({
    onSuccess: () => {
      utils.vatRates.list.invalidate();
      toast({
        title: 'Taux archivé',
        description: 'Le taux de TVA a été archivé avec succès.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Impossible d\'archiver',
        description: error.message,
        variant: 'destructive',
      });
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
                      {rate.isDefault && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3 text-primary" />
                          Par défaut
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
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
