const crypto = require("node:crypto");
const { allowCors, normalizeEmail, readJsonBody, sendJson, supabaseRequest } = require("../server/supabase");

const resendApiUrl = "https://api.resend.com/emails";

module.exports = async function handler(request, response) {
  if (allowCors(request, response)) return;

  try {
    if (request.method === "GET") return getChallenge(request, response);
    if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });

    const body = await readJsonBody(request);
    if (body.action === "opened") return markOpened(body, response);
    if (body.action === "completed") return markCompleted(body, response);
    return createChallenge(body, response);
  } catch (error) {
    console.error("treasure_challenge_request_failed", {
      message: error instanceof Error ? error.message : String(error),
      method: request.method
    });
    return sendJson(response, 500, { error: "Treasure challenge request failed", message: safeError(error) });
  }
};

async function createChallenge(body, response) {
  const senderEmail = normalizeEmail(body.senderEmail);
  const friendEmail = normalizeEmail(body.friendEmail);
  const friendPhone = String(body.friendPhone || "").replace(/\D/g, "");
  const senderName = cleanText(body.senderName, "A friend");
  const friendName = cleanText(body.friendName, "friend");
  const note = cleanText(body.note, "");
  const tiles = Array.isArray(body.tiles) ? body.tiles.map(String).slice(0, 5) : [];
  const origin = validOrigin(body.origin) || "https://intuisity.com";
  const competitionId = validUuid(body.competitionId) ? body.competitionId : crypto.randomUUID();

  if (!validEmail(senderEmail)) {
    return sendJson(response, 400, { error: "A valid sender email address is required" });
  }
  if (!friendEmail && !friendPhone) {
    return sendJson(response, 400, { error: "A friend phone number or email address is required" });
  }
  if (friendEmail && !validEmail(friendEmail)) {
    return sendJson(response, 400, { error: "Enter a valid friend email address" });
  }
  if (friendPhone && friendPhone.length !== 10) {
    return sendJson(response, 400, { error: "Enter a valid 10-digit friend phone number" });
  }
  if (tiles.length !== 5 || tiles.some((tile) => !tile)) {
    return sendJson(response, 400, { error: "Five treasure tiles are required" });
  }

  const id = crypto.randomUUID();
  const senderToken = crypto.randomBytes(24).toString("hex");
  const now = new Date().toISOString();
  const challengeUrl = `${origin}/?treasureInvite=1&challenge=${encodeURIComponent(id)}`;

  await supabaseRequest("/treasure_challenges", {
    method: "POST",
    body: JSON.stringify({
      id,
      competition_id: competitionId,
      sender_token: senderToken,
      sender_email: senderEmail,
      sender_name: senderName,
      friend_email: friendEmail,
      friend_name: friendName,
      tiles,
      note,
      status: "sent",
      sent_at: now,
      updated_at: now
    })
  });

  if (!friendEmail) {
    await updateChallenge(id, { invite_delivery_status: "share_required", updated_at: new Date().toISOString() });
    console.info("treasure_challenge_text_link_created", { challengeId: id });
    return sendJson(response, 201, { id, senderToken, status: "sent", emailDeliveryStatus: "share_required" });
  }

  try {
    const pushToken = await findExpoPushToken(friendEmail);
    const pushDeliveryId = pushToken ? await sendExpoPush({ challengeUrl, friendName, pushToken, senderName }) : "";
    const deliveryId = await sendEmail({
      to: friendEmail,
      subject: `Can you unlock ${senderName}'s Treasure Chest?`,
      html: inviteHtml({ challengeUrl, friendName, note, senderName }),
      text: `Hi ${friendName},\n\n${senderName} created an Intuisity Treasure Chest challenge just for you. Trust your first impression, arrange the five treasures, and see if you can unlock the hidden order in four tries.\n\n${note ? `A note from ${senderName}: “${note}”\n\n` : ""}Play the challenge: ${challengeUrl}\n\nNo account is needed to accept this challenge. Have fun!\n\n— Intuisity\nAwaken Your Intuition`
    });
    await updateChallenge(id, { invite_delivery_id: deliveryId, invite_delivery_status: "sent", updated_at: new Date().toISOString() });
    console.info("treasure_challenge_invite_sent", { challengeId: id, deliveryId, pushDeliveryId: pushDeliveryId || null, recipient: maskEmail(friendEmail) });
  } catch (error) {
    const emailError = safeError(error);
    await updateChallenge(id, { email_error: emailError, invite_delivery_status: "failed", updated_at: new Date().toISOString() }).catch(() => {});
    console.warn("treasure_challenge_invite_delivery_failed", { challengeId: id, recipient: maskEmail(friendEmail), emailError });
    return sendJson(response, 201, { id, senderToken, status: "sent", emailDeliveryStatus: "failed", emailError });
  }

  return sendJson(response, 201, { id, senderToken, status: "sent", emailDeliveryStatus: "sent" });
}

async function getChallenge(request, response) {
  const id = String(request.query?.id || new URL(request.url || "", "https://intuisity.com").searchParams.get("id") || "");
  const senderToken = String(request.query?.senderToken || new URL(request.url || "", "https://intuisity.com").searchParams.get("senderToken") || "");
  if (!id) return sendJson(response, 400, { error: "Challenge id is required" });
  const rows = await supabaseRequest(`/treasure_challenges?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  const row = rows?.[0];
  if (!row) return sendJson(response, 404, { error: "Challenge not found" });

  if (senderToken && senderToken === row.sender_token) {
    if (row.invite_delivery_id) {
      try {
        const latestDeliveryStatus = await getEmailDeliveryStatus(row.invite_delivery_id);
        if (latestDeliveryStatus && latestDeliveryStatus !== row.invite_delivery_status) {
          row.invite_delivery_status = latestDeliveryStatus;
          await updateChallenge(row.id, { invite_delivery_status: latestDeliveryStatus, updated_at: new Date().toISOString() });
        }
      } catch (error) {
        console.warn("treasure_invite_delivery_check_failed", { challengeId: row.id, message: safeError(error) });
      }
    }
    const competitionRows = row.competition_id
      ? await supabaseRequest(`/treasure_challenges?competition_id=eq.${encodeURIComponent(row.competition_id)}&select=*`)
      : [row];
    return sendJson(response, 200, publicStatus(row, rankCompetition(competitionRows)));
  }
  return sendJson(response, 200, {
    id: row.id,
    senderName: row.sender_name,
    friendName: row.friend_name,
    tiles: row.tiles,
    note: row.note,
    status: row.status
  });
}

async function findExpoPushToken(email) {
  const rows = await supabaseRequest(`/profiles?email=eq.${encodeURIComponent(email)}&select=profile_json&limit=1`);
  const token = rows?.[0]?.profile_json?.expoPushToken;
  return /^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/.test(String(token || "")) ? String(token) : "";
}

async function sendExpoPush({ challengeUrl, friendName, pushToken, senderName }) {
  try {
    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      body: JSON.stringify({
        body: `${senderName} created a challenge for you. Can you unlock the hidden order?`,
        data: { challengeUrl, type: "treasure-challenge" },
        sound: "default",
        title: `🔐 A Treasure Chest for ${friendName}`,
        to: pushToken
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
    const result = await pushResponse.json().catch(() => ({}));
    const ticket = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!pushResponse.ok || ticket?.status !== "ok" || !ticket?.id) return "";
    return `expo:${ticket.id}`;
  } catch {
    return "";
  }
}

async function markOpened(body, response) {
  const row = await findChallenge(body.id);
  if (!row) return sendJson(response, 404, { error: "Challenge not found" });
  if (row.opened_at) return sendJson(response, 200, { ok: true, status: row.status });

  const openedAt = new Date().toISOString();
  let deliveryId = row.opened_delivery_id || null;
  let emailError = null;
  try {
    deliveryId = await sendEmail({
      to: row.sender_email,
      subject: `${row.friend_name || "Your friend"} opened your Treasure Chest`,
      html: statusHtml(`${row.friend_name || "Your friend"} opened your shared Treasure Chest challenge.`, "Opened"),
      text: `${row.friend_name || "Your friend"} opened your shared Intuisity Treasure Chest challenge.`
    });
  } catch (error) {
    emailError = safeError(error);
  }
  await updateChallenge(row.id, {
    status: "opened",
    opened_at: openedAt,
    opened_delivery_id: deliveryId,
    email_error: emailError,
    updated_at: openedAt
  });
  console.info("treasure_challenge_opened", { challengeId: row.id, deliveryId, recipient: maskEmail(row.sender_email), emailError });
  if (emailError) return sendJson(response, 502, { error: "Opened status saved, but notification email failed", details: emailError, statusSaved: true });
  return sendJson(response, 200, { ok: true, status: "opened" });
}

async function markCompleted(body, response) {
  const row = await findChallenge(body.id);
  if (!row) return sendJson(response, 404, { error: "Challenge not found" });
  const answers = Array.isArray(body.answers) ? body.answers.map(String).slice(0, 5) : [];
  if (answers.length !== 5 || answers.some((answer) => !answer)) {
    return sendJson(response, 400, { error: "Five submitted answers are required" });
  }

  const completedAt = row.completed_at || new Date().toISOString();
  const solved = Boolean(body.solved) || Boolean(row.solved);
  const solvedAt = solved ? (row.solved_at || new Date().toISOString()) : null;
  const attempts = Math.max(Number(row.attempt_count || 0), Math.min(4, Math.max(1, Number(body.attempts || 1))));
  const startedAt = new Date(row.opened_at || row.sent_at || completedAt).getTime();
  const durationMs = solvedAt ? Math.max(0, new Date(solvedAt).getTime() - startedAt) : null;
  let deliveryId = row.completed_delivery_id || null;
  let emailError = null;
  try {
    if (!row.completed_at) {
    deliveryId = await sendEmail({
      to: row.sender_email,
      subject: `${row.friend_name || "Your friend"} completed your Treasure Chest`,
      html: statusHtml(`${row.friend_name || "Your friend"} locked in and submitted their Treasure Chest answers.`, "Completed"),
      text: `${row.friend_name || "Your friend"} locked in and submitted their Intuisity Treasure Chest answers.`
    });
    }
  } catch (error) {
    emailError = safeError(error);
  }
  await updateChallenge(row.id, {
    status: "completed",
    response_tiles: answers,
    attempt_count: attempts,
    solved,
    solved_at: solvedAt,
    completion_duration_ms: durationMs,
    completed_at: completedAt,
    completed_delivery_id: deliveryId,
    email_error: emailError,
    updated_at: new Date().toISOString()
  });
  console.info("treasure_challenge_completed", { challengeId: row.id, deliveryId, recipient: maskEmail(row.sender_email), emailError });
  if (emailError) return sendJson(response, 502, { error: "Answers saved, but notification email failed", details: emailError, statusSaved: true });
  return sendJson(response, 200, { ok: true, status: "completed" });
}

async function findChallenge(id) {
  const cleanId = String(id || "");
  if (!cleanId) return null;
  const rows = await supabaseRequest(`/treasure_challenges?id=eq.${encodeURIComponent(cleanId)}&select=*&limit=1`);
  return rows?.[0] || null;
}

function updateChallenge(id, values) {
  return supabaseRequest(`/treasure_challenges?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(values) });
}

async function sendEmail(message) {
  requireEmailConfig();
  const fromEmail = process.env.INTUISITY_FROM_EMAIL || "Intuisity <admin@intuisity.com>";
  const result = await fetch(resendApiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromEmail, to: [message.to], ...message })
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(payload?.message || payload?.error || `Email provider returned ${result.status}`);
  return payload.id || null;
}

async function getEmailDeliveryStatus(deliveryId) {
  requireEmailConfig();
  const result = await fetch(`${resendApiUrl}/${encodeURIComponent(deliveryId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(payload?.message || payload?.error || `Email status provider returned ${result.status}`);
  return String(payload.last_event || "sent");
}

function requireEmailConfig() {
  if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
}

function publicStatus(row, leaderboard = []) {
  const ranked = leaderboard.find((entry) => entry.id === row.id);
  return { id: row.id, friendName: row.friend_name, friendEmail: row.friend_email, status: row.status, sentAt: row.sent_at, openedAt: row.opened_at, completedAt: row.completed_at, emailError: row.email_error || null, emailDeliveryStatus: row.invite_delivery_status || "sent", attempts: Number(row.attempt_count || 0), solved: Boolean(row.solved), durationMs: row.completion_duration_ms == null ? null : Number(row.completion_duration_ms), rank: ranked?.rank, playerCount: leaderboard.length };
}

function rankCompetition(rows) {
  const playerCount = rows.length;
  return [...rows]
    .sort((a, b) => {
      if (Boolean(a.solved) !== Boolean(b.solved)) return a.solved ? -1 : 1;
      if (!a.solved && !b.solved) return Number(a.attempt_count || 0) - Number(b.attempt_count || 0);
      if (playerCount === 2) return Number(a.attempt_count || 99) - Number(b.attempt_count || 99) || Number(a.completion_duration_ms || Infinity) - Number(b.completion_duration_ms || Infinity);
      return Number(a.completion_duration_ms || Infinity) - Number(b.completion_duration_ms || Infinity) || Number(a.attempt_count || 99) - Number(b.attempt_count || 99);
    })
    .map((row, index) => ({ id: row.id, rank: index + 1 }));
}

function inviteHtml({ challengeUrl, friendName, note, senderName }) {
  const safeUrl = escapeHtml(challengeUrl);
  const safeSender = escapeHtml(senderName);
  return `<div style="margin:0;padding:24px 12px;background:#F5F1FC;font-family:Arial,sans-serif;color:#30264C"><div style="max-width:580px;margin:0 auto;overflow:hidden;border:1px solid #E1D7F5;border-radius:18px;background:#FFFFFF;box-shadow:0 8px 24px rgba(48,38,76,.12)"><div style="padding:28px 24px;text-align:center;background:linear-gradient(135deg,#51339A,#7654C7);color:#FFFFFF"><div style="font-size:44px;line-height:1">✨🔐✨</div><p style="margin:12px 0 4px;font-size:14px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#CFF8F6">Intuisity Treasure Chest</p><h1 style="margin:4px 0 0;font-size:28px;line-height:1.2;color:#FFFFFF">A challenge is waiting for you!</h1></div><div style="padding:28px 26px;line-height:1.6"><p style="margin-top:0;font-size:17px">Hi ${escapeHtml(friendName)},</p><p style="font-size:17px"><strong>${safeSender}</strong> created a Treasure Chest challenge just for you.</p><p>Trust your first impression, arrange the five treasures, and see if you can unlock the hidden order in four tries.</p>${note ? `<div style="margin:22px 0;padding:16px 18px;border-left:4px solid #00AEBB;border-radius:8px;background:#EDFBFB"><div style="margin-bottom:5px;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#087E87">A note from ${safeSender}</div><div style="font-size:16px">“${escapeHtml(note)}”</div></div>` : ""}<div style="margin:28px 0;text-align:center"><a href="${safeUrl}" style="display:inline-block;padding:15px 26px;border-radius:10px;background:#00AEBB;color:#FFFFFF;font-size:18px;font-weight:bold;text-decoration:none">Play the Treasure Chest →</a></div><p style="margin-bottom:0;text-align:center;font-size:13px;color:#756D85">No account is needed to accept this challenge.</p></div><div style="padding:18px;text-align:center;background:#FAF8FE;color:#6544B8;font-size:13px;font-weight:bold">Intuisity · Awaken Your Intuition</div></div></div>`;
}

function statusHtml(message, status) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#30264C;max-width:560px"><h1 style="color:#6544B8">Treasure Chest: ${status}</h1><p>${escapeHtml(message)}</p><p>You can also see the latest status inside Intuisity.</p></div>`;
}

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function validUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "")); }
function validOrigin(value) { try { const url = new URL(String(value || "")); return /^https?:$/.test(url.protocol) ? url.origin : ""; } catch { return ""; } }
function cleanText(value, fallback) { return String(value || fallback).trim().slice(0, 1000) || fallback; }
function safeError(error) { return (error instanceof Error ? error.message : String(error)).slice(0, 500); }
function maskEmail(email) { const [name, domain] = String(email || "").split("@"); return name && domain ? `${name.slice(0, 2)}***@${domain}` : "invalid"; }
function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
