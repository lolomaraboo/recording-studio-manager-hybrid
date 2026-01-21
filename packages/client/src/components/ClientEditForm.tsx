/**
 * ClientEditForm.tsx
 * Formulaire d'édition de client avec accordéons
 * Cohérent avec la page de visualisation (mêmes tabs, organisation similaire)
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
  Building2,
  Plus,
  Trash2,
} from "lucide-react";

interface ClientEditFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ClientEditForm({
  formData,
  setFormData,
}: ClientEditFormProps) {
  // State to manage open accordions for Alt key toggle
  const [openItems, setOpenItems] = useState<string[]>(["identite"]);

  // Handle Alt key to toggle all accordions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();

        const allAccordions = ["identite", "coordonnees", "profil-artistique", "streaming", "notes-studio"];

        // If any closed, open all. If all open, close all.
        if (openItems.length < allAccordions.length) {
          setOpenItems(allAccordions);
        } else {
          setOpenItems([]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openItems]);

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
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <h3 className="text-lg font-semibold">Identité</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Type de client */}
              <div>
                <label className="text-sm font-medium">Type de client</label>
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    variant={formData.type === "individual" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, type: "individual" })}
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Particulier
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === "company" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, type: "company" })}
                    className="flex-1"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Entreprise
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
                />
              </div>

              {/* Champs de nom structuré (pour individus) */}
              {formData.type === "individual" && (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label htmlFor="prefix" className="text-sm font-medium">Civilité</label>
                      <select
                        id="prefix"
                        value={formData.prefix || ""}
                        onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                        className="w-full px-3 py-2 border rounded mt-1"
                      >
                        <option value="">-</option>
                        <option value="M.">M.</option>
                        <option value="Mme">Mme</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="firstName" className="text-sm font-medium">Prénom</label>
                      <input
                        id="firstName"
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        value={formData.firstName || ""}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label htmlFor="middleName" className="text-sm font-medium">Nom du milieu</label>
                      <input
                        id="middleName"
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        value={formData.middleName || ""}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="text-sm font-medium">Nom de famille</label>
                      <input
                        id="lastName"
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        value={formData.lastName || ""}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="suffix" className="text-sm font-medium">Suffixe</label>
                    <input
                      id="suffix"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.suffix || ""}
                      onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                      placeholder="Jr., III, etc."
                    />
                  </div>
                </>
              )}

              {/* Nom d'artiste */}
              <div>
                <label htmlFor="artistName" className="text-sm font-medium">Nom d'artiste / Pseudo</label>
                <input
                  id="artistName"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.artistName || ""}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                />
              </div>

              {/* Birthday */}
              <div>
                <label htmlFor="birthday" className="text-sm font-medium">Date de naissance</label>
                <input
                  id="birthday"
                  type="date"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.birthday || ""}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="text-sm font-medium">Genre</label>
                <select
                  id="gender"
                  value={formData.gender || ""}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border rounded mt-1"
                >
                  <option value="">-</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                  <option value="prefer_not_to_say">Préfère ne pas répondre</option>
                </select>
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 2: Coordonnées (MOVED TO POSITION 2) */}
      <AccordionItem value="coordonnees">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <h3 className="text-lg font-semibold">Coordonnées</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Subsection: Contact */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Contact</h4>
                <div className="space-y-3">
                  {/* Email simple (backward compat) */}
                  <div>
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  {/* Téléphone simple (backward compat) */}
                  <div>
                    <label htmlFor="phone" className="text-sm font-medium">Téléphone</label>
                    <input
                      id="phone"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  {/* Emails multiples */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Emails multiples</label>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          const emails = [...(formData.emails || []), { type: "work", email: "" }];
                          setFormData({ ...formData, emails });
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(formData.emails || []).map((email: any, index: number) => (
                        <div key={index} className="flex gap-2">
                          <select
                            value={email.type}
                            onChange={(e) => {
                              const emails = [...(formData.emails || [])];
                              emails[index] = { ...emails[index], type: e.target.value };
                              setFormData({ ...formData, emails });
                            }}
                            className="w-32 px-3 py-2 border rounded"
                          >
                            <option value="work">Travail</option>
                            <option value="personal">Personnel</option>
                            <option value="other">Autre</option>
                          </select>
                          <input
                            type="email"
                            value={email.email}
                            onChange={(e) => {
                              const emails = [...(formData.emails || [])];
                              emails[index] = { ...emails[index], email: e.target.value };
                              setFormData({ ...formData, emails });
                            }}
                            placeholder="Email"
                            className="flex-1 px-3 py-2 border rounded-md"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              const emails = (formData.emails || []).filter((_: any, i: number) => i !== index);
                              setFormData({ ...formData, emails });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Téléphones multiples */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Téléphones multiples</label>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          const phones = [...(formData.phones || []), { type: "mobile", number: "" }];
                          setFormData({ ...formData, phones });
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(formData.phones || []).map((phone: any, index: number) => (
                        <div key={index} className="flex gap-2">
                          <select
                            value={phone.type}
                            onChange={(e) => {
                              const phones = [...(formData.phones || [])];
                              phones[index] = { ...phones[index], type: e.target.value };
                              setFormData({ ...formData, phones });
                            }}
                            className="w-32 px-3 py-2 border rounded"
                          >
                            <option value="mobile">Mobile</option>
                            <option value="work">Travail</option>
                            <option value="home">Domicile</option>
                          </select>
                          <input
                            value={phone.number}
                            onChange={(e) => {
                              const phones = [...(formData.phones || [])];
                              phones[index] = { ...phones[index], number: e.target.value };
                              setFormData({ ...formData, phones });
                            }}
                            placeholder="Numéro"
                            className="flex-1 px-3 py-2 border rounded-md"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              const phones = (formData.phones || []).filter((_: any, i: number) => i !== index);
                              setFormData({ ...formData, phones });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sites web multiples */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Sites web</label>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          const websites = [...(formData.websites || []), { type: "website", url: "" }];
                          setFormData({ ...formData, websites });
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(formData.websites || []).map((website: any, index: number) => (
                        <div key={index} className="flex gap-2">
                          <select
                            value={website.type}
                            onChange={(e) => {
                              const websites = [...(formData.websites || [])];
                              websites[index] = { ...websites[index], type: e.target.value };
                              setFormData({ ...formData, websites });
                            }}
                            className="w-32 px-3 py-2 border rounded"
                          >
                            <option value="website">Site web</option>
                            <option value="portfolio">Portfolio</option>
                            <option value="blog">Blog</option>
                          </select>
                          <input
                            type="url"
                            value={website.url}
                            onChange={(e) => {
                              const websites = [...(formData.websites || [])];
                              websites[index] = { ...websites[index], url: e.target.value };
                              setFormData({ ...formData, websites });
                            }}
                            placeholder="https://..."
                            className="flex-1 px-3 py-2 border rounded-md"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              const websites = (formData.websites || []).filter((_: any, i: number) => i !== index);
                              setFormData({ ...formData, websites });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subsection: Adresses */}
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-semibold mb-2">Adresses</h4>
                <div className="space-y-3">
                  {/* Simple address (backward compat) */}
                  <div>
                    <label htmlFor="address" className="text-sm font-medium">Adresse</label>
                    <input
                      id="address"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  {/* Structured address fields */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label htmlFor="street" className="text-sm font-medium">Rue</label>
                      <input
                        id="street"
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        value={formData.street || ""}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="text-sm font-medium">Ville</label>
                      <input
                        id="city"
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        value={formData.city || ""}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label htmlFor="postalCode" className="text-sm font-medium">Code postal</label>
                      <input
                        id="postalCode"
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        value={formData.postalCode || ""}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="region" className="text-sm font-medium">Région</label>
                      <input
                        id="region"
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        value={formData.region || ""}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="text-sm font-medium">Pays</label>
                      <input
                        id="country"
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        value={formData.country || ""}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Multiple addresses array */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Adresses multiples</label>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          const addresses = [...(formData.addresses || []), {
                            type: "home",
                            street: "",
                            city: "",
                            postalCode: "",
                            region: "",
                            country: ""
                          }];
                          setFormData({ ...formData, addresses });
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(formData.addresses || []).map((addr: any, index: number) => (
                        <div key={index} className="border rounded-md p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <select
                              value={addr.type}
                              onChange={(e) => {
                                const addresses = [...(formData.addresses || [])];
                                addresses[index] = { ...addresses[index], type: e.target.value };
                                setFormData({ ...formData, addresses });
                              }}
                              className="w-32 px-3 py-2 border rounded"
                            >
                              <option value="home">Domicile</option>
                              <option value="work">Travail</option>
                              <option value="other">Autre</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => {
                                const addresses = (formData.addresses || []).filter((_: any, i: number) => i !== index);
                                setFormData({ ...formData, addresses });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <input
                            value={addr.street || ""}
                            onChange={(e) => {
                              const addresses = [...(formData.addresses || [])];
                              addresses[index] = { ...addresses[index], street: e.target.value };
                              setFormData({ ...formData, addresses });
                            }}
                            placeholder="Rue"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                          <div className="grid gap-2 md:grid-cols-2">
                            <input
                              value={addr.city || ""}
                              onChange={(e) => {
                                const addresses = [...(formData.addresses || [])];
                                addresses[index] = { ...addresses[index], city: e.target.value };
                                setFormData({ ...formData, addresses });
                              }}
                              placeholder="Ville"
                              className="w-full px-3 py-2 border rounded-md"
                            />
                            <input
                              value={addr.postalCode || ""}
                              onChange={(e) => {
                                const addresses = [...(formData.addresses || [])];
                                addresses[index] = { ...addresses[index], postalCode: e.target.value };
                                setFormData({ ...formData, addresses });
                              }}
                              placeholder="Code postal"
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            <input
                              value={addr.region || ""}
                              onChange={(e) => {
                                const addresses = [...(formData.addresses || [])];
                                addresses[index] = { ...addresses[index], region: e.target.value };
                                setFormData({ ...formData, addresses });
                              }}
                              placeholder="Région"
                              className="w-full px-3 py-2 border rounded-md"
                            />
                            <input
                              value={addr.country || ""}
                              onChange={(e) => {
                                const addresses = [...(formData.addresses || [])];
                                addresses[index] = { ...addresses[index], country: e.target.value };
                                setFormData({ ...formData, addresses });
                              }}
                              placeholder="Pays"
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 3: Profil Artistique (genres, instruments, professional, career) */}
      <AccordionItem value="profil-artistique">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <h3 className="text-lg font-semibold">Profil Artistique</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Subsection: Genres & Instruments */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Genres & Instruments</h4>
                <div className="space-y-3">
                  {/* Genres (array converted to comma-separated for simple editing) */}
                  <div>
                    <label htmlFor="genres" className="text-sm font-medium">Genres musicaux</label>
                    <input
                      id="genres"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={Array.isArray(formData.genres) ? formData.genres.join(", ") : ""}
                      onChange={(e) => {
                        const genres = e.target.value.split(",").map(g => g.trim()).filter(g => g);
                        setFormData({ ...formData, genres });
                      }}
                      placeholder="Rock, Jazz, Hip-Hop (séparés par virgules)"
                    />
                  </div>

                  {/* Instruments (array converted to comma-separated for simple editing) */}
                  <div>
                    <label htmlFor="instruments" className="text-sm font-medium">Instruments</label>
                    <input
                      id="instruments"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={Array.isArray(formData.instruments) ? formData.instruments.join(", ") : ""}
                      onChange={(e) => {
                        const instruments = e.target.value.split(",").map(i => i.trim()).filter(i => i);
                        setFormData({ ...formData, instruments });
                      }}
                      placeholder="Guitare, Piano, Basse (séparés par virgules)"
                    />
                  </div>
                </div>
              </div>

              {/* Subsection: Informations Professionnelles */}
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-semibold mb-2">Informations professionnelles</h4>
                <div className="space-y-3">
                  {/* Record label */}
                  <div>
                    <label htmlFor="recordLabel" className="text-sm font-medium">Label</label>
                    <input
                      id="recordLabel"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.recordLabel || ""}
                      onChange={(e) => setFormData({ ...formData, recordLabel: e.target.value })}
                      placeholder="Nom du label"
                    />
                  </div>

                  {/* Distributor */}
                  <div>
                    <label htmlFor="distributor" className="text-sm font-medium">Distributeur</label>
                    <input
                      id="distributor"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.distributor || ""}
                      onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
                      placeholder="Nom du distributeur"
                    />
                  </div>

                  {/* Manager contact */}
                  <div>
                    <label htmlFor="managerContact" className="text-sm font-medium">Contact manager</label>
                    <input
                      id="managerContact"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.managerContact || ""}
                      onChange={(e) => setFormData({ ...formData, managerContact: e.target.value })}
                      placeholder="Nom ou email du manager"
                    />
                  </div>

                  {/* Publisher */}
                  <div>
                    <label htmlFor="publisher" className="text-sm font-medium">Éditeur</label>
                    <input
                      id="publisher"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.publisher || ""}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      placeholder="Nom de l'éditeur"
                    />
                  </div>

                  {/* Performance rights society */}
                  <div>
                    <label htmlFor="performanceRightsSociety" className="text-sm font-medium">Société de gestion collective</label>
                    <input
                      id="performanceRightsSociety"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.performanceRightsSociety || ""}
                      onChange={(e) => setFormData({ ...formData, performanceRightsSociety: e.target.value })}
                      placeholder="SACEM, ASCAP, BMI, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Subsection: Carrière */}
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-semibold mb-2">Carrière</h4>
                <div className="space-y-3">
                  {/* Years active */}
                  <div>
                    <label htmlFor="yearsActive" className="text-sm font-medium">Années d'activité</label>
                    <input
                      id="yearsActive"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.yearsActive || ""}
                      onChange={(e) => setFormData({ ...formData, yearsActive: e.target.value })}
                      placeholder="2015-présent, 2010-2020, etc."
                    />
                  </div>

                  {/* Notable works */}
                  <div>
                    <label htmlFor="notableWorks" className="text-sm font-medium">Œuvres notables</label>
                    <textarea
                      id="notableWorks"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.notableWorks || ""}
                      onChange={(e) => setFormData({ ...formData, notableWorks: e.target.value })}
                      placeholder="Albums, singles, collaborations importantes..."
                    />
                  </div>

                  {/* Awards & recognition */}
                  <div>
                    <label htmlFor="awardsRecognition" className="text-sm font-medium">Récompenses & Distinctions</label>
                    <textarea
                      id="awardsRecognition"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.awardsRecognition || ""}
                      onChange={(e) => setFormData({ ...formData, awardsRecognition: e.target.value })}
                      placeholder="Grammy, Victoires de la Musique, nominations..."
                    />
                  </div>

                  {/* Biography */}
                  <div>
                    <label htmlFor="biography" className="text-sm font-medium">Biographie</label>
                    <textarea
                      id="biography"
                      rows={5}
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={formData.biography || ""}
                      onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                      placeholder="Histoire de l'artiste, influences, parcours..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 4: Plateformes de Streaming */}
      <AccordionItem value="streaming">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <h3 className="text-lg font-semibold">Plateformes de Streaming</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                {/* Spotify */}
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

                {/* Apple Music */}
                <div>
                  <label htmlFor="appleMusicUrl" className="text-sm font-medium">Apple Music</label>
                  <input
                    id="appleMusicUrl"
                    type="url"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.appleMusicUrl || ""}
                    onChange={(e) => setFormData({ ...formData, appleMusicUrl: e.target.value })}
                    placeholder="https://music.apple.com/artist/..."
                  />
                </div>

                {/* YouTube */}
                <div>
                  <label htmlFor="youtubeUrl" className="text-sm font-medium">YouTube</label>
                  <input
                    id="youtubeUrl"
                    type="url"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.youtubeUrl || ""}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://youtube.com/@..."
                  />
                </div>

                {/* SoundCloud */}
                <div>
                  <label htmlFor="soundcloudUrl" className="text-sm font-medium">SoundCloud</label>
                  <input
                    id="soundcloudUrl"
                    type="url"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.soundcloudUrl || ""}
                    onChange={(e) => setFormData({ ...formData, soundcloudUrl: e.target.value })}
                    placeholder="https://soundcloud.com/..."
                  />
                </div>

                {/* Bandcamp */}
                <div>
                  <label htmlFor="bandcampUrl" className="text-sm font-medium">Bandcamp</label>
                  <input
                    id="bandcampUrl"
                    type="url"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.bandcampUrl || ""}
                    onChange={(e) => setFormData({ ...formData, bandcampUrl: e.target.value })}
                    placeholder="https://artist.bandcamp.com"
                  />
                </div>

                {/* Deezer */}
                <div>
                  <label htmlFor="deezerUrl" className="text-sm font-medium">Deezer</label>
                  <input
                    id="deezerUrl"
                    type="url"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.deezerUrl || ""}
                    onChange={(e) => setFormData({ ...formData, deezerUrl: e.target.value })}
                    placeholder="https://www.deezer.com/artist/..."
                  />
                </div>

                {/* Tidal */}
                <div>
                  <label htmlFor="tidalUrl" className="text-sm font-medium">Tidal</label>
                  <input
                    id="tidalUrl"
                    type="url"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.tidalUrl || ""}
                    onChange={(e) => setFormData({ ...formData, tidalUrl: e.target.value })}
                    placeholder="https://tidal.com/artist/..."
                  />
                </div>

                {/* Amazon Music */}
                <div>
                  <label htmlFor="amazonMusicUrl" className="text-sm font-medium">Amazon Music</label>
                  <input
                    id="amazonMusicUrl"
                    type="url"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.amazonMusicUrl || ""}
                    onChange={(e) => setFormData({ ...formData, amazonMusicUrl: e.target.value })}
                    placeholder="https://music.amazon.com/artists/..."
                  />
                </div>

                {/* Audiomack */}
                <div>
                  <label htmlFor="audiomackUrl" className="text-sm font-medium">Audiomack</label>
                  <input
                    id="audiomackUrl"
                    type="url"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.audiomackUrl || ""}
                    onChange={(e) => setFormData({ ...formData, audiomackUrl: e.target.value })}
                    placeholder="https://audiomack.com/..."
                  />
                </div>

                {/* Beatport */}
                <div>
                  <label htmlFor="beatportUrl" className="text-sm font-medium">Beatport</label>
                  <input
                    id="beatportUrl"
                    type="url"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.beatportUrl || ""}
                    onChange={(e) => setFormData({ ...formData, beatportUrl: e.target.value })}
                    placeholder="https://www.beatport.com/artist/..."
                  />
                </div>

                {/* Other platforms */}
                <div>
                  <label htmlFor="otherPlatformsUrl" className="text-sm font-medium">Autres plateformes</label>
                  <input
                    id="otherPlatformsUrl"
                    type="url"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={formData.otherPlatformsUrl || ""}
                    onChange={(e) => setFormData({ ...formData, otherPlatformsUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 5: Notes Studio (renamed from Personal Information) */}
      <AccordionItem value="notes-studio">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <h3 className="text-lg font-semibold">Notes Studio</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Custom fields array */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Champs personnalisés</label>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      const customFields = [...(formData.customFields || []), {
                        label: "",
                        type: "text",
                        value: ""
                      }];
                      setFormData({ ...formData, customFields });
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-2">
                  {(formData.customFields || []).map((field: any, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={field.label}
                        onChange={(e) => {
                          const customFields = [...(formData.customFields || [])];
                          customFields[index] = { ...customFields[index], label: e.target.value };
                          setFormData({ ...formData, customFields });
                        }}
                        placeholder="Libellé"
                        className="w-32 px-3 py-2 border rounded-md"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const customFields = [...(formData.customFields || [])];
                          customFields[index] = { ...customFields[index], type: e.target.value };
                          setFormData({ ...formData, customFields });
                        }}
                        className="w-32 px-3 py-2 border rounded"
                      >
                        <option value="text">Texte</option>
                        <option value="number">Nombre</option>
                        <option value="date">Date</option>
                        <option value="url">URL</option>
                      </select>
                      <input
                        value={field.value}
                        onChange={(e) => {
                          const customFields = [...(formData.customFields || [])];
                          customFields[index] = { ...customFields[index], value: e.target.value };
                          setFormData({ ...formData, customFields });
                        }}
                        placeholder="Valeur"
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => {
                          const customFields = (formData.customFields || []).filter((_: any, i: number) => i !== index);
                          setFormData({ ...formData, customFields });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

    </Accordion>
  );
}
