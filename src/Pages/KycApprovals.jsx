import { useEffect, useMemo, useState } from "react";
import {
  documentCompletionOptions,
  initialKycSubmissions,
  kycSummaryCards,
  statusOptions,
} from "../data/kyc/kycData";
import { kycDocumentDefinitions } from "../data/kyc/kycDocuments";
import "./KycApprovals.css";

function Icon({ name, size = 20 }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
    document: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></>,
    check: <path d="m4 12 5 5L20 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    phone: <path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-4-2-2 2c-3.5-1.5-6-4-7.5-7.5l2-2z" />,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V4h6v3M3 12h18" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 20h14" /></>,
  };

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const getDocumentCount = (submission) =>
    Object.values(submission.documents || {}).filter((document) => document.submitted).length;

function StatusBadge({ status }) {
  return <span className={`kyc-status kyc-status-${(status || "pending").toLowerCase()}`}>{status}</span>;
}

function KycSummaryCards({ submissions, onOpenStatus }) {
  return (
      <section className="kyc-summary" aria-label="KYC summary">
        {kycSummaryCards.map((item) => {
          const value = submissions.filter((submission) => submission.status === item.status).length;
          return (
              <button
                  className={`kyc-summary-card kyc-summary-${item.tone} is-interactive`}
                  key={item.id}
                  type="button"
                  onClick={() => onOpenStatus(item.status)}
                  aria-label={`View ${value} ${item.status.toLowerCase()} KYC submissions`}
              >
                <span className="kyc-summary-icon"><Icon name={item.icon} size={31} /></span>
                <div>
                  <span>{item.label}</span>
                  <strong>{value}</strong>
                  <b>{value} {item.trendLabel}</b>
                  <small>{item.detail}</small>
                </div>
              </button>
          );
        })}
      </section>
  );
}

function KycFilters({ search, status, completion, onSearch, onStatus, onCompletion, onClear }) {
  return (
      <section className="kyc-filters" aria-label="Filter KYC submissions">
        <label className="kyc-filter-field kyc-search-field">
          <span>Search</span>
          <span className="kyc-search-control">
          <Icon name="search" size={18} />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search by partner name, email, or KYC ID..." type="search" />
        </span>
        </label>
        <label className="kyc-filter-field">
          <span>Status</span>
          <select value={status} onChange={(event) => onStatus(event.target.value)}>
            <option value="all">All Statuses</option>
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="kyc-filter-field">
          <span>Document Completeness</span>
          <select value={completion} onChange={(event) => onCompletion(event.target.value)}>
            {documentCompletionOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button className="kyc-clear" type="button" onClick={onClear}>Clear Filters</button>
      </section>
  );
}

function KycTable({ submissions, selectedId, onReview }) {
  return (
      <section className="kyc-table-card">
        <div className="kyc-table-heading">
          <h2>Partners ({submissions.length})</h2>
          <label className="kyc-sort">Sort by:<select aria-label="Sort submissions" defaultValue="newest"><option value="newest">Newest</option><option value="oldest">Oldest</option></select></label>
        </div>
        {submissions.length === 0 ? (
            <div className="kyc-empty"><span>⌕</span><strong>No KYC submissions found</strong><p>Try changing your search or clearing the filters.</p></div>
        ) : (
            <div className="kyc-table-scroll">
              <table className="kyc-table">
                <thead><tr><th>S.No.</th><th>Partner</th><th>KYC ID</th><th>Submitted</th><th>Documents</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                {submissions.map((submission, index) => {
                  const documentCount = getDocumentCount(submission);
                  return (
                      <tr className={selectedId === submission.id ? "is-selected" : ""} key={submission.id}>
                        <td>{index + 1}</td>
                        <td><div className="kyc-partner-cell"><span className="kyc-partner-thumb" style={{ "--partner-color": submission.color || "#1775f4" }}>{submission.initials}</span><span><strong>{submission.partnerName}</strong><small>{submission.email}</small></span></div></td>
                        <td>{submission.id}</td>
                        <td>{submission.submittedDate}</td>
                        <td><div className={`kyc-document-count count-${documentCount}`}><span>{documentCount}/4</span><span className="kyc-progress"><span style={{ width: `${documentCount * 25}%` }} /></span></div></td>
                        <td><StatusBadge status={submission.status} /></td>
                        <td><button className="kyc-review-button" type="button" onClick={() => onReview(submission)}>{submission.status === "Rejected" ? "Preview" : "Review"}</button></td>
                      </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
        )}
      </section>
  );
}

function DocumentPreview({ document, partner }) {
  if (!document?.submitted) {
    return <div className="kyc-preview-empty"><span>⊘</span><strong>Document not submitted</strong><p>{partner.partnerName} has not submitted this document.</p></div>;
  }

  return (
      <div className="kyc-document-preview">
        <div className="kyc-preview-toolbar"><span><b>PDF</b>{document.fileName}</span><a href={document.fileUrl} download aria-label={`Download ${document.label}`}><Icon name="download" size={17} /></a></div>
        <a className="kyc-pdf-preview" href={document.fileUrl} target="_blank" rel="noreferrer" aria-label={`Open ${document.label} PDF`}>
          <img src={document.previewUrl} alt={`${partner.partnerName} ${document.label} PDF preview`} />
        </a>
      </div>
  );
}

function StatusSubmissionsPanel({ status, submissions, onClose, onReview }) {
  const statusKey = status.toLowerCase();
  const descriptions = {
    Submitted: "Review completed submissions and move them to the appropriate next state.",
    Pending: "Review applications that are currently awaiting an admin decision.",
    Rejected: "Review declined applications and approve them when the required corrections are complete.",
  };

  return (
      <div className="kyc-metric-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <section className={`kyc-metric-panel metric-panel-${statusKey}`} role="dialog" aria-modal="true" aria-labelledby="metric-submissions-title">
          <header className="kyc-metric-header">
            <div><span>{status} KYC</span><h2 id="metric-submissions-title">{status} Submissions ({submissions.length})</h2><p>{descriptions[status]}</p></div>
            <button type="button" onClick={onClose} aria-label={`Close ${statusKey} submissions`}>×</button>
          </header>
          {submissions.length === 0 ? (
              <div className="kyc-metric-empty"><span>✓</span><strong>No {statusKey} submissions</strong><p>{status} KYC applications will appear here when available.</p></div>
          ) : (
              <div className="kyc-metric-table-scroll">
                <table className={`kyc-metric-table${status === "Rejected" ? " has-reason" : ""}`}>
                  <thead><tr><th>S.No.</th><th>Partner Name</th><th>KYC ID</th>{status === "Rejected" && <th>Rejection Reason</th>}<th>Submitted</th><th>Documents</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{submissions.map((submission, index) => {
                    const documentCount = getDocumentCount(submission);
                    return (
                        <tr key={submission.id}>
                          <td>{index + 1}</td>
                          <td><div className="kyc-partner-cell"><span className="kyc-partner-thumb" style={{ "--partner-color": submission.color || "#1775f4" }}>{submission.initials}</span><span><strong>{submission.partnerName}</strong><small>{submission.email}</small></span></div></td>
                          <td>{submission.id}</td>
                          {status === "Rejected" && <td><span className="kyc-reason-cell">{submission.rejectionReason || "No reason recorded"}</span></td>}
                          <td>{submission.submittedDate}</td>
                          <td>{documentCount}/4</td>
                          <td><StatusBadge status={submission.status} /></td>
                          <td><button className={`kyc-review-button metric-review-button${status === "Rejected" ? " is-rejected" : ""}`} type="button" onClick={() => onReview(submission)}>{status === "Rejected" ? "Review & Approve" : "Review"}</button></td>
                        </tr>
                    );
                  })}</tbody>
                </table>
              </div>
          )}
        </section>
      </div>
  );
}

function KycReviewPanel({ submission, onClose, onApprove, onMarkPending, onReject }) {
  const firstSubmitted = kycDocumentDefinitions.find((item) => submission.documents?.[item.key]?.submitted)?.key ?? "panCard";
  const [selectedDocument, setSelectedDocument] = useState(firstSubmitted);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const documentCount = getDocumentCount(submission);

  const confirmReject = () => {
    if (!rejectionReason.trim()) return;
    onReject(submission.id, rejectionReason.trim());
    setIsRejecting(false);
  };

  return (
      <aside className="kyc-review-panel" aria-label={`Review ${submission.id}`}>
        <header className="kyc-review-header"><h2>{submission.id}</h2><button type="button" onClick={onClose} aria-label="Close review">×</button></header>
        <section className="kyc-applicant">
          <span className="kyc-applicant-photo" style={{ "--partner-color": submission.color || "#1775f4" }}>{submission.initials}</span>
          <div className="kyc-applicant-details">
            <div className="kyc-applicant-title"><h3>{submission.partnerName}</h3><StatusBadge status={submission.status} /></div>
            <div className="kyc-applicant-meta"><span><Icon name="mail" size={15} />{submission.email}</span><span><Icon name="phone" size={15} />{submission.phone}</span><span><Icon name="location" size={15} />{submission.location}</span><span><Icon name="briefcase" size={15} />{submission.partnerType}</span><span><Icon name="calendar" size={15} />Submitted on {submission.submittedDate}</span></div>
          </div>
        </section>
        {submission.status === "Rejected" && (
            <section className="kyc-current-rejection" aria-label="Rejection reason">
              <strong>Rejection Reason</strong>
              <p>{submission.rejectionReason || "No rejection reason was recorded."}</p>
            </section>
        )}
        <div className="kyc-review-tab">Documents</div>
        <section className="kyc-review-documents">
          <div className="kyc-document-list"><h3>Submitted Documents ({documentCount}/4)</h3>{kycDocumentDefinitions.map((definition) => {
            const document = submission.documents?.[definition.key] || { submitted: false };
            return <button type="button" className={`${selectedDocument === definition.key ? "is-active" : ""}${document.submitted ? "" : " is-missing"}`} onClick={() => setSelectedDocument(definition.key)} key={definition.key}><span className="kyc-document-state">{document.submitted ? "✓" : "○"}</span><span><strong>{definition.label}</strong><small>{document.submitted ? "Submitted" : "Not Submitted"}</small></span><Icon name="document" size={18} /></button>;
          })}</div>
          <div className="kyc-preview-column"><h3>Document Preview</h3><DocumentPreview document={submission.documents?.[selectedDocument]} partner={submission} /></div>
        </section>
        {isRejecting && <section className="kyc-reject-box"><label htmlFor="kyc-reason">Reason for rejection</label><textarea id="kyc-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain what the partner needs to correct..." autoFocus /><div><button type="button" onClick={() => setIsRejecting(false)}>Cancel</button><button type="button" className="danger" disabled={!rejectionReason.trim()} onClick={confirmReject}>Confirm rejection</button></div></section>}
        <footer className={`kyc-review-actions review-actions-${submission.status.toLowerCase()}`}><button type="button" onClick={onClose}>Cancel</button>{submission.status === "Submitted" && <button type="button" className="pending" onClick={() => onMarkPending(submission.id)}>Mark Pending</button>}{submission.status !== "Rejected" && <button type="button" className="reject" onClick={() => setIsRejecting(true)}>Reject</button>}{submission.status !== "Submitted" && <button type="button" className="approve" onClick={() => onApprove(submission.id)}>Approve</button>}</footer>
      </aside>
  );
}

function KycApprovals() {
  const [submissions, setSubmissions] = useState(initialKycSubmissions);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [completion, setCompletion] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [activeMetricStatus, setActiveMetricStatus] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/kyc-requests")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch KYC submissions");
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSubmissions(data);
          }
        })
        .catch((err) => {
          console.warn("Backend offline for KYC, using default local data:", err);
        });
  }, []);

  const filteredSubmissions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const completionRule = documentCompletionOptions.find((option) => option.value === completion);
    return submissions.filter((submission) => {
      const matchesSearch = !term || [submission.id, submission.partnerName, submission.email].some((value) => value.toLowerCase().includes(term));
      const matchesStatus = status === "all" || submission.status === status;
      const matchesDocuments = completionRule?.count == null || getDocumentCount(submission) === completionRule.count;
      return matchesSearch && matchesStatus && matchesDocuments;
    });
  }, [completion, search, status, submissions]);

  const selectedSubmission = submissions.find((submission) => submission.id === selectedId);
  const metricSubmissions = activeMetricStatus ? submissions.filter((submission) => submission.status === activeMetricStatus) : [];

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const clearFilters = () => { setSearch(""); setStatus("all"); setCompletion("all"); };
  const updateSubmission = (id, updates, message) => {
    setSubmissions((current) => current.map((submission) => submission.id === id ? { ...submission, ...updates } : submission));
    setToast(message);
  };

  return (
      <main className={`kyc-content${selectedSubmission ? " has-review" : ""}`}>
        <div className="kyc-main-column">
          <div className="kyc-breadcrumb"><span>Admin</span><b>/</b><strong>KYC Approvals</strong></div>
          <header className="kyc-page-header"><h1>KYC Approvals</h1><p>Review partner verification submissions and ensure a safe and trusted travel ecosystem.</p></header>
          <KycSummaryCards submissions={submissions} onOpenStatus={setActiveMetricStatus} />
          <KycFilters search={search} status={status} completion={completion} onSearch={setSearch} onStatus={setStatus} onCompletion={setCompletion} onClear={clearFilters} />
          <KycTable submissions={filteredSubmissions} selectedId={selectedId} onReview={(submission) => setSelectedId(submission.id)} />
        </div>
        {activeMetricStatus && <StatusSubmissionsPanel status={activeMetricStatus} submissions={metricSubmissions} onClose={() => setActiveMetricStatus(null)} onReview={(submission) => { setActiveMetricStatus(null); setSelectedId(submission.id); }} />}
        {selectedSubmission && <KycReviewPanel key={selectedSubmission.id} submission={selectedSubmission} onClose={() => setSelectedId(null)} onApprove={(id) => updateSubmission(id, { status: "Submitted", rejectionReason: "" }, `${selectedSubmission.partnerName} has been approved.`)} onMarkPending={(id) => updateSubmission(id, { status: "Pending", rejectionReason: "" }, `${selectedSubmission.partnerName} was moved to pending review.`)} onReject={(id, reason) => updateSubmission(id, { status: "Rejected", rejectionReason: reason }, `${selectedSubmission.partnerName} was rejected: ${reason}`)} />}
        {toast && <div className="kyc-toast" role="status"><span>✓</span>{toast}</div>}
      </main>
  );
}

export default KycApprovals;