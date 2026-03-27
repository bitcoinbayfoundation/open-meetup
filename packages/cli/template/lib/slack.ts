import { WebClient } from "@slack/web-api";

export const isSlackConfigured = !!process.env.SLACK_BOT_TOKEN;

const slack = isSlackConfigured
  ? new WebClient(process.env.SLACK_BOT_TOKEN)
  : null;

export async function sendSlackMessage(
  channel: string,
  text: string,
  blocks?: Record<string, unknown>[],
) {
  if (!slack) return;

  await slack.chat.postMessage({
    channel,
    text,
    ...(blocks && { blocks }),
  });
}
