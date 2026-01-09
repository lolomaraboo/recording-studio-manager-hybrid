import ExcelJS from 'exceljs';
import type { Client } from '@rsm/database/tenant/schema';

/**
 * Export clients to Excel
 */
export async function clientsToExcel(clients: Client[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clients');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Prénom', key: 'firstName', width: 15 },
    { header: 'Nom', key: 'lastName', width: 15 },
    { header: 'Nom complet', key: 'name', width: 25 },
    { header: 'Nom artiste', key: 'artistName', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Téléphone', key: 'phone', width: 15 },
    { header: 'Rue', key: 'street', width: 30 },
    { header: 'Ville', key: 'city', width: 20 },
    { header: 'Code postal', key: 'postalCode', width: 12 },
    { header: 'Région', key: 'region', width: 20 },
    { header: 'Pays', key: 'country', width: 15 },
    { header: 'Anniversaire', key: 'birthday', width: 15 },
    { header: 'Genre', key: 'gender', width: 10 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCCCCCC' },
  };

  // Add data rows
  clients.forEach((client) => {
    worksheet.addRow({
      id: client.id,
      type: client.type === 'company' ? 'Entreprise' : 'Particulier',
      firstName: client.firstName,
      lastName: client.lastName,
      name: client.name,
      artistName: client.artistName,
      email: client.email,
      phone: client.phone,
      street: client.street,
      city: client.city,
      postalCode: client.postalCode,
      region: client.region,
      country: client.country,
      birthday: client.birthday,
      gender: client.gender,
      notes: client.notes,
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Parse Excel file to clients
 */
export async function excelToClients(fileBuffer: Buffer): Promise<Partial<Client>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer as any);

  const worksheet = workbook.getWorksheet('Clients') || workbook.worksheets[0];
  const clients: Partial<Client>[] = [];

  // Skip header row
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const client: Partial<Client> = {
      type: row.getCell(2).value === 'Entreprise' ? 'company' : 'individual',
      firstName: row.getCell(3).value?.toString(),
      lastName: row.getCell(4).value?.toString(),
      name: row.getCell(5).value?.toString() || '',
      artistName: row.getCell(6).value?.toString(),
      email: row.getCell(7).value?.toString(),
      phone: row.getCell(8).value?.toString(),
      street: row.getCell(9).value?.toString(),
      city: row.getCell(10).value?.toString(),
      postalCode: row.getCell(11).value?.toString(),
      region: row.getCell(12).value?.toString(),
      country: row.getCell(13).value?.toString(),
      birthday: row.getCell(14).value?.toString(),
      gender: row.getCell(15).value?.toString(),
      notes: row.getCell(16).value?.toString(),
    };

    if (client.name) {
      clients.push(client);
    }
  });

  return clients;
}

/**
 * Generate Excel template for import
 */
export async function generateExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clients');

  // Same columns as export
  worksheet.columns = [
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Prénom', key: 'firstName', width: 15 },
    { header: 'Nom', key: 'lastName', width: 15 },
    { header: 'Nom complet', key: 'name', width: 25 },
    { header: 'Nom artiste', key: 'artistName', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Téléphone', key: 'phone', width: 15 },
    { header: 'Rue', key: 'street', width: 30 },
    { header: 'Ville', key: 'city', width: 20 },
    { header: 'Code postal', key: 'postalCode', width: 12 },
    { header: 'Région', key: 'region', width: 20 },
    { header: 'Pays', key: 'country', width: 15 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCCCCCC' },
  };

  // Add example rows
  worksheet.addRow({
    type: 'Particulier',
    firstName: 'Jean',
    lastName: 'Dupont',
    name: 'Jean Dupont',
    artistName: 'DJ Jean',
    email: 'jean@example.com',
    phone: '+33 6 12 34 56 78',
    street: '123 Rue de la Musique',
    city: 'Paris',
    postalCode: '75001',
    region: 'Île-de-France',
    country: 'France',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
