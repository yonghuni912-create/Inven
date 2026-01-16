/**
 * Send notification to Slack
 */
export async function sendSlackNotification(
  webhookUrl: string,
  message: {
    text: string;
    blocks?: any[];
    attachments?: any[];
  }
): Promise<boolean> {
  if (!webhookUrl) {
    console.warn('No Slack webhook URL provided');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}

/**
 * Format alert for stockout risk
 */
export function formatStockoutAlert(
  regionName: string,
  skus: Array<{ sku_code: string; name: string; on_hand: number; rop: number }>
): any {
  return {
    text: `⚠️ Stockout Risk Alert - ${regionName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `⚠️ Stockout Risk - ${regionName}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${skus.length} SKU(s)* below reorder point:`,
        },
      },
      ...skus.slice(0, 10).map(sku => ({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*SKU:* ${sku.sku_code}`,
          },
          {
            type: 'mrkdwn',
            text: `*Name:* ${sku.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*On Hand:* ${sku.on_hand}`,
          },
          {
            type: 'mrkdwn',
            text: `*ROP:* ${sku.rop}`,
          },
        ],
      })),
    ],
  };
}

/**
 * Format deadstock risk alert
 */
export function formatDeadstockAlert(
  regionName: string,
  items: Array<{
    sku_code: string;
    name: string;
    days_to_expiry: number;
    expected_leftover: number;
    suggested_action: string;
  }>
): any {
  return {
    text: `🗑️ Deadstock Risk Alert - ${regionName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🗑️ Deadstock Risk - ${regionName}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${items.length} SKU(s)* at risk within 150 days:`,
        },
      },
      ...items.slice(0, 10).map(item => ({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*SKU:* ${item.sku_code}`,
          },
          {
            type: 'mrkdwn',
            text: `*Days to Expiry:* ${item.days_to_expiry}`,
          },
          {
            type: 'mrkdwn',
            text: `*Expected Leftover:* ${Math.round(item.expected_leftover)}`,
          },
          {
            type: 'mrkdwn',
            text: `*Action:* ${item.suggested_action}`,
          },
        ],
      })),
    ],
  };
}

/**
 * Format emergency order summary
 */
export function formatEmergencyOrderSummary(
  regionName: string,
  date: string,
  stats: {
    total_orders: number;
    emergency_orders: number;
    extra_orders: number;
    emergency_rate: number;
  }
): any {
  return {
    text: `📊 Daily Summary - ${regionName} - ${date}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📊 Daily Summary - ${regionName}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Date:* ${date}`,
          },
          {
            type: 'mrkdwn',
            text: `*Total Orders:* ${stats.total_orders}`,
          },
          {
            type: 'mrkdwn',
            text: `*Emergency Orders:* ${stats.emergency_orders}`,
          },
          {
            type: 'mrkdwn',
            text: `*Extra Orders:* ${stats.extra_orders}`,
          },
          {
            type: 'mrkdwn',
            text: `*Emergency Rate:* ${(stats.emergency_rate * 100).toFixed(1)}%`,
          },
        ],
      },
    ],
  };
}
