function Card({ as: Component = "section", className = "", children, ...props }) {
  return (
    <Component
      className={[
        "min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 sm:p-6",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Card;
