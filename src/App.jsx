import { useState } from "react";
import { dashboardMockData } from "./data/dashboardMockData";
import Dashboard from "./Pages/Dashboard";
import ForgotPassword from "./Pages/ForgotPassword";
import Login from "./Pages/Login";
import OtpVerification from "./Pages/OtpVerification";
import PasswordResetSuccess from "./Pages/PasswordResetSuccess";
import ResetPassword from "./Pages/ResetPassword";

function App() {
  const [currentView, setCurrentView] = useState("login");
  const [pendingEmail, setPendingEmail] = useState("");

  if (currentView === "dashboard") {
    return (
      <Dashboard
        data={dashboardMockData}
        onLogout={() => setCurrentView("login")}
      />
    );
  }

  if (currentView === "forgot-password") {
    return (
      <ForgotPassword
        initialEmail={pendingEmail}
        onSignIn={() => setCurrentView("login")}
        onSendCode={(email) => {
          setPendingEmail(email);
          setCurrentView("otp");
        }}
      />
    );
  }

  if (currentView === "otp") {
    return (
      <OtpVerification
        onVerify={() => setCurrentView("reset-password")}
        onUseDifferentEmail={() => setCurrentView("forgot-password")}
      />
    );
  }

  if (currentView === "reset-password") {
    return (
      <ResetPassword
        onResetPassword={() => {
          setPendingEmail("");
          setCurrentView("password-reset-success");
        }}
        onSignIn={() => setCurrentView("login")}
      />
    );
  }

  if (currentView === "password-reset-success") {
    return (
      <PasswordResetSuccess onBackToSignIn={() => setCurrentView("login")} />
    );
  }

  return (
    <Login
      onForgotPassword={() => setCurrentView("forgot-password")}
      onLogin={() => setCurrentView("dashboard")}
    />
  );
}

export default App;
