import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Button from "./ui/Button";

const publicNavItems = [
  { to: "/login", label: "Login" },
  { to: "/register", label: "Register" },
];

const studentNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/subjects", label: "Subjects" },
  { to: "/search", label: "Search" },
  { to: "/analysis", label: "Analysis" },
  { to: "/predict", label: "Predictions" },
  { to: "/suggestions", label: "Suggestions" },
  { to: "/generate-answer", label: "Answers" },
  { to: "/profile", label: "Profile" },
];

const adminNavItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/upload", label: "Upload" },
  { to: "/admin/questions", label: "Questions" },
  { to: "/admin/subjects", label: "Subjects" },
];

function navClass({ isActive }) {
  return [
    "flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium transition",
    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  ].join(" ");
}

function Brand() {
  return (
    <NavLink to="/" className="min-w-0">
      <span className="block truncate text-lg font-semibold tracking-tight text-slate-950">FakiBuzz! ISTian</span>
      <span className="block truncate text-xs font-medium text-slate-500">Exam intelligence for students</span>
    </NavLink>
  );
}

function Navbar() {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();
  const navItems = !isAuthenticated ? publicNavItems : isAdmin ? adminNavItems : studentNavItems;

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  if (!isAuthenticated) {
    return (
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Brand />
          <div className="flex shrink-0 items-center gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Brand />
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `${navClass({ isActive })} shrink-0`}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
        <Brand />

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{isAdmin ? "Admin" : "Student"}</p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-950">
            {user?.full_name || user?.email || (isAdmin ? "Admin" : "Student")}
          </p>
          {user?.email && <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>}
        </div>

        <div className="mt-6 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <Button variant="secondary" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </aside>
    </>
  );
}

export default Navbar;
