import { useAuth } from "../context/useAuth";

function ProfilePage() {
  const { user } = useAuth();

  return (
    <main className="min-h-[calc(100vh-88px)] bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Profile</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">{user?.full_name || "User Profile"}</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
            <p className="mt-2 font-medium text-slate-950">{user?.email || "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Phone</p>
            <p className="mt-2 font-medium text-slate-950">{user?.phone_number || "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Role</p>
            <p className="mt-2 font-medium capitalize text-slate-950">{user?.role || "student"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">User ID</p>
            <p className="mt-2 font-medium text-slate-950">{user?.id || "-"}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProfilePage;
