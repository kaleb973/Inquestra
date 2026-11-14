export { cn } from "cn"

/** Sanitize raw Supabase errors (such as alphabet dumps) into clean human-readable text. */
export function formatAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('password should contain at least one character of each')) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }
  return msg;
}
