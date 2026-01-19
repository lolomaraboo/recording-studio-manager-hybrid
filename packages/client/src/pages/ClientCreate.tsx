import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClientFormWizard } from "@/components/ClientFormWizard";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";

export default function ClientCreate() {
  const navigate = useNavigate();

  // Create mutation
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: (data) => {
      toast.success("Client créé avec succès");
      navigate(`/clients/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Handle form submission
  const handleSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header with breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/clients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8 text-primary" />
              Nouveau Client
            </h2>
          </div>
        </div>

        {/* Wizard Form */}
        <ClientFormWizard
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => navigate("/clients")}
        />
      </div>
    </div>
  );
}
