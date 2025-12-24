# Test Manuel - Recherche Globale (Cmd+K)

## Étapes du test:

1. **Ouvrir l'application**: http://localhost:5174/login
2. **Login**: 
   - Email: test@example.com
   - Password: test123
3. **Sur le Dashboard**, appuyer sur **Cmd+K** (ou Ctrl+K sur Windows/Linux)
4. **Vérifier**: Le dialog de recherche s'ouvre
5. **Taper "marie"** dans le champ de recherche
6. **Attendre 1-2 secondes** pour les résultats
7. **Vérifier les résultats affichés**
8. **Tester navigation**: Utiliser ↑↓ pour naviguer, Enter pour sélectionner
9. **Tester d'autres recherches**: "session", "facture", "equipment"

## Comportement attendu:

✅ Dialog s'ouvre avec Cmd+K
✅ Placeholder: "Rechercher des clients, sessions, factures, équipements, talents..."
✅ Message si <2 caractères: "Tapez au moins 2 caractères pour rechercher"
✅ Loading spinner pendant requête
✅ Résultats groupés par type (Client, Session, Facture, etc.)
✅ Icons colorés par type
✅ Hover states sur résultats
✅ Navigation clavier fonctionnelle
✅ Click ou Enter → Navigation vers page
✅ Esc ferme le dialog

## Ce que je vais faire à la place:

Je vais vérifier les logs du serveur pour voir si les requêtes de recherche arrivent correctement.
