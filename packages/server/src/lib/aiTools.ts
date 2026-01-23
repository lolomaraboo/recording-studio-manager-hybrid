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
      "Récupère les sessions d'enregistrement à venir. Peut filtrer par plage de dates et par salle spécifique.",
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
    description: "Met à jour une session existante (titre, horaires, statut).",
    input_schema: {
      type: "object",
      properties: {
        session_id: {
          type: "number",
          description: "ID de la session à modifier",
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
      required: ["session_id"],
    },
  },
  {
    name: "delete_session",
    description: "Supprime une session d'enregistrement.",
    input_schema: {
      type: "object",
      properties: {
        session_id: {
          type: "number",
          description: "ID de la session à supprimer",
        },
      },
      required: ["session_id"],
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
    description: "Supprime une facture.",
    input_schema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "number",
          description: "ID de la facture",
        },
      },
      required: ["invoice_id"],
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
];
