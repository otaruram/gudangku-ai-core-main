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
  <meta name="x-apple-disable-message-reformatting">
  <title>Welcome to Gudangku</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    @media only screen and (max-width: 640px) {
      .container { width: 100% !important; min-width: 100% !important; }
      .col-half { width: 100% !important; display: block !important; padding: 0 0 12px 0 !important; }
      .hero-pad { padding: 32px 24px !important; }
      .hero-title { font-size: 22px !important; }
      .section-pad { padding: 20px 16px !important; }
      .cta-button { padding: 14px 32px !important; font-size: 15px !important; }
      .stat-row { display: block !important; }
      .stat-cell { display: block !important; width: 100% !important; padding: 8px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#060d1a;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#e2e8f0;">

  <!-- Outer Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#060d1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table class="container" width="620" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;width:100%;">

          <!-- ── TOP NAV BAR ── -->
          <tr>
            <td style="padding:0 0 24px 0;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="text-align:center;">
                    <span style="font-size:22px;font-weight:800;color:#34d399;letter-spacing:-0.5px;">&#x1F4E6; Gudangku</span>
                    <p style="margin:4px 0 0;font-size:11px;color:#334155;letter-spacing:2px;text-transform:uppercase;">Supply Chain Intelligence</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── HERO CARD ── -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:linear-gradient(145deg,#022c22 0%,#064e3b 40%,#065f46 70%,#047857 100%);border-radius:24px;overflow:hidden;position:relative;">
                <!-- Decorative glow line -->
                <tr>
                  <td style="height:3px;background:linear-gradient(90deg,transparent,#34d399,#10b981,transparent);"></td>
                </tr>
                <tr>
                  <td class="hero-pad" style="padding:48px 40px 40px;text-align:center;">
                    <!-- Avatar / Greeting Icon -->
                    <div style="display:inline-block;background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;margin-bottom:20px;">
                      <span style="font-size:32px;line-height:72px;">&#x1F4E6;</span>
                    </div>
                    <h1 class="hero-title" style="margin:0 0 10px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
                      Welcome aboard,<br/><span style="color:#34d399;">${displayName}!</span>
                    </h1>
                    <p style="margin:0 0 28px;font-size:15px;color:#a7f3d0;line-height:1.6;max-width:380px;margin-left:auto;margin-right:auto;">
                      Your AI-powered warehouse intelligence is live and ready.<br/>
                      Smarter inventory decisions start today.
                    </p>
                    <!-- Quick Stats Row -->
                    <table class="stat-row" width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="background:rgba(0,0,0,0.25);border-radius:14px;overflow:hidden;border:1px solid rgba(52,211,153,0.15);">
                      <tr>
                        <td class="stat-cell" width="33%" style="padding:16px;text-align:center;border-right:1px solid rgba(52,211,153,0.1);">
                          <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#34d399;">10</p>
                          <p style="margin:0;font-size:10px;color:#6ee7b7;text-transform:uppercase;letter-spacing:1px;">Daily Credits</p>
                        </td>
                        <td class="stat-cell" width="33%" style="padding:16px;text-align:center;border-right:1px solid rgba(52,211,153,0.1);">
                          <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#34d399;">365d</p>
                          <p style="margin:0;font-size:10px;color:#6ee7b7;text-transform:uppercase;letter-spacing:1px;">Forecast Range</p>
                        </td>
                        <td class="stat-cell" width="33%" style="padding:16px;text-align:center;">
                          <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#34d399;">AI</p>
                          <p style="margin:0;font-size:10px;color:#6ee7b7;text-transform:uppercase;letter-spacing:1px;">Gemini 2.5 Flash</p>
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

          <!-- ── SECTION TITLE: GET STARTED ── -->
          <tr>
            <td style="padding:0 4px 14px;">
              <p style="margin:0;font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:2px;">&#x2728; What you can do</p>
            </td>
          </tr>

          <!-- ── FEATURES GRID ── -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <!-- Row 1 -->
                <tr>
                  <td class="col-half" width="50%" style="padding:0 6px 12px 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="background:linear-gradient(145deg,#0f172a,#1a2540);border-radius:18px;border:1px solid #1e2d45;overflow:hidden;">
                      <tr><td style="height:3px;background:linear-gradient(90deg,#34d399,transparent);"></td></tr>
                      <tr>
                        <td style="padding:22px 22px 20px;">
                          <p style="margin:0 0 10px;font-size:26px;line-height:1;">&#x1F4CA;</p>
                          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#34d399;">Smart Dashboard</p>
                          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.55;">
                            Live stock velocity, deadstock radar, and one-click AI restock analysis.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="col-half" width="50%" style="padding:0 0 12px 6px;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="background:linear-gradient(145deg,#0f172a,#1a2540);border-radius:18px;border:1px solid #1e2d45;overflow:hidden;">
                      <tr><td style="height:3px;background:linear-gradient(90deg,#6366f1,transparent);"></td></tr>
                      <tr>
                        <td style="padding:22px 22px 20px;">
                          <p style="margin:0 0 10px;font-size:26px;line-height:1;">&#x1F52E;</p>
                          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#818cf8;">AI Forecaster</p>
                          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.55;">
                            365-day sales prediction, trend detection, and stockout timing alerts.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Row 2 -->
                <tr>
                  <td class="col-half" width="50%" style="padding:0 6px 0 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="background:linear-gradient(145deg,#0f172a,#1a2540);border-radius:18px;border:1px solid #1e2d45;overflow:hidden;">
                      <tr><td style="height:3px;background:linear-gradient(90deg,#f59e0b,transparent);"></td></tr>
                      <tr>
                        <td style="padding:22px 22px 20px;">
                          <p style="margin:0 0 10px;font-size:26px;line-height:1;">&#x1F916;</p>
                          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#fbbf24;">Doc Assistant</p>
                          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.55;">
                            Chat with Gemini AI about your inventory: EOQ, supplier contracts, optimization.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="col-half" width="50%" style="padding:0 0 0 6px;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="background:linear-gradient(145deg,#0f172a,#1a2540);border-radius:18px;border:1px solid #1e2d45;overflow:hidden;">
                      <tr><td style="height:3px;background:linear-gradient(90deg,#ec4899,transparent);"></td></tr>
                      <tr>
                        <td style="padding:22px 22px 20px;">
                          <p style="margin:0 0 10px;font-size:26px;line-height:1;">&#x1F4C1;</p>
                          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#f472b6;">CSV Upload</p>
                          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.55;">
                            Import your inventory data (date, product, sales, stock) to unlock every feature instantly.
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

          <!-- ── HOW TO START ── -->
          <tr>
            <td style="padding:0 4px 14px;">
              <p style="margin:0;font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:2px;">&#x1F680; Get started in 3 steps</p>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:linear-gradient(145deg,#0f172a,#111827);border-radius:18px;border:1px solid #1e293b;overflow:hidden;">
                <tr>
                  <td class="section-pad" style="padding:24px 28px;">
                    <!-- Step 1 -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:18px;">
                      <tr>
                        <td width="36" valign="top" style="padding-right:14px;">
                          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#059669,#34d399);text-align:center;line-height:32px;font-size:13px;font-weight:700;color:#fff;">1</div>
                        </td>
                        <td valign="top">
                          <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#e2e8f0;">Upload your CSV file</p>
                          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">Go to <strong style="color:#34d399;">Upload CSV</strong> and drop in your inventory data. Format: date, product, sales, stock.</p>
                        </td>
                      </tr>
                    </table>
                    <!-- Step 2 -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:18px;">
                      <tr>
                        <td width="36" valign="top" style="padding-right:14px;">
                          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#818cf8);text-align:center;line-height:32px;font-size:13px;font-weight:700;color:#fff;">2</div>
                        </td>
                        <td valign="top">
                          <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#e2e8f0;">View AI-generated insights</p>
                          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">The <strong style="color:#818cf8;">Dashboard</strong> and <strong style="color:#818cf8;">Forecaster</strong> activate instantly with stock velocity, top performers, and 365-day projections.</p>
                        </td>
                      </tr>
                    </table>
                    <!-- Step 3 -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td width="36" valign="top" style="padding-right:14px;">
                          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#fbbf24);text-align:center;line-height:32px;font-size:13px;font-weight:700;color:#fff;">3</div>
                        </td>
                        <td valign="top">
                          <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#e2e8f0;">Ask AI anything</p>
                          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">Open <strong style="color:#fbbf24;">Doc Assistant</strong> and ask questions like "What should I reorder?" or "Suggest an EOQ strategy for Gula Pasir."</p>
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

          <!-- ── CREDITS INFO ── -->
          <tr>
            <td style="padding:0 4px 14px;">
              <p style="margin:0;font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:2px;">&#x26A1; Credit System</p>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:linear-gradient(145deg,#0f172a,#111827);border-radius:18px;border:1px solid #1e293b;">
                <tr>
                  <td class="section-pad" style="padding:20px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                          <table width="100%" cellpadding="0" cellspacing="0"><tr>
                            <td style="font-size:12px;color:#94a3b8;">Daily allowance</td>
                            <td align="right" style="font-size:13px;font-weight:700;color:#34d399;">10 credits</td>
                          </tr></table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                          <table width="100%" cellpadding="0" cellspacing="0"><tr>
                            <td style="font-size:12px;color:#94a3b8;">AI Forecast</td>
                            <td align="right" style="font-size:13px;font-weight:600;color:#e2e8f0;">1 credit</td>
                          </tr></table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                          <table width="100%" cellpadding="0" cellspacing="0"><tr>
                            <td style="font-size:12px;color:#94a3b8;">AI Chat / Analysis</td>
                            <td align="right" style="font-size:13px;font-weight:600;color:#e2e8f0;">3 credits</td>
                          </tr></table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <table width="100%" cellpadding="0" cellspacing="0"><tr>
                            <td style="font-size:12px;color:#94a3b8;">Cache hit (same question)</td>
                            <td align="right" style="font-size:13px;font-weight:700;color:#34d399;">FREE</td>
                          </tr></table>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;font-size:11px;color:#475569;line-height:1.5;">
                      Credits reset daily at 00:00 UTC. Cached responses are always free.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:32px;"></td></tr>

          <!-- ── CTA BUTTON ── -->
          <tr>
            <td align="center">
              <a href="https://www.gudangku.space/dashboard/upload" class="cta-button"
                 style="display:inline-block;padding:18px 52px;background:linear-gradient(135deg,#059669 0%,#34d399 100%);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:14px;letter-spacing:0.3px;box-shadow:0 8px 32px rgba(52,211,153,0.25);">
                Start Now &rarr; Upload CSV
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:#334155;">
                Or go to <a href="https://www.gudangku.space" style="color:#34d399;">gudangku.space</a> to explore all features
              </p>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:40px;"></td></tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="border-top:1px solid #0f172a;padding:24px 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#334155;font-weight:600;letter-spacing:0.5px;">&#x1F4E6; Gudangku</p>
              <p style="margin:0 0 8px;font-size:11px;color:#1e293b;">Powered by Gemini 2.5 Flash AI &bull; gudangku.space</p>
              <p style="margin:0;font-size:10px;color:#1e293b;">
                You received this because you just created an account.<br/>
                &copy; ${new Date().getFullYear()} Gudangku. All rights reserved.
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
