import { trpc } from "@/lib/trpc";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { User, Building2, Mail, Phone, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientPopoverProps {
  clientId: number;
  clientName?: string; // Optional: for performance, can pass pre-fetched name
}

export function ClientPopover({ clientId, clientName }: ClientPopoverProps) {
  const { data: client, isLoading } = trpc.clients.get.useQuery({ id: clientId });

  // Fallback display name
  const displayName = clientName || client?.name || "Client inconnu";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="font-medium text-primary hover:underline cursor-pointer text-left">
          {displayName}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : client ? (
          <div className="space-y-3">
            {/* Header with avatar/logo */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {client.avatarUrl || client.logoUrl ? (
                  <img
                    src={client.type === "individual" ? client.avatarUrl : client.logoUrl}
                    alt={client.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground">
                    {client.type === "individual" ? (
                      <User className="w-6 h-6" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{client.name}</div>
                <Badge variant="outline" className="mt-1">
                  {client.type === "individual" ? "Particulier" : "Entreprise"}
                </Badge>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-2 text-sm">
              {/* Primary email */}
              {client.emails && client.emails.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{client.emails[0].email}</span>
                </div>
              )}

              {/* Primary phone */}
              {client.phones && client.phones.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{client.phones[0].number}</span>
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="pt-2 border-t">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to={`/clients/${client.id}`}>
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Voir la fiche complète
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Client introuvable</div>
        )}
      </PopoverContent>
    </Popover>
  );
}
