import type { ToolDefinition } from "./llmProvider";

/**
 * AI Tools Definitions
 *
 * Function calling schemas for Claude/GPT-4.
 * Defines 37+ tools that the AI can use to interact with the studio management system.
 *
 * Phase 2.2: Complete tool definitions
 */

export const AI_TOOLS: ToolDefinition[] = [
  // ============================================================================
  // SESSIONS TOOLS (5)
  // ============================================================================
  {
    name: "get_upcoming_sessions",
    description:
      "Récupère UNIQUEMENT les sessions d'enregistrement À VENIR (à partir d'aujourd'hui). Peut filtrer par plage de dates et par salle. NE PAS utiliser pour compter les sessions passées ou le total d'une année : utiliser count_sessions ou get_sessions pour cela.",
    input_schema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Date de début au format YYYY-MM-DD (optionnel)",
        },
        end_date: {
          type: "string",
          description: "Date de fin au format YYYY-MM-DD (optionnel)",
        },
        room_id: {
          type: "number",
          description: "ID de la salle pour filtrer (optionnel)",
        },
      },
    },
  },
  {
    name: "get_sessions",
    description:
      "Récupère les sessions sur une période (PASSÉES et/ou futures), avec filtres date, statut et client. À utiliser pour lister ou compter des sessions déjà réalisées (ex: 'quelles sessions en juin', 'mes sessions cette année'). Différent de get_upcoming_sessions qui privilégie les sessions à venir.",
    input_schema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Date de début YYYY-MM-DD (optionnel)" },
        end_date: { type: "string", description: "Date de fin YYYY-MM-DD (optionnel)" },
        status: {
          type: "string",
          description: "Filtre statut: scheduled, in_progress, completed, cancelled (optionnel)",
        },
        client_id: { type: "number", description: "Filtrer par client (optionnel)" },
        limit: { type: "number", description: "Nombre max de résultats (défaut 100)" },
      },
    },
  },
  {
    name: "count_sessions",
    description:
      "Compte les sessions sur une période donnée, avec ventilation par statut. À utiliser pour répondre aux questions du type 'combien de sessions ai-je faites cette année / ce mois / au total'.",
    input_schema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Date de début YYYY-MM-DD (optionnel)" },
        end_date: { type: "string", description: "Date de fin YYYY-MM-DD (optionnel)" },
        client_id: { type: "number", description: "Filtrer par client (optionnel)" },
      },
    },
  },
  {
    name: "get_session_details",
    description: "Récupère les détails complets d'une session spécifique par son ID.",
    input_schema: {
      type: "object",
      properties: {
        session_id: {
          type: "number",
          description: "ID de la session à récupérer",
        },
      },
      required: ["session_id"],
    },
  },
  {
    name: "create_session",
    description: "Crée une nouvelle session d'enregistrement avec un client et une salle.",
    input_schema: {
      type: "object",
      properties: {
        client_id: {
          type: "number",
          description: "ID du client pour cette session",
        },
        room_id: {
          type: "number",
          description: "ID de la salle à réserver",
        },
        title: {
          type: "string",
          description: "Titre de la session",
        },
        start_time: {
          type: "string",
          description: "Heure de début (ISO 8601: YYYY-MM-DDTHH:mm:ss)",
        },
        end_time: {
          type: "string",
          description: "Heure de fin (ISO 8601: YYYY-MM-DDTHH:mm:ss)",
        },
        description: {
          type: "string",
          description: "Description optionnelle de la session",
        },
      },
      required: ["client_id", "room_id", "title", "start_time", "end_time"],
    },
  },
  {
    name: "update_session",
    description: "Met à jour une session existante (titre, horaires, statut). Peut résoudre la session par son titre.",
    input_schema: {
      type: "object",
      properties: {
        session_id: {
          type: "number",
          description: "ID de la session à modifier (optionnel si session_title fourni)",
        },
        session_title: {
          type: "string",
          description: "Titre de la session à modifier (recherche partielle). Alternative à session_id.",
        },
        title: {
          type: "string",
          description: "Nouveau titre (optionnel)",
        },
        start_time: {
          type: "string",
          description: "Nouvelle heure de début (optionnel)",
        },
        end_time: {
          type: "string",
          description: "Nouvelle heure de fin (optionnel)",
        },
        status: {
          type: "string",
          description: "Nouveau statut: scheduled, in_progress, completed, cancelled (optionnel)",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_session",
    description: "Supprime une session d'enregistrement. Peut résoudre la session par son titre.",
    input_schema: {
      type: "object",
      properties: {
        session_id: {
          type: "number",
          description: "ID de la session à supprimer (optionnel si session_title fourni)",
        },
        session_title: {
          type: "string",
          description: "Titre de la session à supprimer (recherche partielle). Alternative à session_id.",
        },
      },
      required: [],
    },
  },

  // ============================================================================
  // CLIENTS TOOLS (8)
  // ============================================================================
  {
    name: "get_all_clients",
    description: "Récupère la liste de tous les clients actifs. Peut filtrer par statut VIP.",
    input_schema: {
      type: "object",
      properties: {
        is_vip: {
          type: "boolean",
          description: "Filtrer par clients VIP uniquement (optionnel)",
        },
        limit: {
          type: "number",
          description: "Nombre maximum de résultats (défaut: 50)",
        },
      },
    },
  },
  {
    name: "get_client_info",
    description: "Récupère les informations détaillées d'un client spécifique.",
    input_schema: {
      type: "object",
      properties: {
        client_id: {
          type: "number",
          description: "ID du client",
        },
      },
      required: ["client_id"],
    },
  },
  {
    name: "create_client",
    description: "Crée un nouveau client dans le système.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nom complet du client",
        },
        email: {
          type: "string",
          description: "Email du client (optionnel)",
        },
        phone: {
          type: "string",
          description: "Téléphone du client (optionnel)",
        },
        type: {
          type: "string",
          description: "Type de client: individual ou company (défaut: individual)",
        },
        is_vip: {
          type: "boolean",
          description: "Marquer comme client VIP (défaut: false)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "update_client",
    description: "Met à jour les informations d'un client existant.",
    input_schema: {
      type: "object",
      properties: {
        client_id: {
          type: "number",
          description: "ID du client à modifier",
        },
        client_name: {
          type: "string",
          description: "Nom du client. Alternative à client_id pour identifier le client par son nom.",
        },
        name: {
          type: "string",
          description: "Nouveau nom (optionnel)",
        },
        email: {
          type: "string",
          description: "Nouvel email (optionnel)",
        },
        phone: {
          type: "string",
          description: "Nouveau téléphone (optionnel)",
        },
        is_vip: {
          type: "boolean",
          description: "Nouveau statut VIP (optionnel)",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_client",
    description: "Désactive un client (soft delete).",
    input_schema: {
      type: "object",
      properties: {
        client_id: {
          type: "number",
          description: "ID du client à supprimer",
        },
        client_name: {
          type: "string",
          description: "Nom du client. Alternative à client_id pour identifier le client par son nom.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_client_notes",
    description: "Récupère l'historique daté des notes pour un client spécifique. Retourne les notes en ordre chronologique inversé (plus récentes d'abord).",
    input_schema: {
      type: "object",
      properties: {
        client_id: {
          type: "number",
          description: "ID du client",
        },
        limit: {
          type: "number",
          description: "Nombre maximum de notes à retourner (défaut: 10)",
        },
      },
      required: ["client_id"],
    },
  },
  {
    name: "add_client_note",
    description: "Ajoute une nouvelle note datée pour un client. La note sera horodatée automatiquement.",
    input_schema: {
      type: "object",
      properties: {
        client_id: {
          type: "number",
          description: "ID du client",
        },
        note: {
          type: "string",
          description: "Contenu de la note (max 2000 caractères)",
        },
      },
      required: ["client_id", "note"],
    },
  },
  {
    name: "delete_client_note",
    description: "Supprime une note spécifique par son ID.",
    input_schema: {
      type: "object",
      properties: {
        note_id: {
          type: "number",
          description: "ID de la note à supprimer",
        },
      },
      required: ["note_id"],
    },
  },

  // ============================================================================
  // ANALYTICS TOOLS (5)
  // ============================================================================
  {
    name: "get_studio_context",
    description:
      "Récupère un aperçu global du studio: nombre de clients, sessions, projets actifs.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_revenue_forecast",
    description:
      "Calcule les prévisions de revenus basées sur les sessions planifiées pour les prochains mois.",
    input_schema: {
      type: "object",
      properties: {
        months: {
          type: "number",
          description: "Nombre de mois à prévoir (défaut: 3)",
        },
      },
    },
  },
  {
    name: "get_revenue_summary",
    description: "Résumé des revenus sur une période donnée (basé sur les factures).",
    input_schema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Date de début (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          description: "Date de fin (YYYY-MM-DD)",
        },
      },
    },
  },
  {
    name: "get_client_360_view",
    description:
      "Vue complète à 360° d'un client: infos, sessions, factures, projets associés.",
    input_schema: {
      type: "object",
      properties: {
        client_id: {
          type: "number",
          description: "ID du client",
        },
      },
      required: ["client_id"],
    },
  },
  {
    name: "create_session_checklist",
    description: "Génère une checklist de préparation pour une session spécifique.",
    input_schema: {
      type: "object",
      properties: {
        session_id: {
          type: "number",
          description: "ID de la session",
        },
      },
      required: ["session_id"],
    },
  },

  // ============================================================================
  // INVOICES TOOLS (6)
  // ============================================================================
  {
    name: "get_all_invoices",
    description: "Récupère la liste des factures. Peut filtrer par statut.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filtrer par statut: draft, sent, paid, overdue, cancelled",
        },
        limit: {
          type: "number",
          description: "Nombre maximum de résultats (défaut: 50)",
        },
      },
    },
  },
  {
    name: "get_invoice_details",
    description: "Récupère les détails complets d'une facture spécifique, y compris toutes ses lignes (items) et le client associé.",
    input_schema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "number",
          description: "ID de la facture",
        },
        invoice_number: {
          type: "string",
          description: "Numéro de facture (ex: INV-2025-001). Utilisé si invoice_id n'est pas fourni.",
        },
      },
    },
  },
  {
    name: "create_invoice",
    description: "Crée une nouvelle facture pour un client avec calcul automatique des taxes.",
    input_schema: {
      type: "object",
      properties: {
        client_id: {
          type: "number",
          description: "ID du client",
        },
        invoice_number: {
          type: "string",
          description: "Numéro de facture unique (ex: INV-2025-001)",
        },
        issue_date: {
          type: "string",
          description: "Date d'émission (ISO 8601: YYYY-MM-DD)",
        },
        due_date: {
          type: "string",
          description: "Date d'échéance (ISO 8601: YYYY-MM-DD)",
        },
        subtotal: {
          type: "number",
          description: "Montant HT en euros",
        },
        tax_rate: {
          type: "number",
          description: "Taux de TVA en pourcentage (défaut: 20.0)",
        },
        notes: {
          type: "string",
          description: "Notes optionnelles pour la facture",
        },
        items: {
          type: "array",
          description: "Lignes de facturation (optionnel). Si fourni, le subtotal est calculé automatiquement depuis les lignes.",
          items: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Description de la ligne",
              },
              quantity: {
                type: "number",
                description: "Quantité (défaut: 1)",
              },
              unit_price: {
                type: "number",
                description: "Prix unitaire HT en euros",
              },
              tax_rate: {
                type: "number",
                description: "Taux de TVA pour cette ligne en % (défaut: 20)",
              },
            },
            required: ["description", "unit_price"],
          },
        },
      },
      required: ["client_id", "invoice_number", "issue_date", "due_date", "subtotal"],
    },
  },
  {
    name: "update_invoice",
    description: "Met à jour une facture existante (statut, dates, notes). Pour modifier les lignes, utiliser update_invoice_item. Si 'items' est fourni, TOUTES les anciennes lignes sont remplacées par les nouvelles.",
    input_schema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "number",
          description: "ID numérique de la facture",
        },
        invoice_number: {
          type: "string",
          description: "Numéro de facture (ex: INV-xxx). Alternative à invoice_id.",
        },
        status: {
          type: "string",
          description: "Nouveau statut: draft, sent, paid, overdue, cancelled",
        },
        issue_date: {
          type: "string",
          description: "Nouvelle date d'émission (ISO 8601: YYYY-MM-DD)",
        },
        due_date: {
          type: "string",
          description: "Nouvelle date d'échéance (ISO 8601: YYYY-MM-DD)",
        },
        notes: {
          type: "string",
          description: "Notes à ajouter ou modifier",
        },
        paid_at: {
          type: "string",
          description: "Date de paiement (ISO 8601: YYYY-MM-DD) - marque comme payée",
        },
        items: {
          type: "array",
          description: "ATTENTION: REMPLACE toutes les lignes existantes. Pour modifier une seule ligne, utiliser update_invoice_item à la place.",
          items: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Description de la ligne",
              },
              quantity: {
                type: "number",
                description: "Quantité (défaut: 1)",
              },
              unit_price: {
                type: "number",
                description: "Prix unitaire HT en euros",
              },
              tax_rate: {
                type: "number",
                description: "Taux de TVA pour cette ligne en % (défaut: 20)",
              },
            },
            required: ["description", "unit_price"],
          },
        },
      },
      required: [],
    },
  },
  {
    name: "update_invoice_item",
    description: "Modifie une ligne spécifique d'une facture (quantité, prix unitaire, description). Recalcule automatiquement les totaux de la facture. Utiliser ce tool pour modifier une seule ligne sans toucher aux autres.",
    input_schema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "number",
          description: "ID numérique de la facture",
        },
        invoice_number: {
          type: "string",
          description: "Numéro de facture (ex: INV-xxx). Alternative à invoice_id.",
        },
        item_id: {
          type: "number",
          description: "ID de la ligne à modifier (obtenu via get_invoice_details)",
        },
        item_description: {
          type: "string",
          description: "Texte de description de la ligne à modifier (recherche partielle). Alternative à item_id.",
        },
        quantity: {
          type: "number",
          description: "Nouvelle quantité",
        },
        unit_price: {
          type: "number",
          description: "Nouveau prix unitaire HT",
        },
        description: {
          type: "string",
          description: "Nouvelle description de la ligne",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_invoice",
    description: "Supprime une facture. Peut résoudre la facture par son numéro.",
    input_schema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "number",
          description: "ID de la facture (optionnel si invoice_number fourni)",
        },
        invoice_number: {
          type: "string",
          description: "Numéro de facture (ex: INV-xxx). Alternative à invoice_id.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_invoice_summary",
    description: "Résumé financier des factures avec statistiques détaillées (revenus, payées, impayées, en retard).",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Période d'analyse: 'month' (dernier mois) ou 'year' (dernière année). Défaut: month",
        },
      },
    },
  },

  // ============================================================================
  // QUOTES TOOLS (6)
  // ============================================================================
  {
    name: "get_all_quotes",
    description: "Récupère la liste des devis.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filtrer par statut: draft, sent, accepted, rejected, expired",
        },
        limit: {
          type: "number",
          description: "Nombre maximum de résultats",
        },
      },
    },
  },
  {
    name: "get_quote_details",
    description: "Récupère les détails complets d'un devis spécifique, y compris toutes ses lignes (items) et le client associé.",
    input_schema: {
      type: "object",
      properties: {
        quote_id: {
          type: "number",
          description: "ID du devis",
        },
        quote_number: {
          type: "string",
          description: "Numéro de devis (ex: QT-2025-001). Utilisé si quote_id n'est pas fourni.",
        },
      },
    },
  },
  {
    name: "create_quote",
    description: "Crée un nouveau devis avec calcul automatique des taxes et date de validité. Si des items sont fournis, le subtotal est calculé automatiquement.",
    input_schema: {
      type: "object",
      properties: {
        client_id: {
          type: "number",
          description: "ID du client",
        },
        quote_number: {
          type: "string",
          description: "Numéro de devis unique (ex: QT-2025-001)",
        },
        valid_until: {
          type: "string",
          description: "Date d'expiration du devis (ISO 8601: YYYY-MM-DD)",
        },
        subtotal: {
          type: "number",
          description: "Montant HT en euros (ignoré si items fournis, car calculé automatiquement)",
        },
        tax_rate: {
          type: "number",
          description: "Taux de TVA en pourcentage (défaut: 20.0). Utilisé uniquement si pas d'items avec tax_rate individuel.",
        },
        title: {
          type: "string",
          description: "Titre du devis",
        },
        description: {
          type: "string",
          description: "Description détaillée du devis",
        },
        project_id: {
          type: "number",
          description: "ID du projet associé (optionnel)",
        },
        items: {
          type: "array",
          description: "Lignes du devis. Si fourni, les totaux sont calculés automatiquement.",
          items: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Description de la prestation",
              },
              quantity: {
                type: "number",
                description: "Quantité (défaut: 1)",
              },
              unit_price: {
                type: "number",
                description: "Prix unitaire HT en euros",
              },
              tax_rate: {
                type: "number",
                description: "Taux de TVA pour cette ligne en % (défaut: 20)",
              },
            },
            required: ["description", "unit_price"],
          },
        },
      },
      required: ["client_id", "quote_number", "valid_until"],
    },
  },
  {
    name: "update_quote",
    description: "Met à jour un devis existant. Peut modifier le statut, les dates, les notes, ET les lignes (items). Si 'items' est fourni, les anciennes lignes sont remplacées et les totaux recalculés.",
    input_schema: {
      type: "object",
      properties: {
        quote_id: {
          type: "number",
          description: "ID du devis à modifier",
        },
        quote_number: {
          type: "string",
          description: "Numéro du devis (ex: QT-2025-001). Alternative à quote_id.",
        },
        status: {
          type: "string",
          description: "Nouveau statut: draft, sent, accepted, rejected, expired, converted",
        },
        valid_until: {
          type: "string",
          description: "Nouvelle date d'expiration (ISO 8601: YYYY-MM-DD)",
        },
        title: {
          type: "string",
          description: "Nouveau titre",
        },
        description: {
          type: "string",
          description: "Nouvelle description",
        },
        notes: {
          type: "string",
          description: "Notes client",
        },
        items: {
          type: "array",
          description: "Nouvelles lignes du devis. REMPLACE toutes les lignes existantes. Les totaux sont recalculés automatiquement.",
          items: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Description de la prestation",
              },
              quantity: {
                type: "number",
                description: "Quantité (défaut: 1)",
              },
              unit_price: {
                type: "number",
                description: "Prix unitaire HT en euros",
              },
              tax_rate: {
                type: "number",
                description: "Taux de TVA pour cette ligne en % (défaut: 20)",
              },
            },
            required: ["description", "unit_price"],
          },
        },
      },
      required: [],
    },
  },
  {
    name: "delete_quote",
    description: "Supprime un devis.",
    input_schema: {
      type: "object",
      properties: {
        quote_id: {
          type: "number",
          description: "ID du devis",
        },
        quote_number: {
          type: "string",
          description: "Numéro du devis (ex: QT-2025-001). Alternative à quote_id.",
        },
      },
      required: [],
    },
  },
  {
    name: "convert_quote_to_invoice",
    description: "Convertit un devis accepté en facture.",
    input_schema: {
      type: "object",
      properties: {
        quote_id: {
          type: "number",
          description: "ID du devis à convertir",
        },
      },
      required: ["quote_id"],
    },
  },

  // ============================================================================
  // ROOMS TOOLS (3)
  // ============================================================================
  {
    name: "get_all_rooms",
    description: "Récupère la liste de toutes les salles du studio.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_room",
    description: "Crée une nouvelle salle de studio avec tarifs horaires et capacité.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nom de la salle (ex: Studio A, Salle de Mixage)",
        },
        type: {
          type: "string",
          description: "Type de salle: recording, mixing, mastering, rehearsal, live. Défaut: recording",
        },
        hourly_rate: {
          type: "number",
          description: "Tarif horaire en euros (requis)",
        },
        half_day_rate: {
          type: "number",
          description: "Tarif demi-journée en euros (optionnel)",
        },
        full_day_rate: {
          type: "number",
          description: "Tarif journée complète en euros (optionnel)",
        },
        capacity: {
          type: "number",
          description: "Capacité d'accueil (nombre de personnes). Défaut: 1",
        },
        description: {
          type: "string",
          description: "Description de la salle et ses équipements",
        },
      },
      required: ["name", "hourly_rate"],
    },
  },
  {
    name: "update_room",
    description: "Met à jour une salle existante (tarifs, disponibilité, description).",
    input_schema: {
      type: "object",
      properties: {
        room_id: {
          type: "number",
          description: "ID de la salle à modifier",
        },
        name: {
          type: "string",
          description: "Nouveau nom de la salle",
        },
        hourly_rate: {
          type: "number",
          description: "Nouveau tarif horaire en euros",
        },
        is_active: {
          type: "boolean",
          description: "Activer/désactiver la salle",
        },
        is_available_for_booking: {
          type: "boolean",
          description: "Disponible pour réservation",
        },
        description: {
          type: "string",
          description: "Nouvelle description",
        },
      },
      required: ["room_id"],
    },
  },

  // ============================================================================
  // EQUIPMENT TOOLS (3)
  // ============================================================================
  {
    name: "get_all_equipment",
    description: "Récupère la liste de tout l'équipement du studio.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_equipment",
    description: "Ajoute un nouvel équipement au studio (microphones, préamps, instruments, etc.).",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nom de l'équipement (ex: Neumann U87, SSL G-Series Compressor)",
        },
        category: {
          type: "string",
          description: "Catégorie: microphone, preamp, interface, outboard, instrument, monitoring, computer, cable, accessory, other",
        },
        brand: {
          type: "string",
          description: "Marque (ex: Neumann, SSL, Shure)",
        },
        model: {
          type: "string",
          description: "Modèle (ex: U87 Ai, G-Series)",
        },
        room_id: {
          type: "number",
          description: "ID de la salle où est installé l'équipement (optionnel)",
        },
        status: {
          type: "string",
          description: "Statut: operational, maintenance, out_of_service, rented. Défaut: operational",
        },
        description: {
          type: "string",
          description: "Description et spécifications techniques",
        },
      },
      required: ["name", "category"],
    },
  },
  {
    name: "update_equipment",
    description: "Met à jour un équipement existant (statut, condition, localisation).",
    input_schema: {
      type: "object",
      properties: {
        equipment_id: {
          type: "number",
          description: "ID de l'équipement à modifier",
        },
        name: {
          type: "string",
          description: "Nouveau nom",
        },
        status: {
          type: "string",
          description: "Nouveau statut: operational, maintenance, out_of_service, rented",
        },
        condition: {
          type: "string",
          description: "Condition: excellent, good, fair, poor",
        },
        is_available: {
          type: "boolean",
          description: "Disponible pour utilisation",
        },
        room_id: {
          type: "number",
          description: "Déplacer vers une autre salle",
        },
        description: {
          type: "string",
          description: "Nouvelle description",
        },
      },
      required: ["equipment_id"],
    },
  },

  // ============================================================================
  // PROJECTS TOOLS (4)
  // ============================================================================
  {
    name: "get_all_projects",
    description: "Récupère la liste des projets musicaux.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description:
            "Filtrer par statut: pre_production, recording, mixing, mastering, completed",
        },
        limit: {
          type: "number",
          description: "Nombre maximum de résultats",
        },
      },
    },
  },
  {
    name: "create_project",
    description: "Crée un nouveau projet musical (album, EP, single, demo, etc.).",
    input_schema: {
      type: "object",
      properties: {
        client_id: {
          type: "number",
          description: "ID du client",
        },
        name: {
          type: "string",
          description: "Nom du projet (ex: Mon Premier Album)",
        },
        artist_name: {
          type: "string",
          description: "Nom de l'artiste",
        },
        type: {
          type: "string",
          description: "Type: album, ep, single, demo, soundtrack, podcast. Défaut: album",
        },
        genre: {
          type: "string",
          description: "Genre musical (rock, pop, jazz, électro, etc.)",
        },
        budget: {
          type: "number",
          description: "Budget du projet en euros",
        },
        description: {
          type: "string",
          description: "Description du projet",
        },
      },
      required: ["client_id", "name"],
    },
  },
  {
    name: "update_project",
    description: "Met à jour un projet existant (statut, budget, coûts).",
    input_schema: {
      type: "object",
      properties: {
        project_id: {
          type: "number",
          description: "ID du projet à modifier",
        },
        name: {
          type: "string",
          description: "Nouveau nom du projet",
        },
        status: {
          type: "string",
          description: "Nouveau statut: pre_production, recording, editing, mixing, mastering, completed, delivered, archived",
        },
        budget: {
          type: "number",
          description: "Nouveau budget en euros",
        },
        total_cost: {
          type: "number",
          description: "Coût total actuel en euros",
        },
        description: {
          type: "string",
          description: "Nouvelle description",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "create_project_folder",
    description: "Génère automatiquement un chemin de stockage pour un projet (ex: /projects/1-mon-album).",
    input_schema: {
      type: "object",
      properties: {
        project_id: {
          type: "number",
          description: "ID du projet",
        },
        folder_name: {
          type: "string",
          description: "Nom personnalisé du dossier (optionnel, utilise le nom du projet par défaut)",
        },
      },
      required: ["project_id"],
    },
  },

  // ============================================================================
  // MUSICIANS TOOLS (2)
  // ============================================================================
  {
    name: "get_all_musicians",
    description: "Récupère la liste des musiciens/talents.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_musician",
    description: "Ajoute un nouveau musicien/talent avec ses instruments et genres musicaux.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nom complet du musicien",
        },
        stage_name: {
          type: "string",
          description: "Nom de scène (optionnel)",
        },
        email: {
          type: "string",
          description: "Email de contact",
        },
        phone: {
          type: "string",
          description: "Numéro de téléphone",
        },
        talent_type: {
          type: "string",
          description: "Type de talent: musician, actor. Défaut: musician",
        },
        instruments: {
          type: "array",
          description: "Liste des instruments joués (ex: ['guitar', 'vocals', 'piano'])",
          items: {
            type: "string",
          },
        },
        genres: {
          type: "array",
          description: "Genres musicaux (ex: ['rock', 'blues', 'jazz'])",
          items: {
            type: "string",
          },
        },
        bio: {
          type: "string",
          description: "Biographie du musicien",
        },
      },
      required: ["name"],
    },
  },

  // ============================================================================
  // ACCÈS ÉTENDU — TRACKS, TEMPS, DÉPENSES, CONTRATS, SERVICES
  // ============================================================================
  {
    name: "get_all_tracks",
    description:
      "Récupère les tracks (morceaux) du studio, optionnellement filtrés par projet. Retourne titre, numéro, BPM, tonalité, statut.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "number", description: "ID du projet pour filtrer (optionnel)" },
        limit: { type: "number", description: "Nombre max de résultats (défaut 50)" },
      },
    },
  },
  {
    name: "create_track",
    description: "Crée une nouvelle track (morceau) rattachée à un projet.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "number", description: "ID du projet parent" },
        title: { type: "string", description: "Titre de la track" },
        track_number: { type: "number", description: "Numéro de piste (optionnel)" },
        bpm: { type: "number", description: "Tempo en BPM (optionnel)" },
        key: { type: "string", description: "Tonalité, ex: 'Am' (optionnel)" },
      },
      required: ["project_id", "title"],
    },
  },
  {
    name: "update_track",
    description:
      "Met à jour une track existante (titre, numéro, BPM, tonalité, statut). Ex: marquer une track comme terminée.",
    input_schema: {
      type: "object",
      properties: {
        track_id: { type: "number", description: "ID de la track (optionnel si track_title fourni)" },
        track_title: { type: "string", description: "Titre de la track (recherche partielle). Alternative à track_id." },
        title: { type: "string", description: "Nouveau titre (optionnel)" },
        track_number: { type: "number", description: "Nouveau numéro de piste (optionnel)" },
        bpm: { type: "number", description: "Nouveau tempo BPM (optionnel)" },
        key: { type: "string", description: "Nouvelle tonalité (optionnel)" },
        status: {
          type: "string",
          description: "Nouveau statut: recording, editing, mixing, mastering, completed (optionnel)",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_track",
    description: "Supprime une track. Peut résoudre la track par son titre.",
    input_schema: {
      type: "object",
      properties: {
        track_id: { type: "number", description: "ID de la track (optionnel si track_title fourni)" },
        track_title: { type: "string", description: "Titre de la track (recherche partielle). Alternative à track_id." },
      },
      required: [],
    },
  },
  {
    name: "get_track_credits",
    description:
      "Liste les crédits / splits (répartition des droits) d'une track: rôle, nom crédité, pourcentage de split, musicien lié.",
    input_schema: {
      type: "object",
      properties: {
        track_id: { type: "number", description: "ID de la track (optionnel si track_title fourni)" },
        track_title: { type: "string", description: "Titre de la track (recherche partielle). Alternative à track_id." },
      },
      required: [],
    },
  },
  {
    name: "add_track_credit",
    description:
      "Ajoute un crédit / split à une track (ex: 'crédite Sarah Petit à la guitare avec 20% de split').",
    input_schema: {
      type: "object",
      properties: {
        track_id: { type: "number", description: "ID de la track (optionnel si track_title fourni)" },
        track_title: { type: "string", description: "Titre de la track (recherche partielle). Alternative à track_id." },
        credit_name: { type: "string", description: "Nom tel qu'il doit apparaître dans les crédits" },
        role: { type: "string", description: "Rôle: producer, engineer, mixing, mastering, vocals, guitar, drums, bass, etc." },
        split_percent: { type: "number", description: "Pourcentage de split royalties (optionnel)" },
        musician_id: { type: "number", description: "ID du musicien/talent lié (optionnel)" },
        is_primary: { type: "boolean", description: "Crédit principal (optionnel)" },
      },
      required: ["credit_name", "role"],
    },
  },
  {
    name: "update_musician",
    description: "Met à jour un talent/musicien (nom, nom de scène, email, téléphone, bio). Peut résoudre par nom.",
    input_schema: {
      type: "object",
      properties: {
        musician_id: { type: "number", description: "ID du musicien (optionnel si musician_name fourni)" },
        musician_name: { type: "string", description: "Nom du musicien (recherche partielle). Alternative à musician_id." },
        name: { type: "string", description: "Nouveau nom (optionnel)" },
        stage_name: { type: "string", description: "Nouveau nom de scène (optionnel)" },
        email: { type: "string", description: "Nouvel email (optionnel)" },
        phone: { type: "string", description: "Nouveau téléphone (optionnel)" },
        bio: { type: "string", description: "Nouvelle bio (optionnel)" },
      },
      required: [],
    },
  },
  {
    name: "delete_musician",
    description: "Désactive un talent/musicien (soft delete). Peut résoudre par nom.",
    input_schema: {
      type: "object",
      properties: {
        musician_id: { type: "number", description: "ID du musicien (optionnel si musician_name fourni)" },
        musician_name: { type: "string", description: "Nom du musicien (recherche partielle). Alternative à musician_id." },
      },
      required: [],
    },
  },
  {
    name: "get_all_vat_rates",
    description: "Récupère les taux de TVA configurés dans le studio (nom, taux %, défaut).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_all_time_entries",
    description: "Récupère les saisies de temps (heures travaillées) enregistrées.",
    input_schema: {
      type: "object",
      properties: { limit: { type: "number", description: "Nombre max (défaut 50)" } },
    },
  },
  {
    name: "get_all_expenses",
    description: "Récupère les dépenses du studio (coûts, achats, frais).",
    input_schema: {
      type: "object",
      properties: { limit: { type: "number", description: "Nombre max (défaut 50)" } },
    },
  },
  {
    name: "get_all_contracts",
    description: "Récupère les contrats du studio (accords clients, cessions de droits, etc.).",
    input_schema: {
      type: "object",
      properties: { limit: { type: "number", description: "Nombre max (défaut 50)" } },
    },
  },
  {
    name: "get_all_services",
    description:
      "Récupère le catalogue de services/prestations du studio (nom, prix, unité).",
    input_schema: { type: "object", properties: {} },
  },

  // ============================================================================
  // PILOTAGE — PROSPECTS, TÂCHES, DOCUMENTS, DISPONIBILITÉS
  // ============================================================================
  {
    name: "get_all_leads",
    description: "Récupère les prospects (leads) du pipeline commercial.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filtre par statut (ex: 'new', 'contacted', 'won', 'lost')" },
        limit: { type: "number", description: "Nombre max (défaut 50)" },
      },
    },
  },
  {
    name: "create_lead",
    description: "Crée un nouveau prospect (lead) dans le pipeline.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom du prospect ou de l'entreprise" },
        contact_email: { type: "string", description: "Email de contact (optionnel)" },
        contact_phone: { type: "string", description: "Téléphone de contact (optionnel)" },
        source: { type: "string", description: "Origine du prospect (optionnel)" },
        notes: { type: "string", description: "Notes libres (optionnel)" },
      },
      required: ["name"],
    },
  },
  {
    name: "get_all_tasks",
    description: "Récupère les tâches (to-do) du studio, optionnellement filtrées par statut.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filtre par statut (ex: 'todo', 'doing', 'done')" },
        limit: { type: "number", description: "Nombre max (défaut 50)" },
      },
    },
  },
  {
    name: "create_task",
    description: "Crée une nouvelle tâche, optionnellement rattachée à un projet.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Intitulé de la tâche" },
        project_id: { type: "number", description: "ID du projet lié (optionnel)" },
        assignee: { type: "string", description: "Personne assignée (optionnel)" },
        notes: { type: "string", description: "Détails (optionnel)" },
      },
      required: ["title"],
    },
  },
  {
    name: "get_all_documents",
    description: "Récupère les documents du studio (fichiers, liens, pièces jointes).",
    input_schema: {
      type: "object",
      properties: { limit: { type: "number", description: "Nombre max (défaut 50)" } },
    },
  },
  {
    name: "create_document",
    description: "Ajoute un document (référence par URL) au studio.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom du document" },
        url: { type: "string", description: "URL du document" },
        doc_type: { type: "string", description: "Type de document (optionnel)" },
        project_id: { type: "number", description: "ID du projet lié (optionnel)" },
        notes: { type: "string", description: "Notes (optionnel)" },
      },
      required: ["name", "url"],
    },
  },
  {
    name: "get_all_availability",
    description:
      "Récupère les créneaux de disponibilité/indisponibilité (salles, staff, talents).",
    input_schema: {
      type: "object",
      properties: { limit: { type: "number", description: "Nombre max (défaut 100)" } },
    },
  },

  // ============================================================================
  // FINANCE ÉTENDUE — FORFAITS, AVOIRS, COUPONS, INVENTAIRE, LIVRABLES
  // ============================================================================
  {
    name: "get_all_packages",
    description: "Récupère les forfaits/packages clients (heures prépayées, formules).",
    input_schema: {
      type: "object",
      properties: { limit: { type: "number", description: "Nombre max (défaut 50)" } },
    },
  },
  {
    name: "get_all_credit_notes",
    description: "Récupère les avoirs (notes de crédit) émis.",
    input_schema: {
      type: "object",
      properties: { limit: { type: "number", description: "Nombre max (défaut 50)" } },
    },
  },
  {
    name: "get_all_coupons",
    description: "Récupère les coupons/codes promo du studio.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_all_consumables",
    description:
      "Récupère l'inventaire des consommables (bandes, câbles, fournitures) avec stocks.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_all_deliverables",
    description:
      "Récupère les livrables clients (masters, mixs, exports) et leur statut de livraison.",
    input_schema: {
      type: "object",
      properties: { limit: { type: "number", description: "Nombre max (défaut 50)" } },
    },
  },

  // ============================================================================
  // ÉCRITURE ÉTENDUE — CRÉATION
  // ============================================================================
  {
    name: "create_expense",
    description: "Enregistre une dépense du studio.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Catégorie (rent, utilities, equipment, software, supplies, marketing, other…)" },
        description: { type: "string", description: "Description de la dépense" },
        amount: { type: "number", description: "Montant" },
        vendor: { type: "string", description: "Fournisseur/bénéficiaire (optionnel)" },
        currency: { type: "string", description: "Devise ISO, défaut EUR (optionnel)" },
        expense_date: { type: "string", description: "Date YYYY-MM-DD (optionnel, défaut aujourd'hui)" },
        payment_method: { type: "string", description: "cash|card|bank_transfer|check|other (optionnel)" },
      },
      required: ["category", "description", "amount"],
    },
  },
  {
    name: "create_service",
    description: "Ajoute une prestation au catalogue de services.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom du service" },
        category: { type: "string", description: "Catégorie (Studio, Post-production, Location matériel, Autre)" },
        unit_price: { type: "number", description: "Prix unitaire HT" },
        description: { type: "string", description: "Description (optionnel)" },
      },
      required: ["name", "category", "unit_price"],
    },
  },
  {
    name: "create_contract",
    description: "Crée un contrat client (le numéro est généré automatiquement).",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "number", description: "ID du client" },
        type: { type: "string", description: "recording|mixing|mastering|production|exclusivity|distribution|studio_rental|services|partnership|other" },
        title: { type: "string", description: "Titre du contrat" },
        terms: { type: "string", description: "Texte / termes du contrat" },
        project_id: { type: "number", description: "ID projet lié (optionnel)" },
        value: { type: "number", description: "Valeur totale (optionnel)" },
        status: { type: "string", description: "draft|sent|signed|active… (optionnel, défaut draft)" },
      },
      required: ["client_id", "type", "title", "terms"],
    },
  },
  {
    name: "create_deliverable",
    description: "Crée un livrable client (master, mix, export).",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom du livrable" },
        project_id: { type: "number", description: "ID projet lié (optionnel)" },
        url: { type: "string", description: "URL du fichier (optionnel)" },
        status: { type: "string", description: "draft|delivered|approved (optionnel)" },
        notes: { type: "string", description: "Notes (optionnel)" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_consumable",
    description: "Ajoute un article à l'inventaire des consommables.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom de l'article" },
        quantity: { type: "number", description: "Quantité en stock (optionnel)" },
        unit: { type: "string", description: "Unité (ex: pièces, mètres) (optionnel)" },
        threshold: { type: "number", description: "Seuil d'alerte de réappro (optionnel)" },
        notes: { type: "string", description: "Notes (optionnel)" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_coupon",
    description: "Crée un coupon/code promo.",
    input_schema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Code du coupon" },
        value: { type: "number", description: "Valeur (pourcentage ou montant selon kind)" },
        kind: { type: "string", description: "percent|amount|giftcard (optionnel, défaut percent)" },
        valid_until: { type: "string", description: "Date d'expiration YYYY-MM-DD (optionnel)" },
        notes: { type: "string", description: "Notes (optionnel)" },
      },
      required: ["code", "value"],
    },
  },
  {
    name: "create_package",
    description: "Crée un forfait/formule d'heures prépayées pour un client.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "number", description: "ID du client" },
        name: { type: "string", description: "Nom du forfait" },
        total_hours: { type: "number", description: "Heures incluses (optionnel)" },
        price: { type: "number", description: "Prix du forfait (optionnel)" },
        valid_until: { type: "string", description: "Validité YYYY-MM-DD (optionnel)" },
        notes: { type: "string", description: "Notes (optionnel)" },
      },
      required: ["client_id", "name"],
    },
  },
  {
    name: "create_availability",
    description: "Déclare un créneau d'indisponibilité pour un membre du staff ou un talent.",
    input_schema: {
      type: "object",
      properties: {
        subject_type: { type: "string", description: "staff|talent" },
        subject_id: { type: "number", description: "ID du staff ou du talent" },
        start_time: { type: "string", description: "Début ISO (YYYY-MM-DDTHH:mm)" },
        end_time: { type: "string", description: "Fin ISO (YYYY-MM-DDTHH:mm)" },
        kind: { type: "string", description: "unavailable|vacation (optionnel)" },
        notes: { type: "string", description: "Notes (optionnel)" },
      },
      required: ["subject_type", "subject_id", "start_time", "end_time"],
    },
  },
  {
    name: "create_credit_note",
    description: "Émet un avoir (note de crédit). Le numéro est généré automatiquement.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "number", description: "ID du client" },
        amount: { type: "number", description: "Montant de l'avoir" },
        invoice_id: { type: "number", description: "ID facture liée (optionnel)" },
        reason: { type: "string", description: "Motif (optionnel)" },
      },
      required: ["client_id", "amount"],
    },
  },
  {
    name: "create_time_entry",
    description:
      "Enregistre une saisie de temps (heures travaillées) sur un projet, une session ou une track.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "number", description: "ID projet (au moins un lien requis)" },
        session_id: { type: "number", description: "ID session (au moins un lien requis)" },
        track_id: { type: "number", description: "ID track (au moins un lien requis)" },
        task_type_id: { type: "number", description: "ID type de tâche (optionnel, sinon défaut)" },
        duration_minutes: { type: "number", description: "Durée en minutes (optionnel)" },
        hourly_rate: { type: "number", description: "Taux horaire (optionnel, sinon celui du type de tâche)" },
        notes: { type: "string", description: "Notes (optionnel)" },
      },
    },
  },

  // ============================================================================
  // ÉCRITURE ÉTENDUE — MISE À JOUR DE STATUT
  // ============================================================================
  {
    name: "update_lead_status",
    description: "Met à jour le statut d'un prospect (new, contacted, quoted, won, lost).",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID du prospect" },
        status: { type: "string", description: "Nouveau statut" },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "update_task_status",
    description: "Met à jour le statut d'une tâche (todo, doing, done).",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID de la tâche" },
        status: { type: "string", description: "Nouveau statut" },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "update_deliverable_status",
    description: "Met à jour le statut d'un livrable (draft, delivered, approved).",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID du livrable" },
        status: { type: "string", description: "Nouveau statut" },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "update_contract_status",
    description: "Met à jour le statut d'un contrat (draft, sent, signed, active, expired…).",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID du contrat" },
        status: { type: "string", description: "Nouveau statut" },
      },
      required: ["id", "status"],
    },
  },
];
