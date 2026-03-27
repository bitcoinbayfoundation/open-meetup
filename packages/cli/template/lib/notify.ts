import config from "@/site.config";

// ── Slack ────────────────────────────────────────────────────
const slackToken = process.env.SLACK_BOT_TOKEN;
const isSlack = config.notifications?.provider === "slack" && !!slackToken;

async function sendSlack(text: string) {
  if (!slackToken) return;
  const { WebClient } = await import("@slack/web-api");
  const client = new WebClient(slackToken);
  await client.chat.postMessage({
    channel: config.notifications?.slackChannel ?? "general",
    text,
  });
}

// ── Telegram ─────────────────────────────────────────────────
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;
const isTelegram = config.notifications?.provider === "telegram" && !!telegramToken && !!telegramChatId;

async function sendTelegram(text: string) {
  if (!telegramToken || !telegramChatId) return;
  await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: telegramChatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

// ── Unified API ──────────────────────────────────────────────
export const isNotificationsConfigured = isSlack || isTelegram;

export async function sendNotification(text: string): Promise<void> {
  if (isSlack) return sendSlack(text);
  if (isTelegram) return sendTelegram(text);
}
