import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `你是一个基于"猜疑链动力学"的爱情实战教练。核心：爱情势能 E = S(猜疑张力) × I(不可逆浓度) × Δ(变化感知)。爱的源头是猜疑链。你直接给话术和行动，用户执行后汇报反应，你评估沦陷度。风格：像老练军师，不废话，话术可直接复制发送，分析要犀利精准。`;

async function callAI(messages) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });
    const data = await res.json();
    return data.content && data.content[0] ? data.content[0].text : "";
  } catch (e) {
    throw new Error("API调用失败");
  }
}

function parseJSON(text) {
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

const DIM_COLORS = { S: "#e8927c", I: "#7cc5e8", D: "#a8e87c" };
const DIM_NAMES = { S: "猜疑张力", I: "不可逆浓度", D: "变化感知" };
const SIG_COLORS = { "强阳性": "#51cf66", "弱阳性": "#a8e87c", "中性": "#ffd43b", "弱阴性": "#ffa94d", "强阴性": "#ff6b6b" };

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{
        width: 24, height: 24, border: "2px solid rgba(232,146,124,0.15)",
        borderTop: "2px solid #e8927c", borderRadius: "50%",
        animation: "spin .8s linear infinite", margin: "0 auto 12px",
      }} />
      <div style={{ fontSize: 12, color: "rgba(224,214,204,0.3)" }}>思考中...</div>
    </div>
  );
}

function BarChart({ value, color }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 200);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
      <div ref={ref} style={{
        height: "100%", borderRadius: 3, background: color,
        width: w + "%", transition: "width 1s ease",
      }} />
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("input");
  const [ctx, setCtx] = useState("");
  const [mission, setMission] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const btm = useRef(null);

  useEffect(() => {
    btm.current && btm.current.scrollIntoView({ behavior: "smooth" });
  }, [step, loading]);

  async function getMission() {
    if (!ctx.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const hText = history.map((h, i) =>
        "Task" + (i + 1) + ": " + h.task + "\nResult: " + h.fb + "\nScore: " + h.score
      ).join("\n");

      const raw = await callAI([{
        role: "user",
        content: "关系背景：" + ctx + (hText ? "\n\n历史：\n" + hText : "") + '\n\n给出下一个测试任务。JSON格式：{"dim":"S或I或D","strategy":"战术意图15字内","lines":[{"text":"话术","when":"时机"}],"action":"行动指令","watch":"观察什么","note":"注意事项"}'
      }]);
      const m = parseJSON(raw);
      if (!m) throw new Error("解析失败");
      setMission(m);
      setStep("mission");
    } catch (e) {
      setErr("生成失败，请重试");
    }
    setLoading(false);
  }

  async function analyze() {
    if (!feedback.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const raw = await callAI([{
        role: "user",
        content: "背景：" + ctx + "\n任务：" + mission.action + "\n话术：" + mission.lines.map(function(l) { return l.text; }).join("/") + "\n观察：" + mission.watch + "\n维度：" + mission.dim + "\n对方反应：" + feedback + '\n\n评估沦陷度。JSON格式：{"score":0到100,"signal":"强阳性/弱阳性/中性/弱阴性/强阴性","reading":"解读2句话要犀利","signals":["微信号1","微信号2"],"S":0到100,"I":0到100,"D":0到100,"total":0到100,"label":"无感/好奇/心动/暧昧/沦陷/深陷","next":"下一步方向一句话"}'
      }]);
      const r = parseJSON(raw);
      if (!r) throw new Error("解析失败");
      setResult(r);
      setHistory(function(prev) {
        return prev.concat([{ task: mission.action, dim: mission.dim, fb: feedback, score: r.score, result: r }]);
      });
      setStep("result");
    } catch (e) {
      setErr("分析失败，请重试");
    }
    setLoading(false);
  }

  function nextRound() {
    setFeedback("");
    setResult(null);
    setMission(null);
    getMission();
  }

  function restart() {
    setStep("input");
    setCtx("");
    setMission(null);
    setFeedback("");
    setResult(null);
    setHistory([]);
    setErr("");
  }

  var dimColor = mission ? (DIM_COLORS[mission.dim] || "#e8927c") : "#e8927c";
  var dimName = mission ? (DIM_NAMES[mission.dim] || "未知") : "";

  var boxStyle = {
    background: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.05)",
    marginBottom: 12,
  };

  var btnPrimary = {
    width: "100%",
    padding: "12px 0",
    background: "rgba(232,146,124,0.12)",
    color: "#e8927c",
    border: "1px solid rgba(232,146,124,0.25)",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 600,
    letterSpacing: 1,
  };

  var btnSecondary = {
    padding: "12px 0",
    background: "transparent",
    color: "rgba(224,214,204,0.35)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
  };

  var inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: 12,
    color: "#e0d6cc",
    fontSize: 14,
    lineHeight: "1.7",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0b0a",
      color: "#e0d6cc",
      padding: "28px 16px",
      display: "flex",
      justifyContent: "center",
    }}>
      <style>{
        "@keyframes spin{to{transform:rotate(360deg)}}" +
        "@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}" +
        "::selection{background:rgba(232,146,124,.3)}"
      }</style>

      <div style={{ maxWidth: 460, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: 5, color: "rgba(224,214,204,0.2)", marginBottom: 6 }}>
            E = S x I x Delta
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#e8927c", letterSpacing: 2 }}>
            沦陷度实测
          </h1>
          {history.length > 0 && (
            <div style={{ fontSize: 11, color: "rgba(224,214,204,0.25)", marginTop: 6 }}>
              已完成 {history.length} 轮 {result ? " · 当前 " + result.total + "/100" : ""}
            </div>
          )}
        </div>

        {err && (
          <div style={{
            background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 14,
            fontSize: 12, color: "#ff6b6b", textAlign: "center",
          }}>
            {err}
            <span onClick={function() { setErr(""); }} style={{ marginLeft: 10, cursor: "pointer", opacity: 0.5 }}>x</span>
          </div>
        )}

        {/* Input Phase */}
        {step === "input" && !loading && (
          <div style={{ animation: "fadeIn .5s ease" }}>
            <div style={{ fontSize: 13, color: "rgba(224,214,204,0.45)", marginBottom: 12, lineHeight: 1.8 }}>
              描述你们的关系。我直接给话术和行动，你去执行，回来告诉我她怎么反应的。
            </div>
            <textarea
              value={ctx}
              onChange={function(e) { setCtx(e.target.value); }}
              placeholder={"认识多久、什么关系、最近互动..."}
              rows={5}
              style={inputStyle}
            />
            <div style={{ height: 12 }} />
            <button
              onClick={getMission}
              disabled={!ctx.trim()}
              style={Object.assign({}, btnPrimary, { opacity: ctx.trim() ? 1 : 0.4 })}
            >
              开始实测
            </button>
          </div>
        )}

        {/* Mission Phase */}
        {step === "mission" && !loading && mission && (
          <div style={{ animation: "fadeIn .5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                padding: "3px 10px", borderRadius: 12, fontSize: 11,
                background: dimColor + "18", color: dimColor, border: "1px solid " + dimColor + "30",
              }}>
                {mission.dim} {dimName}
              </div>
              <div style={{ fontSize: 12, color: "rgba(224,214,204,0.4)" }}>{mission.strategy}</div>
              <div style={{ marginLeft: "auto", fontSize: 10, color: "rgba(224,214,204,0.15)" }}>
                #{history.length + 1}
              </div>
            </div>

            {/* Chat Lines */}
            <div style={boxStyle}>
              <div style={{ fontSize: 10, color: "rgba(224,214,204,0.3)", letterSpacing: 1, marginBottom: 10 }}>
                话术 · 点击复制
              </div>
              {mission.lines && mission.lines.map(function(l, i) {
                return (
                  <div key={i} style={{ marginBottom: i < mission.lines.length - 1 ? 10 : 0 }}>
                    <div
                      onClick={function() {
                        if (navigator.clipboard) navigator.clipboard.writeText(l.text);
                      }}
                      style={{
                        background: "rgba(232,146,124,0.07)",
                        borderLeft: "2px solid " + dimColor + "50",
                        borderRadius: "8px 8px 8px 2px",
                        padding: "9px 12px", fontSize: 14, lineHeight: 1.7,
                        cursor: "pointer",
                      }}
                    >
                      {l.text}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(224,214,204,0.2)", marginTop: 3, paddingLeft: 6 }}>
                      {l.when}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action */}
            <div style={Object.assign({}, boxStyle, { borderLeft: "2px solid #7cc5e8" })}>
              <div style={{ fontSize: 10, color: "#7cc5e8", letterSpacing: 1, marginBottom: 6 }}>行动指令</div>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: "rgba(224,214,204,0.7)" }}>{mission.action}</div>
            </div>

            {/* Watch */}
            <div style={Object.assign({}, boxStyle, { borderLeft: "2px solid #a8e87c" })}>
              <div style={{ fontSize: 10, color: "#a8e87c", letterSpacing: 1, marginBottom: 6 }}>观察重点</div>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: "rgba(224,214,204,0.7)" }}>{mission.watch}</div>
            </div>

            {mission.note && (
              <div style={{ fontSize: 11, color: "rgba(255,169,77,0.5)", marginBottom: 14, paddingLeft: 4 }}>
                {"* " + mission.note}
              </div>
            )}

            <button onClick={function() { setStep("report"); }} style={btnPrimary}>
              去执行，回来汇报
            </button>
          </div>
        )}

        {/* Report Phase */}
        {step === "report" && !loading && (
          <div style={{ animation: "fadeIn .5s ease" }}>
            <div style={{ fontSize: 13, color: "rgba(224,214,204,0.45)", marginBottom: 12, lineHeight: 1.8 }}>
              她怎么反应的？说了什么、语气、回复速度、有没有追问。越具体越准。
            </div>
            <textarea
              value={feedback}
              onChange={function(e) { setFeedback(e.target.value); }}
              placeholder={"比如：她过了5分钟才回，说'哈哈还行吧'，没有追问..."}
              rows={5}
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={function() { setStep("mission"); }} style={Object.assign({}, btnSecondary, { flex: 1 })}>
                回看任务
              </button>
              <button
                onClick={analyze}
                disabled={!feedback.trim()}
                style={Object.assign({}, btnPrimary, { flex: 2, opacity: feedback.trim() ? 1 : 0.4 })}
              >
                提交反应
              </button>
            </div>
          </div>
        )}

        {/* Result Phase */}
        {step === "result" && !loading && result && (
          <div style={{ animation: "fadeIn .8s ease" }}>
            {/* Signal Badge */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{
                display: "inline-block", padding: "4px 16px", borderRadius: 16,
                fontSize: 12, fontWeight: 700, letterSpacing: 2,
                color: SIG_COLORS[result.signal] || "#ffd43b",
                background: (SIG_COLORS[result.signal] || "#ffd43b") + "15",
                border: "1px solid " + (SIG_COLORS[result.signal] || "#ffd43b") + "30",
              }}>
                {result.signal}
              </span>
            </div>

            {/* Big Score */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: "#e8927c" }}>{result.total}</div>
              <div style={{ fontSize: 13, color: "rgba(224,214,204,0.4)", letterSpacing: 3 }}>{result.label}</div>
            </div>

            {/* Reading */}
            <div style={Object.assign({}, boxStyle, { fontSize: 14, lineHeight: 2, color: "rgba(224,214,204,0.8)" })}>
              {result.reading}
            </div>

            {/* Micro Signals */}
            {result.signals && result.signals.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {result.signals.map(function(s, i) {
                  return (
                    <span key={i} style={{
                      padding: "4px 10px", borderRadius: 14, fontSize: 11,
                      background: "rgba(232,146,124,0.07)", color: "rgba(224,214,204,0.55)",
                      border: "1px solid rgba(232,146,124,0.1)",
                    }}>{s}</span>
                  );
                })}
              </div>
            )}

            {/* Dimension Bars */}
            <div style={boxStyle}>
              {["S", "I", "D"].map(function(k, i) {
                var v = result[k] || 0;
                return (
                  <div key={k} style={{ marginBottom: i < 2 ? 12 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: DIM_COLORS[k] }}>{k} {DIM_NAMES[k]}</span>
                      <span style={{ fontSize: 11, color: "rgba(224,214,204,0.25)" }}>{v}</span>
                    </div>
                    <BarChart value={v} color={DIM_COLORS[k]} />
                  </div>
                );
              })}
            </div>

            {/* Next Hint */}
            <div style={Object.assign({}, boxStyle, {
              background: "rgba(232,146,124,0.05)", borderColor: "rgba(232,146,124,0.1)", textAlign: "center",
            })}>
              <div style={{ fontSize: 10, color: "#e8927c", letterSpacing: 1, marginBottom: 5 }}>下一步</div>
              <div style={{ fontSize: 13, color: "rgba(224,214,204,0.65)", lineHeight: 1.7 }}>{result.next}</div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                onClick={function() { setStep("history"); }}
                style={Object.assign({}, btnSecondary, { flex: 1 })}
              >历史</button>
              <button onClick={nextRound} style={Object.assign({}, btnPrimary, { flex: 2 })}>
                下一轮测试
              </button>
            </div>
          </div>
        )}

        {/* History Phase */}
        {step === "history" && (
          <div style={{ animation: "fadeIn .5s ease" }}>
            <div style={{ fontSize: 11, color: "rgba(224,214,204,0.25)", letterSpacing: 1, marginBottom: 14 }}>
              测试记录 ({history.length})
            </div>
            {history.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(224,214,204,0.15)", padding: 30, fontSize: 12 }}>无</div>
            )}
            {history.map(function(h, i) {
              var dc = DIM_COLORS[h.dim] || "#e8927c";
              var sl = h.result ? h.result.signal : "";
              return (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 12,
                  border: "1px solid rgba(255,255,255,0.04)", marginBottom: 8,
                  borderLeft: "3px solid " + dc,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: dc }}>{h.dim} {DIM_NAMES[h.dim]}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: dc }}>{h.score}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(224,214,204,0.4)", lineHeight: 1.6 }}>{h.task}</div>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={restart} style={Object.assign({}, btnSecondary, { flex: 1 })}>重置</button>
              <button
                onClick={function() { setStep(result ? "result" : "mission"); }}
                style={Object.assign({}, btnPrimary, { flex: 2 })}
              >继续</button>
            </div>
          </div>
        )}

        {loading && <Spinner />}

        <div ref={btm} />
        <div style={{ textAlign: "center", marginTop: 36, fontSize: 9, color: "rgba(224,214,204,0.08)" }}>
          所有模型都不对 但有些模型有用
        </div>
      </div>
    </div>
  );
}
