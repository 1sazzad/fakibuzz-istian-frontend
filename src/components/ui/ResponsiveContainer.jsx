function ResponsiveContainer({ as: Component = "main", className = "", children }) {
  return (
    <Component className={`min-h-[calc(100vh-72px)] overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_35%,#eef2ff_120%)] px-4 py-6 text-slate-900 sm:px-6 md:py-10 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-7xl space-y-6">{children}</div>
    </Component>
  );
}

export default ResponsiveContainer;
