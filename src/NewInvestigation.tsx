import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FilePlus2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Car,
  HeartPulse,
  Home,
  BriefcaseBusiness,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

import "./investigation.css";

interface NewInvestigationProps {
  onBack: () => void;
}

function NewInvestigation({ onBack }: NewInvestigationProps) {
  const [claimType, setClaimType] = useState("Vehicle Accident");

  const [form, setForm] = useState({
    claimant: "",
    email: "",
    phone: "",
    claimId: "",
    policyNumber: "",
    incidentDate: "",
    location: "",
    description: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const savedClaims = JSON.parse(
      localStorage.getItem("NexusClaimClaims") || "[]"
    );

    const newClaim = {
      ...form,
      claimType,
      id: `CLM-${Date.now()}`,
      status: "New Investigation",
      createdAt: new Date().toLocaleDateString(),
    };

    localStorage.setItem(
      "NexusClaimClaims",
      JSON.stringify([...savedClaims, newClaim])
    );

    alert("New claim investigation created successfully!");

    onBack();
  };

  return (
    <div className="investigation-page">

      <header className="investigation-topbar">
        <div className="investigation-brand">
          <div className="investigation-logo">N</div>
          <div>
            <h2>NexusClaim</h2>
            <span>CLAIMS INTELLIGENCE</span>
          </div>
        </div>

        <div className="investigation-user">
          <ShieldCheck size={17} />
          <span>INVESTIGATOR WORKSPACE</span>
        </div>
      </header>

      <main className="investigation-container">

        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>

        <motion.div
          className="investigation-heading"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="heading-icon">
            <FilePlus2 size={25} />
          </div>

          <div>
            <div className="heading-label">INVESTIGATION MANAGEMENT</div>
            <h1>Create New Investigation</h1>
            <p>
              Register a claim to begin the intelligent investigation process.
            </p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>

          <section className="investigation-card">
            <div className="section-heading">
              <div className="section-number">01</div>
              <div>
                <h3>Claimant Information</h3>
                <p>Enter the basic details of the claimant.</p>
              </div>
            </div>

            <div className="investigation-form-grid">

              <div className="field-group">
                <label>CLAIMANT FULL NAME *</label>
                <div className="field-input">
                  <User size={17} />
                  <input
                    required
                    placeholder="Enter claimant name"
                    value={form.claimant}
                    onChange={(e) => updateField("claimant", e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label>EMAIL ADDRESS *</label>
                <div className="field-input">
                  <Mail size={17} />
                  <input
                    type="email"
                    required
                    placeholder="claimant@email.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label>PHONE NUMBER *</label>
                <div className="field-input">
                  <Phone size={17} />
                  <input
                    type="tel"
                    required
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label>POLICY NUMBER *</label>
                <div className="field-input">
                  <ShieldCheck size={17} />
                  <input
                    required
                    placeholder="Enter policy number"
                    value={form.policyNumber}
                    onChange={(e) => updateField("policyNumber", e.target.value)}
                  />
                </div>
              </div>

            </div>
          </section>

          <section className="investigation-card">
            <div className="section-heading">
              <div className="section-number">02</div>
              <div>
                <h3>Claim Details</h3>
                <p>Specify the insurance claim category and incident details.</p>
              </div>
            </div>

            <label className="category-label">CLAIM CATEGORY *</label>

            <div className="claim-type-grid">

              {[
                { name: "Vehicle Accident", icon: Car },
                { name: "Health Insurance", icon: HeartPulse },
                { name: "Property Damage", icon: Home },
                { name: "Business Insurance", icon: BriefcaseBusiness },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    type="button"
                    key={item.name}
                    className={`claim-type-option ${
                      claimType === item.name ? "selected" : ""
                    }`}
                    onClick={() => setClaimType(item.name)}
                  >
                    <Icon size={22} />
                    <span>{item.name}</span>
                  </button>
                );
              })}

            </div>

            <div className="investigation-form-grid">

              <div className="field-group">
                <label>CLAIM REFERENCE ID</label>
                <div className="field-input">
                  <ClipboardList size={17} />
                  <input
                    placeholder="Enter existing claim ID (optional)"
                    value={form.claimId}
                    onChange={(e) => updateField("claimId", e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label>INCIDENT DATE *</label>
                <div className="field-input">
                  <Calendar size={17} />
                  <input
                    type="date"
                    required
                    value={form.incidentDate}
                    onChange={(e) => updateField("incidentDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group full-width">
                <label>INCIDENT LOCATION *</label>
                <div className="field-input">
                  <MapPin size={17} />
                  <input
                    required
                    placeholder="Enter incident location"
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group full-width">
                <label>INCIDENT DESCRIPTION *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe the incident, circumstances and reported damages..."
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>

            </div>
          </section>

          <div className="investigation-notice">
            <ShieldCheck size={20} />
            <div>
              <h4>Investigation Integrity</h4>
              <p>
                Submitted information will be used as input for further
                investigation. AI-generated findings will support human
                review and will not independently determine claim validity.
              </p>
            </div>
          </div>

          <div className="investigation-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onBack}
            >
              Cancel
            </button>

            <button type="submit" className="create-button">
              Create Investigation
              <ArrowRight size={18} />
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}

export default NewInvestigation;