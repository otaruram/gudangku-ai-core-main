/**
 * Email Service — Welcome email for new users via Sumopod SMTP.
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
 * Send welcome email to a new user.
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  try {
    const transporter = await getTransporter();
    const displayName = name || email.split("@")[0];

    await transporter.sendMail({
      from: '"Gudangku" <noreply@gudangku.space>',
      to: email,
      subject: "Welcome to Gudangku — Your Supply Chain Intelligence Hub",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#10b981;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Gudangku</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Supply Chain Intelligence Hub</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#18181b;font-size:22px;font-weight:600;">
                Welcome, ${displayName}!
              </h2>
              <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
                Your account has been created. Gudangku is an AI-powered warehouse management platform that helps you make smarter inventory decisions.
              </p>

              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background-color:#f0fdf4;border-radius:8px;margin-bottom:8px;">
                    <p style="margin:0;font-size:14px;color:#18181b;">
                      <strong style="color:#10b981;">1. Upload CSV</strong> — Import your inventory data (date, product, sales, stock) and activate all features instantly.
                    </p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f0fdf4;border-radius:8px;">
                    <p style="margin:0;font-size:14px;color:#18181b;">
                      <strong style="color:#10b981;">2. Smart Dashboard</strong> — Real-time command center with stock velocity alerts, deadstock detection, and one-click AI reorder analysis.
                    </p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f0fdf4;border-radius:8px;">
                    <p style="margin:0;font-size:14px;color:#18181b;">
                      <strong style="color:#10b981;">3. AI Forecaster</strong> — Predicts sales trends, identifies top performers, and calculates when products will run out.
                    </p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f0fdf4;border-radius:8px;">
                    <p style="margin:0;font-size:14px;color:#18181b;">
                      <strong style="color:#10b981;">4. Doc Assistant</strong> — Chat with AI about your inventory data. Ask about reorder strategies, supplier contracts, and optimization.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.6;">
                You receive <strong>10 free AI credits daily</strong>. Each forecast costs 1 credit and each AI consultation costs 3 credits. Credits reset every day at 00:00 UTC.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://www.gudangku.space/dashboard/upload" 
                       style="display:inline-block;padding:14px 32px;background-color:#10b981;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                      Get Started — Upload Your CSV
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                Powered by Gemini 2.5 Flash AI &bull; gudangku.space
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });
  } catch (err) {
    // Non-critical — log and continue
    console.warn("Failed to send welcome email:", err);
  }
}
