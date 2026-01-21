import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CompanyMembersModal } from "./CompanyMembersModal";
import { Button } from "@/components/ui/button";

interface CompanyMembersIndicatorProps {
  clientId: number;
  clientType: "company" | "individual";
  clientName: string;
  isEditing?: boolean;
}

export function CompanyMembersIndicator({
  clientId,
  clientType,
  clientName,
  isEditing = false,
}: CompanyMembersIndicatorProps) {
  const [showModal, setShowModal] = useState(false);

  // Query for existing relationships
  const membersQuery =
    clientType === "company"
      ? trpc.clients.getMembers.useQuery({ companyId: clientId })
      : trpc.clients.getCompanies.useQuery({ memberId: clientId });

  const members = membersQuery.data || [];
  const count = members.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {clientType === "company" ? "Membres" : "Entreprises"}
        </h3>
        {isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {clientType === "company" ? "Ajouter un membre" : "Ajouter une entreprise"}
          </Button>
        )}
      </div>

      {count === 0 ? (
        <div className="text-sm text-muted-foreground p-3 border rounded">
          {clientType === "company" ? "Aucun membre" : "Aucune entreprise"}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {count} {clientType === "company"
              ? (count === 1 ? "membre" : "membres")
              : (count === 1 ? "entreprise" : "entreprises")}
          </div>
          {members.map((item: any) => {
            const entity = clientType === "company" ? item.member : item.company;
            const entityId = clientType === "company" ? item.member?.id : item.company?.id;
            const name = entity?.name || "Inconnu";

            return (
              <Link
                key={entityId}
                to={`/clients/${entityId}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1 text-xs hover:bg-accent p-1 rounded transition-colors">
                  {item.isPrimary && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                  <span className="font-medium truncate">{name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CompanyMembersModal
        open={showModal}
        onOpenChange={setShowModal}
        clientId={clientId}
        clientType={clientType}
        clientName={clientName}
      />
    </div>
  );
}
