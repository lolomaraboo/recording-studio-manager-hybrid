/**
 * TalentEditForm.tsx
 * Formulaire d'édition de talent avec accordéons
 * Pattern reference: ClientEditForm (Phase 26)
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  User,
  Mail,
  Music,
  Radio,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";

interface TalentEditFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function TalentEditForm({
  formData,
  setFormData,
}: TalentEditFormProps) {
  // State to manage open accordions with localStorage persistence
  const [openItems, setOpenItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('talentEditAccordions');
      return saved ? JSON.parse(saved) : ["identite", "contact", "profil-musical", "streaming", "notes"];
    } catch {
      return ["identite", "contact", "profil-musical", "streaming", "notes"];
    }
  });

  // Save accordion state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('talentEditAccordions', JSON.stringify(openItems));
    } catch (error) {
      console.error('Failed to save accordion state:', error);
    }
  }, [openItems]);

  // Handle Alt+Click on accordion trigger to toggle all accordions
  const handleAccordionTriggerClick = (event: React.MouseEvent) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();

      const allAccordions = ["identite", "contact", "profil-musical", "streaming", "notes"];

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
      {/* Accordéon 1: Identité */}
      <AccordionItem value="identite">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Identité
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Type de talent (musician/actor) */}
              <div>
                <label className="text-sm font-medium">Type de talent</label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={formData.talentType === "musician" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, talentType: "musician" })}
                    className="flex-1"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Musicien
                  </Button>
                  <Button
                    type="button"
                    variant={formData.talentType === "actor" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, talentType: "actor" })}
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Acteur
                  </Button>
                </div>
              </div>

              {/* Nom complet */}
              <div>
                <label htmlFor="name" className="text-sm font-medium">
                  Nom complet <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>

              {/* Nom de scène */}
              <div>
                <label htmlFor="stageName" className="text-sm font-medium">Nom de scène / Pseudo</label>
                <input
                  id="stageName"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.stageName || ""}
                  onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                  placeholder="DJ Cool"
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 2: Contact */}
      <AccordionItem value="contact">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="text-sm font-medium">Téléphone</label>
                  <input
                    id="phone"
                    type="tel"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="website" className="text-sm font-medium">Site web</label>
                <input
                  id="website"
                  type="url"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.website || ""}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 3: Profil Musical */}
      <AccordionItem value="profil-musical">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Profil Musical
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="instruments" className="text-sm font-medium">Instruments</label>
                  <input
                    id="instruments"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.instruments || ""}
                    onChange={(e) => setFormData({ ...formData, instruments: e.target.value })}
                    placeholder="Guitare, Piano, Batterie"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Séparer par des virgules</p>
                </div>
                <div>
                  <label htmlFor="genres" className="text-sm font-medium">Genres musicaux</label>
                  <input
                    id="genres"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.genres || ""}
                    onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                    placeholder="Rock, Jazz, Blues"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Séparer par des virgules</p>
                </div>
              </div>
              <div>
                <label htmlFor="bio" className="text-sm font-medium">Biographie</label>
                <textarea
                  id="bio"
                  className="w-full px-3 py-2 border rounded-md mt-1 min-h-[100px]"
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Parcours musical, expérience, style..."
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 4: Plateformes Streaming */}
      <AccordionItem value="streaming">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Plateformes Streaming
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              <div>
                <label htmlFor="spotifyUrl" className="text-sm font-medium">Spotify</label>
                <input
                  id="spotifyUrl"
                  type="url"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.spotifyUrl || ""}
                  onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                  placeholder="https://open.spotify.com/artist/..."
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 5: Notes */}
      <AccordionItem value="notes">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notes internes
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              <div>
                <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                <textarea
                  id="notes"
                  className="w-full px-3 py-2 border rounded-md mt-1 min-h-[100px]"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes internes du studio..."
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}
