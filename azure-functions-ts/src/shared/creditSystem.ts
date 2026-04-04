/**
 * Tiered Credit System with Lazy Evaluation.
 *
 * NO CRON JOBS. Credits reset lazily on first request of the day.
 *
 * User document in Cosmos DB:
 *   { id, email, current_credits, last_refresh_date, ... }
 *
 * Credit costs:
 *   OCR              = 1 credit
 *   Supply Chain AI  = 3 credits
 */
import { getContainer } from "./cosmosClient";
import { sendWelcomeEmail } from "./emailService";

const DAILY_QUOTA = 10;

export type CreditAction = "ocr" | "supply_chain_ai";

const CREDIT_COSTS: Record<CreditAction, number> = {
  ocr: 1,
  supply_chain_ai: 3,
};

export interface UserDocument {
  id: string; // same as Supabase sub
  email?: string;
  current_credits: number;
  last_refresh_date: string; // "YYYY-MM-DD"
  role?: "admin" | "user";
  banned?: boolean;
}

/** Admin email — permanent unlimited credits */
const ADMIN_EMAIL = "okitr52@gmail.com";

export function isAdmin(user: UserDocument): boolean {
  return user.role === "admin";
}

/**
 * Get today's date string in UTC ("YYYY-MM-DD").
 */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Ensure the user document exists, apply lazy refresh if needed,
 * then check and deduct credits for the requested action.
 *
 * Returns the updated UserDocument on success.
 * Throws an error with a descriptive message if credits are insufficient.
 */
export async function consumeCredits(
  userId: string,
  action: CreditAction,
  email?: string
): Promise<UserDocument> {
  const container = getContainer("users");
  const cost = CREDIT_COSTS[action];
  const today = todayUTC();

  // 1. Read or create user document
  let user: UserDocument;
  try {
    const { resource } = await container.item(userId, userId).read<UserDocument>();
    if (!resource) throw { code: 404 };
    user = resource;
  } catch (err: any) {
    if (err.code === 404) {
      // First-time user — bootstrap document
      const isAdminUser = email === ADMIN_EMAIL;
      user = {
        id: userId,
        email,
        current_credits: isAdminUser ? 999999 : DAILY_QUOTA,
        last_refresh_date: today,
        role: isAdminUser ? "admin" : "user",
      };
      await container.items.create(user);
      // Send welcome email for new users
      if (email) {
        sendWelcomeEmail(email).catch(() => {});
      }
    } else {
      throw err;
    }
  }

  // Sync email if not stored yet
  if (email && !user.email) {
    user.email = email;
  }

  // Admin auto-detection on existing users
  if (user.email === ADMIN_EMAIL && user.role !== "admin") {
    user.role = "admin";
  }

  // 2. Lazy Evaluation — reset credits if last_refresh_date < today
  if (user.last_refresh_date < today) {
    user.current_credits = user.role === "admin" ? 999999 : DAILY_QUOTA;
    user.last_refresh_date = today;
  }

  // 3. Admin bypass — unlimited credits
  if (user.role === "admin") {
    user.current_credits = 999999;
    await container.item(userId, userId).replace(user);
    return user;
  }

  // 4. Check sufficient credits
  if (user.current_credits < cost) {
    throw new CreditError(
      `Insufficient credits. You have ${user.current_credits} credits remaining. ` +
        `This action costs ${cost} credits. Credits reset daily at 00:00 UTC.`,
      user.current_credits,
      cost
    );
  }

  // 5. Deduct and persist
  user.current_credits -= cost;
  await container.item(userId, userId).replace(user);

  return user;
}

/**
 * Get current credit balance (with lazy refresh applied).
 */
export async function getCredits(userId: string, email?: string): Promise<UserDocument> {
  const container = getContainer("users");
  const today = todayUTC();

  let user: UserDocument;
  try {
    const { resource } = await container.item(userId, userId).read<UserDocument>();
    if (!resource) throw { code: 404 };
    user = resource;
  } catch (err: any) {
    if (err.code === 404) {
      const isAdminUser = email === ADMIN_EMAIL;
      user = {
        id: userId,
        email,
        current_credits: isAdminUser ? 999999 : DAILY_QUOTA,
        last_refresh_date: today,
        role: isAdminUser ? "admin" : "user",
      };
      await container.items.create(user);
      // Send welcome email for new users
      if (email) {
        sendWelcomeEmail(email).catch(() => {});
      }
      return user;
    }
    throw err;
  }

  // Sync email
  if (email && !user.email) {
    user.email = email;
  }

  // Admin auto-detection
  if (user.email === ADMIN_EMAIL && user.role !== "admin") {
    user.role = "admin";
  }

  // Admin gets unlimited
  if (user.role === "admin") {
    user.current_credits = 999999;
    await container.item(userId, userId).replace(user);
    return user;
  }

  // Lazy refresh
  if (user.last_refresh_date < today) {
    user.current_credits = DAILY_QUOTA;
    user.last_refresh_date = today;
    await container.item(userId, userId).replace(user);
  }

  return user;
}

/**
 * Typed error for credit exhaustion — lets the handler return 429.
 */
export class CreditError extends Error {
  public remaining: number;
  public required: number;

  constructor(message: string, remaining: number, required: number) {
    super(message);
    this.name = "CreditError";
    this.remaining = remaining;
    this.required = required;
  }
}
