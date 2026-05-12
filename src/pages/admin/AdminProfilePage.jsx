import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import { Badge, Button, Card, ErrorMessage, PageHeader, ResponsiveContainer } from "../../components/ui";
import { getApiErrorMessage } from "../../utils/auth";

function formatValue(value) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return value || "-";
}

function AdminProfilePage() {
  const { refreshUser, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function handleRefresh() {
    setRefreshing(true);
    setError("");

    try {
      await refreshUser();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to refresh profile."));
    } finally {
      setRefreshing(false);
    }
  }

  const profileItems = [
    ["Full name", user?.full_name],
    ["Email", user?.email],
    ["Phone number", user?.phone_number],
    ["Role", user?.role],
    ["Active", user?.is_active],
    ["Email verified", user?.is_email_verified],
    ["Created at", user?.created_at],
  ];

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Admin Profile"
        title={user?.full_name || "Admin profile"}
        description="Your current admin account details from the authenticated profile."
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Profile details</h2>
            <p className="mt-1 text-sm text-slate-500">Profile editing is not available yet.</p>
          </div>
          <Badge tone={user?.role === "super_admin" ? "indigo" : "slate"}>{user?.role || "admin"}</Badge>
        </div>

        <div className="mt-4">
          <ErrorMessage>{error}</ErrorMessage>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {profileItems.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-2 break-words font-medium text-slate-950">{formatValue(value)}</p>
            </div>
          ))}
        </div>

        <Button type="button" variant="secondary" disabled={refreshing} className="mt-5 w-full sm:w-auto" onClick={handleRefresh}>
          {refreshing ? "Refreshing..." : "Refresh profile"}
        </Button>
      </Card>
    </ResponsiveContainer>
  );
}

export default AdminProfilePage;
