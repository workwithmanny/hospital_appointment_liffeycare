"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "@/components/auth-nav";
export function HeaderNav() {
  const pathname = usePathname();
  if (pathname === "/") {
    return null;
  }
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      {" "}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        {" "}
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-slate-900"
        >
          {" "}
          LiffeyCare{" "}
        </Link>{" "}
        <div className="flex items-center gap-5 text-sm text-slate-600">
          {" "}
          <Link className="transition hover:text-slate-900" href="/patient">
            {" "}
            Patient{" "}
          </Link>{" "}
          <Link className="transition hover:text-slate-900" href="/doctor">
            {" "}
            Doctor{" "}
          </Link>{" "}
          <Link className="transition hover:text-slate-900" href="/admin">
            {" "}
            Admin{" "}
          </Link>{" "}
          <AuthNav />{" "}
        </div>{" "}
      </nav>{" "}
    </header>
  );
}
