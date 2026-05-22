import Footer from "../components/Footer";
import { Card, PageHeader, ResponsiveContainer } from "../components/ui";

const sections = [
  {
    title: "Platform usage",
    description:
      "Q Arena is built to help students search previous questions, analyze topics, and prepare more efficiently. Use the platform for lawful academic preparation only.",
  },
  {
    title: "User responsibilities",
    description:
      "Users are responsible for keeping account details accurate, protecting login credentials, and submitting only content they have permission to share.",
  },
  {
    title: "Content limitations",
    description:
      "AI-generated suggestions and predictions are study aids, not guaranteed exam outcomes. Always verify results with official course materials and teacher guidance.",
  },
  {
    title: "Disclaimer",
    description:
      "Q Arena is provided as an educational support tool. We do not guarantee uninterrupted service, complete data accuracy, or specific academic results.",
  },
  {
    title: "Account rules",
    description:
      "Do not misuse accounts, attempt unauthorized access, upload harmful content, or interfere with platform security. Violations may lead to account restriction.",
  },
];

function TermsOfServicePage() {
  return (
    <>
      <ResponsiveContainer>
        <div className="mx-auto max-w-4xl space-y-6">
          <PageHeader
            eyebrow="Legal"
            title="Terms of Service"
            description="Simple rules and expectations for using Q Arena responsibly."
          />

          <div className="grid gap-4">
            {sections.map((section) => (
              <Card key={section.title} className="h-full">
                <h2 className="break-words text-xl font-semibold text-slate-950">{section.title}</h2>
                <p className="mt-3 break-words text-base leading-relaxed text-slate-600">{section.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </ResponsiveContainer>
      <Footer />
    </>
  );
}

export default TermsOfServicePage;
