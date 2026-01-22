import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface EditVatRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: { id: number; name: string; rate: string };
}

export function EditVatRateDialog({
  open,
  onOpenChange,
  rate,
}: EditVatRateDialogProps) {
  const [name, setName] = useState(rate.name);

  useEffect(() => {
    setName(rate.name);
  }, [rate]);

  const utils = trpc.useContext();

  const updateMutation = trpc.vatRates.update.useMutation({
    onSuccess: () => {
      utils.vatRates.list.invalidate();
      toast.success('Taux de TVA modifié avec succès');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ id: rate.id, name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier le taux de TVA</DialogTitle>
            <DialogDescription>
              Modifiez le nom du taux. Le pourcentage ne peut pas être modifié
              pour préserver l'historique.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Taux actuel</Label>
              <div className="text-sm text-muted-foreground">{rate.rate}%</div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Modification...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
