import { useState, useEffect, useCallback } from "react";

// ── API helpers ───────────────────────────────────────────────────────────────
const API = "/api";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ── Utility ───────────────────────────────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMeetingStatus(startTime) {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const diff = start - now;
  if (diff < 0) return { label: "Past", color: "#6b7280" };
  if (diff < 3600000) return { label: "Soon", color: "#f59e0b" };
  return { label: "Upcoming", color: "#10b981" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 1000,
      background: type === "error" ? "#ef4444" : "#10b981",
      color: "#fff", padding: "12px 20px", borderRadius: 10,
      fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
      boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      animation: "slideIn 0.3s ease",
      display: "flex", alignItems: "center", gap: 10, maxWidth: 360,
    }}>
      <span>{type === "error" ? "✕" : "✓"}</span>
      <span>{message}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff", borderRadius: "50%",
      animation: "spin 0.7s linear infinite", display: "inline-block",
    }} />
  );
}

function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "64px 24px", gap: 16,
      color: "#9ca3af",
    }}>
      <div style={{ fontSize: 56, lineHeight: 1 }}>📅</div>
      <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 600, color: "#d1d5db", margin: 0 }}>
        No meetings scheduled
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, margin: 0, textAlign: "center" }}>
        Create your first meeting using the form on the right
      </p>
    </div>
  );
}

function MeetingCard({ meeting, onDelete, deleting }) {
  const status = getMeetingStatus(meeting.start_time);

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 10,
      transition: "border-color 0.2s, background 0.2s",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
    >
      {/* Accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: status.color, borderRadius: "14px 0 0 14px",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingLeft: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0, fontFamily: "'Syne', sans-serif",
            fontSize: 16, fontWeight: 700, color: "#f9fafb",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {meeting.topic || "Untitled Meeting"}
          </h3>
          <p style={{
            margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, color: "#9ca3af",
          }}>
            ID: {meeting.id}
          </p>
        </div>

        <span style={{
          fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          background: `${status.color}20`, color: status.color,
          padding: "3px 10px", borderRadius: 20, flexShrink: 0, marginLeft: 8,
        }}>
          {status.label}
        </span>
      </div>

      <div style={{
        display: "flex", flexWrap: "wrap", gap: "8px 20px",
        paddingLeft: 8,
      }}>
        <InfoPill icon="🕐" label={formatDate(meeting.start_time)} />
        <InfoPill icon="⏱" label={`${meeting.duration} min`} />
        {meeting.join_url && (
          <a href={meeting.join_url} target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              color: "#818cf8", textDecoration: "none",
            }}>
            <span>🔗</span> Join Link
          </a>
        )}
      </div>

      <div style={{ paddingLeft: 8, marginTop: 4 }}>
        <button
          onClick={() => onDelete(meeting.id)}
          disabled={deleting}
          style={{
            background: "transparent",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            cursor: deleting ? "not-allowed" : "pointer",
            opacity: deleting ? 0.5 : 1,
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            if (!deleting) {
              e.currentTarget.style.background = "rgba(239,68,68,0.12)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.6)";
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
          }}
        >
          {deleting ? <><Spinner /> Deleting…</> : "🗑 Delete"}
        </button>
      </div>
    </div>
  );
}

function InfoPill({ icon, label }) {
  return (
    <span style={{
      display: "flex", alignItems: "center", gap: 5,
      fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#9ca3af",
    }}>
      <span>{icon}</span>{label}
    </span>
  );
}

// ── Create Meeting Form ───────────────────────────────────────────────────────
function CreateMeetingForm({ onCreated }) {
  const todayDate = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [form, setForm] = useState({
    topic: "",
    date: todayDate,
    time: nowTime,
    duration: "60",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const timezones = Intl.supportedValuesOf
    ? Intl.supportedValuesOf("timeZone").filter((_, i) => i % 3 === 0).slice(0, 60)
    : ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Riyadh", "Asia/Dubai"];

  function validate() {
    const errs = {};
    if (!form.topic.trim()) errs.topic = "Required";
    if (!form.date) errs.date = "Required";
    if (!form.time) errs.time = "Required";
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const meeting = await apiFetch("/meetings", {
        method: "POST",
        body: JSON.stringify({
          topic: form.topic.trim(),
          date: form.date,
          time: form.time,
          duration: parseInt(form.duration),
          timezone: form.timezone,
        }),
      });
      onCreated(meeting);
      setForm(f => ({ ...f, topic: "" }));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasError) => ({
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${hasError ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 10, padding: "11px 14px",
    color: "#f9fafb",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    outline: "none", transition: "border-color 0.2s",
  });

  const labelStyle = {
    display: "block", marginBottom: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: 12,
    fontWeight: 500, color: "#9ca3af", letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  return (
    <div style={{
      background: "rgba(99,102,241,0.06)",
      border: "1px solid rgba(99,102,241,0.2)",
      borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", gap: 18,
    }}>
      <h2 style={{
        margin: 0, fontFamily: "'Syne', sans-serif",
        fontSize: 18, fontWeight: 800, color: "#e0e7ff",
      }}>
        ✦ Create Meeting
      </h2>

      {/* Topic */}
      <div>
        <label style={labelStyle}>Meeting Topic</label>
        <input
          type="text"
          placeholder="e.g. Weekly Standup"
          value={form.topic}
          onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
          onFocus={e => e.target.style.borderColor = "#6366f1"}
          onBlur={e => e.target.style.borderColor = fieldErrors.topic ? "#ef4444" : "rgba(255,255,255,0.1)"}
          style={inputStyle(fieldErrors.topic)}
        />
        {fieldErrors.topic && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f87171" }}>{fieldErrors.topic}</p>}
      </div>

      {/* Date + Time row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={form.date}
            min={todayDate}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            onFocus={e => e.target.style.borderColor = "#6366f1"}
            onBlur={e => e.target.style.borderColor = fieldErrors.date ? "#ef4444" : "rgba(255,255,255,0.1)"}
            style={{ ...inputStyle(fieldErrors.date), colorScheme: "dark" }}
          />
        </div>
        <div>
          <label style={labelStyle}>Time</label>
          <input
            type="time"
            value={form.time}
            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            onFocus={e => e.target.style.borderColor = "#6366f1"}
            onBlur={e => e.target.style.borderColor = fieldErrors.time ? "#ef4444" : "rgba(255,255,255,0.1)"}
            style={{ ...inputStyle(fieldErrors.time), colorScheme: "dark" }}
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label style={labelStyle}>Duration (minutes)</label>
        <select
          value={form.duration}
          onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
          style={{ ...inputStyle(false), cursor: "pointer" }}
        >
          {[15, 30, 45, 60, 90, 120].map(d => (
            <option key={d} value={d} style={{ background: "#1e1e2e" }}>{d} min</option>
          ))}
        </select>
      </div>

      {/* Timezone */}
      <div>
        <label style={labelStyle}>Timezone</label>
        <select
          value={form.timezone}
          onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
          style={{ ...inputStyle(false), cursor: "pointer" }}
        >
          {timezones.map(tz => (
            <option key={tz} value={tz} style={{ background: "#1e1e2e" }}>{tz}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none", borderRadius: 12,
          padding: "13px 24px",
          color: "#fff",
          fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "opacity 0.2s, transform 0.1s",
          boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        {loading ? <><Spinner /> Creating…</> : "＋ Schedule Meeting"}
      </button>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("scheduled");

  const showToast = (message, type = "success") =>
    setToast({ message, type, key: Date.now() });

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/meetings?type=${filter}`);
      setMeetings(data.meetings || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this meeting? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/meetings/${id}`, { method: "DELETE" });
      setMeetings(m => m.filter(x => x.id !== id));
      showToast("Meeting deleted successfully");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCreated(meeting) {
    showToast(`"${meeting.topic}" scheduled!`);
    fetchMeetings();
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f1a",
      color: "#f9fafb",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(15,15,26,0.8)",
        backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>📹</div>
          <div>
            <h1 style={{
              margin: 0, fontFamily: "'Syne', sans-serif",
              fontSize: 20, fontWeight: 800, color: "#fff",
              letterSpacing: "-0.3px",
            }}>Zoom Meeting Manager</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
              Schedule and manage your meetings
            </p>
          </div>
        </div>

        <button
          onClick={fetchMeetings}
          disabled={loading}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#9ca3af", borderRadius: 10,
            padding: "8px 16px", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f9fafb"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          {loading ? <Spinner /> : "↻"} Refresh
        </button>
      </header>

      {/* Main layout */}
      <main style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "32px 24px",
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: 32,
        alignItems: "start",
      }}>
        {/* Left: Meeting List */}
        <section>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["scheduled", "upcoming", "live"].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  background: filter === t ? "rgba(99,102,241,0.2)" : "transparent",
                  border: `1px solid ${filter === t ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
                  color: filter === t ? "#a5b4fc" : "#6b7280",
                  borderRadius: 8, padding: "7px 16px",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.2s",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
            <span style={{
              marginLeft: "auto",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#4b5563",
              alignSelf: "center",
            }}>
              {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Meeting cards */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, border: "3px solid rgba(99,102,241,0.2)",
                  borderTopColor: "#6366f1", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                <p style={{ color: "#4b5563", fontFamily: "'DM Sans', sans-serif", fontSize: 14, margin: 0 }}>
                  Loading meetings…
                </p>
              </div>
            </div>
          ) : meetings.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.4s ease" }}>
              {meetings.map(m => (
                <MeetingCard
                  key={m.id}
                  meeting={m}
                  onDelete={handleDelete}
                  deleting={deletingId === m.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right: Create Form */}
        <aside style={{ position: "sticky", top: 88 }}>
          <CreateMeetingForm onCreated={handleCreated} />
        </aside>
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
