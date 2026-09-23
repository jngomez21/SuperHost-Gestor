import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireHost() {
  const session = await auth();
  const id = session?.user?.id;
  const email = session?.user?.email;
  if (!id || !email) redirect("/login");
  return { id, email, expires: session.expires };
}
