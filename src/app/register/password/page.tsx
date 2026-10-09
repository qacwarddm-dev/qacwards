import { redirect } from "next/navigation";
import { verifiedRegistration } from "@/lib/registration-session";
import CreatePasswordForm from "./CreatePasswordForm";

export default async function CreatePasswordPage() {
  if (!(await verifiedRegistration())) redirect("/register");
  return <CreatePasswordForm />;
}
