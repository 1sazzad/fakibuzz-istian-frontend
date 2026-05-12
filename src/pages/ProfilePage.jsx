import { useAuth } from "../context/useAuth";
import { Card, PageHeader, ResponsiveContainer } from "../components/ui";
import { getInstitutionDisplay } from "../utils/institution";

function ProfilePage() {
  const { user } = useAuth();
  const institution = getInstitutionDisplay(user);

  return (
    <ResponsiveContainer>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Profile"
          title={user?.full_name || "User Profile"}
          description="Your account details used across the FakiBuzz dashboard."
        />
        <Card>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
            <p className="mt-2 font-medium text-slate-950">{user?.email || "-"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</p>
            <p className="mt-2 font-medium text-slate-950">{user?.phone_number || "-"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role</p>
            <p className="mt-2 font-medium capitalize text-slate-950">{user?.role || "student"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">User ID</p>
            <p className="mt-2 font-medium text-slate-950">{user?.id || "-"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email verified</p>
            <p className="mt-2 font-medium text-slate-950">{user?.is_email_verified ? "Yes" : "No"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Terms accepted</p>
            <p className="mt-2 font-medium text-slate-950">{user?.terms_accepted ? "Yes" : "No"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Institution ID</p>
            <p className="mt-2 font-medium text-slate-950">{institution.institutionId}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Institution</p>
            <p className="mt-2 font-medium text-slate-950">{institution.institutionName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Department</p>
            <p className="mt-2 font-medium text-slate-950">{institution.department}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Program</p>
            <p className="mt-2 font-medium text-slate-950">{institution.program}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Batch/session</p>
            <p className="mt-2 font-medium text-slate-950">{institution.batchSession}</p>
          </div>
        </div>
        </Card>
      </div>
    </ResponsiveContainer>
  );
}

export default ProfilePage;
