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
  Upload,
  X,
  Users,
  MapPin,
  Music,
  Radio,
  FileText,
} from "lucide-react";
import { CompanyMembersIndicator } from "@/components/CompanyMembersIndicator";

interface ClientEditFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ClientEditForm({
  formData,
  setFormData,
}: ClientEditFormProps) {
  // State to manage open accordions with localStorage persistence
  const [openItems, setOpenItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('clientEditAccordions');
      return saved ? JSON.parse(saved) : ["identite"];
    } catch {
      return ["identite"];
    }
  });

  // Save accordion state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('clientEditAccordions', JSON.stringify(openItems));
    } catch (error) {
      console.error('Failed to save accordion state:', error);
    }
  }, [openItems]);

  // Auto-fill "Nom complet" from structured name fields
  useEffect(() => {
    // Only auto-fill for individual clients
    if (formData.type === "individual") {
      const parts = [];
      if (formData.prefix) parts.push(formData.prefix);
      if (formData.firstName) parts.push(formData.firstName);
      if (formData.middleName) parts.push(`"${formData.middleName}"`);
      if (formData.lastName) parts.push(formData.lastName);
      if (formData.suffix) parts.push(formData.suffix);

      if (parts.length > 0) {
        const autoName = parts.join(' ');
        setFormData((prev: any) => ({ ...prev, name: autoName }));
      }
    }
  }, [formData.prefix, formData.firstName, formData.middleName, formData.lastName, formData.suffix, formData.type, setFormData]);

  // Handle Alt+Click on accordion trigger to toggle all accordions
  const handleAccordionTriggerClick = (event: React.MouseEvent) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();

      const allAccordions = ["identite", "coordonnees", "relations-professionnelles", "profil-artistique", "streaming", "notes-studio"];

      // If any closed, open all. If all open, close all.
      if (openItems.length < allAccordions.length) {
        setOpenItems(allAccordions);
      } else {
        setOpenItems([]);
      }
    }
  };

  // Avatar/Logo upload handlers
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: uploadFormData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      setFormData((prev: any) => ({ ...prev, avatarUrl: result.data.url }));
    } catch (error) {
      console.error("Avatar upload error:", error);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: uploadFormData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      setFormData((prev: any) => ({ ...prev, logoUrl: result.data.url }));
    } catch (error) {
      console.error("Logo upload error:", error);
    }
  };

  return (
    <Accordion
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className="space-y-1"
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
            <div className="px-4 pb-3 space-y-1">
              {/* Type de client - TOP POSITION */}
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

              {/* Nom d'artiste - SECOND POSITION */}
              <div>
                <label htmlFor="artistName" className="text-sm font-medium">Nom d'artiste / Pseudo</label>
                <input
                  id="artistName"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={formData.artistName || ""}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                />
              </div>

              {/* Nom complet (auto-generated, readonly) - BELOW artistName */}
              <div>
                <label htmlFor="name" className="text-sm font-medium">
                  Nom complet
                </label>
                <input
                  id="name"
                  className="w-full px-3 py-2 border rounded-md mt-1 bg-muted cursor-not-allowed"
                  value={formData.name || ""}
                  readOnly
                  placeholder="Se génère automatiquement"
                />
              </div>

              {/* Champs de nom structuré (pour individus) */}
              {formData.type === "individual" && (
                <>
                  {/* Row: Nom de famille + Prénom */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label htmlFor="lastName" className="text-sm font-medium">Nom de famille</label>
                      <input
                        id="lastName"
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        value={formData.lastName || ""}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
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

                  {/* Row: Civilité + Surnom */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label htmlFor="prefix" className="text-sm font-medium">Civilité</label>
                      <select
                        id="prefix"
                        value={formData.prefix || ""}
                        onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                      >
                        <option value="">-</option>
                        <option value="M.">M.</option>
                        <option value="Mme">Mme</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="middleName" className="text-sm font-medium">Surnom</label>
                      <input
                        id="middleName"
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        value={formData.middleName || ""}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Suffixe - bottom of name fields */}
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
                  className="w-full px-3 py-2 border rounded-md mt-1"
                >
                  <option value="">-</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                  <option value="prefer_not_to_say">Préfère ne pas répondre</option>
                </select>
              </div>

              {/* Avatar/Logo upload */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {formData.type === "individual" ? "Photo de profil" : "Logo de l'entreprise"}
                </label>
                <div className="flex items-center gap-4">
                  {(formData.avatarUrl || formData.logoUrl) && (
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                      <img
                        src={formData.type === "individual" ? formData.avatarUrl : formData.logoUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            [formData.type === "individual" ? "avatarUrl" : "logoUrl"]: "",
                          })
                        }
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={formData.type === "individual" ? handleAvatarUpload : handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">
                        {formData.type === "individual" ? "Télécharger une photo" : "Télécharger un logo"}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 2: Coordonnées (MOVED TO POSITION 2) */}
      <AccordionItem value="coordonnees">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Coordonnées
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-1">
              {/* Section 1: Contact */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Contact</h4>
                <div className="space-y-1">
                  {/* Téléphones - 3-column grid */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Téléphones</label>
                    <div className="space-y-1">
                      {(() => {
                        const phones = (formData.phones || []).length > 0 ? formData.phones : [{ type: "mobile", number: "" }];
                        return phones.map((phone: any, index: number) => (
                          <div key={index} className="grid grid-cols-[120px_1fr_80px] gap-2 items-center">
                            <select
                              value={phone.type}
                              onChange={(e) => {
                                const phones = [...(formData.phones || [{ type: "mobile", number: "" }])];
                                phones[index] = { ...phones[index], type: e.target.value };
                                setFormData({ ...formData, phones });
                              }}
                              className="px-3 py-2 border rounded-md text-sm"
                            >
                              <option value="mobile">Mobile</option>
                              <option value="work">Travail</option>
                              <option value="home">Domicile</option>
                            </select>
                            <input
                              value={phone.number}
                              onChange={(e) => {
                                const phones = [...(formData.phones || [{ type: "mobile", number: "" }])];
                                phones[index] = { ...phones[index], number: e.target.value };
                                setFormData({ ...formData, phones });
                              }}
                              placeholder="+33 6 12 34 56 78"
                              className="px-3 py-2 border rounded-md text-sm"
                            />
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const phones = [...(formData.phones || [{ type: "mobile", number: "" }]), { type: "mobile", number: "" }];
                                  setFormData({ ...formData, phones });
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const phones = (formData.phones || []).filter((_: any, i: number) => i !== index);
                                  if (phones.length === 0) {
                                    phones.push({ type: "mobile", number: "" });
                                  }
                                  setFormData({ ...formData, phones });
                                }}
                                disabled={phones.length === 1}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Emails - 3-column grid */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Emails</label>
                    <div className="space-y-1">
                      {(() => {
                        const emails = (formData.emails || []).length > 0 ? formData.emails : [{ type: "work", email: "" }];
                        return emails.map((email: any, index: number) => (
                          <div key={index} className="grid grid-cols-[120px_1fr_80px] gap-2 items-center">
                            <select
                              value={email.type}
                              onChange={(e) => {
                                const emails = [...(formData.emails || [{ type: "work", email: "" }])];
                                emails[index] = { ...emails[index], type: e.target.value };
                                setFormData({ ...formData, emails });
                              }}
                              className="px-3 py-2 border rounded-md text-sm"
                            >
                              <option value="work">Travail</option>
                              <option value="personal">Personnel</option>
                              <option value="other">Autre</option>
                            </select>
                            <input
                              type="email"
                              value={email.email}
                              onChange={(e) => {
                                const emails = [...(formData.emails || [{ type: "work", email: "" }])];
                                emails[index] = { ...emails[index], email: e.target.value };
                                setFormData({ ...formData, emails });
                              }}
                              placeholder="email@exemple.com"
                              className="px-3 py-2 border rounded-md text-sm"
                            />
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const emails = [...(formData.emails || [{ type: "work", email: "" }]), { type: "work", email: "" }];
                                  setFormData({ ...formData, emails });
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const emails = (formData.emails || []).filter((_: any, i: number) => i !== index);
                                  if (emails.length === 0) {
                                    emails.push({ type: "work", email: "" });
                                  }
                                  setFormData({ ...formData, emails });
                                }}
                                disabled={emails.length === 1}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Websites - 3-column grid */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sites web</label>
                    <div className="space-y-1">
                      {(() => {
                        const websites = (formData.websites || []).length > 0 ? formData.websites : [{ type: "website", url: "" }];
                        return websites.map((website: any, index: number) => (
                          <div key={index} className="grid grid-cols-[120px_1fr_80px] gap-2 items-center">
                            <select
                              value={website.type}
                              onChange={(e) => {
                                const websites = [...(formData.websites || [{ type: "website", url: "" }])];
                                websites[index] = { ...websites[index], type: e.target.value };
                                setFormData({ ...formData, websites });
                              }}
                              className="px-3 py-2 border rounded-md text-sm"
                            >
                              <option value="website">Site web</option>
                              <option value="portfolio">Portfolio</option>
                              <option value="social">Réseaux sociaux</option>
                              <option value="other">Autre</option>
                            </select>
                            <input
                              type="url"
                              value={website.url}
                              onChange={(e) => {
                                const websites = [...(formData.websites || [{ type: "website", url: "" }])];
                                websites[index] = { ...websites[index], url: e.target.value };
                                setFormData({ ...formData, websites });
                              }}
                              placeholder="https://..."
                              className="px-3 py-2 border rounded-md text-sm"
                            />
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const websites = [...(formData.websites || [{ type: "website", url: "" }]), { type: "website", url: "" }];
                                  setFormData({ ...formData, websites });
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const websites = (formData.websites || []).filter((_: any, i: number) => i !== index);
                                  if (websites.length === 0) {
                                    websites.push({ type: "website", url: "" });
                                  }
                                  setFormData({ ...formData, websites });
                                }}
                                disabled={websites.length === 1}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual separator between sections */}
              <div className="border-t"></div>

              {/* Section 2: Adresses */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Adresses</h4>
                <div className="space-y-1">
                  {(() => {
                    const addresses = (formData.addresses || []).length > 0 ? formData.addresses : [{
                      type: "home",
                      street: "",
                      city: "",
                      postalCode: "",
                      country: ""
                    }];
                    return addresses.map((addr: any, index: number) => (
                      <div key={index} className="grid grid-cols-[120px_1fr_80px] gap-2 items-start">
                        <select
                          value={addr.type}
                          onChange={(e) => {
                            const addresses = [...(formData.addresses || [{
                              type: "home",
                              street: "",
                              city: "",
                              postalCode: "",
                              country: ""
                            }])];
                            addresses[index] = { ...addresses[index], type: e.target.value };
                            setFormData({ ...formData, addresses });
                          }}
                          className="px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="home">Domicile</option>
                          <option value="work">Travail</option>
                          <option value="other">Autre</option>
                        </select>
                        <div className="space-y-1">
                          <input
                            value={addr.street || ""}
                            onChange={(e) => {
                              const addresses = [...(formData.addresses || [{
                                type: "home",
                                street: "",
                                city: "",
                                postalCode: "",
                                country: ""
                              }])];
                              addresses[index] = { ...addresses[index], street: e.target.value };
                              setFormData({ ...formData, addresses });
                            }}
                            placeholder="Rue"
                            className="w-full px-3 py-2 border rounded-md text-sm"
                          />
                          <div className="grid gap-2 grid-cols-2">
                            <input
                              value={addr.city || ""}
                              onChange={(e) => {
                                const addresses = [...(formData.addresses || [{
                                  type: "home",
                                  street: "",
                                  city: "",
                                  postalCode: "",
                                  country: ""
                                }])];
                                addresses[index] = { ...addresses[index], city: e.target.value };
                                setFormData({ ...formData, addresses });
                              }}
                              placeholder="Ville"
                              className="w-full px-3 py-2 border rounded-md text-sm"
                            />
                            <input
                              value={addr.postalCode || ""}
                              onChange={(e) => {
                                const addresses = [...(formData.addresses || [{
                                  type: "home",
                                  street: "",
                                  city: "",
                                  postalCode: "",
                                  country: ""
                                }])];
                                addresses[index] = { ...addresses[index], postalCode: e.target.value };
                                setFormData({ ...formData, addresses });
                              }}
                              placeholder="Code postal"
                              className="w-full px-3 py-2 border rounded-md text-sm"
                            />
                          </div>
                          <input
                            value={addr.country || ""}
                            onChange={(e) => {
                              const addresses = [...(formData.addresses || [{
                                type: "home",
                                street: "",
                                city: "",
                                postalCode: "",
                                country: ""
                              }])];
                              addresses[index] = { ...addresses[index], country: e.target.value };
                              setFormData({ ...formData, addresses });
                            }}
                            placeholder="Pays"
                            className="w-full px-3 py-2 border rounded-md text-sm"
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              const addresses = [...(formData.addresses || [{
                                type: "home",
                                street: "",
                                city: "",
                                postalCode: "",
                                country: ""
                              }]), {
                                type: "home",
                                street: "",
                                city: "",
                                postalCode: "",
                                country: ""
                              }];
                              setFormData({ ...formData, addresses });
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              const addresses = (formData.addresses || []).filter((_: any, i: number) => i !== index);
                              if (addresses.length === 0) {
                                addresses.push({
                                  type: "home",
                                  street: "",
                                  city: "",
                                  postalCode: "",
                                  country: ""
                                });
                              }
                              setFormData({ ...formData, addresses });
                            }}
                            disabled={addresses.length === 1}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 3: Relations professionnelles */}
      <AccordionItem value="relations-professionnelles">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Relations professionnelles
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-1">
              {formData.id ? (
                <CompanyMembersIndicator
                  clientId={formData.id}
                  clientType={formData.type}
                  clientName={formData.name || formData.companyName || ''}
                  isEditing={true}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enregistrez d'abord ce client pour gérer les relations professionnelles.
                </p>
              )}
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordéon 4: Profil Artistique (genres, instruments, professional, career) */}
      <AccordionItem value="profil-artistique">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Profil Artistique
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-1">
              {/* Subsection: Genres & Instruments */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Genres & Instruments</h4>
                <div className="space-y-1">
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
                <div className="space-y-1">
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
                <div className="space-y-1">
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

      {/* Accordéon 5: Plateformes de Streaming */}
      <AccordionItem value="streaming">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Plateformes de Streaming
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-1">
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

      {/* Accordéon 6: Notes Studio (renamed from Personal Information) */}
      <AccordionItem value="notes-studio">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Champs Personnalisés
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-1">
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
                <div className="space-y-1">
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
                        className="w-32 px-3 py-2 border rounded-md"
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
