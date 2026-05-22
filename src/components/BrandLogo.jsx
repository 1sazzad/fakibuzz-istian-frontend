import logoUrl from "../assets/branding/q_arena_logo.png";
import { APP_NAME } from "../config/app";

function BrandLogo({ className = "", imageClassName = "h-10 w-10", textClassName = "text-lg font-semibold tracking-tight text-slate-950", showText = true, showTagline = false }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <img src={logoUrl} alt="Q Arena logo" className={`shrink-0 object-contain ${imageClassName}`} />
      {showText && (
        <div className="min-w-0">
          <span className={`block truncate ${textClassName}`}>{APP_NAME}</span>
          {showTagline && <span className="block truncate text-xs font-medium text-slate-500">Smart Planning for Smart Students</span>}
        </div>
      )}
    </div>
  );
}

export default BrandLogo;