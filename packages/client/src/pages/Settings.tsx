import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Bell,
  Globe,
  Shield,
  CreditCard,
  Palette,
  Mail,
  Key,
  Smartphone,
  Save,
  Upload,
  Download,
} from "lucide-react";

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get organization data
  const { data: organization } = trpc.organizations.get.useQuery();
  const updateOrganization = trpc.organizations.update.useMutation();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner une image (PNG, JPG, SVG, WebP)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 MB");
      return;
    }

    setUploading(true);

    try {
      // Preview image
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organization?.id.toString() || '');

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update organization with new logo URL
      if (organization) {
        await updateOrganization.mutateAsync({
          id: organization.id,
          data: {
            logoUrl: result.data.secureUrl,
          },
        });

        alert("Logo mis à jour avec succès !");
      }
    } catch (error: any) {
      console.error('Logo upload error:', error);
      alert(error.message || "Échec de l'upload du logo");
      setLogoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground">
          Gérez les préférences de votre compte et de votre studio
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="organization">
            <Building2 className="mr-2 h-4 w-4" />
            Organisation
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="mr-2 h-4 w-4" />
            Facturation
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil utilisateur</CardTitle>
              <CardDescription>
                Informations personnelles et préférences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Changer la photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou GIF. Max 2 MB.
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" defaultValue="Alice" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" defaultValue="Martin" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="alice@studiopro.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" defaultValue="+33 6 12 34 56 78" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Select defaultValue="europe-paris">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {/* Europe */}
                    <SelectItem value="europe-paris">Europe/Paris (GMT+1)</SelectItem>
                    <SelectItem value="europe-london">Europe/London (GMT+0)</SelectItem>
                    <SelectItem value="europe-berlin">Europe/Berlin (GMT+1)</SelectItem>
                    <SelectItem value="europe-madrid">Europe/Madrid (GMT+1)</SelectItem>
                    <SelectItem value="europe-rome">Europe/Rome (GMT+1)</SelectItem>
                    <SelectItem value="europe-amsterdam">Europe/Amsterdam (GMT+1)</SelectItem>
                    <SelectItem value="europe-brussels">Europe/Brussels (GMT+1)</SelectItem>
                    <SelectItem value="europe-zurich">Europe/Zurich (GMT+1)</SelectItem>
                    <SelectItem value="europe-lisbon">Europe/Lisbon (GMT+0)</SelectItem>
                    <SelectItem value="europe-athens">Europe/Athens (GMT+2)</SelectItem>
                    <SelectItem value="europe-moscow">Europe/Moscow (GMT+3)</SelectItem>
                    <SelectItem value="europe-istanbul">Europe/Istanbul (GMT+3)</SelectItem>

                    {/* Americas */}
                    <SelectItem value="america-new-york">America/New York (GMT-5)</SelectItem>
                    <SelectItem value="america-chicago">America/Chicago (GMT-6)</SelectItem>
                    <SelectItem value="america-denver">America/Denver (GMT-7)</SelectItem>
                    <SelectItem value="america-los-angeles">America/Los Angeles (GMT-8)</SelectItem>
                    <SelectItem value="america-toronto">America/Toronto (GMT-5)</SelectItem>
                    <SelectItem value="america-vancouver">America/Vancouver (GMT-8)</SelectItem>
                    <SelectItem value="america-mexico-city">America/Mexico City (GMT-6)</SelectItem>
                    <SelectItem value="america-sao-paulo">America/São Paulo (GMT-3)</SelectItem>
                    <SelectItem value="america-buenos-aires">America/Buenos Aires (GMT-3)</SelectItem>
                    <SelectItem value="america-lima">America/Lima (GMT-5)</SelectItem>
                    <SelectItem value="america-santiago">America/Santiago (GMT-3)</SelectItem>

                    {/* Asia */}
                    <SelectItem value="asia-dubai">Asia/Dubai (GMT+4)</SelectItem>
                    <SelectItem value="asia-shanghai">Asia/Shanghai (GMT+8)</SelectItem>
                    <SelectItem value="asia-tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                    <SelectItem value="asia-hong-kong">Asia/Hong Kong (GMT+8)</SelectItem>
                    <SelectItem value="asia-singapore">Asia/Singapore (GMT+8)</SelectItem>
                    <SelectItem value="asia-seoul">Asia/Seoul (GMT+9)</SelectItem>
                    <SelectItem value="asia-bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                    <SelectItem value="asia-jakarta">Asia/Jakarta (GMT+7)</SelectItem>
                    <SelectItem value="asia-manila">Asia/Manila (GMT+8)</SelectItem>
                    <SelectItem value="asia-kolkata">Asia/Kolkata (GMT+5:30)</SelectItem>

                    {/* Pacific */}
                    <SelectItem value="pacific-tahiti">Pacific/Tahiti (GMT-10)</SelectItem>
                    <SelectItem value="pacific-auckland">Pacific/Auckland (GMT+12)</SelectItem>
                    <SelectItem value="pacific-sydney">Pacific/Sydney (GMT+10)</SelectItem>
                    <SelectItem value="pacific-melbourne">Pacific/Melbourne (GMT+10)</SelectItem>
                    <SelectItem value="pacific-fiji">Pacific/Fiji (GMT+12)</SelectItem>
                    <SelectItem value="pacific-honolulu">Pacific/Honolulu (GMT-10)</SelectItem>
                    <SelectItem value="pacific-marquesas">Pacific/Marquesas (GMT-9:30)</SelectItem>
                    <SelectItem value="pacific-gambier">Pacific/Gambier (GMT-9)</SelectItem>
                    <SelectItem value="pacific-noumea">Pacific/Nouméa (GMT+11)</SelectItem>

                    {/* Africa */}
                    <SelectItem value="africa-cairo">Africa/Cairo (GMT+2)</SelectItem>
                    <SelectItem value="africa-johannesburg">Africa/Johannesburg (GMT+2)</SelectItem>
                    <SelectItem value="africa-lagos">Africa/Lagos (GMT+1)</SelectItem>
                    <SelectItem value="africa-nairobi">Africa/Nairobi (GMT+3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <Select defaultValue="fr">
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Préférences d'affichage</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Thème</Label>
                <Select defaultValue="system">
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Format de date</Label>
                <Select defaultValue="dd/mm/yyyy">
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">JJ/MM/AAAA</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/JJ/AAAA</SelectItem>
                    <SelectItem value="yyyy-mm-dd">AAAA-MM-JJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select defaultValue="eur">
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'organisation</CardTitle>
              <CardDescription>
                Détails de votre studio d'enregistrement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo du studio</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-muted">
                    {logoPreview || organization?.logoUrl ? (
                      <img
                        src={logoPreview || organization?.logoUrl || ''}
                        alt="Logo preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? "Upload en cours..." : "Changer le logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG ou WebP. Max 5 MB. Recommandé: 200x200px minimum.
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="orgName">Nom du studio</Label>
                <Input id="orgName" defaultValue="Studio Pro Recording" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgEmail">Email professionnel</Label>
                <Input
                  id="orgEmail"
                  type="email"
                  defaultValue="contact@studiopro.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgPhone">Téléphone</Label>
                <Input id="orgPhone" type="tel" defaultValue="+33 1 23 45 67 89" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgAddress">Adresse</Label>
                <Textarea
                  id="orgAddress"
                  defaultValue="123 Rue de la Musique, 75001 Paris, France"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgWebsite">Site web</Label>
                <Input id="orgWebsite" defaultValue="https://studiopro.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgDescription">Description</Label>
                <Textarea
                  id="orgDescription"
                  defaultValue="Studio d'enregistrement professionnel spécialisé dans la production musicale, le mixage et le mastering."
                  rows={4}
                />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations légales</CardTitle>
              <CardDescription>SIRET, TVA et mentions légales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input id="siret" defaultValue="123 456 789 00012" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat">N° TVA</Label>
                  <Input id="vat" defaultValue="FR 12 345678901" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalForm">Forme juridique</Label>
                <Select defaultValue="sarl">
                  <SelectTrigger id="legalForm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ei">Entreprise Individuelle</SelectItem>
                    <SelectItem value="sarl">SARL</SelectItem>
                    <SelectItem value="sas">SAS</SelectItem>
                    <SelectItem value="eurl">EURL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>
                Choisissez les notifications que vous souhaitez recevoir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-all">Activer les notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications push dans l'application
                  </p>
                </div>
                <Switch
                  id="notifications-all"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nouvelles sessions</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertes pour les sessions programmées
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Factures impayées</Label>
                    <p className="text-sm text-muted-foreground">
                      Rappels de paiement pour factures en attente
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nouveaux messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Messages des clients et collaborateurs
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance équipement</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertes de maintenance préventive
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir un récapitulatif par email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailFrequency">Fréquence des emails</Label>
                <Select defaultValue="daily">
                  <SelectTrigger id="emailFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Temps réel</SelectItem>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidien (9h00)</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire (lundi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mot de passe</CardTitle>
              <CardDescription>
                Modifier votre mot de passe de connexion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <p className="text-sm text-muted-foreground">
                Le mot de passe doit contenir au moins 8 caractères, une majuscule,
                une minuscule et un chiffre.
              </p>
              <Separator />
              <div className="flex justify-end">
                <Button>Changer le mot de passe</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentification à deux facteurs (2FA)</CardTitle>
              <CardDescription>
                Sécurisez votre compte avec une couche de protection supplémentaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="2fa">Activer 2FA</Label>
                    {twoFactorEnabled && (
                      <Badge variant="secondary" className="text-xs">
                        Activé
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Code de vérification requis à chaque connexion
                  </p>
                </div>
                <Switch
                  id="2fa"
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>
              {twoFactorEnabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Méthode 2FA</Label>
                    <Select defaultValue="app">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="app">
                          Application d'authentification
                        </SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Configurer l'application
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions actives</CardTitle>
              <CardDescription>
                Gérer les appareils connectés à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        MacBook Pro · Paris, France
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Session actuelle · Il y a 2 minutes
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Actuelle</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        iPhone 15 Pro · Paris, France
                      </p>
                      <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Déconnecter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan actuel</CardTitle>
              <CardDescription>
                Gérez votre abonnement et vos informations de facturation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">Plan Professional</h3>
                    <Badge>Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    99,00 € / mois · Renouvellement le 1er janvier 2026
                  </p>
                </div>
                <Button variant="outline">Changer de plan</Button>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Fonctionnalités incluses:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Salles illimitées
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    100 GB de stockage
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Support prioritaire
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Rapports avancés
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moyen de paiement</CardTitle>
              <CardDescription>
                Carte bancaire utilisée pour les paiements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold">
                    VISA
                  </div>
                  <div>
                    <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                    <p className="text-xs text-muted-foreground">Expire 12/2027</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Modifier
                </Button>
              </div>
              <Button variant="outline" className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Ajouter une carte
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique de facturation</CardTitle>
              <CardDescription>Vos dernières factures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "1er décembre 2025", amount: "99,00 €", status: "Payée" },
                  { date: "1er novembre 2025", amount: "99,00 €", status: "Payée" },
                  { date: "1er octobre 2025", amount: "99,00 €", status: "Payée" },
                ].map((invoice, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{invoice.date}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.amount} · {invoice.status}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
