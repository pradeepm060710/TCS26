import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Users,
  Search,
  Mail,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { apiRequest } from "./api";
import "./team-settings.css";

interface TeamMember {
  id: number;
  full_name?: string | null;
  email: string;
  role: string;
}

interface Props {
  onBack: () => void;
}

const TeamMembers = ({ onBack }: Props) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/admin/users");

      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load team members."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((member) =>
    `${member.full_name || ""} ${member.email} ${member.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const getDisplayName = (member: TeamMember) =>
    member.full_name?.trim() || member.email.split("@")[0];

  const getInitials = (name: string) =>
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const investigators = members.filter(
    (member) => member.role.toLowerCase() === "investigator"
  );

  const administrators = members.filter(
    (member) => member.role.toLowerCase() === "admin"
  );

  return (
    <div className="management-page">
      <button className="management-back" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to Dashboard
      </button>

      <div className="management-header">
        <div>
          <span className="management-eyebrow">
            WORKSPACE MANAGEMENT
          </span>

          <h1>Team Members</h1>

          <p>
            View registered investigators and administrators.
          </p>
        </div>

        <button
          className="management-primary"
          onClick={loadMembers}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh Team
        </button>
      </div>

      <div className="management-stats">
        <div>
          <Users />
          <h2>{members.length}</h2>
          <span>Total Users</span>
        </div>

        <div>
          <ShieldCheck />
          <h2>{investigators.length}</h2>
          <span>Investigators</span>
        </div>

        <div>
          <ShieldCheck />
          <h2>{administrators.length}</h2>
          <span>Administrators</span>
        </div>
      </div>

      <div className="management-panel">
        <div className="management-panel-heading">
          <div>
            <h2>Investigation Team</h2>
            <p>Registered team directory</p>
          </div>

          <div className="management-search">
            <Search size={17} />

            <input
              placeholder="Search members..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="evidence-security-note">
            <AlertCircle size={21} />

            <div>
              <h4>Unable to Load Team</h4>

              <p>
                {error}
                {" "}
                This endpoint is currently restricted to administrators.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="management-empty">
            <RefreshCw size={25} />
            <p>Loading team members...</p>
          </div>
        ) : error ? (
          <div className="management-empty">
            <Users size={35} />
            <p>Team information is currently unavailable.</p>

            <button
              className="management-primary"
              onClick={loadMembers}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : (
          <div className="team-grid">
            {filteredMembers.map((member) => {
              const name = getDisplayName(member);

              return (
                <div className="team-member-card" key={member.id}>
                  <div className="team-member-top">
                    <div className="team-member-avatar">
                      {getInitials(name)}
                    </div>

                    <span className="team-status available">
                      Registered
                    </span>
                  </div>

                  <h3>{name}</h3>

                  <span className="team-role">
                    {member.role === "admin"
                      ? "Administrator"
                      : member.role === "investigator"
                        ? "Investigator"
                        : "Customer"}
                  </span>

                  <div className="team-email">
                    <Mail size={15} />
                    {member.email}
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <p className="management-empty">
                No team members found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMembers;