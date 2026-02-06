# Chatbot UI Display - AIAssistant Component

## File Location
`packages/client/src/components/AIAssistant.tsx`

## Modes d'affichage

### 1. Mode Docked (par défaut)
- Position: fixé à droite (`fixed right-0 top-0 bottom-0`)
- Largeur ouverte: `w-96` (384px)
- Largeur minimisée: `w-16` (64px)
- Border gauche: `border-l border-border`
- Background: `bg-card`

### 2. Mode Floating (fenêtre flottante)
- Position: libre, draggable
- Taille initiale: 384×500px
- Taille minimum: 300×300px
- Styles: `border rounded-lg shadow-2xl z-50`
- Draggable via le header
- Resizable via handle en bas à droite

### 3. Mode Fullscreen (plein écran)
- Disponible uniquement en mode floating
- Couvre tout le viewport: `fixed inset-0 z-50 border-0 rounded-none`

## Structure du composant

### Header
```
┌──────────────────────────────────────┐
│ 🤖 AI Assistant    [⛶] [↗] [−]     │
│                    full float min     │
└──────────────────────────────────────┘
```
- Icône Bot (lucide) + texte "AI Assistant"
- Boutons (selon mode):
  - Fullscreen (Maximize) - visible seulement en floating, non minimisé
  - Float/Dock (ExternalLink) - visible seulement non minimisé
  - Minimize/Maximize (Minimize2/Maximize2) - visible seulement en docked
- Header draggable en mode floating
- Classes: `flex items-center justify-between p-4 border-b border-border shrink-0`

### Zone Messages (quand non minimisé)
```
┌──────────────────────────────────────┐
│                                      │
│      🤖 (grand, gris)               │
│      AI Assistant                    │
│      "Posez-moi une question..."     │
│      Exemples: "Crée une facture..." │
│                                      │
└──────────────────────────────────────┘
```
- Empty state: Bot icon h-16 w-16, titre, description, exemples
- Classes container: `flex-1 overflow-y-auto p-4 space-y-4`

### Messages
- **User messages:** alignés à droite (`justify-end`)
  - Bulle: `bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]`
  - Pas d'avatar
- **Assistant messages:** alignés à gauche (`justify-start`)
  - Avatar: Bot icon `h-6 w-6 text-primary`
  - Bulle: `bg-muted rounded-lg px-4 py-2 max-w-[80%]`
- **Timestamp:** `text-xs opacity-50 mt-1` format fr-FR (HH:mm)
- **Contenu:** `text-sm whitespace-pre-wrap`

### Loading indicator (3 dots bounce)
```
🤖 ● ● ●  (animation bounce décalée)
```
- 3 dots: `w-2 h-2 bg-primary rounded-full animate-bounce`
- Delays: 0ms, 150ms, 300ms
- Dans une bulle `bg-muted rounded-lg px-4 py-2`

### Zone Input
```
┌──────────────────────────────────────┐
│ [Tapez votre message...       ] [➤] │
└──────────────────────────────────────┘
```
- Classes container: `border-t border-border p-4 shrink-0`
- Layout: `flex gap-2`
- Input: autoFocus, placeholder "Tapez votre message...", `flex-1`
- Bouton Send: `size="icon"`, icône Send h-4 w-4
- Désactivé si input vide ou isLoading
- Enter envoie (Shift+Enter ne bloque pas)

### Resize Handle (floating mode uniquement)
- Position: `absolute bottom-0 right-0 w-4 h-4`
- SVG diagonal lines (3 lignes)
- Cursor: `cursor-nwse-resize`
- Opacité: 50% → 100% au hover

## Context Provider (ChatbotContext.tsx)

### États gérés
- `isOpen`: synchronisé avec AssistantContext
- `isMinimized`: boolean
- `isFloating`: boolean

### getChatbotWidth()
- Fermé: 0px
- Flottant: 0px (ne pousse pas le contenu)
- Minimisé: 64px (w-16)
- Ouvert docked: 384px (w-96)

## Logique de visibilité
- Invisible si `!assistantOpen || !isOpen`
- Le toggle principal est dans AssistantContext (persisté en localStorage)
- ChatbotContext se synchronise avec AssistantContext

## Communication Backend
- Mutation: `trpc.ai.chat.useMutation()`
- Query history: `utils.ai.getHistory.fetch({ sessionId })`
- SessionId persisté en localStorage (`chatbot_sessionId`)
- Invalidation automatique des caches tRPC après actions AI

## Couleurs et Thème
- Background: `bg-card` (variable CSS theme)
- Borders: `border-border`
- Bot icon: `text-primary`
- User bubble: `bg-primary text-primary-foreground`
- Assistant bubble: `bg-muted`
- Loading dots: `bg-primary`
- Empty state icon: `text-muted-foreground`

## Icônes utilisées (lucide-react)
- `Bot` - avatar assistant + empty state
- `Minimize2` - réduire (docked)
- `Maximize2` - agrandir (docked)
- `ExternalLink` - toggle floating
- `Maximize` - toggle fullscreen
- `Send` - bouton envoi
