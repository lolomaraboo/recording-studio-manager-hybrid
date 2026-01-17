# UI Design Guidelines - Recording Studio Manager

## Principes de Design (Phase 3.14)

### 0. Conventions d'Icônes

**Principe**: Cohérence entre titres de page et navigation sidebar.

#### Règle: Icône page = Icône sidebar

```tsx
// ✅ BON - Cohérence parfaite
// Page Dashboard.tsx
<h2 className="text-3xl font-bold flex items-center gap-2">
  <Home className="h-8 w-8 text-primary" />
  Dashboard
</h2>

// Sidebar
<Link to="/dashboard">
  <Home className="h-5 w-5" />
  Dashboard
</Link>
```

#### Mapping Icônes Pages

| Page | Icône | Import lucide-react |
|------|-------|-------------------|
| Dashboard | `Home` | `import { Home } from "lucide-react"` |
| Sessions | `Calendar` | `import { Calendar } from "lucide-react"` |
| Calendrier | `Calendar` | (même que Sessions) |
| Clients | `Users` | `import { Users } from "lucide-react"` |
| Talents | `Users` | (même que Clients) |
| Salles | `Building` | `import { Building } from "lucide-react"` |
| Équipement | `Wrench` | `import { Wrench } from "lucide-react"` |
| Équipe | `Users` | (même que Clients/Talents) |
| Factures | `FileText` | `import { FileText } from "lucide-react"` |
| Paramètres | `Settings` | `import { Settings } from "lucide-react"` |

#### Widgets Dashboard (icônes fonctionnelles)

| Widget | Icône | Rationale |
|--------|-------|-----------|
| Sessions aujourd'hui | `Calendar` | Planification jour |
| Sessions à venir | `Calendar` | Planification future |
| Factures en attente | `FileText` | Documents financiers |
| Alertes & Rappels | `AlertTriangle` | Notifications urgentes |
| Revenus hebdomadaires | `DollarSign` | Finances |
| Top Clients | `Users` | Personnes |
| Équipement en maintenance | `Wrench` | Réparations |
| Messages non lus | `MessageSquare` | Communication |
| Statistiques Rapides | (pas d'icône) | Grid de données |

#### Tailles d'icônes

```tsx
// Titre de page (header) - TOUJOURS en couleur primary
<Icon className="h-8 w-8 text-primary" />

// Navigation sidebar
<Icon className="h-5 w-5" />

// Boutons
<Icon className="h-4 w-4" />

// Empty states
<Icon className="h-8 w-8 text-muted-foreground" />
```

### 1. Densité et Espacement

**Objectif**: Interface moderne, compacte et professionnelle maximisant l'utilisation de l'écran.

#### Conteneurs principaux (TOUTES LES PAGES)

**⚠️ Convention standardisée - À appliquer partout:**

```tsx
// Pattern standard pour TOUTES les pages (Dashboard, Sessions, Clients, etc.)
// Structure: container direct sans wrapper
<div className="container pt-2 pb-4 px-2">
  <div className="space-y-2">
    {/* Header section */}
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold flex items-center gap-2">
        <Icon className="h-8 w-8 text-primary" />
        Titre Page
      </h2>
      <div>{/* Boutons actions */}</div>
    </div>

    {/* Cards content */}
    <Card>...</Card>
  </div>
</div>
```

**Détails de l'espacement:**
- `pt-2` : Top minimal (8px) entre header app et premier élément
- `pb-4` : Bottom suffisant (16px) pour scroll
- `px-2` : Padding horizontal (8px) - crée l'espace avec sidebar/chatbot
- `space-y-2` : Gap vertical (8px) entre sections/cards

**Architecture Layout (Layout.tsx):**
```tsx
<div className="flex h-screen overflow-hidden bg-background">
  <Sidebar />  {/* Pas de gap */}
  <div className="flex flex-col flex-1 ...">
    <Header />
    <main className="flex-1 overflow-y-auto">
      <Outlet />  {/* Pages avec container px-2 */}
    </main>
  </div>
  <AIAssistant />  {/* Position fixed */}
</div>
```

**IMPORTANT:**
- **PAS de `gap-2`** sur le conteneur flex principal
- Le `px-2` des pages crée l'espace entre sidebar et contenu
- Chatbot en `position: fixed` donc hors du flux flex

**Rationale:**
- Cohérence parfaite sur toutes les pages
- Ultra-compact (8px partout sauf bottom)
- Maximise l'espace pour le contenu
- Évite l'hétérogénéité visuelle
- Espacement symétrique sidebar/chatbot

#### Cards

**Pattern standard (avec titre):**
```tsx
<Card>
  <CardHeader className="pb-3">           // Padding bottom réduit
    <CardTitle className="text-base">    // Titre plus petit
    <CardDescription className="text-sm"> // Description compacte (optionnel)
  </CardHeader>
  <CardContent className="pt-0">          // Pas de padding top (continuité avec header)
```

**Cards de filtres (exemple Sessions/Projects):**
```tsx
<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base">Filtres</CardTitle>
  </CardHeader>
  <CardContent className="pt-0">
    {/* Inputs de recherche et filtres */}
  </CardContent>
</Card>
```

#### Grilles (Dashboards)
```tsx
// Layout moderne en grille responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2">
```
- Mobile: 1 colonne
- Tablette (md): 2 colonnes
- Desktop (lg): 3 colonnes
- Gap: `gap-2` (ultra compact)
- Padding horizontal: `px-2` (léger espace des bords)

### 2. Empty States

**Pattern standard** (remplace l'ancien py-12 et h-12):

```tsx
<div className="text-center py-6">
  <Icon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
  <h3 className="text-sm font-medium mb-1">Titre concis</h3>
  <p className="text-sm text-muted-foreground mb-3">Description courte</p>
  <Button size="sm">Action</Button>
</div>
```

**Avant (trop d'espace)**:
- py-12 → py-6
- h-12 w-12 → h-8 w-8
- text-lg → text-sm
- mb-4 → mb-2/mb-3

### 3. Typographie

#### Hiérarchie des titres
```tsx
// Page title (header)
<h1 className="text-xl font-semibold">

// Card title
<CardTitle className="text-base">

// Section subtitle
<h3 className="text-sm font-medium">
```

#### Corps de texte
```tsx
// Description normale
<p className="text-sm text-muted-foreground">

// Labels de formulaire
<Label className="text-sm">
```

### 4. Composants Interactifs

#### Badges (statuts)
```tsx
<Badge variant={getStatusColor(status)} className="mt-1">
  {getStatusLabel(status)}
</Badge>
```
Toujours avec traduction FR et couleur dynamique.

#### Boutons dans empty states
```tsx
<Button size="sm">  // Taille réduite pour densité
```

### 5. Tables

```tsx
<TableRow className="cursor-pointer hover:bg-muted/50">
```
- Hover states pour interactivité
- Padding cellules standard (géré par shadcn/ui)

#### Icônes de tri (TableHead)

**Pattern standard pour colonnes triables:**
```tsx
<TableHead
  className="cursor-pointer hover:bg-accent"
  onClick={() => handleSort('fieldName')}
>
  <div className="flex items-center gap-1">
    Nom Colonne
    {sortField === 'fieldName' ? (
      sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    ) : (
      <ArrowUpDown className="h-4 w-4 opacity-30" />
    )}
  </div>
</TableHead>
```

**Taille icônes de tri:**
- **Toutes les colonnes**: `h-3 w-3` (12px × 12px)
- Gap: `gap-1` entre texte et icône

**Rationale:**
- Uniformité visuelle sur toutes les colonnes
- Espacement cohérent entre texte et icône
- Taille `h-3 w-3` suffisante pour la visibilité

### 6. Widgets Draggables (Dashboard uniquement)

```tsx
<Card className="h-full flex flex-col relative">
  {/* Poignée drag - visible seulement au hover */}
  <div className="absolute top-2 right-2 cursor-grab ... opacity-0 group-hover:opacity-100 transition-opacity z-10">
    <GripVertical className="h-4 w-4" />
  </div>
  <CardContent className="flex-1 overflow-auto p-4">
```

**Avantages**:
- Pas d'espace mort (poignée en position absolute)
- UX épurée (visible seulement au hover)

## Changements par Page (Phase 3.14-01)

### ✅ Dashboard.tsx
- Container: pt-2 pb-4 px-2, space-y-2 (standard)
- Icône titre: text-primary (couleur)
- Grille 3 colonnes responsive
- Widgets compacts (p-4)
- Empty states: py-4, h-8 w-8
- Poignée drag au hover uniquement
- Gap ultra-compact: gap-2

### ✅ Sessions.tsx
- Container: pt-2 pb-4 px-2, space-y-2 (standard)
- Structure: container direct, pas de wrapper bg-background
- Header intégré dans container (pas de header sticky séparé)
- Icône titre: text-primary (couleur) - Calendar h-8 w-8
- Bouton retour vers Dashboard + boutons actions (Calendrier, Nouvelle session)
- Cards: pb-3, text-base
- Empty state: py-6, h-8 w-8
- Bug statut fixé (Badge + traduction FR)
- Espacement symétrique avec sidebar grâce au px-2

### 🔄 À Harmoniser (57 pages restantes)
- Clients (3 pages)
- Projects (pages)
- Equipment (pages)
- Rooms (pages)
- Admin Dashboard (38 pages)
- Client Portal (7 pages)
- Super Admin (3 pages)
- Public/Auth (4 pages)

## Anti-Patterns à Éviter

❌ **Trop d'espace vertical**
```tsx
// Ancien style
<main className="container py-8">      // Trop
  <div className="space-y-6">          // Trop
    <div className="text-center py-12"> // Beaucoup trop
```

✅ **Style moderne compact**
```tsx
// Nouveau style
<main className="container py-4">
  <div className="space-y-3">
    <div className="text-center py-6">
```

❌ **Titres trop grands**
```tsx
<CardTitle>              // text-lg par défaut
<h3 className="text-lg"> // Trop grand
```

✅ **Titres proportionnés**
```tsx
<CardTitle className="text-base">
<h3 className="text-sm font-medium">
```

❌ **Empty states encombrants**
```tsx
<Calendar className="h-12 w-12 mx-auto mb-4" />
<h3 className="text-lg font-semibold mb-2">
```

✅ **Empty states compacts**
```tsx
<Calendar className="h-8 w-8 mx-auto mb-2" />
<h3 className="text-sm font-medium mb-1">
```

## Workflow de Développement

1. **Hot Reload avec Vite**: `pnpm --filter client dev` (localhost:5174)
   - Changements instantanés
   - Évite rebuild Docker (gagne 2-3 minutes par modif)

2. **Validation visuelle**:
   - Tester sur différentes résolutions (mobile, tablette, desktop)
   - Vérifier cohérence avec guidelines ci-dessus

3. **Build Docker** (seulement pour déploiement):
   ```bash
   docker-compose build client
   docker-compose restart client
   ```

## Notes Techniques

- **TailwindCSS 4**: Classes utilitaires modernes
- **shadcn/ui**: Composants avec variants cohérents
- **React 19**: Hot reload rapide en dev

## Références

- Phase: 3.14 - "Améliorations UI de Toutes les Pages"
- Blocker résolu: ISSUE-011 (cookies `secure: false` temporaire)
- Méthode: Vite dev pour itérations rapides
