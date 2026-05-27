function EmptyState({ title = "Nothing to show yet", description, action }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 p-6 text-center sm:p-8">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <span className="text-lg font-semibold">∅</span>
      </div>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export default EmptyState;
