import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface CreateVatRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateVatRateDialog({
  open,
  onOpenChange,
}: CreateVatRateDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const utils = trpc.useContext();

  const createMutation = trpc.vatRates.create.useMutation({
    onSuccess: () => {
      utils.vatRates.list.invalidate();
      toast({
        title: 'Taux créé',
        description: 'Le nouveau taux de TVA a été créé avec succès.',
      });
      onOpenChange(false);
      // Reset form
      setName('');
      setRate('');
      setIsDefault(false);
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNumber = parseFloat(rate);
    if (isNaN(rateNumber) || rateNumber < 0 || rateNumber > 100) {
      toast({
        title: 'Taux invalide',
        description: 'Le taux doit être un nombre entre 0 et 100.',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate({ name, rate: rateNumber, isDefault });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nouveau taux de TVA</DialogTitle>
            <DialogDescription>
              Créez un nouveau taux de TVA pour votre organisation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: TVA Standard 20%"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Taux (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="20.00"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
              <Label htmlFor="isDefault">Définir comme taux par défaut</Label>
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
