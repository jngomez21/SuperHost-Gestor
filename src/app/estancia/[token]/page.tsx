import { notFound } from "next/navigation";
import { getGuestStay } from "@/application/reservations";
import { GuestGuide } from "../guest-guide";
import { GuestThanks } from "../guest-thanks";

export default async function GuestStayPage({ params }: PageProps<"/estancia/[token]">) {
  const { token } = await params;
  const result = await getGuestStay(token);
  if (!result) notFound();
  if (result.view === "thanks") return <GuestThanks {...result} />;
  return <GuestGuide stay={result.stay} guide={result.guide} />;
}
