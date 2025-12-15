import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { exportToExcel, formatDataForExport } from "@/../../shared/excel-utils";

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[] | undefined;
  filename: string;
  sheetName: string;
  columns: Array<{ label: string; key: keyof T; format?: (value: any) => any }>;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function ExportButton<T extends Record<string, any>>({
  data,
  filename,
  sheetName,
  columns,
  variant = "outline",
  size = "default",
}: ExportButtonProps<T>) {
  const handleExport = () => {
    if (data && data.length > 0) {
      const formatted = formatDataForExport(data, columns);
      exportToExcel(formatted, filename, sheetName);
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
      Exporter Excel
    </Button>
  );
}
