/**
 * Client Invoices Page - Coming Soon
 *
 * Client invoices view will be implemented in a future phase.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ClientInvoices() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Mes Factures</CardTitle>
                <CardDescription>
                  Consultez et payez vos factures
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                La consultation de factures sera disponible dans une prochaine mise a jour.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
