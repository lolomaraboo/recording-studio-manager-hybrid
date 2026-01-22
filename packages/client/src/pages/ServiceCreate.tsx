import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Package, X } from "lucide-react";
import { toast } from "sonner";
import { ServiceEditForm } from "@/components/ServiceEditForm";

type ServiceCategory = "Studio" | "Post-production" | "Location matériel" | "Autre";

export default function ServiceCreate() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  // Fetch default VAT rate
  const { data: vatRates } = trpc.vatRates.list.useQuery();

  // Create mutation
  const createMutation = trpc.serviceCatalog.create.useMutation({
    onSuccess: () => {
      utils.serviceCatalog.list.invalidate();
      toast.success("Service créé avec succès");
      navigate("/services");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Studio" as ServiceCategory,
    unitPrice: "",
    vatRateId: undefined as number | undefined,
    defaultQuantity: "1.00",
  });

  // Set default VAT rate when loaded
  useEffect(() => {
    if (vatRates && !formData.vatRateId) {
      const defaultVatRate = vatRates.find((rate) => rate.isDefault);
      if (defaultVatRate) {
        setFormData((prev) => ({ ...prev, vatRateId: defaultVatRate.id }));
      }
    }
  }, [vatRates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    const unitPrice = parseFloat(formData.unitPrice);
    if (!formData.unitPrice || isNaN(unitPrice) || unitPrice < 0) {
      toast.error("Le prix unitaire doit être un nombre positif");
      return;
    }

    if (!formData.vatRateId) {
      toast.error("Veuillez sélectionner un taux de TVA");
      return;
    }

    const defaultQuantity = parseFloat(formData.defaultQuantity);
    if (!formData.defaultQuantity || isNaN(defaultQuantity) || defaultQuantity <= 0) {
      toast.error("La quantité par défaut doit être supérieure à 0");
      return;
    }

    // Submit
    createMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category,
      unitPrice: formData.unitPrice,
      vatRateId: formData.vatRateId,
      defaultQuantity: formData.defaultQuantity,
    } as any);
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/services">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Package className="h-8 w-8 text-primary" />
                Nouveau Service
              </h1>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <ServiceEditForm
            formData={formData}
            setFormData={setFormData}
          />

          {/* Submit button */}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/services">
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Création..." : "Créer le service"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
