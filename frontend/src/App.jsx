import { useState, useEffect } from "react";
import { dashboardMockData } from "./data/dashboardMockData";
import Dashboard from "./Pages/Dashboard.jsx";
import Login from "./Pages/Login.jsx";

function App() {
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem("admin_current_view") || "login";
  });

  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem("admin_user_data");
    return saved ? JSON.parse(saved) : { email: "digitech.pramahar@gmail.com", role: "SUPER_ADMIN" };
  });

  // State to hold live backend stats, falling back to mock data if offline
  const [liveDashboardData, setLiveDashboardData] = useState(dashboardMockData);

  useEffect(() => {
    localStorage.setItem("admin_current_view", currentView);

    // Fetch live data from backend when on dashboard view
    if (currentView === "dashboard") {
      const token = localStorage.getItem("admin_token");
      fetch("http://localhost:8080/api/dashboard/stats", {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Content-Type": "application/json"
        }
      })
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch live stats");
            return res.json();
          })
          .then((data) => {
            if (data && data.success) {
              setLiveDashboardData(data);
            }
          })
          .catch((err) => {
            console.warn("Could not reach backend dashboard stats, using local mock data fallback:", err);
          });
    }
  }, [currentView]);

  const handleLogin = (data) => {
    if (data && data.token) {
      localStorage.setItem("admin_token", data.token);
      const userData = {
        email: data.email || "digitech.pramahar@gmail.com",
        role: data.role || "SUPER_ADMIN"
      };
      setAdminUser(userData);
      localStorage.setItem("admin_user_data", JSON.stringify(userData));
    }
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_current_view");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user_data");
    setCurrentView("login");
  };

  if (currentView === "dashboard") {
    return (
        <Dashboard
            data={liveDashboardData}
            adminUser={adminUser}
            onLogout={handleLogout}
        />
    );
  }

  return (
      <Login
          onLogin={handleLogin}
      />
  );
}

export default App;