import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import type { InvoiceWithLineItems } from '../services/email/resend-service';

interface InvoiceEmailProps {
  invoice: InvoiceWithLineItems;
}

/**
 * Invoice Email Template
 *
 * Professional invoice email using React Email components
 * Displays invoice details, line items, and payment information
 */
export function InvoiceEmail({ invoice }: InvoiceEmailProps) {
  const formattedIssueDate = new Date(invoice.issueDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            {/* Header */}
            <Text style={styles.heading}>
              Invoice #{invoice.invoiceNumber}
            </Text>
            <Hr style={styles.hr} />

            {/* Invoice Info */}
            <Section style={styles.infoSection}>
              <Row>
                <Column>
                  <Text style={styles.label}>Issue Date:</Text>
                  <Text style={styles.value}>{formattedIssueDate}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Due Date:</Text>
                  <Text style={styles.value}>{formattedDueDate}</Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={styles.label}>Status:</Text>
                  <Text style={styles.statusValue}>{invoice.status.toUpperCase()}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Amount Due:</Text>
                  <Text style={styles.amountValue}>{invoice.total}€</Text>
                </Column>
              </Row>
            </Section>

            <Hr style={styles.hr} />

            {/* Client Info */}
            <Section style={styles.clientSection}>
              <Text style={styles.sectionTitle}>Bill To:</Text>
              <Text style={styles.clientName}>{invoice.client.name}</Text>
              {invoice.client.email && (
                <Text style={styles.clientDetail}>Email: {invoice.client.email}</Text>
              )}
              {invoice.client.address && (
                <Text style={styles.clientDetail}>{invoice.client.address}</Text>
              )}
              {invoice.client.city && invoice.client.country && (
                <Text style={styles.clientDetail}>
                  {invoice.client.city}, {invoice.client.country}
                </Text>
              )}
            </Section>

            <Hr style={styles.hr} />

            {/* Line Items */}
            <Section style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Invoice Details:</Text>

              {/* Table Header */}
              <Row style={styles.tableHeader}>
                <Column style={styles.descriptionColumn}>
                  <Text style={styles.tableHeaderText}>Description</Text>
                </Column>
                <Column style={styles.qtyColumn}>
                  <Text style={styles.tableHeaderText}>Qty</Text>
                </Column>
                <Column style={styles.priceColumn}>
                  <Text style={styles.tableHeaderText}>Unit Price</Text>
                </Column>
                <Column style={styles.amountColumn}>
                  <Text style={styles.tableHeaderText}>Amount</Text>
                </Column>
              </Row>

              {/* Table Rows */}
              {invoice.items.map((item, index) => (
                <Row key={index} style={styles.tableRow}>
                  <Column style={styles.descriptionColumn}>
                    <Text style={styles.itemText}>{item.description}</Text>
                  </Column>
                  <Column style={styles.qtyColumn}>
                    <Text style={styles.itemText}>{item.quantity}</Text>
                  </Column>
                  <Column style={styles.priceColumn}>
                    <Text style={styles.itemText}>{item.unitPrice}€</Text>
                  </Column>
                  <Column style={styles.amountColumn}>
                    <Text style={styles.itemText}>{item.amount}€</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr style={styles.hr} />

            {/* Totals */}
            <Section style={styles.totalsSection}>
              <Row>
                <Column style={styles.totalsLabelColumn}>
                  <Text style={styles.totalsLabel}>Subtotal:</Text>
                </Column>
                <Column style={styles.totalsValueColumn}>
                  <Text style={styles.totalsValue}>{invoice.subtotal}€</Text>
                </Column>
              </Row>
              <Row>
                <Column style={styles.totalsLabelColumn}>
                  <Text style={styles.totalsLabel}>Tax ({invoice.taxRate}%):</Text>
                </Column>
                <Column style={styles.totalsValueColumn}>
                  <Text style={styles.totalsValue}>{invoice.taxAmount}€</Text>
                </Column>
              </Row>
              <Row style={styles.totalRow}>
                <Column style={styles.totalsLabelColumn}>
                  <Text style={styles.totalLabel}>Total:</Text>
                </Column>
                <Column style={styles.totalsValueColumn}>
                  <Text style={styles.totalValue}>{invoice.total}€</Text>
                </Column>
              </Row>
            </Section>

            {/* Deposit Information (if applicable) */}
            {invoice.depositAmount && (
              <>
                <Hr style={styles.hr} />
                <Section style={styles.depositSection}>
                  <Text style={styles.sectionTitle}>Payment Information:</Text>
                  <Row>
                    <Column>
                      <Text style={styles.depositLabel}>Deposit Amount:</Text>
                      <Text style={styles.depositValue}>{invoice.depositAmount}€</Text>
                    </Column>
                    <Column>
                      <Text style={styles.depositLabel}>Remaining Balance:</Text>
                      <Text style={styles.depositValue}>{invoice.remainingBalance}€</Text>
                    </Column>
                  </Row>
                  {invoice.depositPaidAt && (
                    <Text style={styles.depositPaid}>
                      ✓ Deposit paid on {new Date(invoice.depositPaidAt).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </Section>
              </>
            )}

            {/* Notes */}
            {invoice.notes && (
              <>
                <Hr style={styles.hr} />
                <Section style={styles.notesSection}>
                  <Text style={styles.sectionTitle}>Notes:</Text>
                  <Text style={styles.notesText}>{invoice.notes}</Text>
                </Section>
              </>
            )}

            {/* Footer */}
            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              Thank you for your business!
            </Text>
            <Text style={styles.footerSmall}>
              This is an automated email. Please do not reply directly to this message.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    margin: '0 auto',
    padding: '20px 0',
    maxWidth: '600px',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  hr: {
    borderColor: '#e1e8ed',
    margin: '20px 0',
  },
  infoSection: {
    marginBottom: '16px',
  },
  label: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 4px 0',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
  },
  value: {
    fontSize: '14px',
    color: '#1a1a1a',
    margin: '0 0 12px 0',
  },
  statusValue: {
    fontSize: '14px',
    color: '#059669',
    margin: '0 0 12px 0',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: '18px',
    color: '#1a1a1a',
    margin: '0 0 12px 0',
    fontWeight: '700',
  },
  clientSection: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4b5563',
    margin: '0 0 12px 0',
  },
  clientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 4px 0',
  },
  clientDetail: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 2px 0',
  },
  itemsSection: {
    marginBottom: '16px',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    padding: '8px 0',
    borderRadius: '4px',
  },
  tableHeaderText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#4b5563',
    margin: 0,
    textTransform: 'uppercase' as const,
  },
  tableRow: {
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  descriptionColumn: {
    width: '45%',
    paddingRight: '8px',
  },
  qtyColumn: {
    width: '15%',
    textAlign: 'center' as const,
  },
  priceColumn: {
    width: '20%',
    textAlign: 'right' as const,
  },
  amountColumn: {
    width: '20%',
    textAlign: 'right' as const,
  },
  itemText: {
    fontSize: '14px',
    color: '#1a1a1a',
    margin: 0,
  },
  totalsSection: {
    marginBottom: '16px',
  },
  totalsLabelColumn: {
    width: '70%',
    textAlign: 'right' as const,
    paddingRight: '16px',
  },
  totalsValueColumn: {
    width: '30%',
    textAlign: 'right' as const,
  },
  totalsLabel: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0',
  },
  totalsValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    margin: '4px 0',
  },
  totalRow: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '2px solid #e1e8ed',
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '4px 0',
  },
  totalValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '4px 0',
  },
  depositSection: {
    marginBottom: '16px',
  },
  depositLabel: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 4px 0',
    fontWeight: '500',
  },
  depositValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    margin: '0 0 12px 0',
    fontWeight: '600',
  },
  depositPaid: {
    fontSize: '14px',
    color: '#059669',
    margin: '8px 0 0 0',
    fontWeight: '600',
  },
  notesSection: {
    marginBottom: '16px',
  },
  notesText: {
    fontSize: '14px',
    color: '#4b5563',
    margin: 0,
    lineHeight: '1.6',
  },
  footer: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center' as const,
    margin: '16px 0 8px 0',
  },
  footerSmall: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    margin: 0,
  },
};

export default InvoiceEmail;
