/**
 * CLIENT PORTAL - Page Annulation de Paiement
 * 
 * Affichée quand l'utilisateur annule le paiement Stripe
 */

import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";

export default function ClientPortalPaymentCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <XCircle className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Paiement Annulé</CardTitle>
          <CardDescription>
            Votre paiement a été annulé
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm text-muted-foreground text-center">
            <p>Vous avez annulé le processus de paiement.</p>
            <p>Votre facture reste en attente de paiement.</p>
            <p>Vous pouvez réessayer à tout moment depuis la page des factures.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/client-portal/invoices">
              <Button className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Retour aux factures
              </Button>
            </Link>
            <Link href="/client-portal">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au portail
              </Button>
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Besoin d'aide ?</strong>
              <br />
              Si vous rencontrez des difficultés pour effectuer votre paiement,
              n'hésitez pas à nous contacter.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
