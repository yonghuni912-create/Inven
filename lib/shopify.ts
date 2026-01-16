import crypto from 'crypto';

/**
 * Verify Shopify webhook HMAC
 */
export function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  
  return hash === hmacHeader;
}

/**
 * Shopify API client helper
 */
export interface ShopifyConfig {
  shop_domain: string;
  admin_token: string;
}

export class ShopifyClient {
  private config: ShopifyConfig;
  private baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.config = config;
    this.baseUrl = `https://${config.shop_domain}/admin/api/2024-01`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': this.config.admin_token,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async registerWebhook(topic: string, address: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': this.config.admin_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic,
          address,
          format: 'json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register webhook: ${response.statusText}`);
    }

    return response.json();
  }

  async fetchOrders(since?: string, limit: number = 250): Promise<any[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      status: 'any',
    });

    if (since) {
      params.append('updated_at_min', since);
    }

    const response = await fetch(`${this.baseUrl}/orders.json?${params}`, {
      headers: {
        'X-Shopify-Access-Token': this.config.admin_token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders || [];
  }

  async fetchOrder(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}.json`, {
      headers: {
        'X-Shopify-Access-Token': this.config.admin_token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }

    const data = await response.json();
    return data.order;
  }
}
