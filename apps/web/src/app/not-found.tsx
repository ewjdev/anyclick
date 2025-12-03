"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-gray-600">The page you are looking for does not exist.</p>
    </main>
  );
}
