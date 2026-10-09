import RegisterForm from "./RegisterForm";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <RegisterForm invitedWebmail={email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : ""} />;
}
