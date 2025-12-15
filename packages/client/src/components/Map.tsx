/**
 * Map Component Placeholder
 *
 * Google Maps integration will be added in a future update.
 * For now, this is a placeholder component.
 */

import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface MapProps {
  address?: string;
  className?: string;
}

export function Map({ address, className }: MapProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <MapPin className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Carte non disponible</p>
        {address && (
          <p className="text-xs mt-2 text-center max-w-xs">{address}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Alias pour compatibilité avec Manus
export const MapView = Map;
