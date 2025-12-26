import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface UpgradeModalProps {
  limitType: "sessions" | "storage";
  currentPlan: string;
  onClose: () => void;
}

/**
 * UpgradeModal Component
 *
 * Displays upgrade prompt when user hits subscription limits.
 * Shows pricing comparison and triggers Stripe Checkout.
 *
 * Port from Python templates (if existed) or new component.
 */
export function UpgradeModal({ limitType, currentPlan, onClose }: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const navigate = useNavigate();

  const { data: availablePlans } = trpc.subscriptions.getAvailablePlans.useQuery();

  const createCheckout = trpc.subscriptions.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      alert(`Erreur lors de la création de la session: ${error.message}`);
      setIsUpgrading(false);
    },
  });

  // Determine recommended upgrade plan
  const getRecommendedPlan = () => {
    if (currentPlan === "trial" || currentPlan === "starter") {
      return availablePlans?.find(p => p.name === "pro");
    }
    if (currentPlan === "pro") {
      return availablePlans?.find(p => p.name === "enterprise");
    }
    return null;
  };

  const recommendedPlan = getRecommendedPlan();

  // Get current plan details
  const currentPlanDetails = availablePlans?.find(p => p.name === currentPlan);

  // Limit messages
  const limitMessages = {
    sessions: {
      title: "Limite de sessions mensuelle atteinte",
      description: limitType === "sessions" && currentPlanDetails
        ? `Vous avez utilisé toutes les ${currentPlanDetails.maxSessions} sessions incluses dans votre plan ${currentPlanDetails.displayName}.`
        : "Vous avez atteint votre limite de sessions mensuelle.",
      benefit: "sessions illimitées",
    },
    storage: {
      title: "Limite de stockage atteinte",
      description: limitType === "storage" && currentPlanDetails
        ? `Vous avez utilisé les ${currentPlanDetails.maxStorage} GB de stockage inclus dans votre plan ${currentPlanDetails.displayName}.`
        : "Vous avez atteint votre limite de stockage.",
      benefit: "stockage étendu",
    },
  };

  const message = limitMessages[limitType];

  const handleUpgrade = (planId: number) => {
    setIsUpgrading(true);
    createCheckout.mutate({
      planId,
      billingPeriod: "monthly",
    });
  };

  const handleViewAllPlans = () => {
    onClose();
    navigate("/settings?tab=billing");
  };

  if (!recommendedPlan) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {message.title}
            </DialogTitle>
            <DialogDescription>
              {message.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vous êtes déjà sur le plan le plus élevé. Contactez notre support pour des options personnalisées.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {message.title}
          </DialogTitle>
          <DialogDescription>
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upgrade CTA */}
          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Passer au plan {recommendedPlan.displayName}</h3>
                  <Badge>Recommandé</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Obtenez {message.benefit} et débloquez toutes les fonctionnalités.
                </p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold">{recommendedPlan.priceMonthly} €</span>
                  <span className="text-muted-foreground">/ mois</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {recommendedPlan.features && JSON.parse(recommendedPlan.features as any).slice(0, 4).map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Plan */}
            {currentPlanDetails && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium mb-1">Plan actuel</div>
                <div className="text-lg font-semibold mb-2">{currentPlanDetails.displayName}</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Sessions: {currentPlanDetails.maxSessions || "Illimité"}</div>
                  <div>Stockage: {currentPlanDetails.maxStorage ? `${currentPlanDetails.maxStorage} GB` : "Illimité"}</div>
                </div>
              </div>
            )}

            {/* Recommended Plan */}
            <div className="p-3 border-2 border-primary rounded-lg bg-primary/5">
              <div className="text-sm font-medium mb-1 text-primary">Plan recommandé</div>
              <div className="text-lg font-semibold mb-2">{recommendedPlan.displayName}</div>
              <div className="space-y-1 text-sm">
                <div className="font-medium">Sessions: {recommendedPlan.maxSessions || "Illimitées"}</div>
                <div className="font-medium">Stockage: {recommendedPlan.maxStorage ? `${recommendedPlan.maxStorage} GB` : "Illimité"}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleViewAllPlans}>
              Voir tous les plans
            </Button>
            <Button
              onClick={() => handleUpgrade(recommendedPlan.id)}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                "Chargement..."
              ) : (
                <>
                  Passer au plan {recommendedPlan.displayName}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
