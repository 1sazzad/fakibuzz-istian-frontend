import Badge from "./Badge";

const STATUS_TONES = {
  active: "green",
  published: "green",
  completed: "green",
  success: "green",
  approved: "green",
  reviewed: "cyan",
  pending: "amber",
  queued: "amber",
  processing: "indigo",
  running: "indigo",
  draft: "slate",
  inactive: "amber",
  failed: "rose",
  error: "rose",
};

function StatusBadge({ status, className = "", children }) {
  const tone = STATUS_TONES[String(status || "").toLowerCase()] || "slate";
  return <Badge tone={tone} className={className}>{children || status || "-"}</Badge>;
}

export default StatusBadge;