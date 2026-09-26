import { useState } from "react";
import "./Login.css";

function CreateAccount({ initialEmail = "", onSignIn, onCreateAccount }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: initialEmail,
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    const { name, type, value, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          role: "USER"
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Trigger App.jsx view switcher to transition to OTP verification
        onCreateAccount?.({ email: formData.email.trim() });
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Could not connect to the backend server on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="login-page">
        <div className="login-left">
          <div className="travel-background" />
          <div className="logos">
            <img src="/tourbhook.png" alt="TourBhook" />
          </div>
        </div>
        <div className="login-right">
          <div className="login-card signup-card">
            <div className="login-header signup-header">
              <h1>Create your account</h1>
              <p>Start managing your TourBhook account</p>
            </div>
            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="full-name">Full name</label>
                <input
                    className="plain-input"
                    id="full-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={updateField}
                    required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Work email</label>
                <input
                    className="plain-input"
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={updateField}
                    required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input
                    className="plain-input"
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={updateField}
                    minLength={8}
                    required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm password</label>
                <input
                    className="plain-input"
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={updateField}
                    minLength={8}
                    aria-describedby={error ? "signup-error" : undefined}
                    required
                />
              </div>
              <label className="terms-label">
                <input
                    name="acceptedTerms"
                    type="checkbox"
                    checked={formData.acceptedTerms}
                    onChange={updateField}
                    required
                />
                <span>I agree to the terms and privacy policy.</span>
              </label>
              {error && (
                  <p className="form-error" id="signup-error" role="alert">
                    {error}
                  </p>
              )}
              <button type="submit" className="sign-in-button" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
            <button
                type="button"
                className="bottom bottom-button signup-signin"
                onClick={onSignIn}
            >
              Already have an account? <span>Sign in</span>
            </button>
          </div>
        </div>
      </div>
  );
}

export default CreateAccount;