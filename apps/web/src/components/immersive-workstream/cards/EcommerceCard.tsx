export function EcommerceCard() {
  return (
    <div className="relative w-full max-w-md">
      <div
        className="rounded-xl p-6 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(251, 191, 36, 0.04))",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-lg"
            style={{
              background:
                "linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.2))",
            }}
          />
          <div className="flex-1">
            <div className="h-3 w-3/4 rounded bg-white/20" />
            <div className="mt-2 h-2 w-1/2 rounded bg-white/10" />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-amber-400">
                $49.99
              </span>
              <span className="rounded bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">
                In Stock
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <div className="h-0.5 flex-1 rounded bg-amber-400/30">
            <div
              className="h-full w-2/3 rounded bg-amber-400"
              style={{ boxShadow: "0 0 8px rgba(245, 158, 11, 0.5)" }}
            />
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-amber-400/60"
          >
            <path
              d="M3 5h2l1 7h11l1-5H7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="19" r="1" fill="currentColor" />
            <circle cx="17" cy="19" r="1" fill="currentColor" />
          </svg>
        </div>
      </div>

      <div
        className="absolute -inset-4 -z-10 rounded-2xl opacity-30 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.4), transparent 70%)",
        }}
      />
    </div>
  );
}
