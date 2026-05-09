import { useEffect, useState } from "react";
import { apiEndpoints } from "../api/api";
import { Badge, Card, EmptyState, ErrorMessage, LoadingSpinner, PageHeader, ResponsiveContainer } from "../components/ui";

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
    return <LoadingSpinner label="Loading support info..." />;
  }

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Support"
        title="Support FakiBuzz"
        description={donationInfo?.message || "Donation information for community development."}
      />

      <ErrorMessage>{error}</ErrorMessage>

      {channels.length === 0 ? (
        <EmptyState title="Donation info is not available yet" description="Configured support channels will appear here when they are ready." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {channels.map((channel, index) => (
            <Card key={`${channel.type || "channel"}-${index}`} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{channel.type || "Channel"}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">{channel.label || "Support channel"}</h2>
                </div>
                {channel.instructions && <Badge tone="indigo">{channel.instructions}</Badge>}
              </div>

              <p className="break-words rounded-xl bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-950">
                {channel.number || "Number unavailable"}
              </p>
            </Card>
          ))}
        </div>
      )}

      {donationInfo?.note && <ErrorMessage tone="info">{donationInfo.note}</ErrorMessage>}
    </ResponsiveContainer>
  );
}

export default DonationPage;
