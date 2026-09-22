import "./Login.css";

function PasswordResetSuccess({ onBackToSignIn }) {
  return (
    <div className="login-page">
      <div className="login-left">
        <div className="travel-background" />
        <div className="logos">
          <img src="/tourbhook.png" alt="TourBhook" />
        </div>
      </div>
      <div className="login-right">
        <div className="login-card reset-success-card">
          <div className="reset-success-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12 4.2 4.2L19 6.5" />
            </svg>
          </div>
          <div className="login-header reset-success-header">
            <h1>Password reset successfully</h1>
            <p>
              Your password has been updated successfully. You can now sign in
              with your new password.
            </p>
          </div>
          <button
            type="button"
            className="sign-in-button reset-success-button"
            onClick={onBackToSignIn}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetSuccess;
