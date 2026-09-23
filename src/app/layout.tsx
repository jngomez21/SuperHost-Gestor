import type { Metadata } from "next";
import { Chakra_Petch, Shantell_Sans } from "next/font/google";
import "./globals.css";

const ui = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const hand = Shantell_Sans({
  variable: "--font-shantell",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestor de llegadas",
  description: "Check-in, limpieza y mensajes para hosts de Airbnb.",
};

// Tema y animaciones elegidos por el host, aplicados antes de pintar para que no parpadee.
const PREFERENCES = `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme"),m=localStorage.getItem("motion");if(t)d.dataset.theme=t;if(m)d.dataset.motion=m}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${ui.variable} ${hand.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
