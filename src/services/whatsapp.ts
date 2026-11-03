import pb from '../api/client';
import type { Settings as SettingsType } from '../types';

export interface WhatsAppConfig {
  token: string;
  phoneId: string;
  isConfigured: boolean;
}

export interface WhatsAppStatus {
  connected: boolean;
  verifiedName?: string;
  displayNumber?: string;
  qualityRating?: string;
  error?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient?: string;
}

/**
 * Fetch WhatsApp credentials from PocketBase settings collection first,
 * and fall back to Vite environment variables if not found in database.
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  let token = import.meta.env.VITE_META_TOKEN || '';
  let phoneId = import.meta.env.VITE_WHATSAPP_PHONE_ID || '';

  try {
    const records = await pb.collection('settings').getFullList();
    if (records.length > 0) {
      const s = records[0] as unknown as SettingsType;
      if (s.whatsappApiKey && s.whatsappApiKey.trim()) {
        token = s.whatsappApiKey.trim();
      }
      if (s.whatsappPhoneNumberId && s.whatsappPhoneNumberId.trim()) {
        phoneId = s.whatsappPhoneNumberId.trim();
      }
    }
  } catch (err) {
    console.warn('Could not load settings from PocketBase, using env fallback:', err);
  }

  return {
    token,
    phoneId,
    isConfigured: Boolean(token && phoneId),
  };
}

/**
 * Clean and format phone number for WhatsApp Meta Cloud API (default India +91)
 */
export function formatPhoneNumber(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    clean = `91${clean}`;
  }
  return clean;
}

/**
 * Send a message via Meta WhatsApp Cloud API using an approved template.
 * Template: hostel_broadcast_notice (language: en, Marketing/Utility) with {{1}} body variable.
 */
export async function sendWhatsAppMessage(
  recipientPhone: string,
  messageText: string,
  templateName: string = 'hostel_broadcast_notice',
  languageCode: string = 'en'
): Promise<SendResult> {
  const config = await getWhatsAppConfig();

  if (!config.isConfigured) {
    return {
      success: false,
      error: 'WhatsApp API credentials missing. Please configure them in Settings or .env file.',
      recipient: recipientPhone,
    };
  }

  const cleanPhone = formatPhoneNumber(recipientPhone);
  if (!cleanPhone || cleanPhone.length < 10) {
    return {
      success: false,
      error: `Invalid phone number: ${recipientPhone}`,
      recipient: recipientPhone,
    };
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: messageText,
            },
          ],
        },
      ],
    },
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${config.phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg =
        data.error?.error_data?.details ||
        data.error?.message ||
        `HTTP ${res.status}: Failed to send WhatsApp message`;
      console.error(`WhatsApp send failed for ${cleanPhone}:`, data);
      return {
        success: false,
        error: errMsg,
        recipient: cleanPhone,
      };
    }

    const messageId = data.messages?.[0]?.id;
    return {
      success: true,
      messageId,
      recipient: cleanPhone,
    };
  } catch (err: any) {
    console.error(`Network error sending WhatsApp to ${cleanPhone}:`, err);
    return {
      success: false,
      error: err.message || 'Network request failed',
      recipient: cleanPhone,
    };
  }
}

/**
 * Check connectivity and details with Meta Graph API
 */
export async function checkWhatsAppConnection(): Promise<WhatsAppStatus> {
  const config = await getWhatsAppConfig();
  if (!config.isConfigured) {
    return { connected: false, error: 'Credentials not configured' };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${config.phoneId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status&access_token=${config.token}`
    );
    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        connected: false,
        error: data.error?.message || 'Failed to authenticate with Meta Graph API',
      };
    }

    return {
      connected: true,
      verifiedName: data.verified_name || "Satabdi Girls' Hostel",
      displayNumber: data.display_phone_number || '',
      qualityRating: data.quality_rating || 'GREEN',
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Connection check failed',
    };
  }
}

/**
 * Send bulk WhatsApp broadcast to a list of phone numbers
 */
export async function sendBulkBroadcast(
  phoneNumbers: string[],
  messageText: string,
  onProgress?: (sentCount: number, total: number) => void
): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  const uniquePhones = Array.from(new Set(phoneNumbers.filter(Boolean)));

  for (let i = 0; i < uniquePhones.length; i++) {
    const phone = uniquePhones[i];
    const res = await sendWhatsAppMessage(phone, messageText);

    if (res.success) {
      successCount++;
    } else {
      failureCount++;
      if (res.error) errors.push(`${phone}: ${res.error}`);
    }

    if (onProgress) {
      onProgress(i + 1, uniquePhones.length);
    }

    // Gentle delay to avoid bursting
    if (i < uniquePhones.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return { successCount, failureCount, errors };
}

