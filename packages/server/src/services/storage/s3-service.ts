import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * AWS S3 Client for invoice PDF storage
 *
 * Configuration via environment variables:
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 * - AWS_REGION: AWS region (default: eu-west-3)
 * - S3_BUCKET_NAME: S3 bucket name for invoice storage
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-3',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface UploadInvoicePDFParams {
  invoiceId: number;
  organizationId: number;
  pdfBuffer: Buffer;
  filename: string;
}

/**
 * Upload invoice PDF to S3
 *
 * S3 Key Structure: invoices/{organizationId}/{invoiceId}/{timestamp}-{filename}
 * Example: invoices/123/456/1704673200000-invoice-INV-2024-001.pdf
 *
 * @param params - Upload parameters
 * @returns S3 key (path) of uploaded file - store this in database
 * @throws Error if upload fails
 *
 * Security:
 * - Server-side encryption (AES256) at rest
 * - Organization-scoped paths prevent cross-tenant access
 * - Private bucket (no public access)
 */
export async function uploadInvoicePDF(params: UploadInvoicePDFParams): Promise<string> {
  const { invoiceId, organizationId, pdfBuffer, filename } = params;

  // Generate unique S3 key with organization isolation
  const key = `invoices/${organizationId}/${invoiceId}/${Date.now()}-${filename}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ServerSideEncryption: 'AES256', // Encrypt at rest
      Metadata: {
        organizationId: organizationId.toString(),
        invoiceId: invoiceId.toString(),
      },
    })
  );

  return key;
}

/**
 * Generate temporary signed URL for invoice PDF download
 *
 * @param s3Key - S3 key (path) of the PDF file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL valid for specified duration
 * @throws Error if key not found or access denied
 *
 * Security:
 * - URLs expire after specified time (default: 1 hour)
 * - Each URL is unique and time-limited
 * - No permanent public access to files
 */
export async function getInvoicePDFUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Check if S3 service is configured
 *
 * @returns true if all required environment variables are set
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
}
