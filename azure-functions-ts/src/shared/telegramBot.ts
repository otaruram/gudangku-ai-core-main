/**
 * Telegram Bot Service for GudangKu Supply Chain Assistant.
 *
 * Capabilities:
 * - Text questions about user's inventory data
 * - Photo/image analysis (product photos, receipts, labels)
 * - PDF document processing (invoices, purchase orders)
 * - Reads user's CSV/inventory context from Cosmos DB
 *
 * Uses Redis for caching & rate limiting.
 * Token budget: max 200 tokens output to control costs.
 */
import { getSecret } from "./keyVault";
import { getCachedResponse, setCachedResponse, checkRateLimit } from "./redisCache";
import { getContainer } from "./cosmosClient";
import { consumeCredits, getCredits, CreditError } from "./creditSystem";

const SYSTEM_PROMPT = [
  "You are GudangKu Supply Chain AI, a professional supply chain and inventory management consultant for Indonesian UMKM businesses.",
  "",
  "CONTEXT: You are chatting via Telegram. The user is a warehouse owner or UMKM operator.",
  "",
  "RULES:",
  "1. Respond in Bahasa Indonesia unless the user writes in English.",
  "2. Keep responses SHORT and actionable (max 150 words).",
  "3. Use numbered lists (1. 2. 3.) for recommendations.",
  "4. NEVER use markdown formatting (no *, no _, no `, no #).",
  "5. When given inventory data, reference specific products and numbers.",
  "6. For images: identify products, estimate quantities, note conditions, suggest actions.",
  "7. For PDFs/documents: extract key info (items, quantities, prices, dates, suppliers).",
  "8. Always end with one actionable next step.",
  "9. If the user hasn't linked their data yet, tell them to visit gudangku.space to upload CSV.",
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
 * Get the user's inventory context from Cosmos DB (linked via Telegram chat ID).
 * Returns a trimmed summary to stay within token budget.
 */
async function getUserContext(telegramChatId: number): Promise<{ userId: string; context: string } | null> {
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

    // Try to get recent chat logs for context
    const chatContainer = getContainer("chat_logs");
    const { resources: recentChats } = await chatContainer.items
      .query({
        query: "SELECT TOP 3 c.question, c.answer FROM c WHERE c.userId = @uid ORDER BY c.createdAt DESC",
        parameters: [{ name: "@uid", value: userId }],
      })
      .fetchAll();

    // Build compact context (budget-friendly)
    let context = "";

    if (user.inventorySummary) {
      // Truncate to ~800 chars to keep token usage low
      const summary = String(user.inventorySummary).slice(0, 800);
      context += `INVENTORY DATA:\n${summary}\n\n`;
    }

    if (recentChats && recentChats.length > 0) {
      context += "RECENT ANALYSIS:\n";
      for (const chat of recentChats) {
        const q = String(chat.question).slice(0, 80);
        const a = String(chat.answer).slice(0, 120);
        context += `Q: ${q}\nA: ${a}\n`;
      }
    }

    return { userId, context: context.trim() };
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
    await container.item(user.id, user.id).replace(user);

    return `Akun berhasil terhubung! Sekarang kamu bisa tanya-tanya soal stok dan inventory langsung di sini.\n\nKetik "stok" untuk cek ringkasan stok kamu.`;
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
    max_tokens: 200,
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
    max_tokens: 200,
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
    await sendMessage(chatId, [
      "Halo! Saya GudangKu AI, asisten supply chain kamu.",
      "",
      "Yang bisa saya bantu:",
      "1. Tanya soal stok dan inventory",
      "2. Analisis foto produk/struk/label",
      "3. Baca dokumen PDF (invoice, PO)",
      "4. Strategi restock dan supplier",
      "",
      "Untuk menghubungkan akun GudangKu kamu, ketik:",
      "/link KODE_KAMU",
      "",
      "Kode bisa didapat di gudangku.space > Dashboard.",
      "",
      "Atau langsung tanya apa saja soal supply chain!",
    ].join("\n"), botToken);
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
      "/start - Mulai bot",
      "/link KODE - Hubungkan akun GudangKu",
      "/stok - Ringkasan stok kamu",
      "/kredit - Cek sisa kredit",
      "/help - Bantuan",
      "",
      "FITUR:",
      "- Kirim teks: tanya soal inventory/supply chain",
      "- Kirim foto: analisis produk/struk/label/gudang",
      "- Kirim PDF: baca invoice, PO, atau dokumen",
      "",
      "Tips: Pertanyaan yang sama akan di-cache (gratis).",
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
    // Summarize using AI
    const { text: summary } = await callGeminiText(
      "Berikan ringkasan singkat stok saya: produk mana yang kritis, perlu restock, dan aman. Format: daftar nomor.",
      userCtx.context
    );
    await sendMessage(chatId, summary, botToken);
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
