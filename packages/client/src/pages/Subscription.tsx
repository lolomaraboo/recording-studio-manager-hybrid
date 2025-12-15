import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Check, CreditCard, Calendar, TrendingUp, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Subscription() {
  const navigate = useNavigate();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  useEffect(() => {
    const storedOrgId = localStorage.getItem("selectedOrganizationId");
    if (storedOrgId) {
      setSelectedOrgId(parseInt(storedOrgId));
    } else {
      navigate("/select-organization");
    }
  }, [navigate]);

  const { data: organization } = trpc.organizations.get.useQuery(
    { id: selectedOrgId! },
    { enabled: selectedOrgId !== null }
  );

  const { data: plans } = trpc.subscriptionPlans.list.useQuery();
  
  const { data: paymentHistory } = trpc.stripe.getPaymentHistory.useQuery(
    { organizationId: selectedOrgId!, limit: 10 },
    { enabled: selectedOrgId !== null }
  );

  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirection vers Stripe...");
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création de la session de paiement");
    },
  });

  const createPortalMutation = trpc.stripe.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirection vers le portail Stripe...");
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'accès au portail");
    },
  });

  const handleUpgrade = (planName: string) => {
    if (!selectedOrgId) return;
    
    // Mapper le nom du plan vers le price ID Stripe
    // Ces IDs doivent correspondre à ceux configurés dans stripe-products.ts
    const priceMapping: Record<string, string> = {
      "Pro": "price_pro_monthly",
      "Enterprise": "price_enterprise_monthly",
    };

    const priceId = priceMapping[planName];
    if (!priceId) {
      toast.error("Plan non disponible");
      return;
    }

    createCheckoutMutation.mutate({
      organizationId: selectedOrgId,
      priceId,
    });
  };

  const handleManageSubscription = () => {
    if (!selectedOrgId) return;
    
    createPortalMutation.mutate({
      organizationId: selectedOrgId,
    });
  };

  const currentPlan = organization?.subscriptionPlan || "free";

  const getPlanFeatures = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return [
          "1 salle d'enregistrement",
          "10 clients maximum",
          "20 sessions par mois",
          "Support par email",
        ];
      case "pro":
        return [
          "5 salles d'enregistrement",
          "100 clients maximum",
          "200 sessions par mois",
          "Support prioritaire",
          "Analytics avancés",
          "Facturation récurrente",
          "Templates de sessions",
        ];
      case "enterprise":
        return [
          "Salles illimitées",
          "Clients illimités",
          "Sessions illimitées",
          "Support 24/7 dédié",
          "Analytics avancés",
          "Facturation récurrente",
          "Templates de sessions",
          "API complète",
          "Contrats personnalisés",
        ];
      default:
        return [];
    }
  };

  const getPlanPrice = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return { amount: 0, label: "Gratuit" };
      case "pro":
        return { amount: 49, label: "49€" };
      case "enterprise":
        return { amount: 149, label: "149€" };
      default:
        return { amount: 0, label: "N/A" };
    }
  };

  const plansList = [
    { id: "free", name: "Free", description: "Pour démarrer votre studio" },
    { id: "pro", name: "Pro", description: "Pour les studios en croissance" },
    { id: "enterprise", name: "Enterprise", description: "Pour les studios professionnels" },
  ];

  if (!organization) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const currentPlanInfo = plansList.find(p => p.id === currentPlan);
  const currentPlanPrice = getPlanPrice(currentPlan);

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Gestion de l'abonnement</h1>
          <p className="text-muted-foreground mt-2">
            Gérez votre plan d'abonnement et vos paiements
          </p>
        </div>

        {/* Current Plan */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Plan actuel</CardTitle>
            <CardDescription>Votre plan d'abonnement actif</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold capitalize">{currentPlan}</h3>
                  <Badge variant="default">{currentPlanPrice.label}{currentPlanPrice.amount > 0 ? "/mois" : ""}</Badge>
                </div>
                <p className="text-muted-foreground mt-2">{currentPlanInfo?.description}</p>
                {organization.stripeCurrentPeriodEnd && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Renouvellement le {new Date(organization.stripeCurrentPeriodEnd).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {currentPlan !== "free" && organization.stripeSubscriptionId && (
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={createPortalMutation.isPending}
                  >
                    {createPortalMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Gérer l'abonnement
                  </Button>
                )}
                {currentPlan !== "enterprise" && (
                  <Button onClick={() => {
                    const nextPlan = currentPlan === "free" ? "Pro" : "Enterprise";
                    handleUpgrade(nextPlan);
                  }} disabled={createCheckoutMutation.isPending}>
                    {createCheckoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    Mettre à niveau
                  </Button>
                )}
              </div>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Sessions ce mois</div>
                <div className="text-2xl font-bold mt-1">
                  {organization.sessionsThisMonth} / {currentPlan === "enterprise" ? "∞" : currentPlan === "pro" ? "200" : "20"}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Salles actives</div>
                <div className="text-2xl font-bold mt-1">
                  0 / {currentPlan === "enterprise" ? "∞" : currentPlan === "pro" ? "5" : "1"}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Clients enregistrés</div>
                <div className="text-2xl font-bold mt-1">
                  {organization.clientsCount} / {currentPlan === "enterprise" ? "∞" : currentPlan === "pro" ? "100" : "10"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Plans disponibles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plansList.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const features = getPlanFeatures(plan.name);
              const price = getPlanPrice(plan.name);

              return (
                <Card key={plan.id} className={isCurrent ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {isCurrent && <Badge>Actuel</Badge>}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <div className="text-3xl font-bold">
                        {price.label}
                      </div>
                      {price.amount > 0 && (
                        <div className="text-sm text-muted-foreground">par mois</div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {!isCurrent && plan.id !== "free" && (
                      <Button 
                        className="w-full" 
                        variant={plan.name === "Enterprise" ? "default" : "outline"}
                        onClick={() => handleUpgrade(plan.name)}
                        disabled={createCheckoutMutation.isPending}
                      >
                        {createCheckoutMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          "Choisir ce plan"
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Method & History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Paiement et facturation
            </CardTitle>
            <CardDescription>Gérez vos informations de paiement et consultez l'historique</CardDescription>
          </CardHeader>
          <CardContent>
            {currentPlan !== "free" && organization.stripeSubscriptionId ? (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-6">
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Carte bancaire enregistrée</p>
                  <p className="text-sm text-muted-foreground">
                    Gérez vos moyens de paiement via le portail Stripe
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleManageSubscription}
                  disabled={createPortalMutation.isPending}
                >
                  {createPortalMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Gérer
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-6">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Aucune carte enregistrée</p>
                  <p className="text-sm text-muted-foreground">
                    Passez à un plan payant pour ajouter une carte bancaire
                  </p>
                </div>
              </div>
            )}

            {/* Billing History */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Historique de facturation
              </h3>
              {paymentHistory && paymentHistory.length > 0 ? (
                <div className="space-y-2">
                  {paymentHistory.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{payment.description || "Paiement d'abonnement"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{payment.amount} {payment.currency}</p>
                        <Badge variant={payment.status === "succeeded" ? "default" : "secondary"}>
                          {payment.status === "succeeded" ? "Payé" : payment.status}
                        </Badge>
                      </div>
                      {payment.receiptUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun paiement enregistré
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
