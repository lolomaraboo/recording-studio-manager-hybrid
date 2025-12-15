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
import { useLocation } from "wouter";

export function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      label: "Session",
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => setLocation("/sessions"),
    },
    {
      label: "Client",
      icon: <Users className="h-4 w-4" />,
      onClick: () => setLocation("/clients"),
    },
    {
      label: "Projet",
      icon: <FolderOpen className="h-4 w-4" />,
      onClick: () => setLocation("/projects"),
    },
    {
      label: "Facture",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => setLocation("/invoices"),
    },
    {
      label: "Devis",
      icon: <FileCheck className="h-4 w-4" />,
      onClick: () => setLocation("/quotes"),
    },
    {
      label: "Upload Audio",
      icon: <Upload className="h-4 w-4" />,
      onClick: () => setLocation("/audio-files"),
    },
    {
      label: "Réservations",
      icon: <Clock className="h-4 w-4" />,
      onClick: () => setLocation("/calendar"),
    },
    {
      label: "Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      onClick: () => setLocation("/analytics"),
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
