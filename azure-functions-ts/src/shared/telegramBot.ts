/**
 * Telegram Bot Service for GudangKu Supply Chain Assistant.
 *
 * Capabilities:
 * - Full access to user's data: inventory, forecasts, stock alerts, chat history
 * - Photo/image analysis (product photos, receipts, labels)
 * - PDF document processing (invoices, purchase orders)
 * - Template questions for new/first-time users
 * - Supply chain expert knowledge
 *
 * Uses Redis for caching & rate limiting.
 */
import { getSecret } from "./keyVault";
import { getCachedResponse, setCachedResponse, checkRateLimit } from "./redisCache";
import { getContainer } from "./cosmosClient";
import { consumeCredits, getCredits, CreditError } from "./creditSystem";

const SYSTEM_PROMPT = [
  "You are Kang Supply, the AI assistant of GudangKu (gudangku.space) — an AI-powered warehouse intelligence platform for Indonesian UMKM businesses.",
  "",
  "ABOUT GUDANGKU:",
  "GudangKu helps UMKM owners manage inventory with AI. Features: Dashboard analytics, AI Forecaster (predict sales 90 days), Stock Alerts (reorder points), Doc Assistant (ask questions about inventory), History (past analyses), and this Telegram bot.",
  "",
  "YOUR ROLE: You are a supply chain expert. When the user has linked their account, you have FULL ACCESS to their data: inventory levels, sales forecasts, stock alerts, best-selling products, and past AI analyses. Use this data actively in every answer.",
  "",
  "RULES:",
  "1. ALWAYS respond in Bahasa Indonesia unless user writes in English.",
  "2. Keep responses clear and thorough (200-400 words). Do NOT be too brief.",
  "3. Use numbered lists (1. 2. 3.) for recommendations.",
  "4. NEVER use markdown formatting (no *, no _, no `, no #). Plain text only.",
  "5. When given inventory data, ALWAYS reference specific product names and numbers from the data.",
  "6. For images: identify products, estimate quantities, note conditions, suggest supply chain actions.",
  "7. For PDFs/documents: extract items, quantities, prices, dates, suppliers.",
  "8. Always end with a concrete actionable next step.",
  "9. If user asks about something unrelated to supply chain, politely redirect to your expertise area.",
  "10. If the user has no data yet, guide them to upload CSV at gudangku.space.",
  "11. When discussing stock alerts, explain the urgency: STOCKOUT = harus segera restok, CRITICAL = pesan sekarang, WARNING = rencanakan pemesanan, SAFE = monitor saja.",
  "12. For forecasting questions, reference actual forecast data if available.",
].join("\n");

const WELCOME_TEMPLATE = [
  "Halo! Saya Kang Supply, asisten AI dari GudangKu.",
  "",
  "Saya punya akses penuh ke data gudang kamu dan bisa bantu:",
  "",
  "1. Cek stok mana yang kritis dan perlu restock segera",
  "2. Analisis tren penjualan dan prediksi demand",
  "3. Rekomendasi strategi reorder point",
  "4. Analisis foto produk, struk, atau label",
  "5. Baca dokumen PDF (invoice, PO, surat jalan)",
  "6. Konsultasi strategi supply chain",
  "",
  "Untuk menghubungkan akun GudangKu kamu:",
  "1. Buka gudangku.space > Dashboard",
  "2. Klik 'Hubungkan Telegram'",
  "3. Ketik /link KODE di sini",
  "",
  "Coba tanya salah satu ini:",
  "",
  "- \"Stok mana yang paling kritis?\"",
  "- \"Prediksi penjualan minggu depan\"",
  "- \"Produk apa yang paling laku?\"",
  "- \"Kapan harus restock Beras Premium?\"",
  "- \"Analisis performa gudang saya\"",
  "",
  "Atau langsung kirim foto/PDF untuk dianalisis!",
].join("\n");

const TEMPLATE_QUESTIONS_LINKED = [
  "Akun kamu sudah terhubung! Berikut pertanyaan yang bisa kamu coba:",
  "",
  "STOK & INVENTORY:",
  '- "Stok mana yang paling kritis sekarang?"',
  '- "Produk apa yang harus saya restock duluan?"',
  '- "Berapa hari lagi stok Minyak Goreng habis?"',
  "",
  "PENJUALAN & FORECAST:",
  '- "Produk apa yang paling laku?"',
  '- "Prediksi penjualan 30 hari ke depan"',
  '- "Tren penjualan minggu ini vs minggu lalu"',
  "",
  "STRATEGI SUPPLY CHAIN:",
  '- "Rekomendasi reorder point untuk semua produk"',
  '- "Analisis performa gudang saya"',
  '- "Bagaimana cara kurangi deadstock?"',
  "",
  "DOKUMEN & FOTO:",
  "- Kirim foto produk/struk untuk analisis",
  "- Kirim PDF invoice/PO untuk ekstrak data",
  "",
  "Ketik pertanyaan kamu atau /help untuk bantuan.",
].join("\n");

interface TelegramMessage {
  message_id: number;
  from?: { id: number; first_name?: string; username?: string };
  chat: { id: number; type: string };
  text?: string;
  photo?: Array<{ file_id: string; file_unique_id: string; width: number; height: number }>;
  document?: { file_id: string; file_name?: string; mime_type?: string };
  caption?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

/**
 * Send a message via Telegram Bot API.
 */
async function sendMessage(chatId: number, text: string, botToken: string): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: undefined, // plain text, no markdown
    }),
  });
}

/**
 * Send a "typing..." indicator.
 */
async function sendTyping(chatId: number, botToken: string): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

/**
 * Download a file from Telegram servers.
 * Returns base64-encoded content.
 */
async function downloadTelegramFile(fileId: string, botToken: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    // Get file path
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoRes.json() as any;
    if (!fileInfo.ok || !fileInfo.result?.file_path) return null;

    const filePath = fileInfo.result.file_path as string;
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";

    // Determine MIME type
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp", pdf: "application/pdf",
    };
    const mimeType = mimeMap[ext] || "application/octet-stream";

    // Download
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const res = await fetch(downloadUrl);
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    return { base64: buffer.toString("base64"), mimeType };
  } catch {
    return null;
  }
}

/**
 * Get the user's FULL data context from Cosmos DB (linked via Telegram chat ID).
 * Pulls: inventory summary, forecast data, stock alerts, best sellers, chat history.
 */
async function getUserContext(telegramChatId: number): Promise<{ userId: string; context: string; isFirstMessage?: boolean } | null> {
  try {
    const container = getContainer("users");
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.telegramChatId = @chatId",
        parameters: [{ name: "@chatId", value: telegramChatId }],
      })
      .fetchAll();

    if (!resources || resources.length === 0) return null;

    const user = resources[0];
    const userId = user.id as string;
    const parts: string[] = [];

    // Check if this is the user's first telegram interaction
    const isFirstMessage = !user._telegramGreeted;

    // 1. Inventory summary (set by forecast endpoint)
    if (user.inventorySummary) {
      parts.push(`DATA INVENTORY:\n${String(user.inventorySummary).slice(0, 1200)}`);
    }

    // 2. Pull full forecast data from prediction_history
    try {
      const historyContainer = getContainer("prediction_history");
      const { resources: histories } = await historyContainer.items
        .query({
          query: "SELECT TOP 1 c.plotData, c.filename, c.createdAt FROM c WHERE c.userId = @uid ORDER BY c.createdAt DESC",
          parameters: [{ name: "@uid", value: userId }],
        })
        .fetchAll();

      if (histories && histories.length > 0) {
        const h = histories[0];
        const plotData = h.plotData || {};

        // Stock alerts (all of them)
        const alerts = (plotData.stock_alerts || [])
          .map((a: any) => `${a.product}: stok ${a.current_stock}, ROP ${a.rop}, status ${a.status}, sisa ${a.days_left} hari, aksi: ${a.action}`)
          .join("\n");
        if (alerts) {
          parts.push(`STOCK ALERTS:\n${alerts}`);
        }

        // Best sellers
        const sellers = Object.entries(plotData.best_sellers || {})
          .map(([name, qty]) => `${name}: ${qty} unit terjual`)
          .join("\n");
        if (sellers) {
          parts.push(`BEST SELLERS:\n${sellers}`);
        }

        // Forecast chart (summary: next 7 and 30 days)
        const chart = plotData.chart || [];
        if (chart.length > 0) {
          const next7 = chart.slice(0, 7);
          const avgNext7 = Math.round(next7.reduce((s: number, c: any) => s + (c.yhat || 0), 0) / next7.length);
          const next30 = chart.slice(0, 30);
          const avgNext30 = Math.round(next30.reduce((s: number, c: any) => s + (c.yhat || 0), 0) / next30.length);
          const totalNext30 = Math.round(next30.reduce((s: number, c: any) => s + (c.yhat || 0), 0));
          parts.push(`FORECAST PREDIKSI:\nRata-rata harian 7 hari ke depan: ${avgNext7} unit\nRata-rata harian 30 hari ke depan: ${avgNext30} unit\nTotal prediksi 30 hari: ${totalNext30} unit\nData forecast: ${chart.length} hari ke depan`);
        }

        if (h.filename) {
          parts.push(`SUMBER DATA: ${h.filename} (diupload ${h.createdAt ? new Date(h.createdAt).toLocaleDateString("id-ID") : "sebelumnya"})`);
        }
      }
    } catch {
      // prediction_history might not exist
    }

    // 3. Recent chat history (last 5 conversations)
    try {
      const chatContainer = getContainer("chat_logs");
      const { resources: recentChats } = await chatContainer.items
        .query({
          query: "SELECT TOP 5 c.question, c.answer, c.createdAt FROM c WHERE c.userId = @uid ORDER BY c.createdAt DESC",
          parameters: [{ name: "@uid", value: userId }],
        })
        .fetchAll();

      if (recentChats && recentChats.length > 0) {
        const chatSummary = recentChats.map((chat: any) => {
          const q = String(chat.question).slice(0, 100);
          const a = String(chat.answer).slice(0, 200);
          return `Q: ${q}\nA: ${a}`;
        }).join("\n---\n");
        parts.push(`RIWAYAT ANALISIS TERBARU (${recentChats.length} percakapan):\n${chatSummary}`);
      }
    } catch {
      // chat_logs might be empty
    }

    const context = parts.join("\n\n");
    return { userId, context: context || "", isFirstMessage };
  } catch (err) {
    console.warn("Failed to get user context:", err);
    return null;
  }
}

/**
 * Link a Telegram chat to a GudangKu user account.
 */
async function linkTelegramAccount(telegramChatId: number, linkCode: string): Promise<string> {
  try {
    const container = getContainer("users");

    // Find user by link code
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.telegramLinkCode = @code",
        parameters: [{ name: "@code", value: linkCode.trim().toUpperCase() }],
      })
      .fetchAll();

    if (!resources || resources.length === 0) {
      return "Kode link tidak ditemukan. Buka gudangku.space > Dashboard lalu generate kode link Telegram.";
    }

    const user = resources[0];
    user.telegramChatId = telegramChatId;
    user.telegramLinkCode = undefined; // one-time use
    user._telegramGreeted = true;
    await container.item(user.id, user.id).replace(user);

    return [
      "Akun berhasil terhubung! Saya sekarang bisa akses data gudang kamu.",
      "",
      "Coba tanya salah satu ini:",
      '- "Stok mana yang paling kritis?"',
      '- "Produk apa yang paling laku?"',
      '- "Kapan harus restock?"',
      '- "Analisis performa gudang saya"',
      "",
      "Atau ketik /stok untuk ringkasan stok langsung.",
    ].join("\n");
  } catch {
    return "Gagal menghubungkan akun. Coba lagi nanti.";
  }
}

/**
 * Call Gemini with file attachment (image/PDF).
 */
async function callGeminiWithFile(
  prompt: string,
  fileBase64: string,
  mimeType: string,
  context: string = ""
): Promise<{ text: string; cached: boolean }> {
  const cacheKey = `tg_file::${prompt.slice(0, 100)}::${fileBase64.slice(0, 50)}`;
  const cached = await getCachedResponse(cacheKey);
  if (cached) return { text: cached, cached: true };

  const apiKey = await getSecret("SUMOPOD-API-KEY", "SUMOPOD_API_KEY");
  let baseUrl = await getSecret("SUMOPOD-BASE-URL", "SUMOPOD_BASE_URL");
  if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;

  const userContent: any[] = [];

  // Add file as inline data
  if (mimeType.startsWith("image/")) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${fileBase64}` },
    });
  }

  // Add text prompt
  const fullPrompt = context
    ? `INVENTORY CONTEXT:\n${context}\n\nUSER REQUEST:\n${prompt}`
    : prompt;
  userContent.push({ type: "text", text: fullPrompt });

  const payload = {
    model: "gemini/gemini-2.5-flash",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.3,
    max_tokens: 1024,
    top_p: 0.8,
  };

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = (await res.json()) as any;
  const text = data.choices?.[0]?.message?.content ?? "Maaf, tidak bisa menganalisis saat ini.";

  await setCachedResponse(cacheKey, text, 4 * 60 * 60);
  return { text, cached: false };
}

/**
 * Call Gemini text-only with token budget.
 */
async function callGeminiText(
  prompt: string,
  context: string = ""
): Promise<{ text: string; cached: boolean }> {
  const cacheKey = `tg_text::${prompt.trim().toLowerCase().slice(0, 200)}::${context.slice(0, 100)}`;
  const cached = await getCachedResponse(cacheKey);
  if (cached) return { text: cached, cached: true };

  const apiKey = await getSecret("SUMOPOD-API-KEY", "SUMOPOD_API_KEY");
  let baseUrl = await getSecret("SUMOPOD-BASE-URL", "SUMOPOD_BASE_URL");
  if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;

  const fullPrompt = context
    ? `INVENTORY CONTEXT:\n${context}\n\nQUESTION:\n${prompt}`
    : prompt;

  const payload = {
    model: "gemini/gemini-2.5-flash",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: fullPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1024,
    top_p: 0.8,
  };

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = (await res.json()) as any;
  const text = data.choices?.[0]?.message?.content ?? "Maaf, tidak bisa menganalisis saat ini.";

  await setCachedResponse(cacheKey, text, 4 * 60 * 60);
  return { text, cached: false };
}

/**
 * Main handler for incoming Telegram updates.
 */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const msg = update.message;
  if (!msg || !msg.chat) return;

  const chatId = msg.chat.id;
  const botToken = await getSecret("TELEGRAM-BOT-TOKEN", "TELEGRAM_BOT_TOKEN");

  // Show typing indicator
  await sendTyping(chatId, botToken);

  const text = msg.text?.trim() ?? "";
  const caption = msg.caption?.trim() ?? "";

  // /start command
  if (text === "/start") {
    // Check if user is already linked
    const startCtx = await getUserContext(chatId);
    if (startCtx && startCtx.context) {
      await sendMessage(chatId, TEMPLATE_QUESTIONS_LINKED, botToken);
    } else {
      await sendMessage(chatId, WELCOME_TEMPLATE, botToken);
    }
    return;
  }

  // /link command
  if (text.startsWith("/link ")) {
    const code = text.replace("/link ", "").trim();
    if (!code) {
      await sendMessage(chatId, "Format: /link KODE_KAMU\n\nDapatkan kode di gudangku.space > Dashboard.", botToken);
      return;
    }
    const result = await linkTelegramAccount(chatId, code);
    await sendMessage(chatId, result, botToken);
    return;
  }

  // /help command
  if (text === "/help") {
    await sendMessage(chatId, [
      "PERINTAH:",
      "/start - Mulai bot & lihat template pertanyaan",
      "/link KODE - Hubungkan akun GudangKu",
      "/stok - Analisis lengkap stok kamu",
      "/forecast - Prediksi penjualan ke depan",
      "/kredit - Cek sisa kredit",
      "/help - Bantuan",
      "",
      "YANG BISA KAMU TANYA:",
      "- Stok mana yang paling kritis?",
      "- Produk apa yang paling laku?",
      "- Kapan harus restock Beras Premium?",
      "- Analisis performa gudang saya",
      "- Rekomendasi strategi supply chain",
      "",
      "FITUR LAINNYA:",
      "- Kirim foto: analisis produk/struk/label/gudang",
      "- Kirim PDF: baca invoice, PO, atau dokumen",
      "",
      "Tips: Pertanyaan yang sama di-cache otomatis (gratis).",
    ].join("\n"), botToken);
    return;
  }

  // /stok command
  if (text === "/stok") {
    const userCtx = await getUserContext(chatId);
    if (!userCtx || !userCtx.context) {
      await sendMessage(chatId, "Belum ada data inventory. Upload CSV di gudangku.space dulu, lalu hubungkan akun dengan /link KODE.", botToken);
      return;
    }
    // Summarize using AI with full context
    const { text: summary } = await callGeminiText(
      "Berikan analisis lengkap stok saya: 1) Produk mana yang KRITIS dan harus segera restock (sebutkan nama produk, sisa stok, dan berapa hari lagi habis), 2) Produk yang WARNING (perlu rencana pemesanan), 3) Produk yang AMAN. Berikan rekomendasi urutan prioritas restok.",
      userCtx.context
    );
    await sendMessage(chatId, summary, botToken);
    return;
  }

  // /forecast command
  if (text === "/forecast") {
    const userCtx = await getUserContext(chatId);
    if (!userCtx || !userCtx.context) {
      await sendMessage(chatId, "Belum ada data forecast. Upload CSV di gudangku.space dulu, lalu hubungkan akun dengan /link KODE.", botToken);
      return;
    }
    const { text: forecast } = await callGeminiText(
      "Berdasarkan data forecast yang ada, berikan analisis: 1) Prediksi tren penjualan 7 hari dan 30 hari ke depan, 2) Produk mana yang permintaannya akan naik, 3) Produk mana yang permintaannya turun, 4) Rekomendasi stok yang harus disiapkan. Sebutkan angka-angka spesifik.",
      userCtx.context
    );
    await sendMessage(chatId, forecast, botToken);
    return;
  }

  // /kredit command
  if (text === "/kredit") {
    const userCtx = await getUserContext(chatId);
    if (!userCtx) {
      await sendMessage(chatId, "Akun belum terhubung. Ketik /link KODE untuk menghubungkan akun GudangKu kamu.", botToken);
      return;
    }
    try {
      const userDoc = await getCredits(userCtx.userId);
      await sendMessage(chatId, `Sisa kredit kamu: ${userDoc.current_credits} kredit\n\nKredit reset otomatis setiap hari jam 00:00 UTC.\nSetiap pertanyaan = 3 kredit.\nJawaban dari cache = GRATIS.`, botToken);
    } catch {
      await sendMessage(chatId, "Gagal mengecek kredit. Coba lagi nanti.", botToken);
    }
    return;
  }

  // Rate limit check (using telegram chat ID as identifier)
  const rateLimitKey = `tg:${chatId}`;
  const rateCheck = await checkRateLimit(rateLimitKey, 60, 10);
  if (!rateCheck.allowed) {
    const waitSec = Math.ceil(rateCheck.retryAfterMs / 1000);
    await sendMessage(chatId, `Terlalu banyak pesan. Tunggu ${waitSec} detik lagi ya.`, botToken);
    return;
  }

  // Get user context (if linked)
  const userCtx = await getUserContext(chatId);
  const inventoryContext = userCtx?.context ?? "";

  // First-time interaction for linked users: show template questions
  if (userCtx && userCtx.isFirstMessage) {
    try {
      const usersContainer = getContainer("users");
      const { resource: userDoc } = await usersContainer.item(userCtx.userId, userCtx.userId).read();
      if (userDoc) {
        userDoc._telegramGreeted = true;
        await usersContainer.item(userCtx.userId, userCtx.userId).replace(userDoc);
      }
    } catch { /* ignore */ }
    // Send template, then continue to process their actual message
    if (!text && !msg.photo && !msg.document) {
      await sendMessage(chatId, TEMPLATE_QUESTIONS_LINKED, botToken);
      return;
    }
  }

  // If user is not linked, provide guidance but still answer
  if (!userCtx && text) {
    // Still answer supply chain questions but note they should link
    const unlinkedNote = "\n\nTip: Hubungkan akun GudangKu kamu dengan /link KODE agar saya bisa akses data stok kamu langsung.";
    try {
      const { text: answer, cached } = await callGeminiText(text, "");
      const creditNote = cached ? " (Cached)" : "";
      await sendMessage(chatId, answer + unlinkedNote + creditNote, botToken);
    } catch {
      await sendMessage(chatId, "Maaf, terjadi error. Coba lagi nanti.", botToken);
    }
    return;
  }

  // Credit check & deduction (if linked)
  if (userCtx) {
    try {
      await consumeCredits(userCtx.userId, "supply_chain_ai");
    } catch (err) {
      if (err instanceof CreditError) {
        await sendMessage(chatId, `Kredit habis (sisa: ${err.remaining}). Kredit reset besok jam 00:00 UTC.\n\nTip: Pertanyaan yang sudah pernah ditanya biasanya di-cache dan gratis.`, botToken);
        return;
      }
      throw err;
    }
  }

  // Handle photo
  if (msg.photo && msg.photo.length > 0) {
    // Get highest resolution photo
    const bestPhoto = msg.photo[msg.photo.length - 1];
    const fileData = await downloadTelegramFile(bestPhoto.file_id, botToken);

    if (!fileData) {
      await sendMessage(chatId, "Gagal mengunduh foto. Coba kirim ulang.", botToken);
      return;
    }

    const prompt = caption || "Analisis foto ini: identifikasi produk, estimasi jumlah, kondisi, dan berikan saran supply chain.";

    try {
      const { text: answer, cached } = await callGeminiWithFile(prompt, fileData.base64, fileData.mimeType, inventoryContext);
      const creditNote = cached ? "\n\n(Cached - gratis)" : "";
      await sendMessage(chatId, answer + creditNote, botToken);
    } catch (err: any) {
      await sendMessage(chatId, "Gagal menganalisis foto. Coba lagi.", botToken);
    }
    return;
  }

  // Handle document (PDF)
  if (msg.document) {
    const mime = msg.document.mime_type ?? "";
    if (!mime.includes("pdf") && !mime.startsWith("image/")) {
      await sendMessage(chatId, "Saat ini hanya mendukung file PDF dan gambar. Kirim file dalam format tersebut.", botToken);
      return;
    }

    const fileData = await downloadTelegramFile(msg.document.file_id, botToken);
    if (!fileData) {
      await sendMessage(chatId, "Gagal mengunduh dokumen. Coba kirim ulang.", botToken);
      return;
    }

    const prompt = caption || (mime.includes("pdf")
      ? "Baca dokumen PDF ini, ekstrak info penting: nama barang, jumlah, harga, tanggal, supplier. Berikan ringkasan."
      : "Analisis gambar ini dalam konteks supply chain dan inventory.");

    try {
      const { text: answer, cached } = await callGeminiWithFile(prompt, fileData.base64, fileData.mimeType, inventoryContext);
      const creditNote = cached ? "\n\n(Cached - gratis)" : "";
      await sendMessage(chatId, answer + creditNote, botToken);
    } catch (err: any) {
      await sendMessage(chatId, "Gagal memproses dokumen. Coba lagi.", botToken);
    }
    return;
  }

  // Handle text message
  if (text) {
    try {
      const { text: answer, cached } = await callGeminiText(text, inventoryContext);
      const creditNote = cached ? "\n\n(Cached - gratis)" : "";
      await sendMessage(chatId, answer + creditNote, botToken);
    } catch (err: any) {
      await sendMessage(chatId, "Maaf, terjadi error. Coba lagi nanti.", botToken);
    }
    return;
  }

  // Fallback
  await sendMessage(chatId, "Kirim teks, foto, atau PDF untuk mulai analisis. Ketik /help untuk bantuan.", botToken);
}

/**
 * Register the webhook URL with Telegram.
 * Call once after deployment.
 */
export async function registerWebhook(webhookUrl: string): Promise<string> {
  const botToken = await getSecret("TELEGRAM-BOT-TOKEN", "TELEGRAM_BOT_TOKEN");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "gudangku-tg-webhook-2026";

  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message"],
      max_connections: 40,
    }),
  });

  const data = await res.json() as any;
  return data.description ?? JSON.stringify(data);
}
