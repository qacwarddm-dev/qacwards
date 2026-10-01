import RegisterForm from "./RegisterForm";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <RegisterForm invitedWebmail={email && /@pup\.edu\.ph$/i.test(email) ? email : ""} />;
}
