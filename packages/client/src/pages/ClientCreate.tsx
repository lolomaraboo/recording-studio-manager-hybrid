import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Upload, X, Plus, User, Building2, Phone as PhoneIcon, MapPin, Info } from "lucide-react";
import { toast } from "sonner";

export default function ClientCreate() {
  const navigate = useNavigate();

  // Create mutation
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: (data) => {
      toast.success("Client créé avec succès");
      navigate(`/clients/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Main form state
  const [formData, setFormData] = useState({
    // Basic
    name: "",
    type: "individual" as "individual" | "company",

    // Structured name
    firstName: "",
    lastName: "",
    middleName: "",
    prefix: "",
    suffix: "",
    artistName: "",

    // Simple contact (backward compat)
    email: "",
    phone: "",

    // Address
    address: "",
    street: "",
    city: "",
    postalCode: "",
    region: "",
    country: "",

    // Additional
    birthday: "",
    gender: "",
    notes: "",

    // Files
    avatarUrl: "",
    logoUrl: "",
  });

  // Arrays state
  const [phones, setPhones] = useState<Array<{ type: string; number: string }>>([]);
  const [emails, setEmails] = useState<Array<{ type: string; email: string }>>([]);
  const [websites, setWebsites] = useState<Array<{ type: string; url: string }>>([]);
  const [customFields, setCustomFields] = useState<Array<{ label: string; type: string; value: any }>>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState("identite");

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      setFormData((prev) => ({ ...prev, avatarUrl: result.data.url }));
      toast.success("Avatar uploadé");
    } catch (error) {
      toast.error("Erreur lors de l'upload de l'avatar");
    }
  };

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      setFormData((prev) => ({ ...prev, logoUrl: result.data.url }));
      toast.success("Logo uploadé");
    } catch (error) {
      toast.error("Erreur lors de l'upload du logo");
    }
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.name.length < 2) {
      toast.error("Le nom est requis (min. 2 caractères)");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      type: formData.type,

      // Structured name
      ...(formData.firstName && { firstName: formData.firstName }),
      ...(formData.lastName && { lastName: formData.lastName }),
      ...(formData.middleName && { middleName: formData.middleName }),
      ...(formData.prefix && { prefix: formData.prefix }),
      ...(formData.suffix && { suffix: formData.suffix }),
      ...(formData.artistName && { artistName: formData.artistName }),

      // Simple contact
      ...(formData.email && { email: formData.email }),
      ...(formData.phone && { phone: formData.phone }),

      // Contact arrays
      ...(phones.length > 0 && { phones }),
      ...(emails.length > 0 && { emails }),
      ...(websites.length > 0 && { websites }),

      // Address
      ...(formData.address && { address: formData.address }),
      ...(formData.street && { street: formData.street }),
      ...(formData.city && { city: formData.city }),
      ...(formData.postalCode && { postalCode: formData.postalCode }),
      ...(formData.region && { region: formData.region }),
      ...(formData.country && { country: formData.country }),

      // Additional
      ...(formData.birthday && { birthday: formData.birthday }),
      ...(formData.gender && { gender: formData.gender }),
      ...(formData.notes && { notes: formData.notes }),

      // Files
      ...(formData.avatarUrl && { avatarUrl: formData.avatarUrl }),
      ...(formData.logoUrl && { logoUrl: formData.logoUrl }),

      // Custom fields
      ...(customFields.length > 0 && { customFields }),
    });
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/clients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8 text-primary" />
              Nouveau Client
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations du client</CardTitle>
              <CardDescription className="text-sm">
                Remplissez les informations du client. Seul le nom est obligatoire.
              </CardDescription>
            </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="identite">
                  <User className="h-4 w-4 mr-2" />
                  Identité
                </TabsTrigger>
                <TabsTrigger value="contact">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Contact
                </TabsTrigger>
                <TabsTrigger value="adresse">
                  <MapPin className="h-4 w-4 mr-2" />
                  Adresse
                </TabsTrigger>
                <TabsTrigger value="additional">
                  <Info className="h-4 w-4 mr-2" />
                  Info additionnelles
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Identité */}
              <TabsContent value="identite" className="space-y-6 mt-6">
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

              {/* Tab 2: Contact */}
              <TabsContent value="contact" className="space-y-6 mt-6">
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
              </TabsContent>

              {/* Tab 3: Adresse */}
              <TabsContent value="adresse" className="space-y-6 mt-6">
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

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse complète (optionnel)</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse complète en format libre..."
                    rows={2}
                  />
                  <p className="text-sm text-muted-foreground">
                    Utilisez ce champ si vous préférez saisir l'adresse en format libre
                  </p>
                </div>
              </TabsContent>

              {/* Tab 4: Info additionnelles */}
              <TabsContent value="additional" className="space-y-6 mt-6">
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

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes internes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes privées pour l'équipe..."
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Création..." : "Créer le client"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/clients")}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
