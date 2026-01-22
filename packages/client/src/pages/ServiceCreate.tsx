import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Package, X } from "lucide-react";
import { toast } from "sonner";
import { ServiceEditForm } from "@/components/ServiceEditForm";

type ServiceCategory = "Studio" | "Post-production" | "Location matériel" | "Autre";

export default function ServiceCreate() {
  const navigate = useNavigate();

  // Create mutation
  const createMutation = trpc.serviceCatalog.create.useMutation({
    onSuccess: () => {
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
    taxRate: "20",
    defaultQuantity: "1.00",
  });

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

    const taxRate = parseFloat(formData.taxRate);
    if (!formData.taxRate || isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      toast.error("Le taux de TVA doit être entre 0 et 100");
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
      description: formData.description.trim() || null,
      category: formData.category,
      unitPrice: formData.unitPrice,
      taxRate: formData.taxRate,
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
