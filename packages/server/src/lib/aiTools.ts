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
  // CLIENTS TOOLS (5)
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
      required: ["client_id"],
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
      },
      required: ["client_id"],
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
  // INVOICES TOOLS (5)
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
    name: "create_invoice",
    description: "Crée une nouvelle facture pour un client.",
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
    name: "update_invoice",
    description: "Met à jour une facture existante.",
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
    description: "Résumé financier des factures (total, payé, en attente).",
    input_schema: {
      type: "object",
      properties: {},
    },
  },

  // ============================================================================
  // QUOTES TOOLS (5)
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
    name: "create_quote",
    description: "Crée un nouveau devis.",
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
    name: "update_quote",
    description: "Met à jour un devis.",
    input_schema: {
      type: "object",
      properties: {
        quote_id: {
          type: "number",
          description: "ID du devis",
        },
      },
      required: ["quote_id"],
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
      },
      required: ["quote_id"],
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
    description: "Crée une nouvelle salle.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nom de la salle",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "update_room",
    description: "Met à jour une salle existante.",
    input_schema: {
      type: "object",
      properties: {
        room_id: {
          type: "number",
          description: "ID de la salle",
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
    description: "Ajoute un nouvel équipement.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nom de l'équipement",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "update_equipment",
    description: "Met à jour un équipement existant.",
    input_schema: {
      type: "object",
      properties: {
        equipment_id: {
          type: "number",
          description: "ID de l'équipement",
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
    description: "Crée un nouveau projet musical.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nom du projet",
        },
        client_id: {
          type: "number",
          description: "ID du client",
        },
      },
      required: ["name", "client_id"],
    },
  },
  {
    name: "update_project",
    description: "Met à jour un projet existant.",
    input_schema: {
      type: "object",
      properties: {
        project_id: {
          type: "number",
          description: "ID du projet",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "create_project_folder",
    description: "Crée un dossier de stockage pour un projet.",
    input_schema: {
      type: "object",
      properties: {
        project_id: {
          type: "number",
          description: "ID du projet",
        },
        folder_path: {
          type: "string",
          description: "Chemin du dossier à créer",
        },
      },
      required: ["project_id", "folder_path"],
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
    description: "Ajoute un nouveau musicien/talent.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nom du musicien",
        },
      },
      required: ["name"],
    },
  },
];
