import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  format: 'vcard' | 'excel' | 'csv';
  onImportComplete: () => void;
}

export function ImportClientsDialog({ open, onClose, format, onImportComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const importVCard = trpc.clients.importVCard.useMutation();
  const importExcel = trpc.clients.importExcel.useMutation();
  const importCSV = trpc.clients.importCSV.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Read file and preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;

      try {
        let result;
        if (format === 'vcard') {
          result = await importVCard.mutateAsync({ content: content as string });
        } else if (format === 'excel') {
          // Convert ArrayBuffer to base64
          const arrayBuffer = content as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          result = await importExcel.mutateAsync({ content: base64 });
        } else {
          result = await importCSV.mutateAsync({ content: content as string });
        }

        setPreview(result.preview);
        toast.success(`${result.count} contacts trouvés`);
      } catch (error: any) {
        // Display specific error message from server (e.g., validation errors)
        console.error('Import error full object:', error);
        console.error('Import error keys:', Object.keys(error || {}));
        console.error('Import error.message:', error?.message);
        console.error('Import error.data:', error?.data);
        console.error('Import error.shape:', error?.shape);

        const errorMessage = error?.message || error?.data?.message || error?.shape?.message || 'Erreur lors de la lecture du fichier';
        toast.error(errorMessage);
      }
    };

    if (format === 'excel') {
      reader.readAsArrayBuffer(selectedFile);
    } else {
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    // Check if file was successfully parsed (preview has data)
    if (preview.length === 0) {
      toast.error('Aucun contact valide trouvé dans le fichier');
      return;
    }

    setImporting(true);
    try {
      toast.success(`Import réussi! ${preview.length} contact(s) importé(s)`);
      onImportComplete();
      setFile(null);
      setPreview([]);
    } catch (error) {
      toast.error('Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Importer des clients - {format.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <input
              type="file"
              id="import-file"
              accept={
                format === 'vcard'
                  ? '.vcf'
                  : format === 'excel'
                  ? '.xlsx'
                  : '.csv'
              }
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-file')?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choisir un fichier {format.toUpperCase()}
            </Button>
            {file && (
              <div className="mt-2 text-sm text-muted-foreground">
                Fichier: {file.name}
              </div>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="border rounded p-4">
              <h4 className="font-semibold mb-2">
                Aperçu (5 premiers contacts)
              </h4>
              <div className="space-y-2">
                {preview.map((client, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{client.name}</span>
                    {client.email && (
                      <span className="text-muted-foreground">
                        ({client.email})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? 'Import en cours...' : 'Importer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
