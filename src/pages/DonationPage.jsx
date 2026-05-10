import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiEndpoints } from "../api/api";
import { Badge, Button, Card, EmptyState, ErrorMessage, LoadingSpinner, ResponsiveContainer } from "../components/ui";

function getErrorMessage(error) {
  const detail = error.response?.data?.detail || error.response?.data?.message;
  return typeof detail === "string" ? detail : error.message || "Unable to load donation info right now.";
}

function DonationPage() {
  const [donationInfo, setDonationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDonationInfo() {
      try {
        const response = await apiEndpoints.getDonationInfo();

        if (active) {
          setDonationInfo(response.data || null);
        }
      } catch (loadError) {
        if (active) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDonationInfo();

    return () => {
      active = false;
    };
  }, []);

  const channels = Array.isArray(donationInfo?.channels) ? donationInfo.channels : [];

  if (loading) {
    return <LoadingSpinner label="Loading contribution info..." />;
  }

  return (
    <ResponsiveContainer>
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="min-w-0">
            <p className="break-words text-xs font-semibold uppercase leading-relaxed tracking-[0.08em] text-indigo-600 sm:tracking-[0.14em]">
              SUPPORT COMMUNITY | শিক্ষার্থী কমিউনিটিকে সহযোগিতা করুন
            </p>
            <h1 className="mt-3 max-w-4xl break-words text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Your contribution helps thousands of students prepare smarter.
            </h1>
            <p className="mt-3 max-w-4xl break-words text-2xl font-semibold leading-9 text-slate-900">
              আপনার সহযোগিতা হাজারো শিক্ষার্থীর ভালো প্রস্তুতিতে সাহায্য করতে পারে।
            </p>
            <p className="mt-5 max-w-3xl break-words text-base leading-relaxed text-slate-600">
              We are building a free resource where students can find previous questions, understand exam patterns, and reduce exam stress.
            </p>
            <p className="mt-3 max-w-3xl break-words text-base leading-8 text-slate-500">
              আমরা এমন একটি ফ্রি রিসোর্স তৈরি করছি যেখানে শিক্ষার্থীরা আগের প্রশ্ন খুঁজতে পারবে, পরীক্ষার প্যাটার্ন বুঝতে পারবে এবং চাপ কমাতে পারবে।
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button as="a" href="#contribute" size="lg" className="w-full sm:w-auto">
                Contribute Now | এখনই সহযোগিতা করুন
              </Button>
              <Button as={Link} to="/" variant="secondary" size="lg" className="w-full sm:w-auto">
                Back to Home
              </Button>
            </div>
            <p className="mt-4 break-words text-sm font-semibold text-slate-600">
              Every contribution matters.
            </p>
            <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-500">
              প্রতিটি সহযোগিতাই গুরুত্বপূর্ণ।
            </p>
          </div>

          <Card as="aside" className="border-cyan-100 bg-cyan-50/60">
            <p className="break-words text-lg font-semibold leading-8 text-slate-950">
              Not every student has easy access to seniors, private groups, or paid resources.
            </p>
            <p className="mt-3 break-words text-lg font-semibold leading-8 text-slate-950">
              Many students prepare with limited access.
            </p>
            <p className="mt-5 break-words text-base leading-8 text-slate-700">
              সব শিক্ষার্থীর সিনিয়র, প্রাইভেট গ্রুপ বা পেইড রিসোর্সে সহজ প্রবেশাধিকার থাকে না।
            </p>
            <p className="mt-3 break-words text-base leading-8 text-slate-700">
              অনেক শিক্ষার্থী সীমিত রিসোর্স নিয়েই প্রস্তুতি নেয়।
            </p>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="break-words text-2xl font-semibold text-slate-950">
            Where your contribution goes | আপনার সহযোগিতা কোথায় ব্যয় হয়
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <ul className="space-y-3 text-sm font-medium leading-6 text-slate-700">
              <li>Server and hosting costs</li>
              <li>Database maintenance</li>
              <li>Question organization</li>
              <li>Platform improvement</li>
              <li>Student support operations</li>
            </ul>
            <ul className="space-y-3 text-sm font-medium leading-7 text-slate-500">
              <li>সার্ভার ও হোস্টিং খরচ</li>
              <li>ডাটাবেজ রক্ষণাবেক্ষণ</li>
              <li>প্রশ্ন সংগঠিত করা</li>
              <li>প্ল্যাটফর্ম উন্নয়ন</li>
              <li>শিক্ষার্থী সহায়তা কার্যক্রম</li>
            </ul>
          </div>
        </Card>

        <Card className="self-start">
          <h2 className="break-words text-xl font-semibold text-slate-950">Contribution channels</h2>
          <p className="mt-3 break-words text-sm leading-6 text-slate-600">
            Use the configured payment methods below when you are ready to contribute.
          </p>
          <p className="mt-2 break-words text-sm leading-7 text-slate-500">
            সহযোগিতা করতে প্রস্তুত হলে নিচের নির্ধারিত পেমেন্ট পদ্ধতি ব্যবহার করুন।
          </p>
          {donationInfo?.message && (
            <p className="mt-4 break-words rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              {donationInfo.message}
            </p>
          )}
        </Card>
      </section>

      <ErrorMessage>{error}</ErrorMessage>

      {channels.length === 0 ? (
        <EmptyState title="Contribution info is not available yet" description="Configured payment channels will appear here when they are ready." />
      ) : (
        <section id="contribute" className="grid scroll-mt-24 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {channels.map((channel, index) => (
            <Card key={`${channel.type || "channel"}-${index}`} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{channel.type || "Channel"}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">{channel.label || "Contribution channel"}</h2>
                </div>
                {channel.instructions && <Badge tone="indigo">{channel.instructions}</Badge>}
              </div>

              <p className="break-words rounded-xl bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-950">
                {channel.number || "Number unavailable"}
              </p>
            </Card>
          ))}
        </section>
      )}

      {donationInfo?.note && <ErrorMessage tone="info">{donationInfo.note}</ErrorMessage>}
    </ResponsiveContainer>
  );
}

export default DonationPage;
