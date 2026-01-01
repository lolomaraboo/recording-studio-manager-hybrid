import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import type { Client } from '@rsm/database/tenant/schema';

/**
 * Export clients to CSV
 */
export function clientsToCSV(clients: Client[]): string {
  const records = clients.map((client) => ({
    ID: client.id,
    Type: client.type === 'company' ? 'Entreprise' : 'Particulier',
    Prénom: client.firstName || '',
    Nom: client.lastName || '',
    'Nom complet': client.name,
    'Nom artiste': client.artistName || '',
    Email: client.email || '',
    Téléphone: client.phone || '',
    Rue: client.street || '',
    Ville: client.city || '',
    'Code postal': client.postalCode || '',
    Région: client.region || '',
    Pays: client.country || '',
    Anniversaire: client.birthday || '',
    Genre: client.gender || '',
    Notes: client.notes || '',
  }));

  return stringify(records, {
    header: true,
    delimiter: ',',
    quoted: true,
  });
}

/**
 * Parse CSV to clients
 */
export function csvToClients(csvContent: string): Partial<Client>[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row: any) => ({
    type: row.Type === 'Entreprise' ? 'company' : 'individual',
    firstName: row['Prénom'] || undefined,
    lastName: row['Nom'] || undefined,
    name: row['Nom complet'] || '',
    artistName: row['Nom artiste'] || undefined,
    email: row['Email'] || undefined,
    phone: row['Téléphone'] || undefined,
    street: row['Rue'] || undefined,
    city: row['Ville'] || undefined,
    postalCode: row['Code postal'] || undefined,
    region: row['Région'] || undefined,
    country: row['Pays'] || undefined,
    birthday: row['Anniversaire'] || undefined,
    gender: row['Genre'] || undefined,
    notes: row['Notes'] || undefined,
  }));
}
