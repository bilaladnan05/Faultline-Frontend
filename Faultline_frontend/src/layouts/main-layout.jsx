import { useState } from "react";
import Sidebar from "./sidebar/sidebar.jsx";
import Header from "./header/header.jsx";
import DashboardPage from "../features/dashboard/dashboard-page";
import IncidentsPage from "../features/incidents/incidents-page";
import IncidentDetailsPage from "../features/incidents/incident-details-page";
import PRIssuancePage from "../features/incidents/pr-issuance-page";
import AlertsPage from "../features/alerts/alerts-page";
import DeploymentsPage from "../features/deployments/deployments-page";
import RuntimePage from "../features/runtime/runtime-page";
import UserManagementPage from "../features/user-management/user-management-page";
import ReportsPage from "../features/reports/reports-page";

export default function MainLayout({ children }) {
  const [activePage, setActivePage] = useState("incidents");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [viewingPR, setViewingPR] = useState(false);

  const handleNavigate = (pageKey) => {
    setSelectedIncident(null);
    setViewingPR(false);
    setActivePage(pageKey);
  };

  const handleSelectIncident = (incident) => {
    setViewingPR(false);
    setSelectedIncident(incident);
  };

  const handleIssuePR = () => {
    setViewingPR(true);
  };

  const handleBackFromPR = () => {
    setViewingPR(false);
  };

  const handleBackFromIncident = () => {
    setSelectedIncident(null);
    setViewingPR(false);
  };

  if (selectedIncident && viewingPR) {
    return (
      <div className="app-layout">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <div className="main-content">
          <Header />
          <PRIssuancePage incident={selectedIncident} onBack={handleBackFromPR} />
        </div>
      </div>
    );
  }

  if (selectedIncident) {
    return (
      <div className="app-layout">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <div className="main-content">
          <Header />
          <IncidentDetailsPage
            incident={selectedIncident}
            onBack={handleBackFromIncident}
            onIssuePR={handleIssuePR}
          />
        </div>
      </div>
    );
  }

  const pageContent = {
    dashboard: <DashboardPage />,
    incidents: <IncidentsPage onSelectIncident={handleSelectIncident} />,
    alerts: <AlertsPage />,
    deployments: <DeploymentsPage />,
    runtime: <RuntimePage />,
    teams: <UserManagementPage />,
    reports: <ReportsPage />,
    settings: <PlaceholderPage title="Settings" description="Settings configuration coming soon." />,
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
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
