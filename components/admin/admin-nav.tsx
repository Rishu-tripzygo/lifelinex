"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/orders", label: "Payments" },
  { href: "/admin/assessments", label: "Assessments" },
  { href: "/admin/schedule", label: "Schedule", adminOnly: true },
  { href: "/admin/doctors", label: "Doctors", adminOnly: true },
  { href: "/admin/team", label: "Team", adminOnly: true },
  { href: "/admin/audit", label: "Audit log", adminOnly: true },
];

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="anav__links" aria-label="Admin">
      {LINKS.filter((l) => isAdmin || !l.adminOnly).map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
