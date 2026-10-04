import { AgentMailClient } from "agentmail";

const INBOX_CLIENT_ID = "chetam-inbox-v1";

let cachedInboxId: string | null = null;

function getClient() {
  const apiKey = process.env.AGENTMAIL_API_KEY;
  if (!apiKey) throw new Error("AGENTMAIL_API_KEY is not set");
  return new AgentMailClient({ apiKey });
}

function getAllowlist(): string[] {
  return (process.env.EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailEnabled() {
  return process.env.EMAIL_ENABLED?.trim() === "true";
}

export function isRecipientAllowed(to: string) {
  const allow = getAllowlist();
  return allow.includes(to.trim().toLowerCase());
}

/**
 * Create or reuse the Chetam inbox (idempotent via clientId).
 * @see https://www.agentmail.to/docs/knowledge-base/creating-first-inbox
 * @see https://www.agentmail.to/docs/api-reference/inboxes/create
 */
export async function getOrCreateChetamInbox() {
  if (cachedInboxId) {
    return { inboxId: cachedInboxId };
  }
  const client = getClient();
  const username = (process.env.AGENTMAIL_INBOX_USERNAME || "chetam").trim();
  // AgentMail rejects commas in displayName (validation_error on display_name).
  // TODO(verify): product wants "Chetam, assistant to Aidar" — using dash until allowed.
  const displayName = "Chetam - assistant to Aidar";

  try {
    const inbox = await client.inboxes.create({
      username,
      displayName,
      clientId: INBOX_CLIENT_ID,
    });
    cachedInboxId = inbox.inboxId;
    return {
      inboxId: inbox.inboxId,
      email: inbox.email,
      displayName: inbox.displayName,
    };
  } catch (error) {
    const body =
      error && typeof error === "object" && "body" in error
        ? (error as { body?: { code?: string } }).body
        : undefined;
    const code = body?.code;
    console.error("[agentmail] inboxes.create failed", {
      message: error instanceof Error ? error.message : String(error),
      code,
      raw: error,
    });

    // Username may already exist from a prior run; clientId idempotency did not return it.
    // TODO(verify): whether clientId alone is enough when username collides across retries.
    if (code === "already_exists" || /already exists/i.test(String(error))) {
      const guessedId = `${username}@agentmail.to`;
      try {
        const existing = await client.inboxes.get(guessedId);
        cachedInboxId = existing.inboxId;
        try {
          await client.inboxes.update(existing.inboxId, { displayName });
        } catch (updateErr) {
          console.warn("[agentmail] displayName update skipped", {
            message:
              updateErr instanceof Error ? updateErr.message : String(updateErr),
          });
        }
        return {
          inboxId: existing.inboxId,
          email: existing.email,
          displayName: existing.displayName ?? displayName,
        };
      } catch (getErr) {
        const listed = await client.inboxes.list({ limit: 50 });
        const match = (listed.inboxes ?? []).find(
          (i) =>
            i.clientId === INBOX_CLIENT_ID ||
            i.inboxId === guessedId ||
            i.email === guessedId ||
            i.email?.startsWith(`${username}@`),
        );
        if (match) {
          cachedInboxId = match.inboxId;
          return {
            inboxId: match.inboxId,
            email: match.email,
            displayName: match.displayName ?? displayName,
          };
        }
        console.error("[agentmail] lookup after already_exists failed", {
          get: getErr instanceof Error ? getErr.message : String(getErr),
          listedCount: listed.count ?? listed.inboxes?.length,
        });
      }
    }
    throw error;
  }
}

/**
 * Send email only when EMAIL_ENABLED=true and recipient is on EMAIL_ALLOWLIST.
 * Must only be called after user approval (execute-approved-actions).
 * @see https://www.agentmail.to/docs/api-reference/inboxes/messages/send
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{
  mode: "live" | "blocked" | "disabled";
  messageId?: string;
  reason?: string;
}> {
  if (!isEmailEnabled()) {
    console.info("[agentmail] EMAIL_ENABLED!=true; would send", {
      to: input.to,
      subject: input.subject,
      textPreview: input.text.slice(0, 120),
    });
    return { mode: "disabled", reason: "EMAIL_ENABLED is not true" };
  }

  if (!isRecipientAllowed(input.to)) {
    console.info("[agentmail] recipient not on EMAIL_ALLOWLIST; would send", {
      to: input.to,
      subject: input.subject,
      textPreview: input.text.slice(0, 120),
      allowlistCount: getAllowlist().length,
    });
    return { mode: "blocked", reason: "recipient not in EMAIL_ALLOWLIST" };
  }

  const client = getClient();
  const inbox = await getOrCreateChetamInbox();
  try {
    const sent = await client.inboxes.messages.send(inbox.inboxId, {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    // TODO(verify): confirm messageId field name on SendMessage response
    const messageId =
      (sent as { messageId?: string; message_id?: string }).messageId ??
      (sent as { message_id?: string }).message_id ??
      undefined;
    console.info("[agentmail] sent", {
      inboxId: inbox.inboxId,
      to: input.to,
      messageId,
    });
    return { mode: "live", messageId };
  } catch (error) {
    console.error("[agentmail] messages.send failed", {
      message: error instanceof Error ? error.message : String(error),
      raw: error,
    });
    throw error;
  }
}

export async function pingAgentMail(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    if (!process.env.AGENTMAIL_API_KEY) {
      return { ok: false, error: "AGENTMAIL_API_KEY missing" };
    }
    const inbox = await getOrCreateChetamInbox();
    if (!inbox.inboxId) {
      return { ok: false, error: "inbox create/lookup returned no inboxId" };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AgentMail ping failed",
    };
  }
}
