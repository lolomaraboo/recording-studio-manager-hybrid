/**
 * Composant Widget réutilisable pour le dashboard personnalisable
 * 
 * Supporte le drag & drop avec @dnd-kit
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isDragging?: boolean;
}

export function DashboardWidget({
  title,
  icon,
  children,
  className,
  isDragging = false,
}: DashboardWidgetProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isDragging && "opacity-50 scale-95",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
