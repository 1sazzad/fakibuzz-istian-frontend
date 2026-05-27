import Card from "./Card";

function SectionCard({ eyebrow, title, description, actions, className = "", children, ...props }) {
  return (
    <Card className={`space-y-4 ${className}`} {...props}>
      {(eyebrow || title || description || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{eyebrow}</p>}
            {title && <h2 className="mt-2 break-words text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{title}</h2>}
            {description && <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-600">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
        </div>
      )}
      {children}
    </Card>
  );
}

export default SectionCard;