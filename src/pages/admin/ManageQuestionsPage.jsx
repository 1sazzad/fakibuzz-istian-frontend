import { AlertTriangle, Search } from "lucide-react";
import { Button, Card, PageHeader, ResponsiveContainer } from "../../components/ui";

function ManageQuestionsPage() {
  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Admin"
        title="Manage Questions"
        description="Review, organize, and maintain the question library from one central control panel."
      />

      <Card className="text-center sm:text-left">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 sm:mx-0">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-950">Question management is coming online</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          This section is reserved for question search, edit, delete, and moderation tools. The core page structure is ready for the connected workflow.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
          <Button variant="secondary" type="button">
            <Search className="h-4 w-4" />
            Search questions
          </Button>
          <Button type="button">Open content tools</Button>
        </div>
      </Card>
    </ResponsiveContainer>
  );
}

export default ManageQuestionsPage;
