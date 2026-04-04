/**
 * Email Service — Premium welcome email for new users via Sumopod SMTP.
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
 * Send premium welcome email to a new user.
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  try {
    const transporter = await getTransporter();
    const displayName = name || email.split("@")[0];

    await transporter.sendMail({
      from: '"Gudangku" <noreply@gudangku.space>',
      to: email,
      subject: "Welcome to Gudangku \u{1F4E6} Your AI Warehouse Intelligence",
      html: buildWelcomeHtml(displayName),
    });
  } catch (err) {
    console.warn("Failed to send welcome email:", err);
  }
}

function buildWelcomeHtml(displayName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Welcome to Gudangku</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

          <!-- Logo Bar -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <span style="font-size:32px;font-weight:800;color:#34d399;letter-spacing:-1px;">Gudangku</span>
            </td>
          </tr>

          <!-- Hero Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#065f46 0%,#047857 50%,#059669 100%);border-radius:20px;overflow:hidden;">
                <tr>
                  <td style="padding:48px 40px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:48px;line-height:1;">&#x1F4E6;</p>
                    <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                      Welcome aboard, ${displayName}!
                    </h1>
                    <p style="margin:0;font-size:16px;color:#a7f3d0;line-height:1.5;">
                      Your AI-powered warehouse intelligence is ready.<br/>
                      Smarter inventory decisions start now.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:24px;"></td></tr>

          <!-- Features Grid (2x2) -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Feature 1 -->
                  <td width="50%" style="padding:0 6px 12px 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;border:1px solid #334155;">
                      <tr>
                        <td style="padding:24px;">
                          <p style="margin:0 0 8px;font-size:28px;line-height:1;">&#x1F4CA;</p>
                          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#34d399;">Smart Dashboard</p>
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
                            Real-time stock velocity, deadstock alerts, and one-click AI analysis.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Feature 2 -->
                  <td width="50%" style="padding:0 0 12px 6px;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;border:1px solid #334155;">
                      <tr>
                        <td style="padding:24px;">
                          <p style="margin:0 0 8px;font-size:28px;line-height:1;">&#x1F52E;</p>
                          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#34d399;">AI Forecaster</p>
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
                            Predict sales trends, identify top products, and stockout timing.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <!-- Feature 3 -->
                  <td width="50%" style="padding:0 6px 0 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;border:1px solid #334155;">
                      <tr>
                        <td style="padding:24px;">
                          <p style="margin:0 0 8px;font-size:28px;line-height:1;">&#x1F916;</p>
                          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#34d399;">Doc Assistant</p>
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
                            Chat with AI about your inventory: reorder strategy, contracts, optimization.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Feature 4 -->
                  <td width="50%" style="padding:0 0 0 6px;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;border:1px solid #334155;">
                      <tr>
                        <td style="padding:24px;">
                          <p style="margin:0 0 8px;font-size:28px;line-height:1;">&#x1F4C1;</p>
                          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#34d399;">CSV Upload</p>
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
                            Import inventory data and unlock every feature in seconds.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:24px;"></td></tr>

          <!-- Credits Info Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;border:1px solid #334155;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#fbbf24;">&#x26A1; Your Daily Credits</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px;color:#94a3b8;">Daily allowance</td>
                              <td align="right" style="font-size:14px;font-weight:700;color:#34d399;">10 credits</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #334155;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px;color:#94a3b8;">AI Forecast</td>
                              <td align="right" style="font-size:14px;font-weight:600;color:#e2e8f0;">1 credit</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #334155;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px;color:#94a3b8;">AI Chat / Analysis</td>
                              <td align="right" style="font-size:14px;font-weight:600;color:#e2e8f0;">3 credits</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #334155;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px;color:#94a3b8;">Cache hit (same question)</td>
                              <td align="right" style="font-size:14px;font-weight:700;color:#34d399;">FREE</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:12px 0 0;font-size:12px;color:#64748b;">
                      Credits reset daily at 00:00 UTC. Cached responses are free.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:28px;"></td></tr>

          <!-- CTA Button -->
          <tr>
            <td align="center">
              <a href="https://www.gudangku.space/dashboard/upload"
                 style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#059669,#34d399);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
                Get Started &rarr; Upload CSV
              </a>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:32px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding:20px 0;border-top:1px solid #1e293b;">
              <p style="margin:0 0 4px;font-size:12px;color:#475569;">
                Powered by Gemini 2.5 Flash AI
              </p>
              <p style="margin:0;font-size:11px;color:#334155;">
                gudangku.space &bull; Supply Chain Intelligence Hub
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
