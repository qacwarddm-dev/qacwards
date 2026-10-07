export function otpErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("security purposes") || m.includes("rate limit") || m.includes("too many")) {
    return "Please wait about a minute before asking for another code.";
  }
  if (m.includes("sending") && m.includes("email")) {
    return "We couldn't send the code just now. Please try again in a minute.";
  }
  if (m.includes("database error")) {
    return "That address can't be registered. Use your PUP webmail (example@pup.edu.ph).";
  }
  return message;
}
