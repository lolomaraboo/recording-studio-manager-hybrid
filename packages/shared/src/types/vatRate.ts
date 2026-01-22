/**
 * Shared types for VAT Rate management
 */

export interface VatRateFormData {
  name: string;          // "TVA Standard 20%"
  rate: number;          // 20.00
  isDefault: boolean;    // true if default rate
  isActive: boolean;     // true if active
}

export interface VatRateWithUsage {
  id: number;
  name: string;
  rate: string;          // decimal from DB
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount?: number;   // Optional: number of invoices/quotes using this rate
}

export interface SetDefaultVatRateInput {
  id: number;
}

export interface ArchiveVatRateInput {
  id: number;
}

export interface UnarchiveVatRateInput {
  id: number;
}

export interface CreateVatRateInput {
  name: string;
  rate: number;
  isDefault?: boolean;
}

export interface UpdateVatRateInput {
  id: number;
  name?: string;
  rate?: number;
}
