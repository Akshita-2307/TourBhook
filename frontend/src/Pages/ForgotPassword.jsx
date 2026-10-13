import { useState } from "react";
import "./Login.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPassword({ initialEmail = "", onSendCode, onSignIn }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setEmail(event.target.value);

    if (error) {
      setError("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Enter your work email.");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid work email address.");
      return;
    }

    onSendCode(normalizedEmail);
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
        <div className="login-card forgot-card">
          <div className="login-header forgot-header">
            <h1>Forgot your password?</h1>
            <p>Enter your work email to receive a verification code.</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group forgot-email-group">
              <label htmlFor="recovery-email">Work Email</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <input
                  id="recovery-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={handleChange}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "recovery-email-error" : undefined}
                  required
                />
              </div>
            </div>
            {error && (
              <p
                className="form-error forgot-error"
                id="recovery-email-error"
                role="alert"
              >
                {error}
              </p>
            )}
            <button type="submit" className="sign-in-button">
              Send verification code
            </button>
          </form>
          <button
            type="button"
            className="bottom bottom-button forgot-signin"
            onClick={onSignIn}
          >
            Remember your password? <span>Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
