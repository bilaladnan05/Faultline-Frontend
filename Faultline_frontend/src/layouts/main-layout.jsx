import { useState } from "react";
import Sidebar from "./sidebar/sidebar.jsx";
import Header from "./header/header.jsx";
import DashboardPage from "../features/dashboard/dashboard-page";
import IncidentsPage from "../features/incidents/incidents-page";
import IncidentDetailsPage from "../features/incidents/incident-details-page";
import UserManagementPage from "../features/user-management/user-management-page";

export default function MainLayout({ children }) {
  const [activePage, setActivePage] = useState("incidents");
  const [selectedIncident, setSelectedIncident] = useState(null);

  const pageContent = {
    dashboard: <DashboardPage />,
    incidents: <IncidentsPage onSelectIncident={setSelectedIncident} />,
    "user-management": <UserManagementPage />,
    services: <PlaceholderPage title="Services" description="Services view coming soon." />,
    settings: <PlaceholderPage title="Settings" description="Settings view coming soon." />,
  };

  if (selectedIncident) {
    return (
      <div className="app-layout">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />

        <div className="main-content">
          <Header />
          <IncidentDetailsPage incident={selectedIncident} onBack={() => setSelectedIncident(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="main-content">
        <Header />
        {pageContent[activePage] ?? children}
      </div>
    </div>
  );
}

function PlaceholderPage({ title, description }) {
  return (
    <main className="incidents-page">
      <section className="incidents-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
      </section>
    </main>
  );
}