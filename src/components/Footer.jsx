import { Link } from "react-router-dom";
import { APP_NAME } from "../config/app";
import { CONTACT_METHODS } from "../config/contact";

const footerLinks = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms-of-service", label: "Terms of Service" },
  { to: "/contact", label: "Contact" },
  { to: "/feedback", label: "Feedback" },
];

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <p className="text-xl font-semibold tracking-tight">{APP_NAME}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
            Exam intelligence for learners.
          </p>
          <p className="mt-5 text-sm text-slate-400">
            © 2026 FakiBuzz. Built for students, by students.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:min-w-[28rem]">
          <div>
            <p className="text-sm font-semibold text-white">Important Links</p>
            <nav className="mt-3 grid gap-2 text-sm text-slate-300">
              {footerLinks.map((link) => (
                <Link key={link.to} to={link.to} className="inline-flex min-h-9 items-center hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Contact</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              {CONTACT_METHODS.map((method) => (
                <a
                  key={method.type}
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={method.href.startsWith("http") ? "noreferrer" : undefined}
                  className="inline-flex min-h-9 min-w-0 items-center break-words hover:text-white"
                >
                  {method.type}: {method.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
