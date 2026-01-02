import type { Client, ClientContact } from '@rsm/database/tenant/schema';

/**
 * Convert Client to vCard 4.0 string
 */
export function clientToVCard(client: Client, contacts?: ClientContact[]): string {
  const lines: string[] = [];

  // Begin vCard
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:4.0');

  // FN - Formatted Name (required)
  lines.push(`FN:${escapeVCardValue(client.name)}`);

  // N - Structured Name
  if (client.firstName || client.lastName) {
    const n = [
      escapeVCardValue(client.lastName || ''),
      escapeVCardValue(client.firstName || ''),
      escapeVCardValue(client.middleName || ''),
      escapeVCardValue(client.prefix || ''),
      escapeVCardValue(client.suffix || ''),
    ].join(';');
    lines.push(`N:${n}`);
  }

  // NICKNAME - Artist Name
  if (client.artistName) {
    lines.push(`NICKNAME:${escapeVCardValue(client.artistName)}`);
  }

  // TEL - Phone Numbers
  if (client.phones && Array.isArray(client.phones) && client.phones.length > 0) {
    client.phones.forEach((phone: any) => {
      const type = phone.type || 'voice';
      lines.push(`TEL;TYPE=${type}:${escapeVCardValue(phone.number)}`);
    });
  } else if (client.phone) {
    lines.push(`TEL:${escapeVCardValue(client.phone)}`);
  }

  // EMAIL - Email Addresses
  if (client.emails && Array.isArray(client.emails) && client.emails.length > 0) {
    client.emails.forEach((email: any) => {
      const type = email.type || 'internet';
      lines.push(`EMAIL;TYPE=${type}:${escapeVCardValue(email.email)}`);
    });
  } else if (client.email) {
    lines.push(`EMAIL:${escapeVCardValue(client.email)}`);
  }

  // URL - Websites
  if (client.websites && Array.isArray(client.websites) && client.websites.length > 0) {
    client.websites.forEach((website: any) => {
      lines.push(`URL:${escapeVCardValue(website.url)}`);
    });
  }

  // ADR - Address
  if (client.street || client.city || client.country) {
    const adr = [
      '', // PO Box
      '', // Extended Address
      escapeVCardValue(client.street || ''),
      escapeVCardValue(client.city || ''),
      escapeVCardValue(client.region || ''),
      escapeVCardValue(client.postalCode || ''),
      escapeVCardValue(client.country || ''),
    ].join(';');
    lines.push(`ADR:${adr}`);
  }

  // BDAY - Birthday
  if (client.birthday) {
    lines.push(`BDAY:${client.birthday}`);
  }

  // GENDER
  if (client.gender) {
    lines.push(`GENDER:${client.gender}`);
  }

  // PHOTO - Avatar URL (external reference)
  if (client.avatarUrl) {
    lines.push(`PHOTO;MEDIATYPE=image/jpeg:${escapeVCardValue(client.avatarUrl)}`);
  }

  // LOGO - Company Logo (external reference)
  if (client.logoUrl) {
    lines.push(`LOGO;MEDIATYPE=image/png:${escapeVCardValue(client.logoUrl)}`);
  }

  // ORG - Organization (for companies)
  if (client.type === 'company') {
    lines.push(`ORG:${escapeVCardValue(client.name)}`);
  }

  // KIND - Type of entity
  lines.push(`KIND:${client.type === 'company' ? 'org' : 'individual'}`);

  // NOTE - Notes
  if (client.notes) {
    lines.push(`NOTE:${escapeVCardValue(client.notes)}`);
  }

  // Custom fields as extended properties
  if (client.customFields && Array.isArray(client.customFields) && client.customFields.length > 0) {
    client.customFields.forEach((field: any) => {
      const propName = `X-${field.label.toUpperCase().replace(/\s+/g, '-')}`;
      lines.push(`${propName}:${escapeVCardValue(String(field.value))}`);
    });
  }

  // End vCard
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

/**
 * Parse vCard to Client data (simplified parser)
 */
export function vCardToClient(vcardString: string): Partial<Client> {
  const client: Partial<Client> = {
    type: 'individual',
  };

  const lines = vcardString.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('BEGIN:') || trimmed.startsWith('END:')) {
      continue;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const propPart = trimmed.substring(0, colonIndex);
    const value = unescapeVCardValue(trimmed.substring(colonIndex + 1));

    // Split property and parameters
    const [propName, ...params] = propPart.split(';');

    switch (propName) {
      case 'FN':
        client.name = value;
        break;

      case 'N': {
        const [lastName, firstName, middleName, prefix, suffix] = value.split(';');
        client.lastName = lastName || undefined;
        client.firstName = firstName || undefined;
        client.middleName = middleName || undefined;
        client.prefix = prefix || undefined;
        client.suffix = suffix || undefined;
        break;
      }

      case 'NICKNAME':
        client.artistName = value;
        break;

      case 'TEL':
        if (!client.phones) client.phones = [];
        const telType = params.find(p => p.startsWith('TYPE='))?.split('=')[1] || 'voice';
        (client.phones as any).push({ type: telType, number: value });
        if (!client.phone) client.phone = value;
        break;

      case 'EMAIL':
        if (!client.emails) client.emails = [];
        const emailType = params.find(p => p.startsWith('TYPE='))?.split('=')[1] || 'internet';
        (client.emails as any).push({ type: emailType, email: value });
        if (!client.email) client.email = value;
        break;

      case 'URL':
        if (!client.websites) client.websites = [];
        (client.websites as any).push({ type: 'website', url: value });
        break;

      case 'ADR': {
        const [, , street, city, region, postalCode, country] = value.split(';');
        client.street = street || undefined;
        client.city = city || undefined;
        client.region = region || undefined;
        client.postalCode = postalCode || undefined;
        client.country = country || undefined;
        break;
      }

      case 'BDAY':
        client.birthday = value;
        break;

      case 'GENDER':
        client.gender = value;
        break;

      case 'NOTE':
        client.notes = value;
        break;

      case 'KIND':
        client.type = value === 'org' ? 'company' : 'individual';
        break;

      case 'ORG':
        if (!client.name) client.name = value;
        break;

      default:
        // Custom fields (X- properties)
        if (propName.startsWith('X-')) {
          if (!client.customFields) client.customFields = [];
          const label = propName.substring(2).replace(/-/g, ' ');
          (client.customFields as any).push({
            label,
            type: 'text',
            value,
          });
        }
        break;
    }
  }

  // Validation RFC 6350: FN (Formatted Name) est OBLIGATOIRE et ne peut pas être vide
  if (!client.name || client.name.trim() === '') {
    throw new Error('vCard invalide: champ FN (Formatted Name) requis selon RFC 6350');
  }

  return client;
}

/**
 * Parse multiple vCards from .vcf file
 */
export function parseVCardFile(fileContent: string): Partial<Client>[] {
  const clients: Partial<Client>[] = [];

  // Split by BEGIN:VCARD
  const vcards = fileContent.split(/BEGIN:VCARD/i).filter(s => s.trim());

  vcards.forEach((vcardText, index) => {
    try {
      const fullVCard = 'BEGIN:VCARD' + vcardText;
      const client = vCardToClient(fullVCard);
      clients.push(client);
    } catch (error) {
      // Log mais continue le parsing des autres vCards
      console.warn(`[vCard] Parsing skipped for vCard #${index + 1}:`, error instanceof Error ? error.message : error);
    }
  });

  return clients;
}

/**
 * Escape special characters in vCard values
 */
function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Unescape special characters in vCard values
 */
function unescapeVCardValue(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}
