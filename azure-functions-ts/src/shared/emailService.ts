/**
 * Email Service — transactional welcome email via Sumopod SMTP.
 */
import * as nodemailer from "nodemailer";
import { getSecret } from "./keyVault";

let _transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!_transporter) {
    const smtpUser = await getSecret("SMTP-USERNAME", "SMTP_USERNAME");
    const smtpPass = await getSecret("SMTP-PASSWORD", "SMTP_PASSWORD");

    _transporter = nodemailer.createTransport({
      host: "smtp.sumopod.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return _transporter;
}

/**
 * Send a transactional welcome email to a new user.
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  try {
    const transporter = await getTransporter();
    const displayName = name || email.split("@")[0];

    await transporter.sendMail({
      from: '"Gudangku" <admin@gudangku.space>',
      sender: "admin@gudangku.space",
      replyTo: "admin@gudangku.space",
      to: email,
      subject: "Welcome to Gudangku",
      text: buildWelcomeText(displayName),
      html: buildWelcomeHtml(displayName),
      headers: {
        "X-Auto-Response-Suppress": "All",
      },
    });
  } catch (err) {
    console.warn("Failed to send welcome email:", err);
  }
}

function buildWelcomeText(displayName: string): string {
  return [
    `Hello ${displayName},`,
    "",
    "Welcome to Gudangku.",
    "",
    "Your account is ready. You can now:",
    "- Upload your CSV inventory data",
    "- View demand forecasts",
    "- Use the AI assistant for warehouse analysis",
    "",
    "Open the app:",
    "https://gudangku.space/dashboard/upload",
    "",
    "If you did not create this account, reply to this email.",
    "",
    "Gudangku",
    "admin@gudangku.space",
  ].join("\n");
}

function buildWelcomeHtml(displayName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Welcome to Gudangku</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    a { text-decoration: none; }
    @media only screen and (max-width: 640px) {
      .container { width: 100% !important; min-width: 100% !important; }
      .hero-pad { padding: 28px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table class="container" width="620" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;width:100%;">
          <tr>
            <td style="padding:0 0 20px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.4px;">Gudangku</span>
              <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Warehouse intelligence</p>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
                <tr>
                  <td class="hero-pad" style="padding:40px 36px 28px;text-align:left;">
                    <div style="display:inline-block;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;padding:8px 14px;margin-bottom:18px;font-size:12px;font-weight:600;color:#047857;">
                      Account ready
                    </div>
                    <h1 style="margin:0 0 12px;font-size:30px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;line-height:1.2;">
                      Welcome, ${displayName}
                    </h1>
                    <p style="margin:0 0 22px;font-size:15px;color:#475569;line-height:1.7;max-width:520px;">
                      Your Gudangku account is active. You can upload inventory data, generate forecasts,
                      and use the assistant for warehouse analysis.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
                      <tr>
                        <td style="padding:16px;border-bottom:1px solid #e2e8f0;">
                          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0f172a;">What to do first</p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                            Upload a CSV from your dashboard to unlock forecasts and AI answers tailored to your inventory.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px;">
                          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0f172a;">Open the app</p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                            https://gudangku.space/dashboard/upload
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.7;">
                This is a transactional email about your account at Gudangku.<br>
                If you did not create this account, reply to
                <a href="mailto:admin@gudangku.space" style="color:#0f766e;">admin@gudangku.space</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
