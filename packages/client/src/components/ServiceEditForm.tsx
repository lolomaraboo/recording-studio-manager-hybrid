/**
 * ServiceEditForm.tsx
 * Formulaire d'édition de service avec accordéons
 * Pattern reference: TalentEditForm (Phase 28)
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Package, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";

type ServiceCategory = "Studio" | "Post-production" | "Location matériel" | "Autre";

interface ServiceEditFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ServiceEditForm({
  formData,
  setFormData,
}: ServiceEditFormProps) {
  // Fetch VAT rates
  const { data: vatRates, isLoading: vatRatesLoading } = trpc.vatRates.list.useQuery();
  // State to manage open accordions with localStorage persistence
  const [openItems, setOpenItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('serviceEditAccordions');
      return saved ? JSON.parse(saved) : ["identite", "pricing"];
    } catch {
      return ["identite", "pricing"];
    }
  });

  // Save accordion state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('serviceEditAccordions', JSON.stringify(openItems));
    } catch (error) {
      console.error('Failed to save accordion state:', error);
    }
  }, [openItems]);

  // Handle Alt+Click on accordion trigger to toggle all accordions
  const handleAccordionTriggerClick = (event: React.MouseEvent) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();

      const allAccordions = ["identite", "pricing"];

      // If any closed, open all. If all open, close all.
      if (openItems.length < allAccordions.length) {
        setOpenItems(allAccordions);
      } else {
        setOpenItems([]);
      }
    }
  };

  return (
    <Accordion
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className="space-y-2"
    >
      {/* Accordéon 1: Identité du Service */}
      <AccordionItem value="identite">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Identité du Service
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Nom du service */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Nom du service <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Session d'enregistrement 1h"
                  maxLength={255}
                  className="mt-1"
                />
              </div>

              {/* Catégorie */}
              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  Catégorie <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ServiceCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Studio">Studio</SelectItem>
                    <SelectItem value="Post-production">Post-production</SelectItem>
                    <SelectItem value="Location matériel">Location matériel</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description optionnelle du service"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 2: Tarification */}
      <AccordionItem value="pricing">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Tarification
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Prix unitaire */}
              <div>
                <Label htmlFor="unitPrice" className="text-sm font-medium">
                  Prix unitaire (€) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice || ""}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              {/* TVA */}
              <div>
                <Label htmlFor="vatRateId" className="text-sm font-medium">
                  TVA <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.vatRateId?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, vatRateId: parseInt(value) })}
                  disabled={vatRatesLoading}
                >
                  <SelectTrigger id="vatRateId" className="mt-1">
                    <SelectValue placeholder={vatRatesLoading ? "Chargement..." : "Sélectionner un taux"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vatRates?.map((rate) => (
                      <SelectItem key={rate.id} value={rate.id.toString()}>
                        {rate.name} ({rate.rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantité par défaut */}
              <div>
                <Label htmlFor="defaultQuantity" className="text-sm font-medium">
                  Quantité par défaut <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="defaultQuantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.defaultQuantity || ""}
                  onChange={(e) => setFormData({ ...formData, defaultQuantity: e.target.value })}
                  placeholder="1.00"
                  className="mt-1"
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}
