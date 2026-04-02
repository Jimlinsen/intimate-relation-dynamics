import { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════════
// 1. SYSTEM PROMPT — 统一理论框架
// ════════════════════════════════════════════════════════════════

var SYSTEM_BASE = "你是亲密关系诊断智能体，整合三套理论框架：\n\n" +
  "【猜疑链动力学】爱情势能E=S×I×Δ。S=1-M/T(猜疑张力,甜区0.3-0.7,低则无聊高则断裂)。" +
  "I=Σ(w·c)/N(不可逆浓度,甜区0.15-0.2,低则无重量高则窒息)。Δ=R/P(变化率,重建/打补丁,>1健康)。" +
  "I_target=0.2×(1+(0.5-S)),S和I形成跷跷板。三变量任一归零E归零。\n\n" +
  "【τ自指循环周期】τ(x,D)=x从提出到被反弹的时间。权力P(A,B)=τ(B→A)/τ(A→B)。" +
  "F_R=D_want×D_feedback×(1+min(I_A,I_B)/I₀)。dF_R/dt=λ(D_want·D_feedback-F_R)-γ·Δτ²。" +
  "初期τ双短对称(秒回)→稳定期τ延长对称→危机期τ出现不对称→修复=同步τ节奏。" +
  "I_n意向梯度：I_1需要→I_2知被需要→I_3策略互动→I_4管理对方策略→I_5+多层博弈。min(I_A,I_B)决定关系最大复杂度。\n\n" +
  "【关系力学全景】四象限ℛ:Q_Ⅰ身体场(物理在场/接触)Q_Ⅱ制度场(共同习惯/物质绑定)Q_Ⅲ直觉场(化学反应/默契)Q_Ⅳ价值场(世界观对齐/精神共鸣)。" +
  "自指守恒律:Σ_stage+Σ_debt=Σ_total,不做阶段消化→债务积累→全面崩溃(无中间态)。" +
  "θ_OC=F_创造/F_秩序,需动态平衡,不可同源控制。" +
  "纵向因果C_V:高层级的什么结构蕴含了低层级现象的必然出现(>横向因果C_H)。\n\n" +
  "【统一原则】所有诊断归结纵向因果。话术必须可直接复制发送。军师式犀利精准不模糊安慰。每个探测任务精确针对一个变量。基于具体行为证据打分不凑整数。";

var MODE_SUFFIX = {
  quick: "\n\n当前为快速模式(E=S×I×Δ)。聚焦S(猜疑张力)、I(不可逆浓度)、D(变化感知)三维度。" +
    "选择S或I或D中最需探测的。输出侧重：直觉判断、沦陷等级、信号强度。",
  standard: "\n\n当前为标准模式(τ测度)。聚焦τ(她→你)、τ(你→她)、D_want、D_feedback、I_n五变量。" +
    "选择tau_her或tau_you或D_want或D_feedback或I_n中最需探测的。输出侧重：τ不对称诊断、权力比、同步建议。",
  deep: "\n\n当前为深度模式(关系力全景)。六维诊断+四象限+纵向因果。" +
    "选择tau_asym或quad_profile或I_n或sigma_debt或theta_OC或D_want中最需探测的。" +
    "输出侧重：四象限分布、因果分层(C_H→C_V)、自指债务、秩序/创造平衡。",
};

var TASK_SCHEMA = '{"probe":"变量代码","probe_name":"变量中文名","intent":"战术意图12字内",' +
  '"lines":[{"text":"可直接发送的话术","when":"发送时机和条件"}],' +
  '"action":"具体行动指令含时间方式","watch":"精确观察指标","note":"注意事项一句话"}';

var EVAL_SCHEMA = {
  quick: '{"F_R":0到100关系力总评,"S":0到100猜疑张力,"I":0到100不可逆浓度,"D":0到100变化感知,' +
    '"signal":"强阳性/弱阳性/中性/弱阴性/强阴性","label":"无感/好奇/心动/暧昧/沦陷/深陷",' +
    '"phase":"好奇/升温/心动/暧昧/热恋/稳定/平淡/失同步/危机",' +
    '"reading":"基于猜疑链的犀利解读2句话","micro_signals":["微信号1","微信号2"],"action":"下一步行动一句话"}',

  standard: '{"F_R":0到100,"tau_her":0到100她回应速度和主动性(100=秒回且主动),' +
    '"tau_you":0到100她制造的回应压力(100=强烈),"D_want":0到100她的欲求值,' +
    '"D_feedback":0到100她的回馈质量,"I_n":0到100博弈深度,' +
    '"delta_tau":0到100不对称度(0=健康对称100=危险失衡),"P_ratio":"权力比数值如1.3(>1你有权力)",' +
    '"phase":"好奇/升温/心动/暧昧/热恋/稳定/平淡/失同步/危机",' +
    '"reading":"基于τ理论的精准解读2句话","tau_diagnosis":"τ不对称的具体表现一句话",' +
    '"micro_signals":["微信号"],"action":"下一步行动","sync_advice":"τ校准建议一句话"}',

  deep: '{"F_R":0到100,"tau_asym":0到100(0=完美对称100=极度失衡),' +
    '"tau_dir":"她的tau更长/你的tau更长/基本对称","P_ratio":"如1.3",' +
    '"Q1":0到100身体场,"Q2":0到100制度场,"Q3":0到100直觉场,"Q4":0到100价值场,' +
    '"quad_weakest":"最弱象限Q几及原因","I_n":0到100,"I_n_level":"I_几(如I_3策略性互动)",' +
    '"sigma_debt":0到100(0=无积压100=临界崩溃),"sigma_signs":"自指债务信号一句话",' +
    '"theta_OC":0到100(0=纯秩序50=平衡100=纯创造),"D_want":0到100,' +
    '"C_H":"横向因果一句话","C_V":"纵向因果一句话(必须比C_H深一层)",' +
    '"phase":"好奇/升温/心动/暧昧/热恋/稳定/平淡/失同步/危机",' +
    '"reading":"核心诊断2句话","micro_signals":["微信号"],' +
    '"action":"下一步行动","tau_sync":"τ校准建议","sigma_rx":"Σ消化建议"}',
};

// ════════════════════════════════════════════════════════════════
// 2. MODE & VARIABLE CONFIGURATION
// ════════════════════════════════════════════════════════════════

var MODES = {
  quick: { name: "快速", sub: "E = S x I x Delta", color: "#e8927c", desc: "3维沦陷度，直觉判断，快速出结果" },
  standard: { name: "标准", sub: "tau 测度", color: "#7cc5e8", desc: "5变量精确测量回应节奏和博弈深度" },
  deep: { name: "深度", sub: "关系力全景", color: "#c49bde", desc: "6维+4象限+纵向因果，结构性诊断" },
};

var ALL_VARS = {
  S: { label: "S", full: "猜疑张力", color: "#e8927c" },
  I: { label: "I", full: "不可逆浓度", color: "#7cc5e8" },
  D: { label: "Delta", full: "变化感知", color: "#a8e87c" },
  tau_her: { label: "tau她", full: "她回应你的速度", color: "#e8927c" },
  tau_you: { label: "tau你", full: "你回应她的速度", color: "#7cc5e8" },
  D_want: { label: "Dw", full: "欲求值", color: "#a8e87c" },
  D_feedback: { label: "Df", full: "回馈质量", color: "#c49bde" },
  I_n: { label: "In", full: "博弈深度", color: "#f0c674" },
  tau_asym: { label: "Dtau", full: "tau不对称", color: "#e8927c" },
  quad_profile: { label: "R", full: "四象限分布", color: "#7cc5e8" },
  sigma_debt: { label: "Sigma", full: "自指债务", color: "#cc6666" },
  theta_OC: { label: "OC", full: "秩序/创造", color: "#c49bde" },
};

var MODE_VARS = {
  quick: ["S", "I", "D"],
  standard: ["tau_her", "tau_you", "D_want", "D_feedback", "I_n"],
  deep: ["tau_asym", "D_want", "I_n", "sigma_debt", "theta_OC"],
};

var PHASE_COLORS = {
  "好奇": "#ffd43b", "升温": "#a8e87c", "心动": "#51cf66",
  "暧昧": "#7cc5e8", "热恋": "#e8927c", "稳定": "#7cc5e8",
  "平淡": "#ffd43b", "失同步": "#ffa94d", "危机": "#ff6b6b",
};

var SIGNAL_COLORS = {
  "强阳性": "#51cf66", "弱阳性": "#a8e87c", "中性": "#ffd43b",
  "弱阴性": "#ffa94d", "强阴性": "#ff6b6b",
};

// ════════════════════════════════════════════════════════════════
// 3. AI COMMUNICATION
// ════════════════════════════════════════════════════════════════

async function callAI(system, messages) {
  var allMessages = [{ role: "system", content: system }].concat(messages);
  var res = await fetch("/api/coding/paas/v4/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "GLM-5.1",
      messages: allMessages,
      max_tokens: 1400,
    }),
  });
  var data = await res.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  throw new Error("API returned empty: " + JSON.stringify(data));
}

function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch (e) {
    return null;
  }
}

function buildHistorySummary(rounds) {
  if (rounds.length === 0) return "";
  return "\n\n历史数据：\n" + rounds.map(function (h, i) {
    return "R" + (i + 1) + "[" + h.mode + "/" + h.probe + "]: " + h.task +
      " | 反应: " + h.feedback.slice(0, 60) + " | F_R=" + h.result.F_R;
  }).join("\n");
}

// ════════════════════════════════════════════════════════════════
// 4. SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════

function Spinner(props) {
  return (
    <div style={{ textAlign: "center", padding: "36px 0" }}>
      <div style={{
        width: 22, height: 22, border: "2px solid rgba(232,146,124,0.12)",
        borderTop: "2px solid #e8927c", borderRadius: "50%",
        animation: "spin .7s linear infinite", margin: "0 auto 10px",
      }} />
      <div style={{ fontSize: 11, color: "rgba(224,214,204,0.25)" }}>{props.text || "..."}</div>
    </div>
  );
}

function Bar(props) {
  var s = useState(0), w = s[0], setW = s[1];
  useEffect(function () {
    var t = setTimeout(function () { setW(props.value); }, 150);
    return function () { clearTimeout(t); };
  }, [props.value]);
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
      <div style={{
        height: "100%", borderRadius: 2, background: props.color,
        width: w + "%", transition: "width 1s ease",
      }} />
    </div>
  );
}

function QuadChart(props) {
  var mx = Math.max(props.q1, props.q2, props.q3, props.q4, 1);
  function cell(val, label, pos) {
    var pct = val / mx;
    return (
      <div style={{
        gridArea: pos, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "rgba(124,197,232," + (0.03 + pct * 0.12) + ")",
        borderRadius: 6, padding: 8,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(124,197,232," + (0.4 + pct * 0.6) + ")" }}>{val}</div>
        <div style={{ fontSize: 9, color: "rgba(224,214,204,0.25)", marginTop: 2, textAlign: "center" }}>{label}</div>
      </div>
    );
  }
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr",
      gap: 4, height: 120, gridTemplateAreas: "'q3 q4' 'q1 q2'",
    }}>
      {cell(props.q1, "Q1 身体场", "q1")}
      {cell(props.q2, "Q2 制度场", "q2")}
      {cell(props.q3, "Q3 直觉场", "q3")}
      {cell(props.q4, "Q4 价值场", "q4")}
    </div>
  );
}

function TrendChart(props) {
  var rounds = props.rounds;
  if (rounds.length < 2) return null;
  return (
    <div style={props.style}>
      <div style={{ fontSize: 9, color: "rgba(224,214,204,0.18)", letterSpacing: 1, marginBottom: 6 }}>
        F_R 趋势
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 45 }}>
        {rounds.map(function (r, i) {
          var pct = (r.result.F_R || 0) / 100;
          var mc = MODES[r.mode] ? MODES[r.mode].color : "#e8927c";
          return (
            <div key={i} style={{
              flex: 1, background: mc, opacity: 0.3 + pct * 0.7,
              borderRadius: "2px 2px 0 0", height: Math.max(pct * 100, 3) + "%",
              transition: "height .5s ease",
            }} />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 8, color: "rgba(224,214,204,0.12)" }}>R1</span>
        <span style={{ fontSize: 8, color: "rgba(224,214,204,0.12)" }}>R{rounds.length}</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. MAIN APP
// ════════════════════════════════════════════════════════════════

export default function App() {
  var s1 = useState("input"), step = s1[0], setStep = s1[1];
  var s2 = useState(""), ctx = s2[0], setCtx = s2[1];
  var s3 = useState("quick"), mode = s3[0], setMode = s3[1];
  var s4 = useState(null), mission = s4[0], setMission = s4[1];
  var s5 = useState(""), feedback = s5[0], setFeedback = s5[1];
  var s6 = useState(null), result = s6[0], setResult = s6[1];
  var s7 = useState([]), rounds = s7[0], setRounds = s7[1];
  var s8 = useState(false), loading = s8[0], setLoading = s8[1];
  var s9 = useState(""), err = s9[0], setErr = s9[1];
  var s10 = useState({}), metrics = s10[0], setMetrics = s10[1];
  var btm = useRef(null);

  useEffect(function () {
    btm.current && btm.current.scrollIntoView({ behavior: "smooth" });
  }, [step, loading]);

  // ── Metrics update ──
  function updateMetrics(prev, res, m) {
    var n = Object.assign({}, prev);
    if (res.F_R !== undefined) n.F_R = res.F_R;
    if (res.phase) n.phase = res.phase;
    // Quick
    if (res.S !== undefined) n.S = res.S;
    if (res.I !== undefined) n.I = res.I;
    if (res.D !== undefined) n.D = res.D;
    if (res.signal) n.signal = res.signal;
    if (res.label) n.label = res.label;
    // Standard
    if (res.tau_her !== undefined) n.tau_her = res.tau_her;
    if (res.tau_you !== undefined) n.tau_you = res.tau_you;
    if (res.D_want !== undefined) n.D_want = res.D_want;
    if (res.D_feedback !== undefined) n.D_feedback = res.D_feedback;
    if (res.I_n !== undefined) n.I_n = res.I_n;
    if (res.delta_tau !== undefined) n.delta_tau = res.delta_tau;
    if (res.P_ratio !== undefined) n.P_ratio = res.P_ratio;
    if (res.tau_diagnosis) n.tau_diagnosis = res.tau_diagnosis;
    // Deep
    if (res.tau_asym !== undefined) { n.tau_asym = res.tau_asym; n.delta_tau = res.tau_asym; }
    if (res.Q1 !== undefined) n.Q1 = res.Q1;
    if (res.Q2 !== undefined) n.Q2 = res.Q2;
    if (res.Q3 !== undefined) n.Q3 = res.Q3;
    if (res.Q4 !== undefined) n.Q4 = res.Q4;
    if (res.sigma_debt !== undefined) n.sigma_debt = res.sigma_debt;
    if (res.theta_OC !== undefined) n.theta_OC = res.theta_OC;
    if (res.C_V) n.C_V = res.C_V;
    if (res.C_H) n.C_H = res.C_H;
    return n;
  }

  // ── AI: Generate mission ──
  function getMission() {
    if (!ctx.trim()) return;
    setLoading(true); setErr("");
    var sys = SYSTEM_BASE + MODE_SUFFIX[mode];
    var hist = buildHistorySummary(rounds);
    var prompt = "关系背景：" + ctx + hist +
      "\n\n根据当前数据缺口，部署下一个探测任务。\n严格JSON返回：" + TASK_SCHEMA;

    callAI(sys, [{ role: "user", content: prompt }]).then(function (raw) {
      var m = parseJSON(raw);
      if (!m) { setErr("解析失败，请重试"); setLoading(false); return; }
      setMission(m); setStep("mission"); setLoading(false);
    }).catch(function () { setErr("生成失败，请重试"); setLoading(false); });
  }

  // ── AI: Analyze response ──
  function analyze() {
    if (!feedback.trim()) return;
    setLoading(true); setErr("");
    var sys = SYSTEM_BASE + MODE_SUFFIX[mode];

    var prevInfo = "";
    if (metrics.F_R !== undefined) {
      prevInfo = "\n当前累计：F_R=" + metrics.F_R;
      if (metrics.delta_tau !== undefined) prevInfo += " Dtau=" + metrics.delta_tau;
      if (metrics.sigma_debt !== undefined) prevInfo += " Sd=" + metrics.sigma_debt;
    }

    var prompt = "背景：" + ctx + prevInfo +
      "\n本轮探测变量：" + mission.probe +
      "\n任务：" + mission.action +
      "\n话术：" + mission.lines.map(function (l) { return l.text; }).join(" / ") +
      "\n观察指标：" + mission.watch +
      "\n\n用户汇报的对方反应：" + feedback +
      "\n\n根据反应精确评估。严格JSON返回：" + EVAL_SCHEMA[mode];

    callAI(sys, [{ role: "user", content: prompt }]).then(function (raw) {
      var r = parseJSON(raw);
      if (!r) { setErr("解析失败，请重试"); setLoading(false); return; }
      setResult(r);
      setMetrics(function (prev) { return updateMetrics(prev, r, mode); });
      setRounds(function (prev) {
        return prev.concat([{
          mode: mode, probe: mission.probe, task: mission.action,
          feedback: feedback, result: r, ts: Date.now(),
        }]);
      });
      setStep("result"); setLoading(false);
    }).catch(function () { setErr("分析失败，请重试"); setLoading(false); });
  }

  function nextRound() { setFeedback(""); setResult(null); setMission(null); getMission(); }
  function switchMode() { setFeedback(""); setResult(null); setMission(null); setStep("mode"); }
  function restart() {
    setStep("input"); setCtx(""); setMode("quick"); setMission(null);
    setFeedback(""); setResult(null); setRounds([]); setMetrics({}); setErr("");
  }

  // ── Styles ──
  var modeColor = MODES[mode] ? MODES[mode].color : "#e8927c";
  var probeInfo = mission && ALL_VARS[mission.probe] ? ALL_VARS[mission.probe] : { label: "?", color: modeColor };

  var bx = {
    background: "rgba(255,255,255,0.025)", borderRadius: 8,
    padding: 14, border: "1px solid rgba(255,255,255,0.04)", marginBottom: 10,
  };
  var b1 = {
    width: "100%", padding: "11px 0", background: modeColor + "18",
    color: modeColor, border: "1px solid " + modeColor + "35", borderRadius: 7,
    fontSize: 13, cursor: "pointer", fontWeight: 600, letterSpacing: 1,
  };
  var b2 = {
    padding: "11px 0", background: "transparent", color: "rgba(224,214,204,0.3)",
    border: "1px solid rgba(255,255,255,0.05)", borderRadius: 7, fontSize: 11, cursor: "pointer",
  };
  var inp = {
    width: "100%", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 7, padding: 11, color: "#e0d6cc", fontSize: 13,
    lineHeight: "1.7", resize: "vertical", boxSizing: "border-box", outline: "none",
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0a09", color: "#e0d6cc",
      padding: "24px 14px", display: "flex", justifyContent: "center",
    }}>
      <style>{
        "@keyframes spin{to{transform:rotate(360deg)}}" +
        "@keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}" +
        "::selection{background:rgba(232,146,124,.3)}"
      }</style>

      <div style={{ maxWidth: 460, width: "100%" }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 9, letterSpacing: 5, color: "rgba(224,214,204,0.12)" }}>
            INTIMATE RELATION DYNAMICS
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 0", color: "#e8927c", letterSpacing: 2 }}>
            沦陷度检测指导系统
          </h1>
          {rounds.length > 0 && (
            <div style={{ fontSize: 10, color: "rgba(224,214,204,0.2)", marginTop: 5, display: "flex", justifyContent: "center", gap: 10 }}>
              <span>R{rounds.length}</span>
              {metrics.F_R !== undefined && <span>F_R={metrics.F_R}</span>}
              {metrics.phase && <span>{metrics.phase}</span>}
              <span style={{ color: modeColor }}>{MODES[mode].name}</span>
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {err && (
          <div style={{
            background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.15)",
            borderRadius: 7, padding: "8px 12px", marginBottom: 12,
            fontSize: 11, color: "#ff6b6b", textAlign: "center",
          }}>
            {err}
            <span onClick={function () { setErr(""); }} style={{ marginLeft: 8, cursor: "pointer", opacity: 0.5 }}>x</span>
          </div>
        )}

        {/* ══════════════ INPUT ══════════════ */}
        {step === "input" && !loading && (
          <div style={{ animation: "fi .5s ease" }}>
            <div style={{ fontSize: 12, color: "rgba(224,214,204,0.4)", marginBottom: 10, lineHeight: 1.8 }}>
              描述你们的关系。我会部署探测任务，你去执行，回来告诉我她的反应。
            </div>
            <textarea value={ctx} onChange={function (e) { setCtx(e.target.value); }}
              placeholder={"认识多久、什么关系、互动频率、回消息速度、最近的变化..."} rows={5} style={inp} />
            <div style={{ height: 10 }} />
            <button onClick={function () { if (ctx.trim()) setStep("mode"); }}
              disabled={!ctx.trim()}
              style={Object.assign({}, b1, { opacity: ctx.trim() ? 1 : 0.4, background: "#e8927c18", color: "#e8927c", borderColor: "#e8927c35" })}>
              下一步
            </button>
          </div>
        )}

        {/* ══════════════ MODE SELECT ══════════════ */}
        {step === "mode" && !loading && (
          <div style={{ animation: "fi .5s ease" }}>
            <div style={{ fontSize: 12, color: "rgba(224,214,204,0.4)", marginBottom: 14, lineHeight: 1.8 }}>
              选择诊断深度。
            </div>
            {["quick", "standard", "deep"].map(function (mk) {
              var m = MODES[mk];
              var selected = mode === mk;
              return (
                <div key={mk} onClick={function () { setMode(mk); }}
                  style={{
                    background: selected ? m.color + "10" : "rgba(255,255,255,0.02)",
                    border: "1px solid " + (selected ? m.color + "40" : "rgba(255,255,255,0.04)"),
                    borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
                    transition: "all .2s ease",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 4,
                      background: selected ? m.color : "rgba(255,255,255,0.1)",
                    }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: selected ? m.color : "rgba(224,214,204,0.6)" }}>
                      {m.name}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(224,214,204,0.2)" }}>{m.sub}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(224,214,204,0.3)", paddingLeft: 16 }}>{m.desc}</div>
                </div>
              );
            })}
            <div style={{ height: 6 }} />
            <button onClick={getMission}
              style={Object.assign({}, b1, { background: MODES[mode].color + "18", color: MODES[mode].color, borderColor: MODES[mode].color + "35" })}>
              部署探测
            </button>
            {rounds.length > 0 && (
              <button onClick={function () { setStep(result ? "result" : "dashboard"); }}
                style={Object.assign({}, b2, { width: "100%", marginTop: 6 })}>
                返回
              </button>
            )}
          </div>
        )}

        {/* ══════════════ MISSION ══════════════ */}
        {step === "mission" && !loading && mission && (
          <div style={{ animation: "fi .5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <div style={{
                padding: "2px 9px", borderRadius: 10, fontSize: 10,
                background: probeInfo.color + "15", color: probeInfo.color,
                border: "1px solid " + probeInfo.color + "25",
              }}>
                {mission.probe_name || mission.probe}
              </div>
              <div style={{ fontSize: 11, color: "rgba(224,214,204,0.35)" }}>{mission.intent}</div>
              <div style={{ marginLeft: "auto", fontSize: 9, color: modeColor + "60" }}>
                {MODES[mode].name} #{rounds.length + 1}
              </div>
            </div>

            {/* Lines */}
            <div style={bx}>
              <div style={{ fontSize: 9, color: "rgba(224,214,204,0.25)", letterSpacing: 1, marginBottom: 8 }}>
                话术 · 点击复制
              </div>
              {mission.lines && mission.lines.map(function (l, i) {
                return (
                  <div key={i} style={{ marginBottom: i < mission.lines.length - 1 ? 8 : 0 }}>
                    <div onClick={function () { if (navigator.clipboard) navigator.clipboard.writeText(l.text); }}
                      style={{
                        background: probeInfo.color + "08",
                        borderLeft: "2px solid " + probeInfo.color + "40",
                        borderRadius: "6px 6px 6px 1px", padding: "8px 10px",
                        fontSize: 14, lineHeight: 1.7, cursor: "pointer",
                      }}>
                      {l.text}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(224,214,204,0.18)", marginTop: 2, paddingLeft: 5 }}>
                      {l.when}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action */}
            <div style={Object.assign({}, bx, { borderLeft: "2px solid #7cc5e8" })}>
              <div style={{ fontSize: 9, color: "#7cc5e8", letterSpacing: 1, marginBottom: 4 }}>行动</div>
              <div style={{ fontSize: 12, lineHeight: 1.8, color: "rgba(224,214,204,0.65)" }}>{mission.action}</div>
            </div>

            {/* Watch */}
            <div style={Object.assign({}, bx, { borderLeft: "2px solid #a8e87c" })}>
              <div style={{ fontSize: 9, color: "#a8e87c", letterSpacing: 1, marginBottom: 4 }}>观察重点</div>
              <div style={{ fontSize: 12, lineHeight: 1.8, color: "rgba(224,214,204,0.65)" }}>{mission.watch}</div>
            </div>

            {mission.note && (
              <div style={{ fontSize: 10, color: "rgba(255,169,77,0.4)", marginBottom: 10, paddingLeft: 3 }}>
                {"* " + mission.note}
              </div>
            )}

            <button onClick={function () { setStep("report"); }} style={b1}>
              去执行 · 回来汇报
            </button>
          </div>
        )}

        {/* ══════════════ REPORT ══════════════ */}
        {step === "report" && !loading && (
          <div style={{ animation: "fi .5s ease" }}>
            <div style={{ fontSize: 12, color: "rgba(224,214,204,0.4)", marginBottom: 10, lineHeight: 1.8 }}>
              她怎么反应的？重点：回复时间、内容、语气、有无追问、表情符号。越具体越准。
            </div>
            <textarea value={feedback} onChange={function (e) { setFeedback(e.target.value); }}
              placeholder={"比如：过了5分钟回，说'哈哈还行吧'，没追问，发了个微笑表情..."} rows={5} style={inp} />
            <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
              <button onClick={function () { setStep("mission"); }}
                style={Object.assign({}, b2, { flex: 1 })}>回看任务</button>
              <button onClick={analyze} disabled={!feedback.trim()}
                style={Object.assign({}, b1, { flex: 2, opacity: feedback.trim() ? 1 : 0.4 })}>
                提交反应
              </button>
            </div>
          </div>
        )}

        {/* ══════════════ RESULT ══════════════ */}
        {step === "result" && !loading && result && (
          <div style={{ animation: "fi .7s ease" }}>

            {/* Phase + Score */}
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              {/* Quick: signal badge; Standard/Deep: phase badge */}
              {mode === "quick" && result.signal && (
                <span style={{
                  display: "inline-block", padding: "3px 14px", borderRadius: 12, fontSize: 11,
                  fontWeight: 700, letterSpacing: 2,
                  color: SIGNAL_COLORS[result.signal] || "#ffd43b",
                  background: (SIGNAL_COLORS[result.signal] || "#ffd43b") + "12",
                  border: "1px solid " + (SIGNAL_COLORS[result.signal] || "#ffd43b") + "25",
                }}>{result.signal}</span>
              )}
              {mode !== "quick" && result.phase && (
                <span style={{
                  display: "inline-block", padding: "3px 14px", borderRadius: 12, fontSize: 11,
                  fontWeight: 700, letterSpacing: 2,
                  color: PHASE_COLORS[result.phase] || "#ffd43b",
                  background: (PHASE_COLORS[result.phase] || "#ffd43b") + "12",
                  border: "1px solid " + (PHASE_COLORS[result.phase] || "#ffd43b") + "25",
                }}>{result.phase}</span>
              )}
              <div style={{ fontSize: 44, fontWeight: 900, color: modeColor, marginTop: 8 }}>
                {result.F_R}
              </div>
              <div style={{ fontSize: 10, color: "rgba(224,214,204,0.25)", letterSpacing: 2 }}>
                {mode === "quick" && result.label ? result.label + " · " : ""}F_R 关系力
              </div>
            </div>

            {/* Reading */}
            <div style={Object.assign({}, bx, { fontSize: 13, lineHeight: 2, color: "rgba(224,214,204,0.75)" })}>
              {result.reading}
            </div>

            {/* ── Mode-specific middle section ── */}

            {/* Quick: S/I/D bars */}
            {mode === "quick" && (
              <div style={bx}>
                {["S", "I", "D"].map(function (k, i) {
                  var v = result[k] || 0;
                  var vi = ALL_VARS[k];
                  return (
                    <div key={k} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: vi.color }}>{vi.label} {vi.full}</span>
                        <span style={{ fontSize: 10, color: "rgba(224,214,204,0.2)" }}>{v}</span>
                      </div>
                      <Bar value={v} color={vi.color} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Standard: tau diagnosis + bars */}
            {mode === "standard" && (
              <div>
                {/* tau diagnosis card */}
                <div style={Object.assign({}, bx, {
                  background: result.delta_tau > 50 ? "rgba(255,107,107,0.05)" : "rgba(124,197,232,0.04)",
                  borderColor: result.delta_tau > 50 ? "rgba(255,107,107,0.1)" : "rgba(124,197,232,0.08)",
                })}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: result.delta_tau > 50 ? "#ff6b6b" : "#7cc5e8", letterSpacing: 1 }}>
                      tau 不对称诊断
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: result.delta_tau > 50 ? "#ff6b6b" : "#7cc5e8" }}>
                      Dtau={result.delta_tau}{result.P_ratio ? " P=" + result.P_ratio : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(224,214,204,0.55)", lineHeight: 1.7 }}>
                    {result.tau_diagnosis}
                  </div>
                </div>

                {/* Variable bars */}
                <div style={bx}>
                  {["tau_her", "tau_you", "D_want", "D_feedback", "I_n"].map(function (k, i) {
                    var v = result[k] || 0;
                    var vi = ALL_VARS[k];
                    return (
                      <div key={k} style={{ marginBottom: i < 4 ? 10 : 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: vi.color }}>{vi.label}</span>
                          <span style={{ fontSize: 10, color: "rgba(224,214,204,0.2)" }}>{v}</span>
                        </div>
                        <Bar value={v} color={vi.color} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deep: Causal + Quad + indicators + bars */}
            {mode === "deep" && (
              <div>
                {/* Causal layers */}
                {(result.C_H || result.C_V) && (
                  <div style={Object.assign({}, bx, { background: "rgba(196,155,222,0.03)", borderColor: "rgba(196,155,222,0.08)" })}>
                    <div style={{ fontSize: 8, color: "#c49bde", letterSpacing: 1, marginBottom: 6 }}>因果分层</div>
                    <div style={{ fontSize: 11, color: "rgba(224,214,204,0.4)", lineHeight: 1.6, marginBottom: 4 }}>
                      <span style={{ color: "rgba(224,214,204,0.25)" }}>C_H 横向：</span>{result.C_H}
                    </div>
                    <div style={{ textAlign: "center", fontSize: 10, color: "rgba(196,155,222,0.25)" }}>- 蕴含 -</div>
                    <div style={{ fontSize: 12, color: "rgba(196,155,222,0.7)", lineHeight: 1.7, marginTop: 4, paddingLeft: 8, borderLeft: "2px solid rgba(196,155,222,0.2)" }}>
                      <span style={{ fontSize: 9, color: "rgba(196,155,222,0.4)" }}>C_V 纵向：</span><br />{result.C_V}
                    </div>
                  </div>
                )}

                {/* Quad chart */}
                {(result.Q1 !== undefined || result.Q2 !== undefined) && (
                  <div style={bx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 8, color: "rgba(224,214,204,0.2)", letterSpacing: 1 }}>四象限 R</span>
                      {result.quad_weakest && (
                        <span style={{ fontSize: 9, color: "rgba(224,214,204,0.15)" }}>{result.quad_weakest}</span>
                      )}
                    </div>
                    <QuadChart q1={result.Q1 || 0} q2={result.Q2 || 0} q3={result.Q3 || 0} q4={result.Q4 || 0} />
                  </div>
                )}

                {/* Three indicator cards: Dtau, P, Sigma */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                  <div style={Object.assign({}, bx, { marginBottom: 0, textAlign: "center", background: (result.tau_asym || 0) > 50 ? "rgba(255,107,107,0.04)" : "rgba(232,146,124,0.03)" })}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: (result.tau_asym || 0) > 50 ? "#ff6b6b" : "#e8927c" }}>{result.tau_asym || 0}</div>
                    <div style={{ fontSize: 8, color: "rgba(224,214,204,0.2)" }}>Dtau</div>
                    {result.tau_dir && <div style={{ fontSize: 8, color: "rgba(224,214,204,0.15)", marginTop: 2 }}>{result.tau_dir}</div>}
                  </div>
                  <div style={Object.assign({}, bx, { marginBottom: 0, textAlign: "center" })}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#f0c674" }}>{result.P_ratio || "-"}</div>
                    <div style={{ fontSize: 8, color: "rgba(224,214,204,0.2)" }}>P 权力比</div>
                    <div style={{ fontSize: 8, color: "rgba(224,214,204,0.15)", marginTop: 2 }}>
                      {result.P_ratio ? (parseFloat(result.P_ratio) > 1 ? "你有权力" : parseFloat(result.P_ratio) < 1 ? "她有权力" : "对等") : ""}
                    </div>
                  </div>
                  <div style={Object.assign({}, bx, { marginBottom: 0, textAlign: "center", background: (result.sigma_debt || 0) > 60 ? "rgba(204,102,102,0.05)" : "rgba(204,102,102,0.02)" })}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: (result.sigma_debt || 0) > 60 ? "#ff6b6b" : "#cc6666" }}>{result.sigma_debt || 0}</div>
                    <div style={{ fontSize: 8, color: "rgba(224,214,204,0.2)" }}>Sigma</div>
                    {result.sigma_signs && <div style={{ fontSize: 8, color: "rgba(224,214,204,0.15)", marginTop: 2, lineHeight: 1.3 }}>{(result.sigma_signs || "").slice(0, 18)}</div>}
                  </div>
                </div>

                {/* Dimension bars */}
                <div style={bx}>
                  {[
                    ["tau_asym", result.tau_asym, true],
                    ["D_want", result.D_want, false],
                    ["I_n", result.I_n, false],
                    ["theta_OC", result.theta_OC, false],
                    ["sigma_debt", result.sigma_debt, true],
                  ].map(function (item, i) {
                    var k = item[0], v = item[1] || 0, inv = item[2];
                    var vi = ALL_VARS[k] || { label: k, color: "#aaa" };
                    return (
                      <div key={k} style={{ marginBottom: i < 4 ? 8 : 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 9, color: vi.color }}>{vi.label} {vi.full}</span>
                          <span style={{ fontSize: 9, color: "rgba(224,214,204,0.18)" }}>
                            {v}
                            {k === "I_n" && result.I_n_level ? " " + result.I_n_level : ""}
                            {k === "theta_OC" ? (v < 35 ? " 偏秩序" : v > 65 ? " 偏创造" : " 平衡") : ""}
                          </span>
                        </div>
                        <Bar value={v} color={inv && v > 50 ? "#ff6b6b" : vi.color} />
                      </div>
                    );
                  })}
                </div>

                {/* tau sync + sigma rx */}
                {(result.tau_sync || result.sigma_rx) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                    {result.tau_sync && (
                      <div style={Object.assign({}, bx, { marginBottom: 0, background: "rgba(124,197,232,0.03)", borderColor: "rgba(124,197,232,0.06)" })}>
                        <div style={{ fontSize: 8, color: "#7cc5e8", letterSpacing: 1, marginBottom: 2 }}>tau校准</div>
                        <div style={{ fontSize: 10, color: "rgba(224,214,204,0.5)", lineHeight: 1.6 }}>{result.tau_sync}</div>
                      </div>
                    )}
                    {result.sigma_rx && (
                      <div style={Object.assign({}, bx, { marginBottom: 0, background: "rgba(204,102,102,0.03)", borderColor: "rgba(204,102,102,0.06)" })}>
                        <div style={{ fontSize: 8, color: "#cc6666", letterSpacing: 1, marginBottom: 2 }}>Sigma消化</div>
                        <div style={{ fontSize: 10, color: "rgba(224,214,204,0.5)", lineHeight: 1.6 }}>{result.sigma_rx}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Common: Micro signals ── */}
            {result.micro_signals && result.micro_signals.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {result.micro_signals.map(function (s, i) {
                  return (
                    <span key={i} style={{
                      padding: "3px 9px", borderRadius: 12, fontSize: 10,
                      background: modeColor + "08", color: "rgba(224,214,204,0.5)",
                      border: "1px solid " + modeColor + "12",
                    }}>{s}</span>
                  );
                })}
              </div>
            )}

            {/* ── Common: Action ── */}
            <div style={Object.assign({}, bx, { background: modeColor + "06", borderColor: modeColor + "12" })}>
              <div style={{ fontSize: 9, color: modeColor, letterSpacing: 1, marginBottom: 4 }}>下一步行动</div>
              <div style={{ fontSize: 12, color: "rgba(224,214,204,0.6)", lineHeight: 1.8 }}>{result.action}</div>
            </div>

            {/* Standard: sync advice */}
            {mode === "standard" && result.sync_advice && (
              <div style={Object.assign({}, bx, { background: "rgba(124,197,232,0.04)", borderColor: "rgba(124,197,232,0.08)" })}>
                <div style={{ fontSize: 9, color: "#7cc5e8", letterSpacing: 1, marginBottom: 4 }}>tau 校准建议</div>
                <div style={{ fontSize: 12, color: "rgba(224,214,204,0.6)", lineHeight: 1.8 }}>{result.sync_advice}</div>
              </div>
            )}

            {/* ── Nav buttons ── */}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={function () { setStep("dashboard"); }} style={Object.assign({}, b2, { flex: 1 })}>仪表盘</button>
              <button onClick={switchMode} style={Object.assign({}, b2, { flex: 1 })}>换模式</button>
              <button onClick={nextRound} style={Object.assign({}, b1, { flex: 2 })}>下一轮</button>
            </div>
          </div>
        )}

        {/* ══════════════ DASHBOARD ══════════════ */}
        {step === "dashboard" && (
          <div style={{ animation: "fi .5s ease" }}>
            <div style={{ fontSize: 10, color: "rgba(224,214,204,0.2)", letterSpacing: 1, marginBottom: 14 }}>
              累积诊断仪表盘 · {rounds.length} 轮数据
            </div>

            {rounds.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(224,214,204,0.12)", padding: 40, fontSize: 12 }}>
                完成至少一轮探测后，数据将在这里汇聚
              </div>
            )}

            {rounds.length > 0 && (
              <div>
                {/* F_R + Phase */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  {metrics.phase && (
                    <span style={{
                      display: "inline-block", padding: "2px 12px", borderRadius: 10, fontSize: 10,
                      fontWeight: 700, letterSpacing: 2,
                      color: PHASE_COLORS[metrics.phase] || "#ffd43b",
                      background: (PHASE_COLORS[metrics.phase] || "#ffd43b") + "10",
                      border: "1px solid " + (PHASE_COLORS[metrics.phase] || "#ffd43b") + "20",
                    }}>{metrics.phase}</span>
                  )}
                  <div style={{ fontSize: 48, fontWeight: 900, color: "#e8927c", marginTop: 6 }}>
                    {metrics.F_R !== undefined ? metrics.F_R : "--"}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(224,214,204,0.2)", letterSpacing: 2 }}>
                    F_R 关系力{metrics.label ? " · " + metrics.label : ""}
                  </div>
                </div>

                {/* Quick metrics (if available) */}
                {metrics.S !== undefined && (
                  <div style={bx}>
                    <div style={{ fontSize: 9, color: "#e8927c", letterSpacing: 1, marginBottom: 8 }}>
                      猜疑链动力学 E=SxIxD{metrics.signal ? " · " + metrics.signal : ""}
                    </div>
                    {["S", "I", "D"].map(function (k, i) {
                      var v = metrics[k] || 0;
                      var vi = ALL_VARS[k];
                      return (
                        <div key={k} style={{ marginBottom: i < 2 ? 8 : 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 9, color: vi.color }}>{vi.label} {vi.full}</span>
                            <span style={{ fontSize: 9, color: "rgba(224,214,204,0.18)" }}>{v}</span>
                          </div>
                          <Bar value={v} color={vi.color} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Standard metrics (if available) */}
                {metrics.tau_her !== undefined && (
                  <div style={bx}>
                    <div style={{ fontSize: 9, color: "#7cc5e8", letterSpacing: 1, marginBottom: 8 }}>
                      tau 动态{metrics.P_ratio ? " · P=" + metrics.P_ratio : ""}
                    </div>
                    {["tau_her", "tau_you", "D_want", "D_feedback", "I_n"].map(function (k, i) {
                      if (metrics[k] === undefined) return null;
                      var vi = ALL_VARS[k];
                      return (
                        <div key={k} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 9, color: vi.color }}>{vi.label}</span>
                            <span style={{ fontSize: 9, color: "rgba(224,214,204,0.18)" }}>{metrics[k]}</span>
                          </div>
                          <Bar value={metrics[k]} color={vi.color} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Deep: Quad chart (if available) */}
                {metrics.Q1 !== undefined && (
                  <div style={bx}>
                    <div style={{ fontSize: 9, color: "#c49bde", letterSpacing: 1, marginBottom: 8 }}>四象限分布</div>
                    <QuadChart q1={metrics.Q1 || 0} q2={metrics.Q2 || 0} q3={metrics.Q3 || 0} q4={metrics.Q4 || 0} />
                  </div>
                )}

                {/* Key indicators row */}
                {(metrics.delta_tau !== undefined || metrics.sigma_debt !== undefined) && (
                  <div style={{ display: "grid", gridTemplateColumns: metrics.sigma_debt !== undefined ? "1fr 1fr 1fr" : "1fr 1fr", gap: 6, marginBottom: 8 }}>
                    {metrics.delta_tau !== undefined && (
                      <div style={Object.assign({}, bx, { marginBottom: 0, textAlign: "center" })}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: metrics.delta_tau > 50 ? "#ff6b6b" : "#e8927c" }}>{metrics.delta_tau}</div>
                        <div style={{ fontSize: 8, color: "rgba(224,214,204,0.2)" }}>Dtau</div>
                      </div>
                    )}
                    {metrics.P_ratio !== undefined && (
                      <div style={Object.assign({}, bx, { marginBottom: 0, textAlign: "center" })}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#f0c674" }}>{metrics.P_ratio}</div>
                        <div style={{ fontSize: 8, color: "rgba(224,214,204,0.2)" }}>P 权力比</div>
                      </div>
                    )}
                    {metrics.sigma_debt !== undefined && (
                      <div style={Object.assign({}, bx, { marginBottom: 0, textAlign: "center" })}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: metrics.sigma_debt > 60 ? "#ff6b6b" : "#cc6666" }}>{metrics.sigma_debt}</div>
                        <div style={{ fontSize: 8, color: "rgba(224,214,204,0.2)" }}>Sigma</div>
                      </div>
                    )}
                  </div>
                )}

                {/* C_V (if available) */}
                {metrics.C_V && (
                  <div style={Object.assign({}, bx, { background: "rgba(196,155,222,0.03)", borderColor: "rgba(196,155,222,0.08)" })}>
                    <div style={{ fontSize: 8, color: "#c49bde", letterSpacing: 1, marginBottom: 4 }}>纵向因果 C_V</div>
                    <div style={{ fontSize: 12, color: "rgba(196,155,222,0.6)", lineHeight: 1.7 }}>{metrics.C_V}</div>
                  </div>
                )}

                {/* Trend */}
                <TrendChart rounds={rounds} style={bx} />

                {/* Mode breakdown */}
                <div style={bx}>
                  <div style={{ fontSize: 9, color: "rgba(224,214,204,0.18)", letterSpacing: 1, marginBottom: 6 }}>模式分布</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["quick", "standard", "deep"].map(function (mk) {
                      var count = rounds.filter(function (r) { return r.mode === mk; }).length;
                      if (count === 0) return null;
                      return (
                        <span key={mk} style={{ fontSize: 10, color: MODES[mk].color }}>
                          {MODES[mk].name} x{count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Nav */}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={function () { setStep("history"); }} style={Object.assign({}, b2, { flex: 1 })}>历史</button>
              <button onClick={switchMode} style={Object.assign({}, b2, { flex: 1 })}>换模式</button>
              <button onClick={function () { setStep(result ? "result" : "mode"); }}
                style={Object.assign({}, b1, { flex: 2, background: "#e8927c18", color: "#e8927c", borderColor: "#e8927c35" })}>
                继续探测
              </button>
            </div>
          </div>
        )}

        {/* ══════════════ HISTORY ══════════════ */}
        {step === "history" && (
          <div style={{ animation: "fi .5s ease" }}>
            <div style={{ fontSize: 10, color: "rgba(224,214,204,0.2)", letterSpacing: 1, marginBottom: 12 }}>
              探测记录 ({rounds.length})
            </div>

            {rounds.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(224,214,204,0.12)", padding: 28, fontSize: 11 }}>无</div>
            )}

            {rounds.map(function (h, i) {
              var mc = MODES[h.mode] ? MODES[h.mode].color : "#e8927c";
              var vi = ALL_VARS[h.probe] || { label: h.probe, color: mc };
              return (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.02)", borderRadius: 7, padding: 10,
                  border: "1px solid rgba(255,255,255,0.03)", marginBottom: 6,
                  borderLeft: "3px solid " + mc,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 9, color: mc, fontWeight: 600 }}>{MODES[h.mode] ? MODES[h.mode].name : h.mode}</span>
                      <span style={{ fontSize: 9, color: vi.color }}>{vi.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: mc }}>F_R={h.result.F_R}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(224,214,204,0.35)", lineHeight: 1.5 }}>{h.task}</div>
                  <div style={{ fontSize: 9, color: "rgba(224,214,204,0.2)", marginTop: 3 }}>
                    {h.result.phase || ""}{h.result.signal ? " " + h.result.signal : ""}
                  </div>
                </div>
              );
            })}

            <TrendChart rounds={rounds} style={Object.assign({}, bx, { marginTop: 10 })} />

            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button onClick={restart} style={Object.assign({}, b2, { flex: 1 })}>重置</button>
              <button onClick={function () { setStep("dashboard"); }} style={Object.assign({}, b2, { flex: 1 })}>仪表盘</button>
              <button onClick={function () { setStep(result ? "result" : "mode"); }}
                style={Object.assign({}, b1, { flex: 2, background: "#e8927c18", color: "#e8927c", borderColor: "#e8927c35" })}>
                继续
              </button>
            </div>
          </div>
        )}

        {loading && <Spinner text={
          step === "report" ? (mode === "deep" ? "六维诊断 + 纵向因果..." : mode === "standard" ? "tau 计算中..." : "评估中...") : "部署中..."
        } />}

        <div ref={btm} />
        <div style={{ textAlign: "center", marginTop: 32, fontSize: 8, color: "rgba(224,214,204,0.06)" }}>
          所有模型都不对 但有些模型有用 · tau(A=A) = infinity
        </div>
      </div>
    </div>
  );
}
