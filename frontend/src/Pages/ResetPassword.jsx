import { useState } from "react";
import "./Login.css";

function LockIcon() {
  return (
    <svg
      className="input-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
      <circle cx="12" cy="15" r="1" />
    </svg>
  );
}

function VisibilityIcon({ visible }) {
  if (visible) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
        <path d="M9.9 5.2A10.7 10.7 0 0112 5c5 0 8.5 4 9.5 7a10.8 10.8 0 01-3.2 4.5" />
        <path d="M6.2 6.2C4.4 7.4 3.2 9.2 2.5 12c1 3 4.5 7 9.5 7 1.4 0 2.7-.3 3.8-.8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function ResetPassword({ onResetPassword, onSignIn }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setErrors((current) => ({ ...current, password: "" }));
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
    setErrors((current) => ({ ...current, confirmPassword: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!password) {
      nextErrors.password = "Enter a new password.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your new password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onResetPassword();
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
        <div className="login-card reset-card">
          <div className="login-header reset-header">
            <h1>Reset your password</h1>
            <p>Create a new password for your TourBhook account.</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group reset-form-group">
              <label htmlFor="new-password">New password</label>
              <div className="input-wrapper">
                <LockIcon />
                <input
                  id="new-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={handlePasswordChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="new-password-help"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide new password" : "Show new password"}
                  aria-pressed={showPassword}
                >
                  <VisibilityIcon visible={showPassword} />
                </button>
              </div>
              <p
                className={errors.password ? "field-help field-error" : "field-help"}
                id="new-password-help"
              >
                {errors.password || "At least 8 characters"}
              </p>
            </div>
            <div className="form-group reset-form-group">
              <label htmlFor="reset-confirm-password">Confirm password</label>
              <div className="input-wrapper">
                <LockIcon />
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword ? "confirm-password-error" : undefined
                  }
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmed password"
                      : "Show confirmed password"
                  }
                  aria-pressed={showConfirmPassword}
                >
                  <VisibilityIcon visible={showConfirmPassword} />
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  className="field-help field-error"
                  id="confirm-password-error"
                  role="alert"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <button type="submit" className="sign-in-button reset-submit">
              Reset password
            </button>
          </form>
          <div className="reset-divider" />
          <button
            type="button"
            className="bottom bottom-button reset-signin"
            onClick={onSignIn}
          >
            Remember your password? <span>Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
