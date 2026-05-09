import Footer from "../components/Footer";
import { Button, Card, PageHeader, ResponsiveContainer } from "../components/ui";
import { CONTACT_METHODS } from "../config/contact";

function ContactPage() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          eyebrow="Contact"
          title="Contact FakiBuzz"
          description="Reach out if you cannot find your subject, want to submit previous question papers, or need platform support."
        />

        <div className="grid gap-4 md:grid-cols-2">
          {CONTACT_METHODS.map((method) => (
            <Card key={method.type} className="h-full">
              <p className="text-sm font-medium text-slate-500">{method.type}</p>
              <h2 className="mt-2 break-words text-2xl font-semibold text-slate-950">{method.label}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Use this channel for subject requests, support questions, or sharing previous question papers.
              </p>
              <Button
                as="a"
                href={method.href}
                target={method.href.startsWith("http") ? "_blank" : undefined}
                rel={method.href.startsWith("http") ? "noreferrer" : undefined}
                className="mt-5 w-full sm:w-auto"
                variant={method.type === "WhatsApp" ? "primary" : "secondary"}
              >
                {method.actionLabel}
              </Button>
            </Card>
          ))}
        </div>
      </ResponsiveContainer>
      <Footer />
    </>
  );
}

export default ContactPage;
