import Footer from "../components/Footer";
import { Card, PageHeader, ResponsiveContainer } from "../components/ui";
import { CONTACT_METHODS } from "../config/contact";

const sections = [
  {
    title: "Information we collect",
    description:
      "FakiBuzz may collect account details, student profile information, feedback messages, search activity, and usage analytics needed to operate and improve the platform.",
  },
  {
    title: "How we use data",
    description:
      "We use data to provide subject search, question analysis, suggestions, support, service improvements, abuse prevention, and communication about student requests.",
  },
  {
    title: "Data protection",
    description:
      "We aim to protect user data with reasonable technical and organizational safeguards. Avoid submitting sensitive personal information in feedback or support messages.",
  },
  {
    title: "User rights",
    description:
      "Users may request access, correction, or deletion of their personal information where applicable. Contact us if you need help with your account or submitted data.",
  },
  {
    title: "Contact information",
    description: `For privacy questions, contact us through WhatsApp (${CONTACT_METHODS[0].label}) or email (${CONTACT_METHODS[1].label}).`,
  },
];

function PrivacyPolicyPage() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          eyebrow="Legal"
          title="Privacy Policy"
          description="A basic overview of how FakiBuzz handles student information and platform data."
        />

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title} className="h-full">
              <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-3 break-words text-sm leading-relaxed text-slate-600">{section.description}</p>
            </Card>
          ))}
        </div>
      </ResponsiveContainer>
      <Footer />
    </>
  );
}

export default PrivacyPolicyPage;
