/**
 * Test data fixtures for E2E tests
 * Provides reusable test data generators
 */

/**
 * Generate unique test email
 */
export function generateEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}@example.com`;
}

/**
 * Generate unique studio name
 */
export function generateStudioName(): string {
  const timestamp = Date.now();
  return `Test Studio ${timestamp}`;
}

/**
 * Generate unique project name
 */
export function generateProjectName(prefix: string = 'Project'): string {
  const timestamp = Date.now();
  return `${prefix} ${timestamp}`;
}

/**
 * Sample client data
 */
export function getClientData(overrides?: Partial<ClientData>): ClientData {
  return {
    name: `Test Client ${Date.now()}`,
    email: generateEmail('client'),
    phone: '+1234567890',
    company: 'Test Company',
    ...overrides,
  };
}

export interface ClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

/**
 * Sample session data
 */
export function getSessionData(overrides?: Partial<SessionData>): SessionData {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    date: tomorrow.toISOString().split('T')[0],
    time: '14:00',
    duration: 2,
    ...overrides,
  };
}

export interface SessionData {
  date: string;
  time: string;
  duration: number;
}

/**
 * Sample project data
 */
export function getProjectData(overrides?: Partial<ProjectData>): ProjectData {
  return {
    name: generateProjectName('Album'),
    genre: 'Rock',
    budget: 10000,
    ...overrides,
  };
}

export interface ProjectData {
  name: string;
  genre?: string;
  budget?: number;
}

/**
 * Sample track data
 */
export function getTrackData(overrides?: Partial<TrackData>): TrackData {
  return {
    title: `Track ${Date.now()}`,
    bpm: 120,
    key: 'C',
    ...overrides,
  };
}

export interface TrackData {
  title: string;
  bpm?: number;
  key?: string;
}

/**
 * Sample room data
 */
export function getRoomData(overrides?: Partial<RoomData>): RoomData {
  return {
    name: `Studio ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    hourlyRate: 50,
    capacity: 4,
    ...overrides,
  };
}

export interface RoomData {
  name: string;
  hourlyRate: number;
  capacity?: number;
}

/**
 * Sample equipment data
 */
export function getEquipmentData(overrides?: Partial<EquipmentData>): EquipmentData {
  return {
    name: `Equipment ${Date.now()}`,
    type: 'Microphone',
    serialNumber: `SN${Date.now()}`,
    ...overrides,
  };
}

export interface EquipmentData {
  name: string;
  type: string;
  serialNumber?: string;
}

/**
 * Sample invoice data
 */
export function getInvoiceData(overrides?: Partial<InvoiceData>): InvoiceData {
  return {
    description: `Invoice ${Date.now()}`,
    amount: 200,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ...overrides,
  };
}

export interface InvoiceData {
  description: string;
  amount: number;
  dueDate?: string;
}

/**
 * Sample talent data
 */
export function getTalentData(overrides?: Partial<TalentData>): TalentData {
  return {
    name: `Talent ${Date.now()}`,
    role: 'Vocalist',
    email: generateEmail('talent'),
    ...overrides,
  };
}

export interface TalentData {
  name: string;
  role: string;
  email?: string;
}

/**
 * Sample quote data
 */
export function getQuoteData(overrides?: Partial<QuoteData>): QuoteData {
  return {
    description: `Quote ${Date.now()}`,
    amount: 500,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ...overrides,
  };
}

export interface QuoteData {
  description: string;
  amount: number;
  validUntil?: string;
}

/**
 * Sample contract data
 */
export function getContractData(overrides?: Partial<ContractData>): ContractData {
  return {
    title: `Contract ${Date.now()}`,
    type: 'Recording Agreement',
    ...overrides,
  };
}

export interface ContractData {
  title: string;
  type: string;
}

/**
 * Sample expense data
 */
export function getExpenseData(overrides?: Partial<ExpenseData>): ExpenseData {
  return {
    description: `Expense ${Date.now()}`,
    amount: 100,
    category: 'Equipment',
    date: new Date().toISOString().split('T')[0],
    ...overrides,
  };
}

export interface ExpenseData {
  description: string;
  amount: number;
  category?: string;
  date?: string;
}
