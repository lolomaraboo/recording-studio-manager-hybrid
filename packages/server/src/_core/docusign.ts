/**
 * DocuSign Integration Module
 *
 * Provides e-signature functionality for:
 * - Quotes/Estimates
 * - Contracts
 *
 * Note: This module provides the structure for DocuSign integration.
 * To fully enable, set the following environment variables:
 * - DOCUSIGN_INTEGRATION_KEY
 * - DOCUSIGN_SECRET_KEY
 * - DOCUSIGN_ACCOUNT_ID
 * - DOCUSIGN_USER_ID
 * - DOCUSIGN_BASE_URL (default: https://demo.docusign.net/restapi for sandbox)
 */

interface DocuSignConfig {
  integrationKey: string;
  secretKey: string;
  accountId: string;
  userId: string;
  baseUrl: string;
  redirectUri?: string;
}

interface SignerInfo {
  name: string;
  email: string;
  clientUserId?: string; // For embedded signing
}

interface EnvelopeRequest {
  documentBase64: string;
  documentName: string;
  documentId: string;
  emailSubject: string;
  emailBody?: string;
  signers: SignerInfo[];
  returnUrl?: string; // For embedded signing
}

interface EnvelopeResponse {
  envelopeId: string;
  status: string;
  signingUrl?: string; // For embedded signing
}

interface EnvelopeStatus {
  envelopeId: string;
  status: 'sent' | 'delivered' | 'completed' | 'declined' | 'voided';
  signedAt?: Date;
  signedByName?: string;
  signedByEmail?: string;
}

interface DocuSignEnvelopeData {
  envelopeId: string;
  status: string;
  completedDateTime?: string;
}

interface DocuSignRecipientsData {
  signers?: Array<{ name: string; email: string }>;
}

interface DocuSignViewData {
  url: string;
}

// Get DocuSign config from environment
function getDocuSignConfig(): DocuSignConfig | null {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const secretKey = process.env.DOCUSIGN_SECRET_KEY;
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const userId = process.env.DOCUSIGN_USER_ID;

  if (!integrationKey || !secretKey || !accountId || !userId) {
    return null;
  }

  return {
    integrationKey,
    secretKey,
    accountId,
    userId,
    baseUrl: process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi',
    redirectUri: process.env.DOCUSIGN_REDIRECT_URI,
  };
}

/**
 * Check if DocuSign is configured
 */
export function isDocuSignConfigured(): boolean {
  return getDocuSignConfig() !== null;
}

/**
 * Create an envelope (document for signing) and send for signature
 */
export async function createEnvelope(request: EnvelopeRequest): Promise<EnvelopeResponse | null> {
  const config = getDocuSignConfig();
  if (!config) {
    console.warn('DocuSign not configured - skipping envelope creation');
    return null;
  }

  try {
    // Get access token (in production, implement OAuth flow)
    const accessToken = await getAccessToken(config);
    if (!accessToken) {
      throw new Error('Failed to get DocuSign access token');
    }

    // Build envelope definition
    const envelopeDefinition = {
      emailSubject: request.emailSubject,
      emailBlurb: request.emailBody || 'Please review and sign this document.',
      documents: [
        {
          documentBase64: request.documentBase64,
          name: request.documentName,
          fileExtension: 'pdf',
          documentId: request.documentId,
        },
      ],
      recipients: {
        signers: request.signers.map((signer, index) => ({
          email: signer.email,
          name: signer.name,
          recipientId: (index + 1).toString(),
          routingOrder: (index + 1).toString(),
          clientUserId: signer.clientUserId,
          tabs: {
            signHereTabs: [
              {
                documentId: request.documentId,
                pageNumber: '1',
                recipientId: (index + 1).toString(),
                xPosition: '350',
                yPosition: '650',
              },
            ],
            dateSignedTabs: [
              {
                documentId: request.documentId,
                pageNumber: '1',
                recipientId: (index + 1).toString(),
                xPosition: '350',
                yPosition: '680',
              },
            ],
          },
        })),
      },
      status: 'sent',
    };

    // Create envelope
    const response = await fetch(
      `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(envelopeDefinition),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DocuSign API error: ${error}`);
    }

    const data = await response.json() as DocuSignEnvelopeData;
    const result: EnvelopeResponse = {
      envelopeId: data.envelopeId,
      status: data.status,
    };

    // If embedded signing requested, get the signing URL
    if (request.signers[0]?.clientUserId && request.returnUrl) {
      const signingUrl = await getEmbeddedSigningUrl(
        config,
        accessToken,
        data.envelopeId,
        request.signers[0],
        request.returnUrl
      );
      result.signingUrl = signingUrl ?? undefined;
    }

    return result;
  } catch (error) {
    console.error('DocuSign createEnvelope error:', error);
    return null;
  }
}

/**
 * Get the status of an envelope
 */
export async function getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatus | null> {
  const config = getDocuSignConfig();
  if (!config) {
    return null;
  }

  try {
    const accessToken = await getAccessToken(config);
    if (!accessToken) {
      throw new Error('Failed to get DocuSign access token');
    }

    const response = await fetch(
      `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DocuSign API error: ${response.statusText}`);
    }

    const data = await response.json() as DocuSignEnvelopeData;

    const status: EnvelopeStatus = {
      envelopeId: data.envelopeId,
      status: data.status as EnvelopeStatus['status'],
    };

    // If completed, get signer info
    if (data.status === 'completed' && data.completedDateTime) {
      status.signedAt = new Date(data.completedDateTime);

      // Get recipients to find signer info
      const recipientsResponse = await fetch(
        `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}/recipients`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (recipientsResponse.ok) {
        const recipientsData = await recipientsResponse.json() as DocuSignRecipientsData;
        const signer = recipientsData.signers?.[0];
        if (signer) {
          status.signedByName = signer.name;
          status.signedByEmail = signer.email;
        }
      }
    }

    return status;
  } catch (error) {
    console.error('DocuSign getEnvelopeStatus error:', error);
    return null;
  }
}

/**
 * Void (cancel) an envelope
 */
export async function voidEnvelope(
  envelopeId: string,
  voidedReason: string = 'Document voided by sender'
): Promise<boolean> {
  const config = getDocuSignConfig();
  if (!config) {
    return false;
  }

  try {
    const accessToken = await getAccessToken(config);
    if (!accessToken) {
      throw new Error('Failed to get DocuSign access token');
    }

    const response = await fetch(
      `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          status: 'voided',
          voidedReason,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('DocuSign voidEnvelope error:', error);
    return false;
  }
}

/**
 * Resend envelope notification
 */
export async function resendEnvelope(envelopeId: string): Promise<boolean> {
  const config = getDocuSignConfig();
  if (!config) {
    return false;
  }

  try {
    const accessToken = await getAccessToken(config);
    if (!accessToken) {
      throw new Error('Failed to get DocuSign access token');
    }

    const response = await fetch(
      `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}?resend_envelope=true`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('DocuSign resendEnvelope error:', error);
    return false;
  }
}

/**
 * Download the signed document
 */
export async function downloadSignedDocument(
  envelopeId: string,
  documentId: string = '1'
): Promise<Buffer | null> {
  const config = getDocuSignConfig();
  if (!config) {
    return null;
  }

  try {
    const accessToken = await getAccessToken(config);
    if (!accessToken) {
      throw new Error('Failed to get DocuSign access token');
    }

    const response = await fetch(
      `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}/documents/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DocuSign API error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('DocuSign downloadSignedDocument error:', error);
    return null;
  }
}

// Helper: Get access token (simplified - in production use OAuth flow with JWT)
async function getAccessToken(config: DocuSignConfig): Promise<string | null> {
  // In a real implementation, you would:
  // 1. Use JWT Grant for server-to-server authentication
  // 2. Cache the token and refresh when expired
  // 3. Handle consent flow for first-time authorization

  // For now, return the secret key if it looks like an access token
  // In production, implement proper JWT authentication
  if (config.secretKey.length > 100) {
    return config.secretKey;
  }

  console.warn('DocuSign: Implement proper JWT authentication for production');
  return null;
}

// Helper: Get embedded signing URL
async function getEmbeddedSigningUrl(
  config: DocuSignConfig,
  accessToken: string,
  envelopeId: string,
  signer: SignerInfo,
  returnUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}/views/recipient`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          returnUrl,
          authenticationMethod: 'none',
          email: signer.email,
          userName: signer.name,
          clientUserId: signer.clientUserId,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as DocuSignViewData;
    return data.url;
  } catch (error) {
    console.error('DocuSign getEmbeddedSigningUrl error:', error);
    return null;
  }
}

export type { DocuSignConfig, SignerInfo, EnvelopeRequest, EnvelopeResponse, EnvelopeStatus };
