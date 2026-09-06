/**
 * Auth screen kit — the login and register screens share a page frame, card,
 * fields, select and button, so they live here rather than being copied per
 * screen. Same discipline as src/components/portal/kit: components own their
 * look, pages pass data and variants.
 */
export { default as AuthAccountPrompt } from "./AuthAccountPrompt";
export { default as AuthButton } from "./AuthButton";
export { default as AuthCard } from "./AuthCard";
export type { AuthStep } from "./AuthCard";
export {
  AuthFieldGroup,
  AuthInput,
  AuthLabel,
  AuthPasswordField,
  AuthTextField,
} from "./AuthField";
export type { PasswordRule } from "./AuthField";
export { default as AuthFormError } from "./AuthFormError";
export { default as AuthSelect } from "./AuthSelect";
export { default as AuthShell } from "./AuthShell";
export { default as BackLink } from "./BackLink";
