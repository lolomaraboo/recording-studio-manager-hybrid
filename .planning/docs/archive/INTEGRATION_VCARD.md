# Intégration vCard - Phase 3.9.4-01

## ✅ Backend Complété

Toutes les modifications backend ont été déployées sur le VPS de production:

### Base de données
- ✅ 16 nouveaux champs vCard dans `clients` (firstName, lastName, phones JSONB, emails JSONB, etc.)
- ✅ Table `client_contacts` créée
- ✅ Migrations appliquées sur tenant_org_1, tenant_3, tenant_superadmin

### API
- ✅ Routes upload: `/api/upload/avatar` et `/api/upload/client-logo`
- ✅ tRPC procedures: `clients.update()` avec champs vCard
- ✅ tRPC procedures: `getWithContacts()`, `addContact()`, `updateContact()`, `deleteContact()`

### Fichiers
- ✅ Middleware sécurité: `packages/server/src/middleware/tenantFileAccess.ts`
- ✅ Service upload: `packages/server/src/utils/local-upload-service.ts`
- ✅ Routes: `packages/server/src/routes/upload.ts`
- ✅ Schema: `packages/database/src/tenant/schema.ts`
- ✅ Router: `packages/server/src/routers/clients.ts`

## 🔧 Frontend - Intégration du Composant

### Nouveau Composant Créé

**Fichier:** `packages/client/src/components/EnrichedClientInfo.tsx`

Ce composant affiche et gère:
- Upload avatar/logo avec preview
- Nom structuré (civilité, prénom, nom, suffixe)
- Téléphones multiples (mobile, travail, domicile)
- Emails multiples (travail, personnel, autre)
- Websites multiples
- Contacts pour entreprises (firstName, lastName, title, email, phone, isPrimary)
- Champs personnalisés illimités

### Étapes d'Intégration dans ClientDetail.tsx

1. **Importer le composant** (ligne ~40):
```typescript
import { EnrichedClientInfo } from "@/components/EnrichedClientInfo";
```

2. **Ajouter état pour les contacts** (après ligne ~50):
```typescript
const { data: contacts } = trpc.clients.getWithContacts.useQuery(
  { id: Number(id) },
  { enabled: !!id }
);
```

3. **Ajouter mutations pour contacts** (après ligne ~111):
```typescript
const addContactMutation = trpc.clients.addContact.useMutation({
  onSuccess: () => {
    toast.success("Contact ajouté");
    refetch();
  },
});

const deleteContactMutation = trpc.clients.deleteContact.useMutation({
  onSuccess: () => {
    toast.success("Contact supprimé");
    refetch();
  },
});
```

4. **Mettre à jour formData** (remplacer lignes ~114-120):
```typescript
const [formData, setFormData] = useState({
  // Existing fields
  name: "",
  email: "",
  phone: "",
  artistName: "",
  address: "",

  // NEW vCard fields
  type: "individual" as "individual" | "company",
  firstName: "",
  lastName: "",
  middleName: "",
  prefix: "",
  suffix: "",
  avatarUrl: "",
  logoUrl: "",
  phones: [] as Array<{type: string; number: string}>,
  emails: [] as Array<{type: string; email: string}>,
  websites: [] as Array<{type: string; url: string}>,
  street: "",
  postalCode: "",
  region: "",
  birthday: "",
  gender: "",
  customFields: [] as Array<{label: string; type: string; value: any}>,
});
```

5. **Mettre à jour useEffect** (remplacer lignes ~123-133):
```typescript
useEffect(() => {
  if (client) {
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      artistName: client.artistName || "",
      address: client.address || "",
      type: (client.type as "individual" | "company") || "individual",
      firstName: client.firstName || "",
      lastName: client.lastName || "",
      middleName: client.middleName || "",
      prefix: client.prefix || "",
      suffix: client.suffix || "",
      avatarUrl: client.avatarUrl || "",
      logoUrl: client.logoUrl || "",
      phones: client.phones || [],
      emails: client.emails || [],
      websites: client.websites || [],
      street: client.street || "",
      postalCode: client.postalCode || "",
      region: client.region || "",
      birthday: client.birthday || "",
      gender: client.gender || "",
      customFields: client.customFields || [],
    });
  }
}, [client]);
```

6. **Mettre à jour handleSave** (remplacer lignes ~135-146):
```typescript
const handleSave = () => {
  updateMutation.mutate({
    id: Number(id),
    data: formData,
  });
};
```

7. **Ajouter helper pour update partiel** (après handleSave):
```typescript
const handleUpdateField = (updates: Partial<typeof formData>) => {
  setFormData(prev => ({ ...prev, ...updates }));
};
```

8. **Insérer le composant dans le JSX** (dans le Tabs, après l'onglet "Informations"):
```tsx
<TabsContent value="vcard" className="space-y-6">
  <EnrichedClientInfo
    client={formData}
    isEditing={isEditing}
    onUpdate={handleUpdateField}
    contacts={contacts?.contacts || []}
    onAddContact={(contact) => {
      addContactMutation.mutate({
        clientId: Number(id),
        ...contact,
      });
    }}
    onDeleteContact={(contactId) => {
      deleteContactMutation.mutate({ id: contactId });
    }}
  />
</TabsContent>
```

9. **Ajouter l'onglet dans TabsList**:
```tsx
<TabsTrigger value="vcard">Informations enrichies</TabsTrigger>
```

## 🧪 Test du Frontend

Après intégration, tester:

1. ✅ Charger un client existant (ID 1 de test existe)
2. ✅ Activer mode édition
3. ✅ Upload un avatar (pour individual) ou logo (pour company)
4. ✅ Ajouter plusieurs téléphones
5. ✅ Ajouter plusieurs emails
6. ✅ Ajouter des contacts (si type=company)
7. ✅ Ajouter des champs personnalisés
8. ✅ Sauvegarder et vérifier persistance

## 📦 Déploiement

### Backend déjà déployé ✅

### Frontend à déployer:

```bash
# Build client
cd packages/client
npm run build

# Deploy to VPS
rsync -av dist/ root@31.220.104.244:/var/www/recording-studio-manager/client/
```

## 🎯 Données de Test Existantes

Client ID 1 (tenant_org_1):
- Nom: "Test vCard Client"
- Prénom: "John"
- Nom: "Doe"
- Téléphones: [{type: "mobile", number: "+33612345678"}]
- Emails: [{type: "work", email: "john@work.com"}]
- Contact: Jane Smith (Project Manager, Primary)
