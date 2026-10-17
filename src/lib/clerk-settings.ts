import "server-only";

export type SignInSettings = { username: boolean; email: boolean; emailRequired: boolean };

const FALLBACK: SignInSettings = { username: true, email: true, emailRequired: false };

/**
 * Reads which identifiers the Clerk instance accepts (Dashboard → User & authentication),
 * so account creation works whether usernames, emails or both are enabled.
 * Uses the public Frontend API environment endpoint, cached for five minutes.
 */
export async function getSignInSettings(): Promise<SignInSettings> {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk) return FALLBACK;
  try {
    const host = Buffer.from(pk.split("_")[2] ?? "", "base64").toString().replace(/\$$/, "");
    const res = await fetch(`https://${host}/v1/environment`, { next: { revalidate: 300 } });
    if (!res.ok) return FALLBACK;
    const attrs = (await res.json()).user_settings?.attributes;
    return {
      username: !!attrs?.username?.enabled,
      email: !!attrs?.email_address?.enabled,
      emailRequired: !!attrs?.email_address?.required,
    };
  } catch {
    return FALLBACK;
  }
}
