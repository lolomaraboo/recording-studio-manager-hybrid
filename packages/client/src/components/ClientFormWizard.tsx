/**
 * ClientFormWizard.tsx
 * Reusable 3-step wizard for client creation and modification
 * Step 1: Base fields | Step 2: Enriched vCard arrays | Step 3: Music profile (22 fields)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MusicProfileSection } from "@/components/MusicProfileSection";
import { Save, X, Plus, User, Building2, Upload } from "lucide-react";

interface ClientFormData {
  // Basic
  name: string;
  type: "individual" | "company";

  // Structured name
  firstName?: string;
  lastName?: string;
  middleName?: string;
  prefix?: string;
  suffix?: string;
  artistName?: string;

  // Simple contact (backward compat)
  email?: string;
  phone?: string;

  // Address
  address?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  region?: string;
  country?: string;

  // Additional
  birthday?: string;
  gender?: string;

  // Files
  avatarUrl?: string;
  logoUrl?: string;

  // Music profile fields (22 fields from Phase 18.4)
  genres?: string[];
  instruments?: string[];
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  bandcampUrl?: string;
  deezerUrl?: string;
  tidalUrl?: string;
  amazonMusicUrl?: string;
  audiomackUrl?: string;
  beatportUrl?: string;
  otherPlatformsUrl?: string;
  recordLabel?: string;
  distributor?: string;
  managerContact?: string;
  publisher?: string;
  performanceRightsSociety?: string;
  yearsActive?: string;
  notableWorks?: string;
  awardsRecognition?: string;
  biography?: string;
}

interface ClientFormWizardProps {
  mode: "create" | "edit";
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

export function ClientFormWizard({
  mode,
  initialData = {},
  onSubmit,
  onCancel,
}: ClientFormWizardProps) {
  // Current step (1-3)
  const [currentStep, setCurrentStep] = useState<"base" | "enriched" | "music">("base");

  // Form data state
  const [formData, setFormData] = useState<ClientFormData>({
    name: initialData.name || "",
    type: initialData.type || "individual",
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    middleName: initialData.middleName || "",
    prefix: initialData.prefix || "",
    suffix: initialData.suffix || "",
    artistName: initialData.artistName || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    address: initialData.address || "",
    street: initialData.street || "",
    city: initialData.city || "",
    postalCode: initialData.postalCode || "",
    region: initialData.region || "",
    country: initialData.country || "",
    birthday: initialData.birthday || "",
    gender: initialData.gender || "",
    avatarUrl: initialData.avatarUrl || "",
    logoUrl: initialData.logoUrl || "",
    genres: initialData.genres || [],
    instruments: initialData.instruments || [],
    spotifyUrl: initialData.spotifyUrl || "",
    appleMusicUrl: initialData.appleMusicUrl || "",
    youtubeUrl: initialData.youtubeUrl || "",
    soundcloudUrl: initialData.soundcloudUrl || "",
    bandcampUrl: initialData.bandcampUrl || "",
    deezerUrl: initialData.deezerUrl || "",
    tidalUrl: initialData.tidalUrl || "",
    amazonMusicUrl: initialData.amazonMusicUrl || "",
    audiomackUrl: initialData.audiomackUrl || "",
    beatportUrl: initialData.beatportUrl || "",
    otherPlatformsUrl: initialData.otherPlatformsUrl || "",
    recordLabel: initialData.recordLabel || "",
    distributor: initialData.distributor || "",
    managerContact: initialData.managerContact || "",
    publisher: initialData.publisher || "",
    performanceRightsSociety: initialData.performanceRightsSociety || "",
    yearsActive: initialData.yearsActive || "",
    notableWorks: initialData.notableWorks || "",
    awardsRecognition: initialData.awardsRecognition || "",
    biography: initialData.biography || "",
  });

  // Arrays state - hydrate from initialData in edit mode
  const [phones, setPhones] = useState<Array<{ type: string; number: string }>>(
    initialData.phones || []
  );
  const [emails, setEmails] = useState<Array<{ type: string; email: string }>>(
    initialData.emails || []
  );
  const [websites, setWebsites] = useState<Array<{ type: string; url: string }>>(
    initialData.websites || []
  );
  const [customFields, setCustomFields] = useState<Array<{ label: string; type: string; value: any }>>(
    initialData.customFields || []
  );

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
      setFormData((prev) => ({ ...prev, avatarUrl: result.data.url }));
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
      setFormData((prev) => ({ ...prev, logoUrl: result.data.url }));
    } catch (error) {
      console.error("Logo upload error:", error);
    }
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Minimal validation: only name required
    if (!formData.name.trim() || formData.name.length < 2) {
      alert("Le nom est requis (min. 2 caractères)");
      return;
    }

    // Build complete data object
    const submitData: any = {
      name: formData.name,
      type: formData.type,
      ...(formData.firstName && { firstName: formData.firstName }),
      ...(formData.lastName && { lastName: formData.lastName }),
      ...(formData.middleName && { middleName: formData.middleName }),
      ...(formData.prefix && { prefix: formData.prefix }),
      ...(formData.suffix && { suffix: formData.suffix }),
      ...(formData.artistName && { artistName: formData.artistName }),
      ...(formData.email && { email: formData.email }),
      ...(formData.phone && { phone: formData.phone }),
      ...(phones.length > 0 && { phones }),
      ...(emails.length > 0 && { emails }),
      ...(websites.length > 0 && { websites }),
      ...(formData.address && { address: formData.address }),
      ...(formData.street && { street: formData.street }),
      ...(formData.city && { city: formData.city }),
      ...(formData.postalCode && { postalCode: formData.postalCode }),
      ...(formData.region && { region: formData.region }),
      ...(formData.country && { country: formData.country }),
      ...(formData.birthday && { birthday: formData.birthday }),
      ...(formData.gender && { gender: formData.gender }),
      ...(formData.avatarUrl && { avatarUrl: formData.avatarUrl }),
      ...(formData.logoUrl && { logoUrl: formData.logoUrl }),
      ...(customFields.length > 0 && { customFields }),
      // Music profile fields
      ...(formData.genres && formData.genres.length > 0 && { genres: formData.genres }),
      ...(formData.instruments && formData.instruments.length > 0 && { instruments: formData.instruments }),
      ...(formData.spotifyUrl && { spotifyUrl: formData.spotifyUrl }),
      ...(formData.appleMusicUrl && { appleMusicUrl: formData.appleMusicUrl }),
      ...(formData.youtubeUrl && { youtubeUrl: formData.youtubeUrl }),
      ...(formData.soundcloudUrl && { soundcloudUrl: formData.soundcloudUrl }),
      ...(formData.bandcampUrl && { bandcampUrl: formData.bandcampUrl }),
      ...(formData.deezerUrl && { deezerUrl: formData.deezerUrl }),
      ...(formData.tidalUrl && { tidalUrl: formData.tidalUrl }),
      ...(formData.amazonMusicUrl && { amazonMusicUrl: formData.amazonMusicUrl }),
      ...(formData.audiomackUrl && { audiomackUrl: formData.audiomackUrl }),
      ...(formData.beatportUrl && { beatportUrl: formData.beatportUrl }),
      ...(formData.otherPlatformsUrl && { otherPlatformsUrl: formData.otherPlatformsUrl }),
      ...(formData.recordLabel && { recordLabel: formData.recordLabel }),
      ...(formData.distributor && { distributor: formData.distributor }),
      ...(formData.managerContact && { managerContact: formData.managerContact }),
      ...(formData.publisher && { publisher: formData.publisher }),
      ...(formData.performanceRightsSociety && { performanceRightsSociety: formData.performanceRightsSociety }),
      ...(formData.yearsActive && { yearsActive: formData.yearsActive }),
      ...(formData.notableWorks && { notableWorks: formData.notableWorks }),
      ...(formData.awardsRecognition && { awardsRecognition: formData.awardsRecognition }),
      ...(formData.biography && { biography: formData.biography }),
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {mode === "create" ? "Nouveau client" : "Modifier le client"}
          </CardTitle>
          <CardDescription className="text-sm">
            Remplissez les informations du client. Seul le nom est obligatoire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 3-Step Tabs - ALL tabs always clickable */}
          <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="base">1. Base</TabsTrigger>
              <TabsTrigger value="enriched">2. Enrichi</TabsTrigger>
              <TabsTrigger value="music">3. Musique</TabsTrigger>
            </TabsList>

            {/* Step 1: Base Fields */}
            <TabsContent value="base" className="space-y-6 mt-6">
              {/* Type toggle */}
              <div className="space-y-2">
                <Label>Type de client</Label>
                <div className="flex gap-2">
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

              {/* Name (required) */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom complet / Raison sociale <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={formData.type === "individual" ? "Ex: Jean Dupont" : "Ex: Sony Music France"}
                  required
                />
              </div>

              {/* Structured name (for individuals) */}
              {formData.type === "individual" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prefix">Civilité</Label>
                      <Input
                        id="prefix"
                        value={formData.prefix}
                        onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                        placeholder="M. / Mme / Dr."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Jean"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Second prénom</Label>
                      <Input
                        id="middleName"
                        value={formData.middleName}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                        placeholder="Paul"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom de famille</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Dupont"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suffix">Suffixe</Label>
                      <Input
                        id="suffix"
                        value={formData.suffix}
                        onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                        placeholder="Jr. / III"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Artist name */}
              <div className="space-y-2">
                <Label htmlFor="artistName">Nom d'artiste / Pseudo</Label>
                <Input
                  id="artistName"
                  value={formData.artistName}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  placeholder="Ex: DJ Cool"
                />
              </div>

              {/* Simple contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Rue</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="123 rue de la Paix"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="75001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Paris"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Région / État</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="Île-de-France"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="France"
                    />
                  </div>
                </div>
              </div>

              {/* Birthday & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthday">Date de naissance</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Genre</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Non spécifié</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="O">Autre</option>
                  </select>
                </div>
              </div>

              {/* Avatar/Logo upload */}
              <div className="space-y-2">
                <Label>
                  {formData.type === "individual" ? "Photo de profil" : "Logo de l'entreprise"}
                </Label>
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
            </TabsContent>

            {/* Step 2: Enriched vCard Fields */}
            <TabsContent value="enriched" className="space-y-6 mt-6">
              {/* Phones array */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Téléphones</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPhones([...phones, { type: "mobile", number: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                {phones.map((phone, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      value={phone.type}
                      onChange={(e) => {
                        const newPhones = [...phones];
                        newPhones[idx].type = e.target.value;
                        setPhones(newPhones);
                      }}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="mobile">Mobile</option>
                      <option value="work">Travail</option>
                      <option value="home">Domicile</option>
                      <option value="fax">Fax</option>
                    </select>
                    <Input
                      value={phone.number}
                      onChange={(e) => {
                        const newPhones = [...phones];
                        newPhones[idx].number = e.target.value;
                        setPhones(newPhones);
                      }}
                      placeholder="+33 6 12 34 56 78"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {phones.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun téléphone ajouté</p>
                )}
              </div>

              {/* Emails array */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Emails</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEmails([...emails, { type: "personal", email: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                {emails.map((email, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      value={email.type}
                      onChange={(e) => {
                        const newEmails = [...emails];
                        newEmails[idx].type = e.target.value;
                        setEmails(newEmails);
                      }}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="personal">Personnel</option>
                      <option value="work">Travail</option>
                      <option value="other">Autre</option>
                    </select>
                    <Input
                      type="email"
                      value={email.email}
                      onChange={(e) => {
                        const newEmails = [...emails];
                        newEmails[idx].email = e.target.value;
                        setEmails(newEmails);
                      }}
                      placeholder="jean@example.com"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEmails(emails.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {emails.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun email ajouté</p>
                )}
              </div>

              {/* Websites array */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Sites web</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWebsites([...websites, { type: "website", url: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                {websites.map((website, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      value={website.type}
                      onChange={(e) => {
                        const newWebsites = [...websites];
                        newWebsites[idx].type = e.target.value;
                        setWebsites(newWebsites);
                      }}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="website">Site web</option>
                      <option value="social">Réseaux sociaux</option>
                      <option value="portfolio">Portfolio</option>
                    </select>
                    <Input
                      value={website.url}
                      onChange={(e) => {
                        const newWebsites = [...websites];
                        newWebsites[idx].url = e.target.value;
                        setWebsites(newWebsites);
                      }}
                      placeholder="https://example.com"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setWebsites(websites.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {websites.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun site web ajouté</p>
                )}
              </div>

              {/* Custom fields array */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Champs personnalisés</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCustomFields([...customFields, { label: "", type: "text", value: "" }])
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={field.label}
                      onChange={(e) => {
                        const newFields = [...customFields];
                        newFields[idx].label = e.target.value;
                        setCustomFields(newFields);
                      }}
                      placeholder="Nom du champ"
                      className="w-1/3"
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...customFields];
                        newFields[idx].value = e.target.value;
                        setCustomFields(newFields);
                      }}
                      placeholder="Valeur"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {customFields.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun champ personnalisé ajouté</p>
                )}
              </div>
            </TabsContent>

            {/* Step 3: Music Profile (22 fields) */}
            <TabsContent value="music" className="mt-6">
              <MusicProfileSection
                client={formData as any}
                isEditing={true}
                onUpdate={(updates) => {
                  // Filter out null values from updates to match our non-null type
                  const filteredUpdates: Partial<ClientFormData> = {};
                  Object.entries(updates).forEach(([key, value]) => {
                    if (value !== null) {
                      filteredUpdates[key as keyof ClientFormData] = value as any;
                    }
                  });
                  setFormData({ ...formData, ...filteredUpdates });
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Actions - Submit button on ALL steps */}
          <div className="flex gap-3 pt-6">
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? "Créer le client" : "Enregistrer les modifications"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
