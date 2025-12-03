import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-8">Page not found</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-violet-500/25"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
