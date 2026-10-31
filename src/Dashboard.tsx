import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  FileSearch,
  FolderOpen,
  Users,
  Settings,
  Bell,
  Search,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Activity,
  LogOut,
  ChevronRight,
  BrainCircuit,
  RefreshCw,
  FileText,
  Download,
  X,
} from "lucide-react";

import { apiRequest } from "./api";

import AIAnalysis from "./AIAnalysis";
import TeamMembers from "./TeamMembers";
import InvestigatorSettings from "./InvestigatorSettings";

import "./dashboard.css";

interface DashboardProps {
  onLogout?: () => void;
}

interface BackendClaim {
  id: number;
  claim_number: string;
  claimant: string;
  email: string;
  phone?: string;
  policy_number: string;
  claim_type: string;
  incident_date: string;
  location?: string;
  description: string;
  amount: number;
  status: string;
  risk_level: string;
  created_at?: string;
  evidence_count?: number;
}

interface Claim {
  id: string;
  databaseId: number;
  claimant: string;
  claimType: string;
  status: string;
  risk: string;
  createdAt: string;
  policyNumber: string;
  incidentDate: string;
  location: string;
  description: string;
  amount: number;
  evidenceCount: number;
}

interface Evidence {
  id: number;
  filename: string;
  file_type?: string;
  file_size?: number;
  uploaded_at?: string;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [activeView, setActiveView] = useState("dashboard");

  const [searchTerm, setSearchTerm] = useState("");

  const [claims, setClaims] = useState<Claim[]>([]);

  const [evidence, setEvidence] = useState<Evidence[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadingEvidence, setLoadingEvidence] = useState(false);

  const [error, setError] = useState("");

  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const [investigatorName, setInvestigatorName] =
    useState("Investigator");

  const [investigatorEmail, setInvestigatorEmail] = useState("");

  // LOAD CLAIMS FROM BACKEND
  const fetchClaims = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/claims");

      const mappedClaims: Claim[] = (data as BackendClaim[]).map(
        (claim) => ({
          id: claim.claim_number || `CLM-${claim.id}`,
          databaseId: claim.id,
          claimant: claim.claimant,
          claimType: claim.claim_type,
          status: claim.status || "Submitted",
          risk: claim.risk_level || "Pending",
          createdAt: claim.created_at
            ? new Date(claim.created_at).toLocaleDateString("en-IN")
            : "N/A",
          policyNumber: claim.policy_number,
          incidentDate: claim.incident_date,
          location: claim.location || "Not provided",
          description: claim.description,
          amount: claim.amount || 0,
          evidenceCount: claim.evidence_count || 0,
        })
      );

      setClaims(mappedClaims);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve claims from the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // LOAD INVESTIGATOR PROFILE
  const fetchProfile = async () => {
    try {
      const user = await apiRequest("/auth/me");

      setInvestigatorName(
        user.full_name || "Investigator"
      );

      setInvestigatorEmail(user.email || "");
    } catch {
      setInvestigatorName("Investigator");
    }
  };

  // INITIAL DATA LOADING
  useEffect(() => {
    fetchClaims();
    fetchProfile();
  }, []);

  // LOAD EVIDENCE FOR SELECTED CLAIM
  const fetchEvidence = async (claim: Claim) => {
    setSelectedClaim(claim);
    setEvidence([]);
    setLoadingEvidence(true);
    setError("");
    setActiveView("evidence");

    try {
      const data = await apiRequest(
        `/claims/${claim.databaseId}/evidence`
      );

      setEvidence(data as Evidence[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load claim evidence."
      );
    } finally {
      setLoadingEvidence(false);
    }
  };

  // DOWNLOAD EVIDENCE
  const downloadEvidence = async (evidenceId: number) => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://127.0.0.1:8000";

      const token = localStorage.getItem("nexus_token");

      const response = await fetch(
        `${API_URL}/evidence/${evidenceId}/download`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );

      if (!response.ok) {
        throw new Error("Unable to download evidence.");
      }

      const blob = await response.blob();

      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;

      link.download =
        evidence.find((item) => item.id === evidenceId)?.filename ||
        "evidence";

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Evidence download failed."
      );
    }
  };

  // SIGN OUT
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_user");

    window.location.reload();
  };

  // FILTER CLAIMS
  const filteredClaims = claims.filter((claim) => {
    const search = searchTerm.toLowerCase();

    return (
      claim.id.toLowerCase().includes(search) ||
      claim.claimant.toLowerCase().includes(search) ||
      claim.claimType.toLowerCase().includes(search) ||
      claim.policyNumber.toLowerCase().includes(search)
    );
  });

  // DASHBOARD STATISTICS
  const totalCount = claims.length;

  const activeCount = claims.filter((claim) =>
    [
      "Submitted",
      "Pending",
      "Under Review",
      "In Review",
      "Investigating",
    ].includes(claim.status)
  ).length;

  const highRiskCount = claims.filter((claim) =>
    ["High", "Critical"].includes(claim.risk)
  ).length;

  const completedCount = claims.filter(
    (claim) => claim.status.toLowerCase() === "completed"
  ).length;

  const pendingCount = claims.filter((claim) =>
    ["Submitted", "Pending"].includes(claim.status)
  ).length;

  // CLAIM STATUS CLASS
  const getStatusClass = (status: string) => {
    const value = status.toLowerCase();

    if (value === "completed" || value === "approved") {
      return "completed";
    }

    if (value === "pending" || value === "submitted") {
      return "pending";
    }

    return "review";
  };

  // RISK CLASS
  const getRiskClass = (risk: string) => {
    const value = risk.toLowerCase();

    if (value === "high" || value === "critical") {
      return "high";
    }

    if (value === "medium") {
      return "medium";
    }

    if (value === "low") {
      return "low";
    }

    return "pending";
  };

  // CLAIM TABLE
  const renderClaimsTable = (data: Claim[]) => (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>CLAIM ID</th>
            <th>CLAIMANT</th>
            <th>CLAIM TYPE</th>
            <th>STATUS</th>
            <th>RISK</th>
            <th>EVIDENCE</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {data.length > 0 ? (
            data.map((claim) => (
              <tr key={claim.databaseId}>
                <td className="claim-id">
                  {claim.id}
                </td>

                <td>{claim.claimant}</td>

                <td>{claim.claimType}</td>

                <td>
                  <span
                    className={`status-badge ${getStatusClass(
                      claim.status
                    )}`}
                  >
                    {claim.status}
                  </span>
                </td>

                <td>
                  <span
                    className={`risk-badge ${getRiskClass(
                      claim.risk
                    )}`}
                  >
                    {claim.risk}
                  </span>
                </td>

                <td>{claim.evidenceCount}</td>

                <td>
                  <button
                    className="icon-button"
                    title="Review claim evidence"
                    onClick={() => fetchEvidence(claim)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7}>
                No matching claims found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // DASHBOARD SCREEN
  if (activeView === "dashboard") {
    return (
      <div className="dashboard">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">N</div>

            <div>
              <h2>NexusClaim</h2>
              <span>CLAIMS INTELLIGENCE</span>
            </div>
          </div>

          <div className="menu-label">
            WORKSPACE
          </div>

          <nav className="side-menu">
            <a
              className="active"
              onClick={() => setActiveView("dashboard")}
            >
              <LayoutDashboard size={19} />
              Dashboard
            </a>

            <a
              onClick={() => setActiveView("history")}
            >
              <FileSearch size={19} />
              Investigations
            </a>

            <a
              onClick={() => {
                setSelectedClaim(null);
                setEvidence([]);
                setActiveView("evidence");
              }}
            >
              <FolderOpen size={19} />
              Evidence Library
            </a>

            <a
              onClick={() => setActiveView("analysis")}
            >
              <Activity size={19} />
              AI Analytics
            </a>
          </nav>

          <div className="menu-label">
            MANAGEMENT
          </div>

          <nav className="side-menu">
            <a
              onClick={() => setActiveView("team")}
            >
              <Users size={19} />
              Team Members
            </a>

            <a
              onClick={() => setActiveView("settings")}
            >
              <Settings size={19} />
              Settings
            </a>
          </nav>

          <div className="sidebar-bottom">
            <div className="profile">
              <div className="avatar">
                {investigatorName.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <h4>{investigatorName}</h4>
                <span>Investigator</span>
              </div>
            </div>

            <button
              className="logout"
              onClick={handleLogout}
            >
              <LogOut size={17} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          {/* TOPBAR */}
          <header className="topbar">
            <div>
              <span className="breadcrumb">
                Workspace / Dashboard
              </span>

              <h1>Investigator Dashboard</h1>
            </div>

            <div className="top-actions">
              <button
                className="icon-button"
                onClick={fetchClaims}
                title="Refresh claims"
              >
                <RefreshCw size={18} />
              </button>

              <button className="icon-button">
                <Bell size={19} />
                <span className="notification-dot" />
              </button>

              <div className="top-avatar">
                {investigatorName.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </header>

          {/* WELCOME SECTION */}
          <section className="welcome-section">
            <div>
              <h2>
                Welcome back, {investigatorName}.
              </h2>

              <p>
                Here's an overview of your claims intelligence workspace.
              </p>

              {investigatorEmail && (
                <small>{investigatorEmail}</small>
              )}
            </div>

            <button
              className="new-claim-button"
              onClick={fetchClaims}
            >
              <RefreshCw size={18} />
              Refresh Claims
            </button>
          </section>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="dashboard-error">
              <AlertTriangle size={18} />
              <span>{error}</span>

              <button onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* STATISTICS */}
          <section className="stats-grid">
            <motion.div
              className="stat-card"
              whileHover={{ y: -5 }}
            >
              <div className="stat-top">
                <span>Total Claims</span>

                <div className="stat-icon purple">
                  <FolderOpen />
                </div>
              </div>

              <h2>{totalCount}</h2>

              <p>Registered customer claims</p>
            </motion.div>

            <motion.div
              className="stat-card"
              whileHover={{ y: -5 }}
            >
              <div className="stat-top">
                <span>Active Investigations</span>

                <div className="stat-icon blue">
                  <FileSearch />
                </div>
              </div>

              <h2>{activeCount}</h2>

              <p>Currently awaiting review</p>
            </motion.div>

            <motion.div
              className="stat-card"
              whileHover={{ y: -5 }}
            >
              <div className="stat-top">
                <span>Completed Claims</span>

                <div className="stat-icon green">
                  <CheckCircle />
                </div>
              </div>

              <h2>{completedCount}</h2>

              <p>Marked as completed</p>
            </motion.div>

            <motion.div
              className="stat-card"
              whileHover={{ y: -5 }}
            >
              <div className="stat-top">
                <span>High-Risk Flags</span>

                <div className="stat-icon orange">
                  <AlertTriangle />
                </div>
              </div>

              <h2>{highRiskCount}</h2>

              <p>Require further review</p>
            </motion.div>
          </section>

          {/* DASHBOARD GRID */}
          <section className="dashboard-grid">
            {/* CLAIMS PANEL */}
            <div className="claims-panel">
              <div className="panel-heading">
                <div>
                  <h3>Customer Claims</h3>

                  <p>
                    Review customer-submitted claims from the database.
                  </p>
                </div>

                <button
                  className="view-all"
                  onClick={() => setActiveView("history")}
                >
                  View All
                  <ArrowUpRight size={16} />
                </button>
              </div>

              {/* SEARCH */}
              <div className="search-box">
                <Search size={18} />

                <input
                  placeholder="Search claim ID or claimant..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />
              </div>

              {/* CLAIMS TABLE */}
              {loading ? (
                <div className="dashboard-loading">
                  <RefreshCw size={20} />
                  Loading claims from database...
                </div>
              ) : (
                renderClaimsTable(filteredClaims.slice(0, 5))
              )}
            </div>

            {/* ACTIVITY PANEL */}
            <div className="activity-panel">
              <h3>Investigation Overview</h3>

              <p>Current database activity</p>

              <div className="activity-item">
                <div className="activity-icon green">
                  <ShieldCheck />
                </div>

                <div>
                  <h4>Completed Claims</h4>
                  <span>{completedCount} claims completed</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon orange">
                  <AlertTriangle />
                </div>

                <div>
                  <h4>High-Risk Indicators</h4>
                  <span>{highRiskCount} claims need attention</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon blue">
                  <Clock />
                </div>

                <div>
                  <h4>Pending Reviews</h4>
                  <span>{pendingCount} claims awaiting review</span>
                </div>
              </div>

              <div className="security-note">
                <BrainCircuit size={20} />

                <div>
                  <h4>Human-in-the-loop AI</h4>

                  <p>
                    AI findings support investigators.
                    Final claim decisions remain with
                    authorized personnel.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="dashboard-footer">
            <span>
              © 2026 NexusClaim INTELLIGENCE
            </span>

            <span>
              Intelligence Beyond Every Claim.
            </span>
          </footer>
        </main>
      </div>
    );
  }

  // INVESTIGATIONS SCREEN
  if (activeView === "history") {
    return (
      <div className="dashboard">
        <div className="main-content">
          <header className="topbar">
            <div>
              <span className="breadcrumb">
                Workspace / Investigations
              </span>

              <h1>Customer Investigations</h1>
            </div>

            <button
              className="new-claim-button"
              onClick={() => setActiveView("dashboard")}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
          </header>

          <section className="claims-panel">
            <div className="panel-heading">
              <div>
                <h3>All Customer Claims</h3>

                <p>
                  Claims retrieved from the NexusClaim database.
                </p>
              </div>

              <button
                className="view-all"
                onClick={fetchClaims}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="search-box">
              <Search size={18} />

              <input
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

            {loading ? (
              <div className="dashboard-loading">
                Loading claims...
              </div>
            ) : (
              renderClaimsTable(filteredClaims)
            )}
          </section>
        </div>
      </div>
    );
  }

  // EVIDENCE LIBRARY SCREEN
  if (activeView === "evidence") {
    return (
      <div className="dashboard">
        <main className="main-content">
          <header className="topbar">
            <div>
              <span className="breadcrumb">
                Workspace / Evidence Library
              </span>

              <h1>Evidence Library</h1>
            </div>

            <button
              className="new-claim-button"
              onClick={() => setActiveView("dashboard")}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
          </header>

          <section className="claims-panel">
            <div className="panel-heading">
              <div>
                <h3>
                  {selectedClaim
                    ? `Evidence for ${selectedClaim.id}`
                    : "Select a Claim"}
                </h3>

                <p>
                  View and download customer-uploaded evidence.
                </p>
              </div>
            </div>

            {!selectedClaim ? (
              <div className="admin-empty-state">
                <FileText size={28} />

                <p>Select a claim to view its evidence.</p>

                {claims.map((claim) => (
                  <button
                    key={claim.databaseId}
                    className="admin-outline-button"
                    onClick={() => fetchEvidence(claim)}
                  >
                    {claim.id} – {claim.claimant}
                  </button>
                ))}
              </div>
            ) : loadingEvidence ? (
              <div className="dashboard-loading">
                Loading evidence...
              </div>
            ) : evidence.length === 0 ? (
              <div className="admin-empty-state">
                <FolderOpen size={28} />

                <p>No evidence files have been uploaded for this claim.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>FILE NAME</th>
                      <th>FILE TYPE</th>
                      <th>FILE SIZE</th>
                      <th>UPLOADED</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {evidence.map((item) => (
                      <tr key={item.id}>
                        <td>{item.filename}</td>

                        <td>{item.file_type || "Unknown"}</td>

                        <td>
                          {item.file_size
                            ? `${(
                                item.file_size / 1024
                              ).toFixed(1)} KB`
                            : "N/A"}
                        </td>

                        <td>
                          {item.uploaded_at
                            ? new Date(
                                item.uploaded_at
                              ).toLocaleDateString("en-IN")
                            : "N/A"}
                        </td>

                        <td>
                          <button
                            className="admin-icon-button"
                            title="Download evidence"
                            onClick={() =>
                              downloadEvidence(item.id)
                            }
                          >
                            <Download size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              className="admin-outline-button"
              onClick={() => {
                setSelectedClaim(null);
                setEvidence([]);
              }}
            >
              Back to Claim Selection
            </button>
          </section>
        </main>
      </div>
    );
  }

  // AI ANALYSIS SCREEN
  if (activeView === "analysis") {
    return (
      <AIAnalysis
        onBack={() => setActiveView("dashboard")}
      />
    );
  }

  // TEAM MEMBERS SCREEN
  if (activeView === "team") {
    return (
      <TeamMembers
        onBack={() => setActiveView("dashboard")}
      />
    );
  }

  // SETTINGS SCREEN
  if (activeView === "settings") {
    return (
      <InvestigatorSettings
        onBack={() => setActiveView("dashboard")}
      />
    );
  }

  return null;
};

export default Dashboard;