import type { Metadata } from "next";

// El token va en la URL (ADR-007): fuera de los buscadores y sin mandarlo en el Referer
// al pulsar un enlace hacia otra web.
export const metadata: Metadata = {
  title: "Tu estancia",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function GuestLayout({ children }: LayoutProps<"/estancia/[token]">) {
  return children;
}
