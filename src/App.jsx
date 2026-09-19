import { useState } from "react";
import { dashboardMockData } from "./data/dashboardMockData";
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";

function App() {
  const [currentView, setCurrentView] = useState("login");

  if (currentView === "dashboard") {
    return (
      <Dashboard
        data={dashboardMockData}
        onLogout={() => setCurrentView("login")}
      />
    );
  }

  return <Login onLogin={() => setCurrentView("dashboard")} />;
}

export default App;
