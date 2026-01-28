import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NewClassClient } from "./NewClassClient";

export default async function NewClassPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  return <NewClassClient />;
}
