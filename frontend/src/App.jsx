import { useState, useEffect, useCallback } from "react";
import { dashboardMockData } from "./data/dashboardMockData";
import Dashboard from "./Pages/Dashboard.jsx";
import Login from "./Pages/Login.jsx";

function App() {
    // Always start with login view on a fresh session/load unless a valid unexpired token exists
    const [currentView, setCurrentView] = useState(() => {
        const token = localStorage.getItem("admin_token");
        const loginTime = localStorage.getItem("admin_login_time");
        if (!token || !loginTime) return "login";

        // Check if 10 minutes have passed (10 * 60 * 1000 ms)
        const tenMinutes = 10 * 60 * 1000;
        if (Date.now() - parseInt(loginTime, 10) > tenMinutes) {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_login_time");
            localStorage.removeItem("admin_user_data");
            localStorage.removeItem("admin_current_view");
            return "login";
        }
        return localStorage.getItem("admin_current_view") || "login";
    });

    const [adminUser, setAdminUser] = useState(() => {
        const saved = localStorage.getItem("admin_user_data");
        return saved ? JSON.parse(saved) : { email: "digitech.pramahar@gmail.com", role: "SUPER_ADMIN" };
    });

    const [liveDashboardData, setLiveDashboardData] = useState(dashboardMockData);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("admin_current_view");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user_data");
        localStorage.removeItem("admin_login_time");
        setCurrentView("login");
    }, []);

    // 10-minute session timeout tracking
    useEffect(() => {
        if (currentView !== "dashboard") return;

        const tenMinutes = 10 * 60 * 1000;
        const interval = setInterval(() => {
            const loginTime = localStorage.getItem("admin_login_time");
            if (loginTime && Date.now() - parseInt(loginTime, 10) > tenMinutes) {
                handleLogout();
                alert("Session expired after 10 minutes of inactivity. Please sign in again.");
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [currentView, handleLogout]);

    useEffect(() => {
        if (currentView === "dashboard") {
            localStorage.setItem("admin_current_view", "dashboard");
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
            localStorage.setItem("admin_login_time", Date.now().toString());
            const userData = {
                email: data.email || "digitech.pramahar@gmail.com",
                role: data.role || "SUPER_ADMIN"
            };
            setAdminUser(userData);
            localStorage.setItem("admin_user_data", JSON.stringify(userData));
        }
        setCurrentView("dashboard");
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