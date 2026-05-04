import Sidebar from "./components/sidebar/sidebar.jsx";
import Header from "./components/header/header.jsx";
import IncidentsList from "./components/incidents_list/incidents_list.jsx";
import "./global.css";
import "./App.css";

function App() {
  return (
    <div className="app-layout">  
      <Sidebar />

      <div className="main-content">
        <Header />

        <IncidentsList />
      </div>
    </div>
  );
}

export default App;