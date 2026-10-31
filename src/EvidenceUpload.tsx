import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Image,
  File,
  Trash2,
  ShieldCheck,
  X,
  CheckCircle,
  FolderOpen,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { apiRequest } from "./api";
import "./evidence.css";

interface EvidenceUploadProps {
  onBack: () => void;
}

interface Claim {
  id: number;
  claim_number: string;
  claimant: string;
  claim_type: string;
  status: string;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
];

const EvidenceUpload = ({ onBack }: EvidenceUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<number | "">("");

  const [dragging, setDragging] = useState(false);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoadingClaims(true);
    setError("");

    try {
      const data = await apiRequest("/claims");
      const claimList: Claim[] = Array.isArray(data) ? data : [];

      setClaims(claimList);

      if (claimList.length > 0) {
        setSelectedClaimId(claimList[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your claims."
      );
    } finally {
      setLoadingClaims(false);
    }
  };

  const validateFiles = (selectedFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    selectedFiles.forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        errors.push(`${file.name}: Unsupported file format.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File exceeds the 20 MB limit.`);
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  };

  const addFiles = (selectedFiles: File[]) => {
    setError("");
    setSuccessMessage("");
    setSaved(false);

    const { validFiles, errors } = validateFiles(selectedFiles);

    setFiles((previous) => {
      const remainingSlots = MAX_FILES - previous.length;

      if (remainingSlots <= 0) {
        setError(`You can upload a maximum of ${MAX_FILES} files.`);
        return previous;
      }

      const filesToAdd = validFiles.slice(0, remainingSlots);

      if (validFiles.length > remainingSlots) {
        errors.push(
          `Only ${remainingSlots} additional file(s) can be selected.`
        );
      }

      if (filesToAdd.length === 0 && errors.length === 0) {
        return previous;
      }

      return [...previous, ...filesToAdd];
    });

    if (errors.length > 0) {
      setError(errors.join(" "));
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    addFiles(selectedFiles);

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files);

    addFiles(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles((previous) =>
      previous.filter((_, currentIndex) => currentIndex !== index)
    );

    setSaved(false);
    setSuccessMessage("");
    setError("");
  };

  const clearAll = () => {
    setFiles([]);
    setSaved(false);
    setSuccessMessage("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (selectedClaimId === "") {
      setError("Please select a claim before uploading evidence.");
      return;
    }

    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    if (files.length > MAX_FILES) {
      setError(`A maximum of ${MAX_FILES} files can be uploaded.`);
      return;
    }

    setUploading(true);
    setError("");
    setSuccessMessage("");
    setSaved(false);

    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      await apiRequest(
        `/claims/${selectedClaimId}/evidence`,
        {
          method: "POST",
          body: formData,
        }
      );

      setSaved(true);
      setSuccessMessage(
        `${files.length} evidence file(s) uploaded successfully.`
      );

      setFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Evidence upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image size={21} />;
    }

    if (file.type === "application/pdf") {
      return <FileText size={21} />;
    }

    return <File size={21} />;
  };

  const selectedClaim = claims.find(
    (claim) => claim.id === selectedClaimId
  );

  return (
    <div className="evidence-page">
      <header className="evidence-header">
        <button className="evidence-back" onClick={onBack}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="evidence-brand">
          <div className="evidence-brand-icon">N</div>
          <span>NexusClaim</span>
        </div>
      </header>

      <main className="evidence-container">
        <section className="evidence-heading">
          <div>
            <span className="evidence-eyebrow">
              INVESTIGATION WORKSPACE
            </span>

            <h1>Evidence Library</h1>

            <p>
              Upload, organize and manage supporting documents
              for your insurance claims.
            </p>
          </div>

          <div className="evidence-security">
            <ShieldCheck size={20} />
            <span>Evidence Management</span>
          </div>
        </section>

        {error && (
          <div className="evidence-security-note">
            <AlertCircle size={21} />
            <div>
              <h4>Attention Required</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="evidence-security-note">
            <CheckCircle size={21} />
            <div>
              <h4>Upload Successful</h4>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        <section className="evidence-card">
          <div className="evidence-card-heading">
            <div>
              <h2>Select Claim</h2>
              <p>
                Choose the claim associated with these evidence files.
              </p>
            </div>

            <div className="evidence-folder-icon">
              <FolderOpen size={23} />
            </div>
          </div>

          {loadingClaims ? (
            <p>Loading your claims...</p>
          ) : claims.length === 0 ? (
            <div className="evidence-empty">
              <FolderOpen size={38} />
              <h3>No claims available</h3>
              <p>
                Submit a claim through the customer dashboard
                before uploading evidence.
              </p>

              <button
                className="evidence-browse-button"
                onClick={loadClaims}
              >
                <RefreshCw size={16} />
                Refresh Claims
              </button>
            </div>
          ) : (
            <>
              <select
                value={selectedClaimId}
                onChange={(event) => {
                  setSelectedClaimId(Number(event.target.value));
                  setFiles([]);
                  setSaved(false);
                  setError("");
                  setSuccessMessage("");
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #dbe2ea",
                  background: "#ffffff",
                  fontSize: "14px",
                  marginTop: "15px",
                }}
              >
                {claims.map((claim) => (
                  <option key={claim.id} value={claim.id}>
                    {claim.claim_number} — {claim.claimant} (
                    {claim.claim_type})
                  </option>
                ))}
              </select>

              {selectedClaim && (
                <p style={{ marginTop: "12px", fontSize: "13px" }}>
                  Selected claim: <strong>{selectedClaim.claim_number}</strong>
                  {" · "}
                  Status: <strong>{selectedClaim.status}</strong>
                </p>
              )}
            </>
          )}
        </section>

        <section className="evidence-card">
          <div className="evidence-card-heading">
            <div>
              <h2>Upload Investigation Evidence</h2>
              <p>
                Add documents, photographs and other supporting files.
              </p>
            </div>

            <div className="evidence-folder-icon">
              <FolderOpen size={23} />
            </div>
          </div>

          <div
            className={`evidence-dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="evidence-upload-icon">
              <UploadCloud size={34} />
            </div>

            <h3>Drag and drop your files here</h3>

            <p>or select files from your computer</p>

            <button
              className="evidence-browse-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedClaim || uploading}
            >
              Browse Files
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              hidden
            />

            <span className="evidence-file-hint">
              PDF, JPG, JPEG, PNG, DOC and DOCX · Maximum 20 MB per file
            </span>

            <span className="evidence-file-hint">
              Maximum {MAX_FILES} files per upload
            </span>
          </div>

          <div className="evidence-supported">
            <div>
              <FileText size={19} />
              <span>PDF Documents</span>
            </div>

            <div>
              <Image size={19} />
              <span>Accident Images</span>
            </div>

            <div>
              <File size={19} />
              <span>Other Documents</span>
            </div>
          </div>
        </section>

        <section className="evidence-card evidence-files-card">
          <div className="evidence-card-heading">
            <div>
              <h2>Selected Evidence</h2>
              <p>
                Review the files selected for this investigation.
              </p>
            </div>

            <span className="evidence-count">
              {files.length} / {MAX_FILES} Files
            </span>
          </div>

          {files.length === 0 ? (
            <div className="evidence-empty">
              <FolderOpen size={38} />

              <h3>No files selected</h3>

              <p>
                Your selected documents and images will appear here.
              </p>
            </div>
          ) : (
            <div className="evidence-file-list">
              {files.map((file, index) => (
                <div
                  className="evidence-file-item"
                  key={`${file.name}-${index}`}
                >
                  <div className="evidence-file-icon">
                    {getFileIcon(file)}
                  </div>

                  <div className="evidence-file-info">
                    <h4>{file.name}</h4>
                    <span>{formatSize(file.size)}</span>
                  </div>

                  <span className="evidence-file-status">
                    Selected
                  </span>

                  <button
                    className="evidence-remove-button"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="evidence-actions">
            {saved && (
              <div className="evidence-success">
                <CheckCircle size={17} />
                Evidence uploaded successfully.
              </div>
            )}

            <button
              className="evidence-clear-button"
              onClick={clearAll}
              disabled={files.length === 0 || uploading}
            >
              <X size={17} />
              Clear All
            </button>

            <button
              className="evidence-save-button"
              onClick={handleSave}
              disabled={
                files.length === 0 ||
                uploading ||
                !selectedClaim ||
                loadingClaims
              }
            >
              {uploading ? (
                <>
                  <RefreshCw size={18} className="spin-icon" />
                  Uploading...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Upload Evidence
                </>
              )}
            </button>
          </div>
        </section>

        <div className="evidence-security-note">
          <ShieldCheck size={21} />

          <div>
            <h4>Evidence Integrity Notice</h4>

            <p>
              Evidence files are uploaded to the NexusClaim backend
              and associated with the selected claim. Authorized
              investigators can review the uploaded files. AI-generated
              findings are intended to support human review, not replace
              final investigation decisions.
            </p>
          </div>
        </div>
      </main>

      <footer className="evidence-footer">
        © 2026 NexusClaim INTELLIGENCE
        <span>Intelligence Beyond Every Claim.</span>
      </footer>
    </div>
  );
};

export default EvidenceUpload;