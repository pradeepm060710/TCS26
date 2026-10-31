import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Activity,
  ShieldCheck,
  Settings,
  LogOut,
  Search,
  Bell,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Menu,
  X,
  UserPlus,
  ClipboardList,
  BarChart3,
  Eye,
} from "lucide-react";

import { apiRequest } from "./api";
import "./admin-dashboard.css";

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminView =
  | "overview"
  | "investigators"
  | "claims"
  | "audit"
  | "analytics"
  | "settings";

interface AdminClaim {
  id: number;
  claim_number: string;
  claimant: string;
  email: string;
  claim_type: string;
  amount: number;
  status: string;
  risk_level: string;
}

interface AdminUser {
  id: number;
  email: string;
  role: string;
  full_name?: string;
}

interface ClaimRow {
  id: string;
  claimant: string;
  type: string;
  investigator: string;
  amount: string;
  status: string;
  risk: string;
}

interface InvestigatorRow {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
  claims: number;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [investigators, setInvestigators] = useState<InvestigatorRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [apiError, setApiError] = useState("");

  const fetchAdminData = async () => {
    setLoadingData(true);
    setApiError("");

    try {
      const [claimsData, usersData] = await Promise.all([
        apiRequest("/admin/claims"),
        apiRequest("/admin/users"),
      ]);

      const mappedClaims = (claimsData as AdminClaim[]).map((claim) => ({
        id: claim.claim_number || String(claim.id),
        claimant: claim.claimant,
        type: claim.claim_type,
        investigator: "Unassigned",
        amount: new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(claim.amount || 0),
        status: claim.status || "Submitted",
        risk: claim.risk_level || "Pending",
      }));

      const mappedInvestigators = (usersData as AdminUser[])
        .filter((user) => user.role === "investigator")
        .map((user) => ({
          id: `INV-${String(user.id).padStart(3, "0")}`,
          name: user.full_name || "Unnamed Investigator",
          email: user.email,
          department: "Not Assigned",
          status: "Active",
          claims: 0,
        }));

      setClaims(mappedClaims);
      setInvestigators(mappedInvestigators);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Unable to load administrator data."
      );
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // These activity records are illustrative.
  // Persistent audit logs will be connected after adding a backend audit endpoint.
  const auditLogs = [
    {
      action: "Administrator dashboard accessed",
      user: "System",
      target: "NexusClaim",
      time: "Current session",
      type: "account",
    },
    {
      action: "Claims database synchronized",
      user: "System",
      target: "Claims database",
      time: "Current session",
      type: "claim",
    },
  ];

  const totalClaims = claims.length;

  const pendingClaims = claims.filter((claim) =>
    ["Pending", "Submitted"].includes(claim.status)
  ).length;

  const completedClaims = claims.filter(
    (claim) => claim.status.toLowerCase() === "completed"
  ).length;

  const reviewClaims = claims.filter((claim) =>
    ["Under Review", "In Review", "Investigating"].includes(claim.status)
  ).length;

  const flaggedClaims = claims.filter((claim) =>
    ["High", "Critical"].includes(claim.risk)
  ).length;

  const completedPercentage =
    totalClaims > 0
      ? Math.round((completedClaims / totalClaims) * 100)
      : 0;

  const reviewPercentage =
    totalClaims > 0
      ? Math.round((reviewClaims / totalClaims) * 100)
      : 0;

  const pendingPercentage =
    totalClaims > 0
      ? Math.max(0, 100 - completedPercentage - reviewPercentage)
      : 0;

  const filteredInvestigators = investigators.filter((person) =>
    `${person.name} ${person.email} ${person.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredClaims = claims.filter((claim) =>
    `${claim.id} ${claim.claimant} ${claim.type} ${claim.investigator}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const pageTitle = {
    overview: "Administrator Overview",
    investigators: "Investigator Management",
    claims: "Claims Management",
    audit: "System Audit Logs",
    analytics: "Analytics & Reports",
    settings: "System Settings",
  }[activeView];

  const navigation = [
    {
      label: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          icon: LayoutDashboard,
          value: "overview",
        },
      ],
    },
    {
      label: "MANAGEMENT",
      items: [
        {
          name: "Investigators",
          icon: Users,
          value: "investigators",
        },
        {
          name: "Claims",
          icon: FileText,
          value: "claims",
        },
      ],
    },
    {
      label: "MONITORING",
      items: [
        {
          name: "Audit Logs",
          icon: ClipboardList,
          value: "audit",
        },
        {
          name: "Analytics",
          icon: BarChart3,
          value: "analytics",
        },
      ],
    },
    {
      label: "CONFIGURATION",
      items: [
        {
          name: "Settings",
          icon: Settings,
          value: "settings",
        },
      ],
    },
  ];

  const renderClaimsTable = (data: ClaimRow[]) => (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>CLAIM ID</th>
            <th>CLAIMANT</th>
            <th>CLAIM TYPE</th>
            <th>INVESTIGATOR</th>
            <th>AMOUNT</th>
            <th>STATUS</th>
            <th>RISK</th>
          </tr>
        </thead>

        <tbody>
          {data.map((claim) => (
            <tr key={claim.id}>
              <td className="admin-claim-id">{claim.id}</td>
              <td>{claim.claimant}</td>
              <td>{claim.type}</td>
              <td>{claim.investigator}</td>
              <td>{claim.amount}</td>

              <td>
                <span
                  className={`admin-status ${
                    claim.status.toLowerCase() === "completed"
                      ? "completed"
                      : ["pending", "submitted"].includes(
                            claim.status.toLowerCase()
                          )
                        ? "pending"
                        : "review"
                  }`}
                >
                  {claim.status}
                </span>
              </td>

              <td>
                <span
                  className={`admin-risk ${claim.risk.toLowerCase()}`}
                >
                  {claim.risk}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="admin-empty-state">
          No claims available.
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <>
      <section className="admin-welcome">
        <div>
          <span className="admin-eyebrow">
            SYSTEM CONTROL CENTER
          </span>

          <h1>Welcome, Administrator</h1>

          <p>
            Monitor investigations, manage your team and oversee the
            NexusClaim claims intelligence platform.
          </p>
        </div>

        <div className="admin-welcome-icon">
          <ShieldCheck size={43} />
        </div>
      </section>

      <section className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Total Claims</span>

            <div className="admin-stat-icon blue">
              <FileText size={21} />
            </div>
          </div>

          <h2>{totalClaims.toLocaleString("en-IN")}</h2>

          <p className="admin-stat-change">
            <TrendingUp size={15} /> Live database records
          </p>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Investigators</span>

            <div className="admin-stat-icon purple">
              <Users size={21} />
            </div>
          </div>

          <h2>{investigators.length}</h2>

          <p className="admin-stat-change">
            <TrendingUp size={15} /> Registered investigators
          </p>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Pending Reviews</span>

            <div className="admin-stat-icon orange">
              <Clock size={21} />
            </div>
          </div>

          <h2>{pendingClaims}</h2>

          <p className="admin-stat-neutral">
            Awaiting investigation
          </p>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Flagged Claims</span>

            <div className="admin-stat-icon red">
              <AlertTriangle size={21} />
            </div>
          </div>

          <h2>{flaggedClaims}</h2>

          <p className="admin-stat-warning">
            Require additional review
          </p>
        </div>
      </section>

      <section className="admin-overview-grid">
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Claims Overview</h2>
              <p>Current investigation distribution</p>
            </div>

            <span className="admin-live-indicator">
              <span /> LIVE
            </span>
          </div>

          <div className="admin-claim-distribution">
            <div className="admin-distribution-visual">
              <div
                className="admin-donut"
                style={{
                  background:
                    totalClaims === 0
                      ? "conic-gradient(#e5e7eb 0% 100%)"
                      : `conic-gradient(
                          #16a36a 0% ${completedPercentage}%,
                          #4387e8 ${completedPercentage}% ${
                            completedPercentage + reviewPercentage
                          }%,
                          #f59e0b ${
                            completedPercentage + reviewPercentage
                          }% 100%
                        )`,
                }}
              >
                <div>
                  <strong>{totalClaims}</strong>
                  <span>Total Claims</span>
                </div>
              </div>
            </div>

            <div className="admin-legend">
              <div>
                <span className="legend-dot green" />
                <span>Completed</span>
                <strong>{completedPercentage}%</strong>
              </div>

              <div>
                <span className="legend-dot blue" />
                <span>Under Review</span>
                <strong>{reviewPercentage}%</strong>
              </div>

              <div>
                <span className="legend-dot orange" />
                <span>Pending</span>
                <strong>{pendingPercentage}%</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>System Activity</h2>
              <p>Current session activity</p>
            </div>

            <Activity size={21} />
          </div>

          <div className="admin-activity-list">
            {auditLogs.map((log, index) => (
              <div className="admin-activity-item" key={index}>
                <div className={`admin-activity-icon ${log.type}`}>
                  {log.type === "investigation" && (
                    <FileText size={17} />
                  )}

                  {log.type === "evidence" && (
                    <ShieldCheck size={17} />
                  )}

                  {log.type === "claim" && (
                    <CheckCircle size={17} />
                  )}

                  {log.type === "account" && (
                    <Users size={17} />
                  )}
                </div>

                <div className="admin-activity-info">
                  <strong>{log.action}</strong>
                  <span>
                    {log.user} · {log.target}
                  </span>
                </div>

                <time>{log.time}</time>
              </div>
            ))}
          </div>

          <button
            className="admin-text-button"
            onClick={() => setActiveView("audit")}
          >
            View all activity <ChevronRight size={16} />
          </button>
        </div>
      </section>

      <section className="admin-panel admin-recent-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Recent Claims</h2>
            <p>Latest claims submitted by customers</p>
          </div>

          <button
            className="admin-outline-button"
            onClick={() => setActiveView("claims")}
          >
            View All Claims <ChevronRight size={16} />
          </button>
        </div>

        {renderClaimsTable(claims.slice(0, 4))}
      </section>
    </>
  );

  const renderInvestigators = () => (
    <section className="admin-panel admin-management-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>Investigator Directory</h2>
          <p>View and monitor registered investigator accounts.</p>
        </div>

        <button
          className="admin-primary-button"
          onClick={() =>
            alert(
              "To create an investigator account, run python create_users.py from the backend folder and select option 1."
            )
          }
        >
          <UserPlus size={17} /> Add Investigator
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>INVESTIGATOR ID</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>DEPARTMENT</th>
              <th>ASSIGNED CLAIMS</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {filteredInvestigators.map((person) => (
              <tr key={person.id}>
                <td className="admin-claim-id">{person.id}</td>
                <td>{person.name}</td>
                <td>{person.email}</td>
                <td>{person.department}</td>
                <td>{person.claims}</td>

                <td>
                  <span
                    className={`admin-status ${
                      person.status === "Active"
                        ? "completed"
                        : "pending"
                    }`}
                  >
                    {person.status}
                  </span>
                </td>

                <td>
                  <button
                    className="admin-icon-button"
                    title="View investigator"
                    onClick={() =>
                      alert(
                        `${person.name}\n${person.email}\n${person.department}`
                      )
                    }
                  >
                    <Eye size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInvestigators.length === 0 && (
          <div className="admin-empty-state">
            No investigators found.
          </div>
        )}
      </div>
    </section>
  );

  const renderClaims = () => (
    <section className="admin-panel admin-management-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>All Insurance Claims</h2>
          <p>Monitor claims submitted across the platform.</p>
        </div>

        <span className="admin-count-badge">
          {claims.length} Claims
        </span>
      </div>

      {renderClaimsTable(filteredClaims)}

      {filteredClaims.length === 0 && (
        <div className="admin-empty-state">
          No claims match your search.
        </div>
      )}
    </section>
  );

  const renderAudit = () => (
    <section className="admin-panel admin-management-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>Activity & Audit Trail</h2>
          <p>
            Persistent audit logging will be available after the backend
            audit endpoint is implemented.
          </p>
        </div>

        <span className="admin-count-badge">
          Demo Activity
        </span>
      </div>

      <div className="admin-audit-list">
        {auditLogs.map((log, index) => (
          <div className="admin-audit-item" key={index}>
            <div className={`admin-activity-icon ${log.type}`}>
              <Activity size={19} />
            </div>

            <div className="admin-audit-content">
              <strong>{log.action}</strong>

              <p>
                Performed by <b>{log.user}</b> · Reference: {log.target}
              </p>
            </div>

            <span>{log.time}</span>
          </div>
        ))}
      </div>
    </section>
  );

  const renderAnalytics = () => (
    <div className="admin-analytics-grid">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Investigation Performance</h2>
            <p>Illustrative monthly claim completion data</p>
          </div>

          <TrendingUp size={21} />
        </div>

        <div className="admin-bars">
          {[45, 65, 52, 80, 61, 92, 73, 85, 68, 96, 78, 88].map(
            (height, index) => (
              <div className="admin-bar-column" key={index}>
                <div className="admin-bar-track">
                  <div style={{ height: `${height}%` }} />
                </div>

                <span>
                  {
                    [
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ][index]
                  }
                </span>
              </div>
            )
          )}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>System Summary</h2>
            <p>Live database indicators</p>
          </div>

          <BarChart3 size={21} />
        </div>

        <div className="admin-summary-list">
          <div>
            <span>Claims submitted</span>
            <strong>{totalClaims}</strong>
          </div>

          <div>
            <span>Registered investigators</span>
            <strong>{investigators.length}</strong>
          </div>

          <div>
            <span>Pending reviews</span>
            <strong>{pendingClaims}</strong>
          </div>

          <div>
            <span>Claims requiring review</span>
            <strong>{flaggedClaims}</strong>
          </div>
        </div>
      </section>
    </div>
  );

  const renderSettings = () => (
    <section className="admin-panel admin-settings-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>Platform Configuration</h2>
          <p>Manage NexusClaim platform preferences.</p>
        </div>

        <Settings size={22} />
      </div>

      <div className="admin-setting-row">
        <div>
          <strong>Platform Name</strong>
          <p>NexusClaim – Multimodal Claims Intelligence</p>
        </div>

        <span className="admin-setting-value">
          NexusClaim
        </span>
      </div>

      <div className="admin-setting-row">
        <div>
          <strong>AI Investigation Support</strong>
          <p>
            AI findings are intended to support human review.
          </p>
        </div>

        <span className="admin-setting-value">
          Demo Mode
        </span>
      </div>

      <div className="admin-setting-row">
        <div>
          <strong>Account Security</strong>
          <p>Backend authentication is connected.</p>
        </div>

        <span className="admin-setting-value">
          Connected
        </span>
      </div>

      <div className="admin-setting-row">
        <div>
          <strong>Data Storage</strong>
          <p>Claims and user accounts are stored in SQLite.</p>
        </div>

        <span className="admin-setting-value">
          Database Connected
        </span>
      </div>

      <div className="admin-setting-row">
        <div>
          <strong>Audit Logging</strong>
          <p>Persistent audit logging is not yet implemented.</p>
        </div>

        <span className="admin-setting-value warning">
          Not Available
        </span>
      </div>
    </section>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return renderOverview();

      case "investigators":
        return renderInvestigators();

      case "claims":
        return renderClaims();

      case "audit":
        return renderAudit();

      case "analytics":
        return renderAnalytics();

      case "settings":
        return renderSettings();

      default:
        return renderOverview();
    }
  };

  return (
    <div className="admin-dashboard">
      {sidebarOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}
      >
        <div className="admin-brand">
          <div className="admin-brand-symbol">N</div>

          <div>
            <h2>NexusClaim</h2>
            <span>CLAIMS INTELLIGENCE</span>
          </div>

          <button
            className="admin-mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-profile">
          <div className="admin-avatar">AD</div>

          <div>
            <strong>Administrator</strong>
            <span>System Admin</span>
          </div>

          <ShieldCheck size={17} />
        </div>

        <nav className="admin-navigation">
          {navigation.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <span className="admin-nav-label">
                {group.label}
              </span>

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.value}
                    className={`admin-nav-item ${
                      activeView === item.value ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveView(item.value as AdminView);
                      setSearchTerm("");
                      setSidebarOpen(false);
                    }}
                  >
                    <Icon size={19} />

                    <span>{item.name}</span>

                    {activeView === item.value && (
                      <span className="admin-nav-active-dot" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-security">
            <ShieldCheck size={19} />

            <div>
              <strong>Admin Access</strong>
              <span>Authenticated session</span>
            </div>
          </div>

          <button
            className="admin-logout-button"
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-button"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <span className="admin-breadcrumb">
                NexusClaim / ADMINISTRATION
              </span>

              <h2>{pageTitle}</h2>
            </div>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

            <button
              className="admin-notification-button"
              title="Notifications"
              onClick={() =>
                alert("No new notifications available.")
              }
            >
              <Bell size={20} />
              <span />
            </button>

            <div className="admin-topbar-avatar">AD</div>
          </div>
        </header>

        <div className="admin-content">
          {loadingData ? (
            <div className="admin-empty-state">
              Loading administrator data...
            </div>
          ) : apiError ? (
            <div className="admin-empty-state">
              <AlertTriangle size={22} />

              <p>{apiError}</p>

              <button
                className="admin-outline-button"
                onClick={fetchAdminData}
              >
                Retry
              </button>
            </div>
          ) : (
            renderActiveView()
          )}
        </div>

        <footer className="admin-footer">
          <span>© 2026 NexusClaim INTELLIGENCE</span>
          <span>Intelligence Beyond Every Claim.</span>
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboard;