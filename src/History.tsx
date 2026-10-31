import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  ArrowLeft,
  Search,
  Filter,
  Clock,
  FileText,
  Eye,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
} from "lucide-react";

import { apiRequest } from "./api";
import "./history.css";

interface HistoryProps {
  onBack: () => void;
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
  risk_level?: string;
  created_at?: string;
}

interface Claim {
  id: number;
  claimId: string;
  claimant: string;
  email: string;
  phone: string;
  policyNumber: string;
  claimType: string;
  incidentDate: string;
  location: string;
  description: string;
  amount: number;
  status: string;
  riskLevel: string;
  createdAt: string;
}

export default function History({ onBack }: HistoryProps) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/claims");

      const backendClaims: BackendClaim[] = Array.isArray(data)
        ? data
        : [];

      const formattedClaims: Claim[] = backendClaims.map((claim) => ({
        id: claim.id,
        claimId: claim.claim_number,
        claimant: claim.claimant,
        email: claim.email,
        phone: claim.phone || "",
        policyNumber: claim.policy_number,
        claimType: claim.claim_type,
        incidentDate: claim.incident_date,
        location: claim.location || "",
        description: claim.description,
        amount: Number(claim.amount || 0),
        status: claim.status || "Submitted",
        riskLevel: claim.risk_level || "Pending",
        createdAt: claim.created_at || "",
      }));

      setClaims(formattedClaims);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve investigation history."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "Not specified";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const normalizeStatus = (status: string) => {
    return status.trim().toLowerCase().replace(/[_-]/g, " ");
  };

  const getStatusClass = (status?: string) => {
    const normalized = normalizeStatus(status || "");

    if (normalized === "completed" || normalized === "approved") {
      return "completed";
    }

    if (
      normalized === "under review" ||
      normalized === "in review" ||
      normalized === "investigating"
    ) {
      return "review";
    }

    return "pending";
  };

  const getDisplayStatus = (status?: string) => {
    if (!status) return "Submitted";

    return status
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const searchableText = [
        claim.claimId,
        claim.claimant,
        claim.policyNumber,
        claim.claimType,
        claim.location,
        claim.email,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        search.toLowerCase().trim()
      );

      const normalizedStatus = normalizeStatus(claim.status);

      const matchesFilter =
        filter === "All" ||
        (filter === "Pending" &&
          ["pending", "submitted"].includes(normalizedStatus)) ||
        (filter === "Under Review" &&
          ["under review", "in review", "investigating"].includes(
            normalizedStatus
          )) ||
        (filter === "Completed" &&
          ["completed", "approved"].includes(normalizedStatus));

      return matchesSearch && matchesFilter;
    });
  }, [claims, search, filter]);

  const pendingCount = claims.filter((claim) =>
    ["pending", "submitted"].includes(normalizeStatus(claim.status))
  ).length;

  const reviewCount = claims.filter((claim) =>
    ["under review", "in review", "investigating"].includes(
      normalizeStatus(claim.status)
    )
  ).length;

  const completedCount = claims.filter((claim) =>
    ["completed", "approved"].includes(normalizeStatus(claim.status))
  ).length;

  return (
    <div className="history-page">
      <header className="history-topbar">
        <button className="history-back" onClick={onBack}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="history-brand">
          <ShieldCheck size={21} />
          NexusClaim
        </div>
      </header>

      <main className="history-container">
        <motion.div
          className="history-heading"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <span className="history-eyebrow">
              INVESTIGATION MANAGEMENT
            </span>

            <h1>Investigation History</h1>

            <p>
              Track, search and review insurance investigation
              records retrieved from the backend.
            </p>
          </div>

          <div className="history-total">
            <FileText size={20} />

            <div>
              <strong>{claims.length}</strong>
              <span>Total Claims</span>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="disclaimer-box">
            <AlertCircle size={18} />
            <p>{error}</p>

            <button
              onClick={loadClaims}
              style={{
                marginLeft: "auto",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={17} />
            </button>
          </div>
        )}

        <section className="history-stats">
          <div className="history-stat">
            <div className="history-stat-icon blue">
              <FileText size={20} />
            </div>

            <div>
              <span>Total Investigations</span>
              <h2>{claims.length}</h2>
            </div>
          </div>

          <div className="history-stat">
            <div className="history-stat-icon orange">
              <Clock size={20} />
            </div>

            <div>
              <span>Under Review</span>
              <h2>{reviewCount}</h2>
            </div>
          </div>

          <div className="history-stat">
            <div className="history-stat-icon purple">
              <AlertCircle size={20} />
            </div>

            <div>
              <span>Pending</span>
              <h2>{pendingCount}</h2>
            </div>
          </div>

          <div className="history-stat">
            <div className="history-stat-icon green">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>Completed</span>
              <h2>{completedCount}</h2>
            </div>
          </div>
        </section>

        <section className="history-table-panel">
          <div className="history-table-heading">
            <div>
              <h3>All Investigations</h3>
              <p>
                Review claim records retrieved from the NexusClaim database.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="records-count">
                {filteredClaims.length} Records
              </span>

              <button
                onClick={loadClaims}
                disabled={loading}
                title="Refresh claims"
                style={{
                  border: "1px solid #dbe2ea",
                  background: "#ffffff",
                  borderRadius: 8,
                  padding: 9,
                  cursor: "pointer",
                }}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "spin-icon" : ""}
                />
              </button>
            </div>
          </div>

          <div className="history-controls">
            <div className="history-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search by claimant, claim ID or policy..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="history-filter">
              <Filter size={16} />

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="history-table-wrapper">
            {loading ? (
              <div className="history-empty">
                <RefreshCw size={28} className="spin-icon" />
                <h3>Loading investigation records</h3>
                <p>Retrieving claims from the backend...</p>
              </div>
            ) : (
              <>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>CLAIM ID</th>
                      <th>CLAIMANT</th>
                      <th>CLAIM TYPE</th>
                      <th>INCIDENT DATE</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClaims.map((claim, index) => (
                      <motion.tr
                        key={claim.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <td>
                          <strong className="claim-id">
                            {claim.claimId}
                          </strong>
                        </td>

                        <td>
                          <div className="history-claimant">
                            <div className="claimant-avatar">
                              {claim.claimant?.charAt(0) || "C"}
                            </div>

                            <span>{claim.claimant || "Unknown"}</span>
                          </div>
                        </td>

                        <td>{claim.claimType || "Not specified"}</td>

                        <td>
                          <span className="history-date">
                            <CalendarDays size={14} />
                            {formatDate(claim.incidentDate)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`history-status ${getStatusClass(
                              claim.status
                            )}`}
                          >
                            {getDisplayStatus(claim.status)}
                          </span>
                        </td>

                        <td>
                          <button
                            className="view-claim-btn"
                            onClick={() => setSelectedClaim(claim)}
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {filteredClaims.length === 0 && (
                  <div className="history-empty">
                    <Search size={30} />

                    <h3>
                      {claims.length === 0
                        ? "No investigations available"
                        : "No investigations found"}
                    </h3>

                    <p>
                      {claims.length === 0
                        ? "Claims submitted through the customer portal will appear here."
                        : "Try changing your search or status filter."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {selectedClaim && (
        <div
          className="history-modal-overlay"
          onClick={() => setSelectedClaim(null)}
        >
          <div
            className="history-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-modal-heading">
              <div>
                <span>INVESTIGATION DETAILS</span>
                <h2>{selectedClaim.claimId}</h2>
              </div>

              <button onClick={() => setSelectedClaim(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="history-modal-content">
              <div>
                <span>Claimant Name</span>
                <strong>{selectedClaim.claimant || "Not available"}</strong>
              </div>

              <div>
                <span>Email Address</span>
                <strong>{selectedClaim.email || "Not available"}</strong>
              </div>

              <div>
                <span>Phone Number</span>
                <strong>{selectedClaim.phone || "Not available"}</strong>
              </div>

              <div>
                <span>Policy Number</span>
                <strong>
                  {selectedClaim.policyNumber || "Not available"}
                </strong>
              </div>

              <div>
                <span>Claim Type</span>
                <strong>
                  {selectedClaim.claimType || "Not specified"}
                </strong>
              </div>

              <div>
                <span>Incident Date</span>
                <strong>{formatDate(selectedClaim.incidentDate)}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{selectedClaim.location || "Not specified"}</strong>
              </div>

              <div>
                <span>Claim Amount</span>
                <strong>
                  ₹{selectedClaim.amount.toLocaleString("en-IN")}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{getDisplayStatus(selectedClaim.status)}</strong>
              </div>

              <div>
                <span>Risk Indicator</span>
                <strong>{selectedClaim.riskLevel}</strong>
              </div>

              <div className="modal-description">
                <span>Incident Description</span>

                <p>
                  {selectedClaim.description || "No description available."}
                </p>
              </div>
            </div>

            <button
              className="modal-close-btn"
              onClick={() => setSelectedClaim(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}