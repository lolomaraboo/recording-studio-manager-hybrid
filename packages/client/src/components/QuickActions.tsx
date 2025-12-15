import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  FolderOpen,
  FileText,
  FileCheck,
  Upload,
  Clock,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Session",
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => navigate("/sessions"),
    },
    {
      label: "Client",
      icon: <Users className="h-4 w-4" />,
      onClick: () => navigate("/clients"),
    },
    {
      label: "Projet",
      icon: <FolderOpen className="h-4 w-4" />,
      onClick: () => navigate("/projects"),
    },
    {
      label: "Facture",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => navigate("/invoices"),
    },
    {
      label: "Devis",
      icon: <FileCheck className="h-4 w-4" />,
      onClick: () => navigate("/quotes"),
    },
    {
      label: "Upload Audio",
      icon: <Upload className="h-4 w-4" />,
      onClick: () => navigate("/audio-files"),
    },
    {
      label: "Réservations",
      icon: <Clock className="h-4 w-4" />,
      onClick: () => navigate("/calendar"),
    },
    {
      label: "Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      onClick: () => navigate("/analytics"),
    },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-4 px-6 mb-8 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-white font-medium text-sm">⚡ Actions Rapides:</span>
        <div className="flex gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant="secondary"
              size="sm"
              className="bg-white hover:bg-gray-100 text-gray-900 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              {action.icon}
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
