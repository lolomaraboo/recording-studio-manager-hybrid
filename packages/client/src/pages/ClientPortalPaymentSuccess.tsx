/**
 * Client Portal Payment Success Page
 *
 * Displayed after successful Stripe payment
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function ClientPortalPaymentSuccess() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <CardTitle>Paiement reussi !</CardTitle>
          <CardDescription>
            Votre paiement a ete traite avec succes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Vous recevrez une confirmation par email sous peu.
          </p>
          <Button asChild>
            <Link to="/client-portal">
              Retour au portail
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
