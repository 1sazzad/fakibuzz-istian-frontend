import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Submit Exam" },
  { to: "/questions", label: "Questions" },
  { to: "/search", label: "Search" },
  { to: "/analysis", label: "Analysis" },
  { to: "/predict", label: "Predictions" },
  { to: "/answers", label: "Answer Builder" },
];

function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <NavLink to="/" className="flex flex-col gap-1">
          <span className="text-xl font-semibold tracking-tight text-white">
            FakiBuzz! ISTian
          </span>
          <span className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            RAG exam intelligence
          </span>
        </NavLink>

        <div className="flex flex-wrap gap-2 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-full px-4 py-2 transition",
                  isActive
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                    : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;