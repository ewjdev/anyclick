import { ArrowRight } from "lucide-react";
import Link from "next/link";

/** Link from a docs section to the example page where it runs. */
export function SeeItLive({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-white transition-colors"
    >
      See it live: {label}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}
