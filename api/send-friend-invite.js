const resendApiUrl = "https://api.resend.com/emails";
const intuisityAppUrl = "https://www.intuisity.com/";
const { normalizeEmail, readJsonBody, supabaseRequest } = require("./_supabase");

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    response.status(204).end();
    return;
  }

  response.setHeader("Access-Control-Allow-Origin", "*");

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.INTUISITY_FROM_EMAIL || "Intuisity <info@intuisity.com>";

  if (!apiKey) {
    response.status(500).json({ error: "Missing RESEND_API_KEY" });
    return;
  }

  try {
    const body = await readJsonBody(request);
    if (body.action === "treasure-completion") {
      await handleTreasureCompletion(body, apiKey, fromEmail, response);
      return;
    }

    const friendEmail = normalizeEmail(body.friendEmail);
    const friendName = String(body.friendName || "friend").trim() || "friend";
    const senderName = String(body.senderName || "A friend").trim() || "A friend";
    const senderEmail = normalizeEmail(body.senderEmail);
    const note = String(body.note || "").trim();
    const challengeUrl = String(body.challengeUrl || "https://intuisity.com").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(friendEmail)) {
      response.status(400).json({ error: "Valid friendEmail is required" });
      return;
    }

    const intro = `${senderName} invited you to play a short Intuisity Treasure Chest challenge.`;
    const noteHtml = note ? `<p style="margin:16px 0;padding:12px;border-left:4px solid #00AEBB;background:#F2FAFA;">${escapeHtml(note)}</p>` : "";

    const resendResponse = await fetch(resendApiUrl, {
      body: JSON.stringify({
        from: fromEmail,
        to: [friendEmail],
        subject: `${senderName} invited you to Intuisity`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#30264C;max-width:560px;">
            <h1 style="color:#6544B8;">You have an Intuisity invite</h1>
            <p>Hi ${escapeHtml(friendName)},</p>
            <p>${escapeHtml(intro)}</p>
            ${noteHtml}
            <p>Open your playable Treasure Chest challenge here:</p>
            <p><a href="${escapeHtml(challengeUrl)}" style="background:#6544B8;color:#ffffff;display:inline-block;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Play Treasure Chest</a></p>
            <p><a href="${intuisityAppUrl}" style="background:#008A94;color:#ffffff;display:inline-block;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Open Intuisity</a></p>
            <p style="font-size:13px;color:#706982;">Intuisity helps you explore awareness, inner knowing, mindfulness, synchronicity, and remote viewing through daily practice.</p>
          </div>
        `,
        text: `Hi ${friendName},\n\n${intro}\n\n${note ? `${note}\n\n` : ""}Open the challenge here: ${challengeUrl}\n\nOpen Intuisity: ${intuisityAppUrl}\n\nIntuisity helps you explore awareness, inner knowing, mindfulness, synchronicity, and remote viewing through daily practice.`
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    const result = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      response.status(resendResponse.status).json({
        error: "Resend send failed",
        details: result,
        hint: "Check that RESEND_API_KEY is saved in Vercel, INTUISITY_FROM_EMAIL uses a sender from a verified Resend domain, and the site was redeployed after changing environment variables."
      });
      return;
    }

    if (senderEmail) {
      await saveTreasureChallengeRecord(senderEmail, {
        challengeId: getChallengeIdFromUrl(challengeUrl),
        challengeUrl,
        createdAt: new Date().toISOString(),
        friendEmail,
        friendName,
        note,
        senderName,
        status: "sent"
      }).catch(() => null);
    }

    response.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    response.status(500).json({
      error: "Invite email failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

async function handleTreasureCompletion(body, apiKey, fromEmail, response) {
  const senderEmail = normalizeEmail(body.senderEmail);
  const senderName = String(body.senderName || "friend").trim() || "friend";
  const friendName = String(body.friendName || "Your friend").trim() || "Your friend";
  const responseMessage = String(body.responseMessage || "").trim();
  const challengeId = String(body.challengeId || "").trim() || `treasure-${Date.now()}`;
  const success = Boolean(body.success);
  const triesUsed = Number(body.triesUsed || 0);
  const score = Number(body.score || 0);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    response.status(400).json({ error: "Valid senderEmail is required" });
    return;
  }

  const completionRecord = {
    challengeId,
    completedAt: new Date().toISOString(),
    friendName,
    responseMessage,
    score,
    status: "completed",
    success,
    triesUsed
  };

  await saveTreasureChallengeRecord(senderEmail, completionRecord);

  const messageHtml = responseMessage
    ? `<p style="margin:16px 0;padding:12px;border-left:4px solid #00AEBB;background:#F2FAFA;">${escapeHtml(responseMessage)}</p>`
    : `<p>${escapeHtml(friendName)} completed your Treasure Chest challenge.</p>`;

  const resendResponse = await fetch(resendApiUrl, {
    body: JSON.stringify({
      from: fromEmail,
      to: [senderEmail],
      subject: `${friendName} answered your Intuisity Treasure Chest`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#30264C;max-width:560px;">
          <h1 style="color:#6544B8;">Your Treasure Chest was answered</h1>
          <p>Hi ${escapeHtml(senderName)},</p>
          <p>${escapeHtml(friendName)} finished your Intuisity Treasure Chest challenge.</p>
          <p><strong>Result:</strong> ${success ? "Opened the chest" : "The treasure stayed hidden"}${triesUsed ? ` in ${triesUsed} ${triesUsed === 1 ? "try" : "tries"}` : ""}.</p>
          <p><strong>Score:</strong> ${score}</p>
          ${messageHtml}
          <p><a href="${intuisityAppUrl}" style="background:#6544B8;color:#ffffff;display:inline-block;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Open Intuisity to see status</a></p>
          <p style="font-size:13px;color:#706982;">Open Intuisity to see Treasure Chest status, daily results, friend activity, and keep practicing awareness, inner knowing, synchronicity, remote viewing, and daily intuition training.</p>
        </div>
      `,
      text: `Hi ${senderName},\n\n${friendName} finished your Intuisity Treasure Chest challenge.\nResult: ${success ? "Opened the chest" : "The treasure stayed hidden"}${triesUsed ? ` in ${triesUsed} ${triesUsed === 1 ? "try" : "tries"}` : ""}.\nScore: ${score}\n\n${responseMessage ? `Message from ${friendName}: ${responseMessage}\n\n` : ""}Open Intuisity to see status: ${intuisityAppUrl}\n\nOpen Intuisity to keep practicing awareness, inner knowing, synchronicity, remote viewing, and daily intuition training.`
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  const result = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    response.status(resendResponse.status).json({
      error: "Completion email failed",
      details: result,
      message: result?.message || result?.error || "The response was saved, but the sender email could not be sent."
    });
    return;
  }

  response.status(200).json({ ok: true, id: result.id });
}

async function saveTreasureChallengeRecord(senderEmail, record) {
  if (!senderEmail) return;
  const currentRows = await supabaseRequest(`/friends?email=eq.${encodeURIComponent(senderEmail)}&select=friends,treasure_challenges&limit=1`);
  const current = currentRows?.[0] || {};
  const existingChallenges = Array.isArray(current.treasure_challenges) ? current.treasure_challenges : [];
  const challengeId = record.challengeId || `treasure-${Date.now()}`;
  const prior = existingChallenges.find((challenge) => challenge.challengeId === challengeId) || {};
  const nextChallenges = [
    ...existingChallenges.filter((challenge) => challenge.challengeId !== challengeId),
    { ...prior, ...record, challengeId }
  ].slice(-100);

  await supabaseRequest("/friends?on_conflict=email", {
    body: JSON.stringify({
      email: senderEmail,
      friends: Array.isArray(current.friends) ? current.friends : [],
      treasure_challenges: nextChallenges,
      updated_at: new Date().toISOString()
    }),
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    method: "POST"
  });
}

function getChallengeIdFromUrl(challengeUrl) {
  try {
    const parsed = new URL(challengeUrl);
    return parsed.searchParams.get("challengeId") || "";
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
