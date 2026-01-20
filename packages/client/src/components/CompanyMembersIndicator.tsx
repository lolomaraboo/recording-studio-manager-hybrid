import { useState } from "react";
import { Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CompanyMembersModal } from "./CompanyMembersModal";

interface CompanyMembersIndicatorProps {
  clientId: number;
  clientType: "company" | "individual";
  clientName: string;
}

export function CompanyMembersIndicator({
  clientId,
  clientType,
  clientName,
}: CompanyMembersIndicatorProps) {
  const [showModal, setShowModal] = useState(false);

  // Query for existing relationships
  const membersQuery =
    clientType === "company"
      ? trpc.clients.getMembers.useQuery({ companyId: clientId })
      : trpc.clients.getCompanies.useQuery({ memberId: clientId });

  const members = membersQuery.data || [];
  const count = members.length;

  // Generate preview text
  let previewText = "";

  if (count === 0) {
    previewText =
      clientType === "company" ? "Aucun membre" : "Aucune entreprise";
  } else {
    const label = clientType === "company" ? "membre" : "entreprise";
    const labelPlural = clientType === "company" ? "membres" : "entreprises";
    const countLabel = count === 1 ? `1 ${label}` : `${count} ${labelPlural}`;

    if (count <= 3) {
      // Show all names with roles
      const names = members
        .map((item: any) => {
          const entity =
            clientType === "company" ? item.member : item.company;
          const name = entity?.name || "Inconnu";
          const role = item.role ? ` (${item.role})` : "";
          return `${name}${role}`;
        })
        .join(", ");
      previewText = `${countLabel} : ${names}`;
    } else {
      // Show first 2 names + truncate
      const firstTwo = members
        .slice(0, 2)
        .map((item: any) => {
          const entity =
            clientType === "company" ? item.member : item.company;
          const name = entity?.name || "Inconnu";
          const role = item.role ? ` (${item.role})` : "";
          return `${name}${role}`;
        })
        .join(", ");
      previewText = `${countLabel} : ${firstTwo}...`;
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">
        {clientType === "company" ? "Membres" : "Entreprises"}
      </h3>

      <div
        className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-accent transition-colors"
        onClick={() => setShowModal(true)}
      >
        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm">{previewText}</span>
      </div>

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
