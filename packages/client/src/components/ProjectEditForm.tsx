/**
 * ProjectEditForm.tsx
 * Formulaire d'édition de projet avec accordéons
 * Pattern reference: TalentEditForm (Phase 28-05)
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Music,
  FileText,
  Calendar,
  Database,
  Radio,
} from "lucide-react";

interface ProjectEditFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ProjectEditForm({
  formData,
  setFormData,
}: ProjectEditFormProps) {
  // Fetch clients for dropdown
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });

  // State to manage open accordions with localStorage persistence
  const [openItems, setOpenItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('projectEditAccordions');
      return saved ? JSON.parse(saved) : ["informations-base", "description-genre", "calendrier", "production-stockage", "plateformes-notes"];
    } catch {
      return ["informations-base", "description-genre", "calendrier", "production-stockage", "plateformes-notes"];
    }
  });

  // Save accordion state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('projectEditAccordions', JSON.stringify(openItems));
    } catch (error) {
      console.error('Failed to save accordion state:', error);
    }
  }, [openItems]);

  // Handle Alt+Click on accordion trigger to toggle all accordions
  const handleAccordionTriggerClick = (event: React.MouseEvent) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();

      const allAccordions = ["informations-base", "description-genre", "calendrier", "production-stockage", "plateformes-notes"];

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
      {/* Accordéon 1: Informations de Base */}
      <AccordionItem value="informations-base">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Informations de Base
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Client dropdown */}
              <div>
                <label className="text-sm font-medium">
                  Client <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.clientId?.toString() || "0"}
                  onValueChange={(value) => setFormData({ ...formData, clientId: parseInt(value) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="text-sm font-medium">
                  Nom du projet <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Album 2024"
                />
              </div>

              {/* Artist Name */}
              <div>
                <label htmlFor="artistName" className="text-sm font-medium">Nom d'artiste</label>
                <input
                  id="artistName"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.artistName || ""}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  placeholder="Ex: The Band"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={formData.type || "album"}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="album">Album</SelectItem>
                    <SelectItem value="ep">EP</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="soundtrack">Bande originale</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium">Statut</label>
                <Select
                  value={formData.status || "pre_production"}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_production">Pré-production</SelectItem>
                    <SelectItem value="recording">Enregistrement</SelectItem>
                    <SelectItem value="editing">Édition</SelectItem>
                    <SelectItem value="mixing">Mixage</SelectItem>
                    <SelectItem value="mastering">Mastering</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="delivered">Livré</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 2: Description & Genre */}
      <AccordionItem value="description-genre">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Description & Genre
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Description */}
              <div>
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border rounded-md mt-1 min-h-[100px]"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du projet..."
                />
              </div>

              {/* Genre */}
              <div>
                <label htmlFor="genre" className="text-sm font-medium">Genre</label>
                <input
                  id="genre"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.genre || ""}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  placeholder="Rock, Pop, Jazz..."
                />
              </div>

              {/* Budget */}
              <div>
                <label htmlFor="budget" className="text-sm font-medium">Budget (€)</label>
                <input
                  id="budget"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.budget || ""}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="5000"
                />
              </div>

              {/* Label */}
              <div>
                <label htmlFor="label" className="text-sm font-medium">Label</label>
                <input
                  id="label"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.label || ""}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Universal Music"
                />
              </div>

              {/* Catalog Number */}
              <div>
                <label htmlFor="catalogNumber" className="text-sm font-medium">Numéro de catalogue</label>
                <input
                  id="catalogNumber"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.catalogNumber || ""}
                  onChange={(e) => setFormData({ ...formData, catalogNumber: e.target.value })}
                  placeholder="CAT-2024-001"
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 3: Calendrier */}
      <AccordionItem value="calendrier">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Calendrier
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="text-sm font-medium">Date de début</label>
                <input
                  id="startDate"
                  type="date"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.startDate || ""}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              {/* Target Delivery Date */}
              <div>
                <label htmlFor="targetDeliveryDate" className="text-sm font-medium">Date de livraison prévue</label>
                <input
                  id="targetDeliveryDate"
                  type="date"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.targetDeliveryDate || ""}
                  onChange={(e) => setFormData({ ...formData, targetDeliveryDate: e.target.value })}
                />
              </div>

              {/* Actual Delivery Date */}
              <div>
                <label htmlFor="actualDeliveryDate" className="text-sm font-medium">Date de livraison réelle</label>
                <input
                  id="actualDeliveryDate"
                  type="date"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.actualDeliveryDate || ""}
                  onChange={(e) => setFormData({ ...formData, actualDeliveryDate: e.target.value })}
                />
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="text-sm font-medium">Date de fin</label>
                <input
                  id="endDate"
                  type="date"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.endDate || ""}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 4: Production & Stockage */}
      <AccordionItem value="production-stockage">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Production & Stockage
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Track Count */}
              <div>
                <label htmlFor="trackCount" className="text-sm font-medium">Nombre de pistes</label>
                <input
                  id="trackCount"
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.trackCount || ""}
                  onChange={(e) => setFormData({ ...formData, trackCount: parseInt(e.target.value) || 0 })}
                  placeholder="12"
                />
              </div>

              {/* Total Cost */}
              <div>
                <label htmlFor="totalCost" className="text-sm font-medium">Coût total (€)</label>
                <input
                  id="totalCost"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.totalCost || ""}
                  onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                  placeholder="4500"
                />
              </div>

              {/* Cover Art URL */}
              <div>
                <label htmlFor="coverArtUrl" className="text-sm font-medium">URL de la pochette</label>
                <input
                  id="coverArtUrl"
                  type="url"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.coverArtUrl || ""}
                  onChange={(e) => setFormData({ ...formData, coverArtUrl: e.target.value })}
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              {/* Storage Location */}
              <div>
                <label htmlFor="storageLocation" className="text-sm font-medium">Emplacement de stockage</label>
                <input
                  id="storageLocation"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.storageLocation || ""}
                  onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  placeholder="/Projects/2024/Album"
                />
              </div>

              {/* Storage Size */}
              <div>
                <label htmlFor="storageSize" className="text-sm font-medium">Taille de stockage (MB)</label>
                <input
                  id="storageSize"
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.storageSize || ""}
                  onChange={(e) => setFormData({ ...formData, storageSize: parseInt(e.target.value) || 0 })}
                  placeholder="2048"
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 5: Plateformes & Notes */}
      <AccordionItem value="plateformes-notes">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Plateformes & Notes
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Spotify URL */}
              <div>
                <label htmlFor="spotifyUrl" className="text-sm font-medium">Spotify</label>
                <input
                  id="spotifyUrl"
                  type="url"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.spotifyUrl || ""}
                  onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                  placeholder="https://open.spotify.com/album/..."
                />
              </div>

              {/* Apple Music URL */}
              <div>
                <label htmlFor="appleMusicUrl" className="text-sm font-medium">Apple Music</label>
                <input
                  id="appleMusicUrl"
                  type="url"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.appleMusicUrl || ""}
                  onChange={(e) => setFormData({ ...formData, appleMusicUrl: e.target.value })}
                  placeholder="https://music.apple.com/album/..."
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="text-sm font-medium">Notes internes</label>
                <textarea
                  id="notes"
                  className="w-full px-3 py-2 border rounded-md mt-1 min-h-[100px]"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes privées du studio..."
                />
              </div>

              {/* Technical Notes */}
              <div>
                <label htmlFor="technicalNotes" className="text-sm font-medium">Notes techniques</label>
                <textarea
                  id="technicalNotes"
                  className="w-full px-3 py-2 border rounded-md mt-1 min-h-[100px]"
                  value={formData.technicalNotes || ""}
                  onChange={(e) => setFormData({ ...formData, technicalNotes: e.target.value })}
                  placeholder="Détails techniques, configurations, problèmes connus..."
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}
