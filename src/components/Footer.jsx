import { Link } from "react-router-dom";
import { Globe, Mail, MessageCircle, Sparkles } from "lucide-react";
import { CONTACT_METHODS } from "../config/contact";
import BrandLogo from "./BrandLogo";

const footerLinks = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms-of-service", label: "Terms of Service" },
  { to: "/contact", label: "Contact" },
  { to: "/feedback", label: "Feedback" },
];

function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0">
          <BrandLogo className="items-start" imageClassName="h-11 w-11" textClassName="text-xl font-semibold tracking-tight text-white" showTagline />
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Q Arena helps students study smarter with previous questions, topic analysis, semantic search, AI predictions, and answer support.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"><Sparkles className="h-3.5 w-3.5" />Premium UI</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"><Globe className="h-3.5 w-3.5" />qarena.me</span>
          </div>
          <p className="mt-5 text-sm text-slate-400">© 2026 Q Arena. Built for students, by students.</p>
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
            <a href="https://qarena.me" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200">
              <Globe className="h-4 w-4" /> Visit qarena.me
            </a>
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
                  {method.type === "Email" ? <Mail className="mr-2 h-4 w-4" /> : <MessageCircle className="mr-2 h-4 w-4" />}
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
