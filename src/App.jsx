import { useState } from "react";
import { dashboardMockData } from "./data/dashboardMockData";
import CreateAccount from "./Pages/CreateAccount";
import Dashboard from "./Pages/Dashboard";
import ForgotPassword from "./Pages/ForgotPassword";
import Login from "./Pages/Login";
import OtpVerification from "./Pages/OtpVerification";
import PasswordResetSuccess from "./Pages/PasswordResetSuccess";
import ResetPassword from "./Pages/ResetPassword";

function App() {
    const [currentView, setCurrentView] = useState("login");
    const [pendingEmail, setPendingEmail] = useState("");
    const [verificationMode, setVerificationMode] = useState("signup");

    if (currentView === "dashboard") {
        return (
            <Dashboard
                data={dashboardMockData}
                onLogout={() => setCurrentView("login")}
            />
        );
    }

    if (currentView === "signup") {
        return (
            <CreateAccount
                initialEmail={pendingEmail}
                onSignIn={() => setCurrentView("login")}
                onCreateAccount={({ email }) => {
                    setPendingEmail(email);
                    setVerificationMode("signup");
                    localStorage.setItem("pendingEmail", email);
                    setCurrentView("otp");
                }}
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
                    setVerificationMode("forgot-password");
                    localStorage.setItem("pendingEmail", email);
                    setCurrentView("otp");
                }}
            />
        );
    }

    if (currentView === "otp") {
        return (
            <OtpVerification
                onVerify={() => {
                    localStorage.removeItem("pendingEmail");
                    if (verificationMode === "signup") {
                        setCurrentView("dashboard");
                    } else {
                        setCurrentView("reset-password");
                    }
                }}
                onUseDifferentEmail={() =>
                    setCurrentView(
                        verificationMode === "signup" ? "signup" : "forgot-password",
                    )
                }
            />
        );
    }

    if (currentView === "reset-password") {
        return (
            <ResetPassword
                onResetPassword={() => {
                    setPendingEmail("");
                    localStorage.removeItem("pendingEmail");
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
            onSignUp={() => setCurrentView("signup")}
        />
    );
}

export default App;