export function LoadingDashboard() {
  return (
    <div aria-label="Connecting to monitoring source" role="status">
      <div className="panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="skeleton size-11 rounded-xl" />
          <div className="flex-1">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton mt-3 h-8 w-36 rounded" />
            <div className="skeleton mt-3 h-3 w-full max-w-md rounded" />
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-slate-500">Connecting to monitoring source…</p>
      <div className="mt-4 grid grid-cols-1 gap-3 min-[350px]:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="panel min-h-[156px] rounded-2xl p-4">
            <div className="skeleton size-9 rounded-lg" />
            <div className="skeleton mt-5 h-3 w-24 rounded" />
            <div className="skeleton mt-3 h-7 w-28 rounded" />
          </div>
        ))}
      </div>
      <div className="panel mt-4 h-[350px] rounded-2xl p-5">
        <div className="skeleton h-4 w-44 rounded" />
        <div className="skeleton mt-6 h-[260px] w-full rounded-xl" />
      </div>
    </div>
  );
}
