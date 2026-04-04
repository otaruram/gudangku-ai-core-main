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
  action: CreditAction
): Promise<UserDocument> {
  const container = getContainer("users");
  const cost = CREDIT_COSTS[action];
  const today = todayUTC();

  // 1. Read or create user document
  let user: UserDocument;
  try {
    const { resource } = await container.item(userId, userId).read<UserDocument>();
    user = resource!;
  } catch (err: any) {
    if (err.code === 404) {
      // First-time user — bootstrap document
      user = {
        id: userId,
        current_credits: DAILY_QUOTA,
        last_refresh_date: today,
      };
      await container.items.create(user);
    } else {
      throw err;
    }
  }

  // 2. Lazy Evaluation — reset credits if last_refresh_date < today
  if (user.last_refresh_date < today) {
    user.current_credits = DAILY_QUOTA;
    user.last_refresh_date = today;
  }

  // 3. Check sufficient credits
  if (user.current_credits < cost) {
    throw new CreditError(
      `Insufficient credits. You have ${user.current_credits} credits remaining. ` +
        `This action costs ${cost} credits. Credits reset daily at 00:00 UTC.`,
      user.current_credits,
      cost
    );
  }

  // 4. Deduct and persist
  user.current_credits -= cost;
  await container.item(userId, userId).replace(user);

  return user;
}

/**
 * Get current credit balance (with lazy refresh applied).
 */
export async function getCredits(userId: string): Promise<UserDocument> {
  const container = getContainer("users");
  const today = todayUTC();

  let user: UserDocument;
  try {
    const { resource } = await container.item(userId, userId).read<UserDocument>();
    user = resource!;
  } catch (err: any) {
    if (err.code === 404) {
      user = {
        id: userId,
        current_credits: DAILY_QUOTA,
        last_refresh_date: today,
      };
      await container.items.create(user);
      return user;
    }
    throw err;
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
