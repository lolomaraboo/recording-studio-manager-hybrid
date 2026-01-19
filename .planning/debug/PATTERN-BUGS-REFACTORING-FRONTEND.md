# Pattern Critique: Bugs de Refactoring Frontend (Non-DB)

**Date découverte:** 2026-01-18
**Phases affectées:** 20.1, 21, 21.1, 22

## ⚠️ FAUSSE PISTE RÉCURRENTE

Quand une page crash après une phase de refactoring:

**❌ NE PAS VÉRIFIER EN PREMIER:**
- Migrations base de données
- Colonnes manquantes dans tenant_X
- Créer un nouveau tenant (tenant_4, tenant_5, etc.)

**✅ VÉRIFIER EN PREMIER:**
- Props manquants dans les composants refactorés
- Interface TypeScript vs props réellement passés
- Accès à des propriétés d'objets undefined

## Symptômes Typiques

```
TypeError: Cannot read properties of undefined (reading 'artistName')
TypeError: Cannot read properties of undefined (reading 'X')
```

**Apparence:** Page blanche, composant ne se charge pas

## Pattern Découvert

### Phase 22 (exemple type)

**Symptôme:**
```javascript
TypeError: Cannot read properties of undefined (reading 'artistName')
at ClientDetailTabs.tsx:413
```

**Première réaction (FAUSSE):**
- "tenant_3 n'a pas les colonnes musicales"
- Vérifier `\d clients` dans PostgreSQL
- Créer tenant_4, tenant_5...

**Vraie cause:**
- `ClientDetail.tsx` (ligne 162) ne passait QUE 3 props
- `ClientDetailTabs` nécessitait 12 props (interface ligne 25-37)
- Prop `client` manquante → `client.artistName` = crash
- **tenant_3 AVAIT DÉJÀ toutes les colonnes**

**Fix:** Ajouter les 9 props manquants (3 minutes avec gsd:debug)

### Phases Précédentes

**Phase 20.1, 21, 21.1:** Même pattern
- Refactoring UI retire des props
- Components enfants crashent
- Base de données CORRECTE
- Temps perdu: plusieurs heures à vérifier migrations

## Workflow Correct

1. **Symptôme:** Crash frontend TypeError undefined
2. **Action 1:** Lire le fichier source du crash (ex: ClientDetailTabs.tsx:413)
3. **Action 2:** Vérifier interface du composant (props requis)
4. **Action 3:** Vérifier composant parent (props passés)
5. **Action 4:** Comparer → identifier props manquants
6. **Fix:** Ajouter props manquants
7. **Temps:** 3-5 minutes

## Workflow Incorrect (À ÉVITER)

1. ~~Symptôme: Crash frontend~~
2. ~~Vérifier migrations DB~~ ← PERTE DE TEMPS
3. ~~Vérifier colonnes PostgreSQL~~ ← PERTE DE TEMPS
4. ~~Créer nouveau tenant~~ ← PERTE DE TEMPS
5. ~~Débugger migrations~~ ← PERTE DE TEMPS
6. **Temps perdu:** 1-3 heures

## Outil Recommandé

**gsd:debug** identifie rapidement:
- Props manquants
- Interface vs usage
- Root cause en quelques minutes

## Conclusion

**RÈGLE D'OR:** Crash frontend après refactoring = VÉRIFIER LES PROPS D'ABORD, pas la DB.

Les migrations DB sont rarement la cause si:
- Le schema TypeScript compile sans erreur
- Le backend démarre sans erreur
- L'erreur est `Cannot read properties of undefined`

---

**Rappel documenté le:** 2026-01-18
**Par:** User request explicite
**Économie de temps future:** 1-3 heures par occurrence
