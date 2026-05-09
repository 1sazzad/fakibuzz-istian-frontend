import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import heroImage from "../assets/hero.png";
import { APP_NAME } from "../config/app";
import { useAuth } from "../context/useAuth";
import { Button, Card } from "../components/ui";

const features = [
  {
    title: "Previous Question Search",
    description: "Find published previous-year questions by subject code or subject name.",
  },
  {
    title: "Topic Analysis",
    description: "Review repeated topics, question patterns, marks, and year-wise trends.",
  },
  {
    title: "AI-Based Suggestions",
    description: "Get guided suggestions based on your selected subject and preparation focus.",
  },
  {
    title: "Important Question Prediction",
    description: "See likely important questions and topics from historical exam signals.",
  },
  {
    title: "Semantic Search",
    description: "Search by meaning instead of exact wording to discover similar questions.",
  },
  {
    title: "Export as PDF",
    description: "Export suggestions and results so you can revise offline before exams.",
  },
];

const painPoints = [
  "Previous questions are scattered across seniors, PDFs, and class groups.",
  "Repeated topics are hard to identify manually before exam week.",
  "Students need faster ways to prioritize what to revise first.",
];

const steps = [
  {
    number: "01",
    title: "Search your subject",
    bangla: "১. আপনার সাবজেক্ট সার্চ করুন",
  },
  {
    number: "02",
    title: "View question analysis",
    bangla: "২. প্রশ্ন বিশ্লেষণ দেখুন",
  },
  {
    number: "03",
    title: "Get prediction and suggestions",
    bangla: "৩. প্রেডিকশন ও সাজেশন নিন",
  },
];

function SectionHeading({ eyebrow, title, description, bangla }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 sm:tracking-[0.18em]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 break-words text-base leading-relaxed text-slate-600">{description}</p>}
      {bangla && <p className="mt-2 break-words text-base leading-relaxed text-slate-600">{bangla}</p>}
    </div>
  );
}

function HomePage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const searchPath = isAuthenticated ? "/subjects" : "/login";
  const getStartedPath = isAuthenticated ? "/dashboard" : "/register";

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const target = document.querySelector(location.hash);
    if (target) {
      window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }
  }, [location.hash]);

  function handleFeedbackSubmit(event) {
    event.preventDefault();
    // TODO: Wire this compact homepage form to the feedback endpoint when phone/contact support is finalized.
    event.currentTarget.reset();
    setFeedbackStatus("Thanks. Your feedback UI is ready and the full feedback page is available from the navbar.");
  }

  return (
    <main className="overflow-x-hidden bg-slate-50">
      <section id="hero" className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:py-16 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:py-20">
          <div className="min-w-0 max-w-3xl">
            <p className="inline-flex max-w-full rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold leading-relaxed text-cyan-800">
              AI-powered exam preparation for university students
            </p>
            <h1 className="mt-6 break-words text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl md:text-5xl lg:text-6xl">
              Analyze Previous Questions. Predict Important Topics. Prepare Smarter.
            </h1>
            <p className="mt-5 break-words text-base leading-relaxed text-slate-700 sm:text-lg">
              পূর্ববর্তী প্রশ্ন বিশ্লেষণ করুন, গুরুত্বপূর্ণ টপিক অনুমান করুন, আরও স্মার্টভাবে প্রস্তুতি নিন।
            </p>
            <p className="mt-5 max-w-2xl break-words text-base leading-relaxed text-slate-600">
              {APP_NAME} helps you search subjects, understand repeated topics, receive AI-based suggestions, and export useful results for focused revision.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to={searchPath} size="lg" className="w-full sm:w-auto">
                Search Subject
              </Button>
              <Button as={Link} to={getStartedPath} variant="secondary" size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-xl shadow-slate-200/80 sm:p-5">
              <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">Exam Signal Overview</p>
                    <p className="mt-1 text-xs text-slate-500">Subject analysis preview</p>
                  </div>
                  <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Ready</span>
                </div>
                <div className="grid gap-3 py-5 sm:grid-cols-3">
                  {["Topics", "Years", "Matches"].map((label, index) => (
                    <div key={label} className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{[24, 5, 86][index]}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {["Repeated algorithms", "Database normalization", "Short note patterns"].map((item, index) => (
                    <div key={item} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
                        {index + 1}
                      </span>
                      <div className="h-2 flex-1 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${84 - index * 13}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <img
              src={heroImage}
              alt=""
              className="pointer-events-none absolute -right-3 -top-8 hidden w-28 max-w-[28vw] opacity-90 lg:block xl:w-36"
            />
          </div>
        </div>
      </section>

      <section id="problem" className="px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="The Problem"
            title="Exam preparation gets messy when question data is scattered"
            description="FakiBuzz keeps the workflow focused: find your subject, inspect previous questions, then decide what deserves your limited revision time."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
            {painPoints.map((item) => (
              <Card key={item} className="rounded-2xl">
                <p className="break-words text-base leading-relaxed text-slate-700">{item}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-white px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Features"
            title="Everything students need for smarter revision"
            description="A focused set of tools for discovering subjects, analyzing question history, and turning patterns into revision priorities."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <h3 className="break-words text-lg font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-3 break-words text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="How It Works"
            title="Three steps from search to suggestion"
            bangla="সার্চ থেকে সাজেশন পর্যন্ত সহজ তিনটি ধাপ।"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.number}>
                <p className="text-sm font-semibold text-cyan-700">{step.number}</p>
                <h3 className="mt-4 break-words text-xl font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-3 break-words text-base leading-relaxed text-slate-600">{step.bangla}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="request-subject" className="bg-white px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Missing Subject</p>
            <h2 className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Can’t find your subject?</h2>
            <p className="mt-4 break-words text-base leading-relaxed text-slate-600">
              We are still expanding our question database. If your subject is not available, please reach out to us with at least the previous five years’ question papers. This will help us add your subject and improve prediction accuracy.
            </p>
            <h3 className="mt-8 break-words text-xl font-semibold text-slate-950 sm:text-2xl">আপনার সাবজেক্ট খুঁজে পাচ্ছেন না?</h3>
            <p className="mt-4 break-words text-base leading-relaxed text-slate-600">
              আমরা এখনো আমাদের প্রশ্ন ডাটাবেজ বড় করছি। যদি আপনার সাবজেক্ট পাওয়া না যায়, তাহলে অন্তত বিগত পাঁচ বছরের প্রশ্নপত্র নিয়ে আমাদের সাথে যোগাযোগ করুন। এতে আমরা আপনার সাবজেক্ট যুক্ত করতে পারব এবং প্রেডিকশনের মান আরও ভালো হবে।
            </p>
          </div>
          <Card className="self-start">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <Button as={Link} to="/feedback" variant="primary" className="w-full">
                Request Subject
              </Button>
              <Button as={Link} to="/feedback" variant="secondary" className="w-full">
                Submit Question Papers
              </Button>
              <Button as={Link} to="/feedback" variant="secondary" className="w-full">
                Contact Us
              </Button>
            </div>
            <p className="mt-5 break-words text-sm leading-relaxed text-slate-500">
              Include subject code, subject name, department, exam years, and clear scans or PDFs when you contact the team.
            </p>
          </Card>
        </div>
      </section>

      <section id="feedback" className="px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Feedback</p>
            <h2 className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Help improve FakiBuzz</h2>
            <p className="mt-4 break-words text-base leading-relaxed text-slate-600">
              Share subject requests, usability issues, prediction feedback, or ideas that would make exam preparation easier.
            </p>
          </div>
          <Card as="form" onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Name
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" placeholder="Your name" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Email or Phone
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" placeholder="email@example.com or 01XXXXXXXXX" />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Feedback message
              <textarea
                rows={5}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="Write your feedback"
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" className="w-full sm:w-auto">Submit</Button>
              <Link to="/feedback" className="inline-flex min-h-10 items-center justify-center text-sm font-semibold text-indigo-700 hover:text-indigo-800">
                Open full feedback page
              </Link>
            </div>
            {feedbackStatus && <p className="break-words rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium leading-relaxed text-emerald-700">{feedbackStatus}</p>}
          </Card>
        </div>
      </section>

      <section id="support" className="bg-white px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Support</p>
            <h2 className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Support FakiBuzz</h2>
            <h3 className="mt-3 break-words text-xl font-semibold text-slate-950 sm:text-2xl">FakiBuzz-কে সাপোর্ট করুন</h3>
            <p className="mt-4 break-words text-base leading-relaxed text-slate-600">
              Your support helps us keep this platform useful for students.
            </p>
            <p className="mt-2 break-words text-base leading-relaxed text-slate-600">
              আপনার সহযোগিতা শিক্ষার্থীদের জন্য এই প্ল্যাটফর্মটি চালু ও উন্নত রাখতে সাহায্য করবে।
            </p>
          </div>
          <Card className="self-start">
            <h3 className="break-words text-xl font-semibold text-slate-950">Donation methods</h3>
            <p className="mt-3 break-words text-sm leading-relaxed text-slate-600">
              Donation channels are loaded from the support page when configured.
            </p>
            {/* TODO: Render configured donation channels here if public donation info should be displayed on the homepage. */}
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="break-words text-sm font-semibold text-slate-950">Support channel placeholder</p>
              <p className="mt-2 break-words text-sm leading-relaxed text-slate-500">Configured payment details will appear here when available.</p>
            </div>
            <Button as={Link} to="/support" variant="secondary" className="mt-5 w-full sm:w-auto">
              View Support Page
            </Button>
          </Card>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-lg font-semibold">{APP_NAME}</p>
            <p className="mt-1 text-sm text-slate-300">Exam intelligence for learners.</p>
          </div>
          <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2 md:flex md:flex-wrap md:justify-end md:gap-4">
            <a href="#features" className="inline-flex min-h-10 items-center hover:text-white">Features</a>
            <a href="#request-subject" className="inline-flex min-h-10 items-center hover:text-white">Request Subject</a>
            <Link to="/feedback" className="inline-flex min-h-10 items-center hover:text-white">Feedback</Link>
            <Link to="/support" className="inline-flex min-h-10 items-center hover:text-white">Support</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default HomePage;
