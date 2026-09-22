import { useState } from "react";
import "./Login.css";

function GoogleIcon() {
  return (
    <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285f4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
      />
      <path
        fill="#34a853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#fbbc05"
        d="M6.39 13.86A6 6 0 0 1 6.07 12c0-.65.11-1.28.32-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z"
      />
      <path
        fill="#ea4335"
        d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
      />
    </svg>
  );
}

function Login({ onForgotPassword, onLogin, onSignUp }) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
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
        <div className="login-card">
          <div className="login-header">
            <h1>Welcome back</h1>
            <p>Sign in to access your account</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="work-email">Work Email</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <input
                  id="work-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>  
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 018 0v3" />
                  <circle cx="12" cy="15" r="1" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A10.7 10.7 0 0112 5c5 0 8.5 4 9.5 7a10.8 10.8 0 01-3.2 4.5" />
                      <path d="M6.2 6.2C4.4 7.4 3.2 9.2 2.5 12c1 3 4.5 7 9.5 7 1.4 0 2.7-.3 3.8-.8" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="login-options">
              <label className="remember-label">
                <input
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="custom-checkbox">{rememberMe && "✓"}</span>
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="forgot-password"
                onClick={onForgotPassword}
              >
                Forgot password?
              </button>
            </div>       
            <button type="submit" className="sign-in-button">
              Sign In
            </button>
          </form>
          <div className="divider">
            <span></span>
            <p>or</p>
            <span></span>
          </div>
          <button type="button" className="social-button google-button">
            <GoogleIcon />
            Sign in with Google
          </button>
          <button
            type="button"
            className="bottom bottom-button"
            onClick={onSignUp}
          >
            Don't have an account? <span>Sign Up</span>
          </button>
          <div className="security-message">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 018 0v3" />
            </svg>
            <p>
              Your data is protected with industry-standard
              <br />
              encryption and security controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Login;
