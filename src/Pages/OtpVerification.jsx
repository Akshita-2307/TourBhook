import { useRef, useState } from "react";
import "./Login.css";

const OTP_LENGTH = 6;

function OtpVerification({ onVerify, onUseDifferentEmail }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const inputRefs = useRef([]);

  const focusDigit = (index) => {
    inputRefs.current[index]?.focus();
  };

  const applyDigits = (startIndex, value) => {
    const numericValue = value.replace(/\D/g, "");

    if (!numericValue) {
      return;
    }

    setDigits((current) => {
      const next = [...current];

      numericValue
        .slice(0, OTP_LENGTH - startIndex)
        .split("")
        .forEach((digit, offset) => {
          next[startIndex + offset] = digit;
        });

      return next;
    });

    setError("");
    setStatus("");
    focusDigit(Math.min(startIndex + numericValue.length, OTP_LENGTH - 1));
  };

  const handleChange = (index, event) => {
    const value = event.target.value;

    if (!value) {
      setDigits((current) => {
        const next = [...current];
        next[index] = "";
        return next;
      });
      return;
    }

    applyDigits(index, value);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const clearIndex = digits[index] || index === 0 ? index : index - 1;

      setDigits((current) => {
        const next = [...current];
        next[clearIndex] = "";
        return next;
      });

      focusDigit(digits[index] && index > 0 ? index - 1 : clearIndex);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusDigit(index - 1);
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusDigit(index + 1);
    }
  };

  const handlePaste = (index, event) => {
    const value = event.clipboardData.getData("text");

    if (/\d/.test(value)) {
      event.preventDefault();
      applyDigits(index, value);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (digits.some((digit) => !digit)) {
      setError("Enter the complete 6-digit verification code.");
      return;
    }

    onVerify?.();
  };

  const handleResend = () => {
    setDigits(Array(OTP_LENGTH).fill(""));
    setError("");
    setStatus("Verification code entry reset.");
    focusDigit(0);
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
        <div className="login-card otp-card">
          <div className="login-header otp-header">
            <h1>Verify your email</h1>
            <p>Enter the code sent to you</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group otp-form-group">
              <label id="verification-code-label">Verification code</label>
              <div
                className="otp-inputs"
                role="group"
                aria-labelledby="verification-code-label"
              >
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    className="otp-digit"
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleChange(index, event)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={(event) => handlePaste(index, event)}
                    aria-label={`Verification code digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            {error && (
              <p className="form-error otp-message" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="sign-in-button">
              Verify email
            </button>
          </form>
          <div className="otp-resend">
            <span>Didn't receive a code?</span>
            <button type="button" onClick={handleResend}>
              Resend code
            </button>
          </div>
          {status && (
            <p className="otp-status" role="status">
              {status}
            </p>
          )}
          <button
            type="button"
            className="bottom bottom-button otp-different-email"
            onClick={onUseDifferentEmail}
          >
            <span>Use a different email</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OtpVerification;
