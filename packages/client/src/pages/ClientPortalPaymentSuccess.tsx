/**
 * CLIENT PORTAL - Page Succès de Paiement
 * 
 * Affichée après un paiement Stripe réussi
 */

import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ClientPortalPaymentSuccess() {
  const [location] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Extraire le session_id de l'URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    setSessionId(id);
  }, [location]);

  const { data: paymentStatus, isLoading } = trpc.stripe.checkPaymentStatus.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Vérification du paiement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Paiement Réussi !</CardTitle>
          <CardDescription>
            Votre paiement a été traité avec succès
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {paymentStatus && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant payé</span>
                <span className="font-medium">
                  {((paymentStatus.amountTotal || 0) / 100).toFixed(2)} {paymentStatus.currency?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <span className="font-medium text-green-600">
                  {paymentStatus.status === "paid" ? "Payé" : "En attente"}
                </span>
              </div>
              {paymentStatus.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="font-medium">{paymentStatus.customerEmail}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Un email de confirmation a été envoyé à votre adresse</p>
            <p>✓ Votre facture a été mise à jour automatiquement</p>
            <p>✓ Vous pouvez télécharger votre reçu depuis la page des factures</p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/client-portal/invoices">
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Voir mes factures
              </Button>
            </Link>
            <Link href="/client-portal">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au portail
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
