// Cloudflare Worker: verifies Google reCAPTCHA v3 token, then forwards email via Resend.
//
// Secrets and optional overrides (set with `wrangler secret put <NAME>`):
//   RECAPTCHA_SECRET   - Google reCAPTCHA v3 secret key
//   ALLOWED_ORIGIN     - Optional comma-separated additional origins for local testing.
//   RESEND_API_KEY     - Resend API key (https://resend.com/api-keys)
//   TO_EMAIL           - Destination address (defaults to ammar from below)
//   FROM_EMAIL         - Sender address (defaults to onboarding@resend.dev)
// Production origin is configured as PUBLIC_ORIGIN in wrangler.toml.

const TO_EMAIL_DEFAULT = "ammaryasseryasser49@gmail.com";
const FROM_EMAIL_DEFAULT = "onboarding@resend.dev";
// Production threshold; low-scoring tokens are rejected before sending email.
const SCORE_THRESHOLD = 0.5;

function corsHeaders(allowedOrigin) {
  // IMPORTANT: only a single origin (or "*") is valid in
  // Access-Control-Allow-Origin. Never pass a comma-separated list here.
  return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function getAllowedList(env) {
  return [env.PUBLIC_ORIGIN || "", env.ALLOWED_ORIGIN || ""]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin, allowedList) {
  if (!origin) return false;
  return allowedList.includes(origin);
}

async function sendEmail(env, { name, email, message }) {
  const to = env.TO_EMAIL || TO_EMAIL_DEFAULT;
  const from = env.FROM_EMAIL || FROM_EMAIL_DEFAULT;

  const subject = `New contact form message from ${name}`;
  const textBody =
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Reply-To: ${email}\n\n` +
    `Message:\n${message}\n`;

  const resendPayload = {
    from: `Portfolio Contact Form <${from}>`,
    to: [to],
    reply_to: email,
    subject,
    text: textBody,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(resendPayload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

async function verifyRecaptcha(env, token) {
  const params = new URLSearchParams();
  params.set("secret", env.RECAPTCHA_SECRET);
  params.set("response", token);

  const res = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    { method: "POST", body: params },
  );
  if (!res.ok) throw new Error(`siteverify HTTP ${res.status}`);
  return res.json();
}

function jsonResponse(status, body, allowedOrigin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(allowedOrigin),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const allowedList = getAllowedList(env);
    const allowedHere = isOriginAllowed(origin, allowedList);
    // Echo only an allowed request origin, never the whole allowlist.
    const echoedOrigin = allowedHere ? origin : "";

    // Debug: log every request so you can confirm the deployed version.
    console.log(
      `[v3] ${request.method} from origin=${JSON.stringify(origin)} allowedHere=${allowedHere}`,
    );

    // Reject unlisted origins for preflights as well as submissions.
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: allowedHere ? 204 : 403,
        headers: corsHeaders(echoedOrigin),
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(405, { error: "method_not_allowed" }, echoedOrigin);
    }

    if (!allowedHere) {
      return jsonResponse(
        403,
        {
          error: "forbidden_origin",
          your_origin: origin || null,
          allowed: allowedList,
          hint: "Add your origin to the ALLOWED_ORIGIN worker secret.",
        },
        echoedOrigin,
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, { error: "invalid_json" }, echoedOrigin);
    }

    const { name, email, message, token } = body || {};

    if (!name || !email || !message || !token) {
      return jsonResponse(400, { error: "missing_fields" }, echoedOrigin);
    }

    if (!env.RECAPTCHA_SECRET) {
      return jsonResponse(
        500,
        { error: "server_misconfigured", hint: "RECAPTCHA_SECRET not set" },
        echoedOrigin,
      );
    }

    if (!env.RESEND_API_KEY) {
      return jsonResponse(
        500,
        { error: "server_misconfigured", hint: "RESEND_API_KEY not set" },
        echoedOrigin,
      );
    }

    // 1. Verify reCAPTCHA token
    let verifyResult;
    try {
      verifyResult = await verifyRecaptcha(
        env,
        token,
      );
      console.log(`[v3] Google verify response:`, JSON.stringify(verifyResult));
    } catch (err) {
      return jsonResponse(
        502,
        { error: "captcha_verify_failed", detail: String(err) },
        echoedOrigin,
      );
    }

    if (!verifyResult.success || (verifyResult.score ?? 0) < SCORE_THRESHOLD) {
      return jsonResponse(
        403,
        {
          error: "captcha_failed",
          score: verifyResult.score ?? null,
          google_errors: verifyResult["error-codes"] || [],
        },
        echoedOrigin,
      );
    }

    // 2. Send email
    try {
      await sendEmail(env, { name, email, message });
    } catch (err) {
      return jsonResponse(
        502,
        { error: "email_send_failed", detail: String(err) },
        echoedOrigin,
      );
    }

    return jsonResponse(200, { ok: true }, echoedOrigin);
  },
};
