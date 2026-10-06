export const PASSWORD_MINIMUM_LENGTH = 12;
export const PASSWORD_MAXIMUM_LENGTH = 128;
export const PASSWORD_POLICY_HINT =
  "Use 12–128 characters with uppercase, lowercase, a number, and a symbol.";

export function passwordPolicyError(password) {
  if (!password) return null;
  if (password.length < PASSWORD_MINIMUM_LENGTH || password.length > PASSWORD_MAXIMUM_LENGTH)
    return `Use ${PASSWORD_MINIMUM_LENGTH}–${PASSWORD_MAXIMUM_LENGTH} characters.`;
  if (!/[a-z]/.test(password)) return "Add a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Add an uppercase letter.";
  if (!/[0-9]/.test(password)) return "Add a number.";
  if (!/[^A-Za-z0-9\s]/.test(password)) return "Add a symbol.";
  return null;
}
