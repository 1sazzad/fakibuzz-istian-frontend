function PageHeader({ eyebrow, title, description, actions, stats }) {
  return (
    <header className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 max-w-4xl break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          {description && <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-slate-600 sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>}
      </div>
      {stats && <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats}</div>}
    </header>
  );
}

export default PageHeader;
