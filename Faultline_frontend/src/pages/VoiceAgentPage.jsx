import { MessageSquareText, PhoneCall, UserCheck } from "lucide-react";
import { listContacts } from "../api/endpoints";
import TopBar from "../components/layout/TopBar";
import { AsyncSection } from "../components/ui/AsyncState";
import StatusPill from "../components/ui/StatusPill";
import { useApiResource } from "../hooks/useApiResource";

export default function VoiceAgentPage() {
  const contacts = useApiResource(({ signal }) => listContacts({ signal }), []);
  const responders = (contacts.data ?? []).filter((contact) =>
    ["ENGINEER", "SENIOR_ENGINEER", "TEAM_LEAD", "MANAGER"].includes(contact.role),
  );

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Notifications", "Calling & SMS"]} />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Calling & SMS Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Faultline immediately contacts SREs assigned to the incident cluster. If no contactable SRE is assigned, the primary administrator is used.
          </p>
        </div>

        <section className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <UserCheck size={18} className="text-blue-600 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-blue-900">Direct cluster routing</h2>
              <p className="text-xs text-blue-800 mt-1 leading-5">
                Cluster assignments determine recipients. Every enabled channel on the linked notification contact is used immediately; there are no escalation steps or delayed recipients.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <PhoneCall size={15} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">Responder contacts</h2>
            <span className="ml-auto text-xs text-gray-400">{responders.length}</span>
          </div>
          <AsyncSection
            {...contacts}
            data={contacts.data ? responders : null}
            onRetry={contacts.refetch}
            isEmpty={(items) => items.length === 0}
            emptyTitle="No responder contacts configured"
            emptyHint="Link a notification contact to an assigned onsite engineer or the primary administrator."
          >
            <ul className="divide-y divide-gray-100">
              {responders.map((contact) => (
                <li key={contact.id} className="p-4 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {contact.userId ? "Linked to a Faultline user" : "Not linked to a Faultline user"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.voiceEnabled && <Channel icon={PhoneCall} label="Voice" />}
                    {contact.smsEnabled && <Channel icon={MessageSquareText} label="SMS" />}
                    <StatusPill status={contact.enabled ? "ACTIVE" : "INACTIVE"} label={contact.enabled ? "Enabled" : "Disabled"} />
                  </div>
                </li>
              ))}
            </ul>
          </AsyncSection>
        </section>
      </main>
    </div>
  );
}

function Channel({ icon: Icon, label }) {
  return (
    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
      <Icon size={10} className="inline mr-1" />
      {label}
    </span>
  );
}
