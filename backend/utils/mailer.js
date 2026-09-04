/**
 * mailer
 *
 * Sends transactional email via Resend's HTTPS API instead of raw SMTP.
 *
 * Why: most PaaS hosts (Render included) block outbound SMTP ports
 * (25/465/587) by default to stop spam abuse, so nodemailer talking to
 * smtp.gmail.com just hangs until it times out. Resend's API runs over
 * plain HTTPS (443), which is never blocked.
 *
 * Uses the sandbox `onboarding@resend.dev` sender, which works without
 * verifying a custom domain — fine for a hobby-scale deploy. To send
 * from your own domain later, verify it in the Resend dashboard and
 * change RESEND_FROM below.
 */

const { RESEND_API_KEY } = require("../secrets.js");

const RESEND_FROM = "Conversa <onboarding@resend.dev>";

/**
 * @param {{ to: string, subject: string, html: string }} message
 *   (a `from` field may be passed for compatibility with existing call
 *   sites, but is ignored — see RESEND_FROM above)
 */
const sendMail = async ({ to, subject, html }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }

  return response.json();
};

module.exports = { sendMail };
