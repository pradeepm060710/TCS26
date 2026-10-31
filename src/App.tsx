import React, { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  ScanEye,
  Shield,
} from "lucide-react";

import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import CustomerDashboard from "./CustomerDashboard";

import "./styles.css";

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type UserRole = "customer" | "investigator" | "admin";

interface UserData {
  id: number;
  email: string;
  role: UserRole;
  full_name?: string | null;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserData;
}

// --------------------------------------------------
// MAIN APPLICATION
// --------------------------------------------------

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [role, setRole] = useState<UserRole>("customer");

  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentUser, setCurrentUser] = useState<UserData | null>(
    null
  );

  // --------------------------------------------------
  // RESTORE LOGIN SESSION
  // --------------------------------------------------

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("nexus_token");

      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session expired");
        }

        const userData: UserData = await response.json();

        if (
          !["customer", "investigator", "admin"].includes(
            userData.role
          )
        ) {
          throw new Error("Invalid user role");
        }

        localStorage.setItem(
          "nexus_user",
          JSON.stringify(userData)
        );

        setCurrentUser(userData);
        setIsLoggedIn(true);
      } catch (err) {
        console.error("Session restoration failed:", err);

        localStorage.removeItem("nexus_token");
        localStorage.removeItem("nexus_user");

        setCurrentUser(null);
        setIsLoggedIn(false);
      } finally {
        setCheckingSession(false);
      }
    };

    restoreSession();
  }, []);

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const handleLogin = async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        role,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Login failed. Please check your credentials."
      );
    }

    const authData = data as AuthResponse;

    // SAVE AUTHENTICATION INFORMATION

    localStorage.setItem(
      "nexus_token",
      authData.access_token
    );

    localStorage.setItem(
      "nexus_user",
      JSON.stringify(authData.user)
    );

    setCurrentUser(authData.user);
    setIsLoggedIn(true);
  };

  // --------------------------------------------------
  // CUSTOMER REGISTRATION
  // --------------------------------------------------

  const handleRegister = async () => {
    if (role !== "customer") {
      throw new Error(
        "Only customers can register. Investigator and Admin accounts must be provisioned separately."
      );
    }

    if (!fullName.trim()) {
      throw new Error("Please enter your full name.");
    }

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Registration failed."
      );
    }

    setSuccess(
      "Account created successfully! Please sign in."
    );

    setIsRegistering(false);
    setPassword("");
    setFullName("");
  };

  // --------------------------------------------------
  // FORM SUBMISSION
  // --------------------------------------------------

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistering) {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_user");

    setCurrentUser(null);
    setIsLoggedIn(false);

    setEmail("");
    setPassword("");
    setFullName("");

    setRole("customer");
    setIsRegistering(false);

    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (checkingSession) {
    return (
      <div className="nexus-auth-page">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="auth-heading"
          style={{
            margin: "auto",
            textAlign: "center",
          }}
        >
          <ShieldCheck size={42} />
          <h2>Loading NexusClaim</h2>
          <p>Verifying your secure session...</p>
          <Loader2
            size={25}
            className="auth-spinner"
          />
        </motion.div>
      </div>
    );
  }

  // --------------------------------------------------
  // DASHBOARD ROUTING
  // --------------------------------------------------

  if (isLoggedIn && currentUser) {
    if (currentUser.role === "admin") {
      return (
        <AdminDashboard
          onLogout={handleLogout}
        />
      );
    }

    if (currentUser.role === "investigator") {
      return <Dashboard />;
    }

    return (
      <CustomerDashboard
        email={currentUser.email}
        onLogout={handleLogout}
      />
    );
  }

  // --------------------------------------------------
  // LOGIN PAGE
  // --------------------------------------------------

  return (
    <div className="nexus-auth-page">

      <div className="auth-background-glow glow-one" />
      <div className="auth-background-glow glow-two" />

      <div className="auth-grid-background" />

      <motion.div
        className="auth-main-container"

        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >

        {/* LEFT HERO SECTION */}

        <div className="auth-hero-section">

          <div className="auth-brand">

            <div className="auth-brand-icon">
              <ShieldCheck size={30} />
            </div>

            <div>
              <h1>NexusClaim</h1>
              <p>INTELLIGENCE BEYOND EVERY CLAIM</p>
            </div>

          </div>

          <div className="auth-hero-content">

            <div className="hero-status">
              <span className="status-dot" />
              AI-POWERED CLAIMS INTELLIGENCE
            </div>

            <h2>
              Beyond Claims.
              <br />

              <span>Discover the Truth.</span>
            </h2>

            <p className="auth-hero-description">
              An intelligent insurance investigation
              platform that brings evidence, analytics
              and investigation workflows together
              in one unified environment.
            </p>

            <div className="auth-feature-list">

              <div className="auth-feature">
                <div className="feature-icon">
                  <ScanEye size={20} />
                </div>

                <div>
                  <h4>Evidence Intelligence</h4>
                  <p>
                    Centralized access to claim evidence
                    and investigation records.
                  </p>
                </div>
              </div>

              <div className="auth-feature">
                <div className="feature-icon">
                  <Fingerprint size={20} />
                </div>

                <div>
                  <h4>Secure Access</h4>
                  <p>
                    Role-based authentication and
                    protected claim information.
                  </p>
                </div>
              </div>

              <div className="auth-feature">
                <div className="feature-icon">
                  <Shield size={20} />
                </div>

                <div>
                  <h4>Investigation Intelligence</h4>
                  <p>
                    Structured claim reviews and
                    evidence-based decisions.
                  </p>
                </div>
              </div>

            </div>

          </div>

          <div className="auth-hero-footer">
            © 2026 NexusClaim. All rights reserved.
          </div>

        </div>

        {/* RIGHT LOGIN SECTION */}

        <div className="auth-form-section">

          <div className="auth-form-wrapper">

            <div className="auth-mobile-brand">
              <ShieldCheck size={30} />
              <h2>NexusClaim</h2>
            </div>

            <div className="auth-heading">

              <div className="auth-heading-icon">
                <Lock size={21} />
              </div>

              <h2>
                {isRegistering
                  ? "Create your account"
                  : "Welcome back"}
              </h2>

              <p>
                {isRegistering
                  ? "Register to access your insurance claims."
                  : "Sign in to continue to your workspace."}
              </p>

            </div>

            {/* ROLE SELECTOR */}

            <div className="auth-role-section">

              <label>Select your workspace</label>

              <div className="auth-role-selector">

                {(
                  [
                    "customer",
                    "investigator",
                    "admin",
                  ] as UserRole[]
                ).map((item) => (

                  <button
                    key={item}
                    type="button"

                    className={
                      role === item
                        ? "auth-role-option active"
                        : "auth-role-option"
                    }

                    onClick={() => {
                      setRole(item);
                      setError("");
                      setSuccess("");

                      if (item !== "customer") {
                        setIsRegistering(false);
                      }
                    }}
                  >
                    {item === "customer" && (
                      <User size={17} />
                    )}

                    {item === "investigator" && (
                      <ScanEye size={17} />
                    )}

                    {item === "admin" && (
                      <ShieldCheck size={17} />
                    )}

                    <span>
                      {item.charAt(0).toUpperCase() +
                        item.slice(1)}
                    </span>

                  </button>

                ))}

              </div>

            </div>

            {/* LOGIN / REGISTER SWITCH */}

            {role === "customer" && (

              <div className="auth-mode-switch">

                <button
                  type="button"

                  className={
                    !isRegistering ? "active" : ""
                  }

                  onClick={() => {
                    setIsRegistering(false);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Sign In
                </button>

                <button
                  type="button"

                  className={
                    isRegistering ? "active" : ""
                  }

                  onClick={() => {
                    setIsRegistering(true);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Register
                </button>

              </div>

            )}

            <form onSubmit={handleSubmit}>

              {/* FULL NAME */}

              <AnimatePresence>
                {isRegistering && (

                  <motion.div
                    className="auth-input-group"

                    initial={{
                      opacity: 0,
                      height: 0,
                    }}

                    animate={{
                      opacity: 1,
                      height: "auto",
                    }}

                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                  >

                    <label>Full Name</label>

                    <div className="auth-input-wrapper">

                      <User size={18} />

                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}

                        onChange={(e) =>
                          setFullName(e.target.value)
                        }

                        required
                      />

                    </div>

                  </motion.div>

                )}
              </AnimatePresence>

              {/* EMAIL */}

              <div className="auth-input-group">

                <label>Email Address</label>

                <div className="auth-input-wrapper">

                  <Mail size={18} />

                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}

                    onChange={(e) =>
                      setEmail(e.target.value)
                    }

                    required
                    autoComplete="email"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="auth-input-group">

                <label>Password</label>

                <div className="auth-input-wrapper">

                  <Lock size={18} />

                  <input
                    type={
                      showPassword ? "text" : "password"
                    }

                    placeholder="Enter your password"
                    value={password}

                    onChange={(e) =>
                      setPassword(e.target.value)
                    }

                    required
                    minLength={8}

                    autoComplete={
                      isRegistering
                        ? "new-password"
                        : "current-password"
                    }
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"

                    onClick={() =>
                      setShowPassword(!showPassword)
                    }

                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />}

                  </button>

                </div>

              </div>

              {/* ERROR MESSAGE */}

              <AnimatePresence>

                {error && (

                  <motion.div
                    className="auth-message auth-error"

                    initial={{
                      opacity: 0,
                      y: -8,
                    }}

                    animate={{
                      opacity: 1,
                      y: 0,
                    }}

                    exit={{
                      opacity: 0,
                    }}
                  >

                    <AlertCircle size={17} />

                    <span>{error}</span>

                  </motion.div>

                )}

              </AnimatePresence>

              {/* SUCCESS MESSAGE */}

              <AnimatePresence>

                {success && (

                  <motion.div
                    className="auth-message auth-success"

                    initial={{
                      opacity: 0,
                      y: -8,
                    }}

                    animate={{
                      opacity: 1,
                      y: 0,
                    }}

                    exit={{
                      opacity: 0,
                    }}
                  >

                    <CheckCircle2 size={17} />

                    <span>{success}</span>

                  </motion.div>

                )}

              </AnimatePresence>

              {/* SUBMIT BUTTON */}

              <motion.button
                type="submit"

                className="auth-submit-button"

                disabled={isLoading}

                whileHover={{
                  scale: 1.015,
                }}

                whileTap={{
                  scale: 0.985,
                }}
              >

                {isLoading ? (

                  <>
                    <Loader2
                      size={19}
                      className="auth-spinner"
                    />

                    Please wait...
                  </>

                ) : (

                  <>
                    {isRegistering
                      ? "Create Account"
                      : "Sign In to Workspace"}

                    <ArrowRight size={19} />
                  </>

                )}

              </motion.button>

            </form>

            <div className="auth-security-note">

              <ShieldCheck size={16} />

              <span>
                Protected access • Secure authentication
              </span>

            </div>

            {role !== "customer" && (

              <div className="auth-admin-note">

                {role === "admin"
                  ? "Administrator accounts must be provisioned securely."
                  : "Investigator accounts must be provisioned securely."}

              </div>

            )}

          </div>

        </div>

      </motion.div>

    </div>
  );
};

export default App;