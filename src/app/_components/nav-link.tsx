"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: string }) {
  const active = usePathname().startsWith(href);
  return (
    <Link href={href} className="navkey" aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
