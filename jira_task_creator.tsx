import { useState } from "react";

const CLOUD_ID = "4bd3ea12-9316-420c-9425-3114f3fbde06";
const MCP_URL  = "https://mcp.atlassian.com/v1/mcp";
const PROJECT  = "IT";

const EPICS = [
  { key: "IT-1014", name: "Isidore Deployment" },
  { key: "IT-985",  name: "Documentation" },
  { key: "IT-944",  name: "Isidore Video Content Library Development" },
  { key: "IT-807",  name: "Other Projects/PoC" },
  { key: "IT-636",  name: "Isidore 50 Monthly Builds 2026" },
  { key: "IT-628",  name: "Isidore EM Monthly Builds 2026" },
  { key: "IT-581",  name: "Inventory Management for Isidore 50s" },
  { key: "IT-263",  name: "Inventory Management for Engineering Models" },
  { key: "IT-608",  name: "Technical Writing & Documentation" },
  { key: "IT-592",  name: "Isidore 50 Engineering Model Production" },
  { key: "IT-447",  name: "Engineering Model Board Production" },
  { key: "IT-446",  name: "Isidore 50 Board Production" },
];

const TEAM = [
  { id: "712020:6a961b9e-7491-4ba7-915c-bdf6656c5944", name: "Paola Hernandez Aguirre" },
  { id: "712020:04f9c324-2343-4b8d-85e9-116a25c4c922", name: "Johanne Fotso" },
  { id: "712020:b754bbd8-c157-46c1-b423-b4a97bc1d404", name: "Elesha Jackson" },
  { id: "712020:700aa895-66f1-4bfb-8e62-94caa66ccbf4", name: "Beau Ratterree" },
  { id: "712020:f386474d-e1e7-4904-8c61-a646b8af5d8a", name: "David-Michael Ross" },
  { id: "712020:b4802ccd-c546-479e-9729-b3c13837f849", name: "Antonio Garcia" },
  { id: "712020:8daf43a7-47ea-4da8-bab0-bf682c69acdb", name: "Jose La Torre" },
  { id: "712020:8686ed21-fe36-475f-9407-255d041cfa0a", name: "Chris Gemeinhardt" },
];

async function callClaude(messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages,
      mcp_servers: [{ type: "url", url: MCP_URL, name: "atlassian" }],
    }),
  });
  return res.json();
}

// ForwardEdge brand colors
const C = {
  purple:     "#8275b1",
  darkPurple: "#574b7c",
  navy:       "#0d0d2b",
  navyLight:  "#13132e",
  grey:       "#999999",
  greyDark:   "#676767",
  white:      "#ffffff",
};

export default function App() {
  const [epicKey,     setEpicKey]     = useState("");
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId,  setAssigneeId]  = useState("");
  const [dueDate,     setDueDate]     = useState("");
  const [step,        setStep]        = useState("form");
  const [result,      setResult]      = useState(null);
  const [errorMsg,    setErrorMsg]    = useState("");

  const selectedEpic = EPICS.find(e => e.key === epicKey);
  const canSubmit = title.trim() && epicKey && dueDate && step === "form";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStep("submitting");
    try {
      const assignee = TEAM.find(t => t.id === assigneeId);
      const prompt = `Create a Jira task in project ${PROJECT} (cloudId: ${CLOUD_ID}) with:
- Summary: "${title}"
- Description: "${description || "No description provided."}"
- Issue type: Task
- Parent epic: ${epicKey}
- Due date: ${dueDate}
- customfield_10001 (Team): {"id": "3a5dfe44-fedc-46b7-b005-0d6a3e4fe948"}
${assigneeId ? `- Assignee accountId: ${assigneeId}` : ""}

Use createJiraIssue. Set parent to ${epicKey}, duedate to ${dueDate}, and additional_fields to include {"customfield_10001": {"id": "3a5dfe44-fedc-46b7-b005-0d6a3e4fe948"}}${assigneeId ? ` and assignee accountId to ${assigneeId}` : ""}. Return the issue key.`;

      const data = await callClaude([{ role: "user", content: prompt }]);
      const textBlocks = data.content?.filter(b => b.type === "text").map(b => b.text).join(" ") || "";
      const toolResults = data.content?.filter(b => b.type === "mcp_tool_result") || [];

      let issueKey = null;
      for (const block of toolResults) {
        try { const p = JSON.parse(block.content?.[0]?.text || ""); if (p.key) { issueKey = p.key; break; } } catch {}
      }
      if (!issueKey) { const m = textBlocks.match(/([A-Z]+-\d+)/); if (m) issueKey = m[1]; }

      setResult({ key: issueKey, epicKey, epicName: selectedEpic?.name, title, assignee: assignee?.name || "Unassigned", dueDate });
      setStep("success");
    } catch (e) {
      setErrorMsg(e.message || "Unknown error");
      setStep("error");
    }
  };

  const reset = () => {
    setStep("form"); setEpicKey(""); setTitle(""); setDescription("");
    setAssigneeId(""); setDueDate(""); setResult(null); setErrorMsg("");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Roboto', system-ui, sans-serif" }}>
      
      {/* Logo */}
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: C.navyLight, border: `1px solid ${C.darkPurple}`, borderRadius: "6px", padding: "10px 28px" }}>
          <span style={{ fontWeight: 700, fontSize: "20px", letterSpacing: "6px", textTransform: "uppercase" }}>
            <span style={{ color: C.purple }}>FORWARD</span><span style={{ color: C.white }}>EDGE</span>
          </span>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: C.navyLight, borderRadius: "14px", width: "100%", maxWidth: "560px", boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${C.darkPurple}40`, overflow: "hidden" }}>

        {/* Card header */}
        <div style={{ background: `linear-gradient(135deg, ${C.darkPurple} 0%, ${C.purple}99 100%)`, padding: "20px 26px" }}>
          <div style={{ fontWeight: 700, fontSize: "17px", color: C.white, letterSpacing: "0.5px" }}>Isidore Production</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginTop: "3px", letterSpacing: "0.3px" }}>Isidore Main Hub v1.0 · Create Jira Task</div>
        </div>

        <div style={{ padding: "26px" }}>

          {/* ── FORM ── */}
          {step === "form" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              <Field label="Epic *">
                <select value={epicKey} onChange={e => setEpicKey(e.target.value)} style={sel}>
                  <option value="">— Select an epic —</option>
                  {EPICS.map(ep => <option key={ep.key} value={ep.key}>{ep.name}</option>)}
                </select>
              </Field>

              <Field label="Task Title *">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" style={inp} />
              </Field>

              <Field label="Description">
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add context, acceptance criteria, or notes…" rows={3} style={{ ...inp, resize: "vertical" }} />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <Field label="Assignee">
                  <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={sel}>
                    <option value="">— Select assignee —</option>
                    {TEAM.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </Field>
                <Field label="Due Date *">
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inp, colorScheme: "dark" }} min={new Date().toISOString().split("T")[0]} />
                </Field>
              </div>

              {/* Team badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: `${C.darkPurple}33`, border: `1px solid ${C.darkPurple}66`, borderRadius: "8px", padding: "10px 14px" }}>
                <span style={{ fontSize: "14px" }}>👥</span>
                <span style={{ fontSize: "12px", color: C.purple, fontWeight: 600, letterSpacing: "0.3px" }}>Team</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginLeft: "4px" }}>Isidore Production Team</span>
                <span style={{ marginLeft: "auto", fontSize: "10px", background: `${C.purple}33`, color: C.purple, padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>AUTO-SET</span>
              </div>

              <button onClick={handleSubmit} disabled={!canSubmit} style={{
                marginTop: "4px", padding: "14px",
                background: canSubmit ? `linear-gradient(90deg, ${C.darkPurple}, ${C.purple})` : "#333",
                color: canSubmit ? C.white : C.greyDark,
                border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px",
                letterSpacing: "0.5px", cursor: canSubmit ? "pointer" : "not-allowed",
                boxShadow: canSubmit ? `0 4px 20px ${C.darkPurple}88` : "none",
                transition: "all 0.2s", fontFamily: "'Roboto', system-ui, sans-serif",
              }}>
                Create Jira Task
              </button>
            </div>
          )}

          {/* ── SUBMITTING ── */}
          {step === "submitting" && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ width: "48px", height: "48px", border: `4px solid ${C.darkPurple}55`, borderTopColor: C.purple, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
              <div style={{ fontWeight: 700, fontSize: "17px", color: C.white }}>Creating task in Jira…</div>
              <div style={{ color: C.grey, marginTop: "6px", fontSize: "13px" }}>Linking to {selectedEpic?.name}</div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && result && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: `${C.purple}22`, border: `2px solid ${C.purple}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: "24px" }}>✓</div>
              <div style={{ fontWeight: 800, fontSize: "19px", color: C.white, marginBottom: "4px" }}>Task Created!</div>
              <div style={{ background: `${C.darkPurple}44`, border: `1px solid ${C.darkPurple}88`, borderRadius: "12px", padding: "16px 18px", margin: "16px 0", textAlign: "left" }}>
                {result.key && (
                  <Row label="Issue Key">
                    <a href={`https://forwardedgeai.atlassian.net/browse/${result.key}`} target="_blank" rel="noreferrer" style={{ color: C.purple, fontWeight: 700, textDecoration: "none" }}>
                      {result.key} ↗
                    </a>
                  </Row>
                )}
                <Row label="Epic"><span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{result.epicName}</span></Row>
                <Row label="Title"><span style={{ color: C.white }}>{result.title}</span></Row>
                <Row label="Assignee"><span style={{ color: C.white }}>{result.assignee}</span></Row>
                <Row label="Due Date">
                  <span style={{ color: C.purple, fontWeight: 600 }}>
                    {new Date(result.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </Row>
                <Row label="Team" last><span style={{ color: C.purple }}>Isidore Production Team</span></Row>
              </div>
              <button onClick={reset} style={{ padding: "12px 30px", background: `linear-gradient(90deg, ${C.darkPurple}, ${C.purple})`, color: C.white, border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "14px", letterSpacing: "0.4px", boxShadow: `0 4px 14px ${C.darkPurple}88`, fontFamily: "'Roboto', system-ui, sans-serif" }}>
                + Create Another Task
              </button>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === "error" && (
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              <div style={{ fontSize: "50px", marginBottom: "10px" }}>❌</div>
              <div style={{ fontWeight: 700, fontSize: "17px", color: "#e05555" }}>Something went wrong</div>
              <div style={{ color: C.grey, margin: "8px 0 20px", fontSize: "13px" }}>{errorMsg}</div>
              <button onClick={reset} style={{ padding: "12px 28px", background: C.darkPurple, color: C.white, border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontFamily: "'Roboto', system-ui, sans-serif" }}>Try Again</button>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "20px", fontSize: "11px", color: C.greyDark, letterSpacing: "1px", textTransform: "uppercase" }}>
        ForwardEdge AI · Isidore Production
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        select option { background: #13132e; color: white; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontWeight: 600, fontSize: "11px", color: "#8275b1", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</label>
      {children}
    </div>
  );
}

function Row({ label, children, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: last ? "none" : "1px solid rgba(130,117,177,0.2)", fontSize: "13px", gap: "12px" }}>
      <span style={{ color: "#8275b1", fontWeight: 500, flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  );
}

const inp = {
  width: "100%", padding: "10px 12px",
  border: "1.5px solid #574b7c55",
  borderRadius: "8px", fontSize: "14px",
  color: "#ffffff", background: "#0a0a22",
  boxSizing: "border-box", fontFamily: "'Roboto', system-ui, sans-serif", outline: "none",
};
const sel = { ...inp, cursor: "pointer" };
