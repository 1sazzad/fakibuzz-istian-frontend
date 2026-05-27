function Card({ as: Component = "section", className = "", children, ...props }) {
  return (
    <Component
      className={[
        "min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-6 lg:p-7",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Card;
