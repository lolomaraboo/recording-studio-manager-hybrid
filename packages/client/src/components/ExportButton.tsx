/**
 * Export Button Component
 *
 * Provides Excel export functionality for data tables.
 */

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

interface ExportColumn<T> {
  label: string;
  key: keyof T;
  format?: (value: unknown) => unknown;
}

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[] | undefined;
  filename: string;
  sheetName: string;
  columns: ExportColumn<T>[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

// Simple CSV export implementation (Excel can open CSV files)
function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  // Create header row
  const headers = columns.map((col) => col.label);

  // Create data rows
  const rows = data.map((row) =>
    columns.map((col) => {
      let value: unknown = row[col.key];
      if (col.format) {
        value = col.format(value);
      }
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value ?? "");
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  // Create download link
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportButton<T extends Record<string, unknown>>({
  data,
  filename,
  columns,
  variant = "outline",
  size = "default",
}: ExportButtonProps<T>) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnee a exporter");
      return;
    }

    try {
      exportToCSV(data, columns, filename);
      toast.success("Export reussi");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={!data || data.length === 0}
    >
      <FileDown className="mr-2 h-4 w-4" />
      Exporter CSV
    </Button>
  );
}
