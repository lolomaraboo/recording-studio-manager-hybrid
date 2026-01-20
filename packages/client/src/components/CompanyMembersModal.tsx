import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, UserPlus, Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CompanyMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  clientType: "company" | "individual";
  clientName: string;
}

export function CompanyMembersModal({
  open,
  onOpenChange,
  clientId,
  clientType,
  clientName,
}: CompanyMembersModalProps) {
  const utils = trpc.useUtils();

  // State for inline role editing
  const [editingRole, setEditingRole] = useState<Record<number, string>>({});

  // State for adding new member/company
  const [selectedId, setSelectedId] = useState<string>("");
  const [newRole, setNewRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Query for existing roles (for autocomplete)
  const { data: existingRoles = [] } = trpc.clients.getRoles.useQuery(
    undefined,
    { enabled: open }
  );

  // Query for existing relationships
  const membersQuery =
    clientType === "company"
      ? trpc.clients.getMembers.useQuery(
          { companyId: clientId },
          { enabled: open && clientType === "company" }
        )
      : trpc.clients.getCompanies.useQuery(
          { memberId: clientId },
          { enabled: open && clientType === "individual" }
        );

  // Query for available clients to add
  const availableClientsQuery = trpc.clients.list.useQuery(
    { limit: 100 },
    { enabled: open }
  );

  // Mutations
  const addMemberMutation = trpc.clients.addMember.useMutation({
    onSuccess: () => {
      toast.success(
        clientType === "company"
          ? "Membre ajouté avec succès"
          : "Entreprise ajoutée avec succès"
      );
      utils.clients.getMembers.invalidate();
      utils.clients.getCompanies.invalidate();
      utils.clients.list.invalidate();
      utils.clients.getAllMembers.invalidate();
      utils.clients.getAllCompaniesForContacts.invalidate();
      // Reset form
      setSelectedId("");
      setNewRole("");
      setIsPrimary(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'ajout");
    },
  });

  const updateMemberMutation = trpc.clients.updateMember.useMutation({
    onSuccess: () => {
      toast.success("Rôle modifié avec succès");
      utils.clients.getMembers.invalidate();
      utils.clients.getCompanies.invalidate();
      utils.clients.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la modification");
    },
  });

  const removeMemberMutation = trpc.clients.removeMember.useMutation({
    onSuccess: () => {
      toast.success(
        clientType === "company"
          ? "Membre retiré avec succès"
          : "Entreprise retirée avec succès"
      );
      utils.clients.getMembers.invalidate();
      utils.clients.getCompanies.invalidate();
      utils.clients.list.invalidate();
      utils.clients.getAllMembers.invalidate();
      utils.clients.getAllCompaniesForContacts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  const handleRoleChange = (id: number, value: string) => {
    setEditingRole((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveRole = (id: number, currentRole: string | null) => {
    const newRoleValue = editingRole[id];

    // Only update if changed
    if (newRoleValue !== undefined && newRoleValue !== (currentRole || "")) {
      updateMemberMutation.mutate({
        id,
        role: newRoleValue || null,
      });
    }

    // Clear editing state
    setEditingRole((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleRemove = (id: number, name: string) => {
    if (
      window.confirm(
        `Retirer ${name} de ${clientType === "company" ? "cette entreprise" : "ce contact"} ?`
      )
    ) {
      removeMemberMutation.mutate({ id });
    }
  };

  const handleAdd = () => {
    if (!selectedId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    const numericId = parseInt(selectedId, 10);

    if (clientType === "company") {
      addMemberMutation.mutate({
        companyId: clientId,
        memberId: numericId,
        role: newRole || null,
        isPrimary,
      });
    } else {
      // For individual view, swap the IDs
      addMemberMutation.mutate({
        companyId: numericId,
        memberId: clientId,
        role: newRole || null,
        isPrimary,
      });
    }
  };

  const members = membersQuery.data || [];

  // Filter available clients based on type
  const availableClients =
    availableClientsQuery.data?.filter((client) => {
      // Don't show self
      if (client.id === clientId) return false;

      // For company view, only show individuals
      if (clientType === "company") {
        return client.type === "individual";
      }

      // For individual view, only show companies
      return client.type === "company";
    }) || [];

  const title =
    clientType === "company"
      ? `Membres de ${clientName}`
      : `Entreprises de ${clientName}`;

  const description =
    clientType === "company"
      ? "Gérer les contacts individuels de cette entreprise"
      : "Gérer les entreprises auxquelles ce contact appartient";

  const addButtonLabel =
    clientType === "company" ? "Ajouter un membre" : "Ajouter une entreprise";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* List existing members/companies */}
        <div className="space-y-2">
          {membersQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          )}

          {!membersQuery.isLoading && members.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {clientType === "company"
                ? "Aucun membre pour le moment"
                : "Aucune entreprise pour le moment"}
            </p>
          )}

          {!membersQuery.isLoading &&
            members.map((item: any) => {
              const entity =
                clientType === "company" ? item.member : item.company;
              const displayName = entity?.name || "Nom inconnu";

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-accent transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{displayName}</div>
                    {/* Inline editable role */}
                    <Input
                      value={editingRole[item.id] ?? item.role ?? ""}
                      onChange={(e) => handleRoleChange(item.id, e.target.value)}
                      onBlur={() => handleSaveRole(item.id, item.role)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveRole(item.id, item.role);
                        }
                      }}
                      placeholder="Rôle (optionnel)"
                      className="text-sm h-8"
                    />
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {item.isPrimary && (
                      <Badge variant="secondary">Contact principal</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id, displayName)}
                      disabled={removeMemberMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>

        <Separator className="my-4" />

        {/* Add new member/company */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            {clientType === "company" ? (
              <>
                <UserPlus className="h-4 w-4" />
                Ajouter un membre
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                Ajouter une entreprise
              </>
            )}
          </h3>

          <div className="space-y-3">
            {/* Dropdown select */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {clientType === "company"
                  ? "Sélectionner un contact"
                  : "Sélectionner une entreprise"}
              </label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      clientType === "company"
                        ? "Choisir un contact..."
                        : "Choisir une entreprise..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role input with autocomplete */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Rôle (optionnel)
              </label>
              <Input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Ex: Ingénieur du son, Producteur, Manager..."
                list="roles-datalist"
              />
              <datalist id="roles-datalist">
                {existingRoles.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </div>

            {/* Primary checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="isPrimary" className="text-sm font-medium">
                Contact principal
              </label>
            </div>

            {/* Submit button */}
            <Button
              onClick={handleAdd}
              disabled={!selectedId || addMemberMutation.isPending}
              className="w-full"
            >
              {addMemberMutation.isPending ? "Ajout en cours..." : addButtonLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
