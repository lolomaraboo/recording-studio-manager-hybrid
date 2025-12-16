# Architecture Tracks - Double Interface

**Date:** 2025-12-15
**Décision:** Mix des deux approches (contextuel + global)
**Contrainte:** Tracks OBLIGATOIREMENT rattachées à un projet (`projectId NOT NULL`)

---

## 🎯 Vue d'Ensemble

Les tracks sont accessibles via **deux interfaces complémentaires** :

1. **Projects.tsx** : Gestion contextuelle (onglet Tracks dans détail projet)
2. **Tracks.tsx** : Vue globale (page dédiée avec toutes les tracks)

---

## 📊 Interface 1: Projects.tsx (Gestion Contextuelle)

### Navigation
```
Sidebar → Projects → [Sélectionner un projet] → Onglet "Tracks"
```

### UI Structure
```tsx
ProjectDetail.tsx (ou modal)
├── Header (Nom projet, status, client)
├── Tabs
│   ├── Info (détails projet)
│   ├── Tracks ← Interface Tracks contextuelle
│   └── Credits (track credits)
└── Actions
```

### Fonctionnalités
- ✅ Liste tracks du projet actuel uniquement
- ✅ Bouton "Ajouter Track" (projectId pré-rempli)
- ✅ CRUD inline (edit, delete)
- ✅ Drag & drop pour réordonner trackNumber
- ✅ Stats projet: total tracks, durée totale, status distribution

### Workflow Utilisateur
1. Créer un nouveau projet
2. Aller dans onglet "Tracks"
3. Ajouter tracks une par une
4. Réordonner avec drag & drop
5. Mettre à jour status (recording → mixing → mastering → completed)

### Données affichées
```
Table Tracks:
| # | Title | Duration | Status | BPM | Key | Actions |
|---|-------|----------|--------|-----|-----|---------|
| 1 | Song A | 3:45 | Mixing | 120 | Cm | Edit, Delete |
| 2 | Song B | 4:12 | Recording | 95 | G | Edit, Delete |
```

### Composants
```tsx
// packages/client/src/pages/Projects.tsx (principal)
import { ProjectTracks } from '@/components/ProjectTracks';

function ProjectDetail({ projectId }: { projectId: number }) {
  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="tracks">Tracks</TabsTrigger>
        <TabsTrigger value="credits">Credits</TabsTrigger>
      </TabsList>

      <TabsContent value="tracks">
        <ProjectTracks projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}
```

```tsx
// packages/client/src/components/ProjectTracks.tsx
export function ProjectTracks({ projectId }: { projectId: number }) {
  const { data: tracks } = trpc.projects.tracks.listByProject.useQuery({ projectId });

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3>Tracks ({tracks?.length || 0})</h3>
        <Button onClick={() => openCreateModal()}>
          <Plus /> Add Track
        </Button>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <TracksTable tracks={tracks} />
      </DndContext>
    </div>
  );
}
```

---

## 📊 Interface 2: Tracks.tsx (Vue Globale)

### Navigation
```
Sidebar → Tracks (page dédiée)
```

### UI Structure
```tsx
Tracks.tsx
├── Header
│   ├── Titre "Tracks"
│   ├── Stats globales (total, par status)
│   └── Bouton "Créer Track"
├── Filtres
│   ├── Dropdown "Projet" (filtre optionnel)
│   ├── Dropdown "Status" (all, recording, editing, mixing, mastering, completed)
│   └── SearchBar (recherche par titre)
└── Table Tracks (toutes les tracks, tous projets)
```

### Fonctionnalités
- ✅ Liste TOUTES les tracks (cross-projet)
- ✅ Colonne "Projet" visible (nom projet cliquable)
- ✅ Filtres: projet, status, recherche
- ✅ Stats globales: count par status, durée totale
- ✅ CRUD complet (create nécessite sélection projet)
- ✅ Tri: par projet, par status, par trackNumber
- ✅ Pagination (si > 50 tracks)

### Workflow Utilisateur
1. Ouvrir page Tracks.tsx
2. Voir toutes les tracks (tous projets)
3. Filtrer par status "mixing" → voir toutes les tracks en mixing
4. Identifier goulots d'étranglement production
5. Créer nouvelle track (sélectionner projet d'abord)

### Données affichées
```
Table Tracks:
| Projet | # | Title | Duration | Status | BPM | Key | Actions |
|--------|---|-------|----------|--------|-----|-----|---------|
| Album X | 1 | Song A | 3:45 | Mixing | 120 | Cm | View, Edit, Delete |
| EP Y | 1 | Song B | 4:12 | Recording | 95 | G | View, Edit, Delete |
| Single Z | 1 | Song C | 3:20 | Mastering | 128 | Am | View, Edit, Delete |
```

### Stats Globales (Header)
```tsx
<div className="grid grid-cols-5 gap-4 mb-6">
  <StatCard title="Total Tracks" value={totalTracks} />
  <StatCard title="Recording" value={recordingCount} color="yellow" />
  <StatCard title="Mixing" value={mixingCount} color="blue" />
  <StatCard title="Mastering" value={masteringCount} color="purple" />
  <StatCard title="Completed" value={completedCount} color="green" />
</div>
```

### Composants
```tsx
// packages/client/src/pages/Tracks.tsx
export function Tracks() {
  const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Query global (tous projets, tous tracks)
  const { data: allTracks } = trpc.projects.tracks.listAll.useQuery();

  // Query projects pour dropdown
  const { data: projects } = trpc.projects.list.useQuery();

  // Filtres client-side
  const filteredTracks = allTracks?.filter(track => {
    if (projectFilter !== 'all' && track.projectId !== projectFilter) return false;
    if (statusFilter !== 'all' && track.status !== statusFilter) return false;
    if (searchQuery && !track.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: allTracks?.length || 0,
    recording: allTracks?.filter(t => t.status === 'recording').length || 0,
    mixing: allTracks?.filter(t => t.status === 'mixing').length || 0,
    mastering: allTracks?.filter(t => t.status === 'mastering').length || 0,
    completed: allTracks?.filter(t => t.status === 'completed').length || 0,
  };

  return (
    <div className="p-6">
      {/* Stats Header */}
      <StatsHeader stats={stats} />

      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrer par projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les status</SelectItem>
            <SelectItem value="recording">Recording</SelectItem>
            <SelectItem value="editing">Editing</SelectItem>
            <SelectItem value="mixing">Mixing</SelectItem>
            <SelectItem value="mastering">Mastering</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Rechercher un titre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />

        <Button onClick={() => openCreateModal()}>
          <Plus /> Nouvelle Track
        </Button>
      </div>

      {/* Table */}
      <TracksTable tracks={filteredTracks} showProjectColumn={true} />
    </div>
  );
}
```

---

## 🔄 Router tRPC - Extensions Nécessaires

### État Actuel (projects.tracks)
```typescript
export const projectsRouter = router({
  tracks: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(/* ... */), // ✅ Existe

    create: protectedProcedure.mutation(/* ... */), // ✅ Existe
    update: protectedProcedure.mutation(/* ... */), // ✅ Existe
    delete: protectedProcedure.mutation(/* ... */), // ✅ Existe
  }),
});
```

### 🆕 Extension à ajouter (pour Tracks.tsx global)
```typescript
tracks: router({
  // Nouveau: Liste TOUTES les tracks (cross-projet)
  listAll: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(100),
      offset: z.number().min(0).default(0),
      projectId: z.number().optional(), // Filtre optionnel
      status: z.enum(['recording', 'editing', 'mixing', 'mastering', 'completed']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getContextDb(ctx);

      let query = db.select().from(tracks);

      if (input.projectId) {
        query = query.where(eq(tracks.projectId, input.projectId));
      }

      if (input.status) {
        query = query.where(eq(tracks.status, input.status));
      }

      return await query
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(tracks.projectId, tracks.trackNumber);
    }),

  // Nouveau: Stats globales
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getContextDb(ctx);
      const allTracks = await db.select().from(tracks);

      return {
        total: allTracks.length,
        byStatus: {
          recording: allTracks.filter(t => t.status === 'recording').length,
          editing: allTracks.filter(t => t.status === 'editing').length,
          mixing: allTracks.filter(t => t.status === 'mixing').length,
          mastering: allTracks.filter(t => t.status === 'mastering').length,
          completed: allTracks.filter(t => t.status === 'completed').length,
        },
        totalDuration: allTracks.reduce((sum, t) => sum + (t.duration || 0), 0),
      };
    }),

  // Existing endpoints
  listByProject: /* ... */,
  create: /* ... */,
  update: /* ... */,
  delete: /* ... */,
}),
```

---

## 📦 Composants Partagés

### TracksTable.tsx (Réutilisable)
```tsx
// packages/client/src/components/TracksTable.tsx
interface TracksTableProps {
  tracks: Track[];
  showProjectColumn?: boolean; // true pour Tracks.tsx, false pour ProjectTracks
  onEdit?: (track: Track) => void;
  onDelete?: (trackId: number) => void;
}

export function TracksTable({ tracks, showProjectColumn = false, onEdit, onDelete }: TracksTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showProjectColumn && <TableHead>Projet</TableHead>}
          <TableHead>#</TableHead>
          <TableHead>Titre</TableHead>
          <TableHead>Durée</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>BPM</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tracks?.map(track => (
          <TableRow key={track.id}>
            {showProjectColumn && (
              <TableCell>
                <Link to={`/projects/${track.projectId}`}>
                  {track.project?.title}
                </Link>
              </TableCell>
            )}
            <TableCell>{track.trackNumber}</TableCell>
            <TableCell>{track.title}</TableCell>
            <TableCell>{formatDuration(track.duration)}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(track.status)}>
                {track.status}
              </Badge>
            </TableCell>
            <TableCell>{track.bpm}</TableCell>
            <TableCell>{track.key}</TableCell>
            <TableCell>
              <Button size="sm" onClick={() => onEdit?.(track)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete?.(track.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### TrackFormModal.tsx (Réutilisable)
```tsx
// packages/client/src/components/TrackFormModal.tsx
interface TrackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  track?: Track; // undefined = création, defined = édition
  preselectedProjectId?: number; // Pour Projects.tsx
  showProjectSelector?: boolean; // true pour Tracks.tsx
}

export function TrackFormModal({ isOpen, onClose, track, preselectedProjectId, showProjectSelector = false }: TrackFormModalProps) {
  const form = useForm({
    defaultValues: {
      projectId: preselectedProjectId || track?.projectId,
      title: track?.title || '',
      trackNumber: track?.trackNumber || 1,
      duration: track?.duration || 0,
      status: track?.status || 'recording',
      bpm: track?.bpm || null,
      key: track?.key || null,
      // ...
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{track ? 'Modifier' : 'Nouvelle'} Track</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          {/* Sélecteur projet (seulement si showProjectSelector=true) */}
          {showProjectSelector && (
            <FormField name="projectId" render={/* ... */} />
          )}

          <FormField name="title" /* ... */ />
          <FormField name="trackNumber" /* ... */ />
          <FormField name="duration" /* ... */ />
          <FormField name="status" /* ... */ />
          {/* ... autres champs ... */}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🎨 Sidebar Navigation

```tsx
// packages/client/src/components/layout/Sidebar.tsx
const navigationItems = [
  // ... autres items ...

  {
    title: 'Projects',
    path: '/projects',
    icon: FolderOpen,
  },
  {
    title: 'Tracks', // 🆕 Nouvelle entrée
    path: '/tracks',
    icon: Music, // ou Music2
  },

  // ... autres items ...
];
```

---

## ✅ Checklist Implémentation

### Backend
- [ ] Ajouter `projects.tracks.listAll` endpoint
- [ ] Ajouter `projects.tracks.getStats` endpoint
- [ ] Tests unitaires nouveaux endpoints

### Frontend - Composants Partagés
- [ ] Créer `TracksTable.tsx` (réutilisable)
- [ ] Créer `TrackFormModal.tsx` (réutilisable)
- [ ] Créer `StatsHeader.tsx` (pour Tracks.tsx)

### Frontend - Projects.tsx
- [ ] Ajouter onglet "Tracks" dans ProjectDetail
- [ ] Créer composant `ProjectTracks.tsx`
- [ ] Implémenter drag & drop réordonnancement
- [ ] Intégrer `TrackFormModal` (projectId pré-rempli)

### Frontend - Tracks.tsx
- [ ] Créer page `Tracks.tsx`
- [ ] Filtres: projet, status, recherche
- [ ] Stats globales header
- [ ] Intégrer `TracksTable` avec colonne projet
- [ ] Intégrer `TrackFormModal` (avec sélecteur projet)

### Navigation
- [ ] Ajouter route `/tracks` dans App.tsx
- [ ] Ajouter item Sidebar "Tracks"
- [ ] Tester navigation Projects ↔ Tracks

---

**Total estimation:** 4-5h
- Backend: 1h (2 endpoints + tests)
- Composants partagés: 1h
- Projects.tsx onglet: 1h
- Tracks.tsx page: 1.5h
- Navigation + tests: 0.5h
