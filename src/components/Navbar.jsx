import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { APP_NAME } from "../config/app";
import Button from "./ui/Button";
import { isSuperAdminRole } from "../utils/auth";

const publicNavItems = [
  { to: "/#features", label: "Features" },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#request-subject", label: "Request subject" },
  { to: "/#feedback", label: "Feedback" },
  { to: "/#support", label: "Support" },
  { to: "/login", label: "Login" },
];

const studentNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/subjects", label: "Subjects" },
  { to: "/search", label: "Search" },
  { to: "/analysis", label: "Analysis" },
  { to: "/predict", label: "Predictions" },
  { to: "/suggestions", label: "Suggestions" },
  { to: "/generate-answer", label: "Answers" },
  { to: "/support", label: "Support" },
  { to: "/feedback", label: "Feedback" },
  { to: "/profile", label: "Profile" },
];

const adminNavItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/upload", label: "Upload" },
  { to: "/admin/questions", label: "Questions" },
  { to: "/admin/subjects", label: "Subjects" },
  { to: "/support", label: "Support" },
  { to: "/feedback", label: "Feedback" },
  { to: "/admin/profile", label: "Profile" },
];

const superAdminNavItems = [
  { to: "/admin/universities", label: "Universities" },
  { to: "/admin/departments", label: "Departments" },
];

function navClass({ isActive }) {
  return [
    "flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium transition",
    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  ].join(" ");
}

function Brand({ onClick }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="block min-w-0 cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      aria-label="Go to FakiBuzz homepage"
    >
      <span className="block truncate text-lg font-semibold tracking-tight text-slate-950">{APP_NAME}</span>
      <span className="block truncate text-xs font-medium text-slate-500">Exam intelligence for learners</span>
    </Link>
  );
}

function getRoleLabel(role, isAdmin) {
  if (isSuperAdminRole(role)) {
    return "Super Admin";
  }

  return isAdmin ? "Sub Admin" : "Student";
}

function Navbar() {
  const { isAuthenticated, isAdmin, isSuperAdmin, logout, role, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPublicMenuOpen, setIsPublicMenuOpen] = useState(false);
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const navItems = !isAuthenticated
    ? publicNavItems
    : isAdmin
      ? [...adminNavItems.slice(0, 4), ...(isSuperAdmin ? superAdminNavItems : []), ...adminNavItems.slice(4)]
      : studentNavItems;
  const roleLabel = getRoleLabel(role, isAdmin);

  function handleLogout() {
    setIsAppMenuOpen(false);
    logout();
    navigate("/", { replace: true });
  }

  function scrollHomeToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleBrandClick(event) {
    event.preventDefault();
    setIsPublicMenuOpen(false);
    setIsAppMenuOpen(false);

    if (location.pathname === "/" && !location.hash) {
      scrollHomeToTop();
      return;
    }

    navigate("/");
    window.setTimeout(scrollHomeToTop, 0);
  }

  if (!isAuthenticated) {
    return (
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Brand onClick={handleBrandClick} />
          <button
            type="button"
            className="inline-flex min-h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isPublicMenuOpen}
            onClick={() => setIsPublicMenuOpen((current) => !current)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
          <div className="hidden items-center gap-2 lg:flex lg:justify-end">
            {navItems.map((item) => {
              if (item.to.includes("#")) {
                const itemHash = item.to.slice(item.to.indexOf("#"));
                const isHashActive = location.pathname === "/" && location.hash === itemHash;

                return (
                  <Link key={item.to} to={item.to} className={navClass({ isActive: isHashActive })}>
                    {item.label}
                  </Link>
                );
              }

              return (
                <NavLink key={item.to} to={item.to} className={navClass}>
                  {item.label}
                </NavLink>
              );
            })}
            <Link
              to="/register"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-transparent bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        </div>
        {isPublicMenuOpen && (
          <div className="border-t border-slate-100 px-4 pb-4 sm:px-6 lg:hidden">
            <div className="grid gap-2 pt-3">
              {navItems.map((item) => {
                const commonClass = "flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-sm font-medium transition";

                if (item.to.includes("#")) {
                  const itemHash = item.to.slice(item.to.indexOf("#"));
                  const isHashActive = location.pathname === "/" && location.hash === itemHash;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsPublicMenuOpen(false)}
                      className={`${commonClass} ${isHashActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsPublicMenuOpen(false)}
                    className={({ isActive }) =>
                      `${commonClass} ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`
                    }
                  >
                    {item.label}
                  </NavLink>
                );
              })}
              <Link
                to="/register"
                onClick={() => setIsPublicMenuOpen(false)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-transparent bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    );
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Brand onClick={handleBrandClick} />
          <button
            type="button"
            className="inline-flex min-h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            aria-label="Toggle navigation menu"
            aria-expanded={isAppMenuOpen}
            onClick={() => setIsAppMenuOpen((current) => !current)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </div>
        {isAppMenuOpen && (
          <div className="border-t border-slate-100 px-4 pb-4">
            <div className="grid gap-2 pt-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {roleLabel}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-950">
                  {user?.full_name || user?.email || roleLabel}
                </p>
              </div>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsAppMenuOpen(false)}
                  className={({ isActive }) => navClass({ isActive })}
                >
                  {item.label}
                </NavLink>
              ))}
              <Button variant="secondary" className="w-full" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        )}
      </nav>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
        <Brand onClick={handleBrandClick} />

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {roleLabel}
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-950">
            {user?.full_name || user?.email || roleLabel}
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
