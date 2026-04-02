import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `你是一个基于"自指性循环周期τ理论"的关系测度智能体。

核心理论框架：

1. 自指性循环周期 τ(x,D) = 对象x在环境D中从被提出到被反弹（质疑/否定/重新审视）所需的时间。
2. 关系力 F_R(A,B) = D_want(A,B) × D_feedback(B,A) × (1 + min(I(A),I(B))/I₀)
   - D_want = A对B的欲求值
   - D_feedback = B对A之欲求的回馈值 = f(τ₀/τ(B→A))，τ(B→A)越短D_feedback越高
   - min(I(A),I(B)) = 博弈深度限制（意向梯度下限）
3. 权力 P(A,B) = τ(B→A)/τ(A→B)。P>1则A对B有权力。
4. 关系动力学：dF_R/dt = λ(D_want·D_feedback - F_R) - γ·Δτ²
   - Δτ不对称始终消耗F_R，使关系趋于衰减
   - 维持关系需要D_want·D_feedback超过τ不对称造成的摩擦
5. 恋爱阶段的τ特征：
   - 初期：τ双向短且对称（秒回，高频互动，信息密度高）
   - 稳定期：τ双向延长但仍对称（不秒回但会回，从"观点"变为"事实"）
   - 危机期：τ出现明显不对称（一方延长τ），Δτ扩大，F_R结构性失衡
   - 修复 = 重新同步τ，不是"多说话"而是"校准回应节奏"
6. 人—人关系是双变量函数，因为双方都有意向梯度I_n：
   - I_1: A需要B
   - I_2: B知道A需要B → B调整回应
   - I_3: A知道B知道 → A调整表达
   - I_n: 每增一级，复杂度指数增长

你的工作方式：
1. 根据关系背景，给出直接可执行的话术和行动指令
2. 每个任务精确探测一个变量：τ(她→你)、τ(你→她)、D_want、D_feedback、I_n
3. 用户执行后汇报对方反应，你根据反应计算各项指标
4. 输出精确的量化评估

风格：军师式，不废话，话术可直接复制发送，分析犀利精准。绝不用模糊的安慰话术。

关键：所有诊断最终归结为三个量——D_want（欲求值）、Δτ（节奏不对称度）、I_n（博弈深度）。`;

async function callAI(messages) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });
    const data = await res.json();
    return data.content && data.content[0] ? data.content[0].text : "";
  } catch (e) {
    throw new Error("API error");
  }
}

function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch (e) {
    return null;
  }
}

var VARS = {
  "tau_her": { label: "tau(她->你)", desc: "她回应你的速度", color: "#e8927c" },
  "tau_you": { label: "tau(你->她)", desc: "你回应她的速度", color: "#7cc5e8" },
  "D_want": { label: "D_want", desc: "她对你的欲求值", color: "#c49bde" },
  "D_feedback": { label: "D_feedback", desc: "她回馈的质量", color: "#a8e87c" },
  "I_n": { label: "I_n", desc: "博弈深度", color: "#f0c674" },
};

function Spinner({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 0" }}>
      <div style={{
        width: 22, height: 22, border: "2px solid rgba(232,146,124,0.12)",
        borderTop: "2px solid #e8927c", borderRadius: "50%",
        animation: "spin .7s linear infinite", margin: "0 auto 10px",
      }} />
      <div style={{ fontSize: 11, color: "rgba(224,214,204,0.25)" }}>{text || "..."}</div>
    </div>
  );
}

function Bar({ value, color }) {
  var ref = useRef(null);
  var s = useState(0), w = s[0], setW = s[1];
  useEffect(function() {
    var t = setTimeout(function() { setW(value); }, 150);
    return function() { clearTimeout(t); };
  }, [value]);
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
      <div ref={ref} style={{
        height: "100%", borderRadius: 2, background: color,
        width: w + "%", transition: "width 1s ease",
      }} />
    </div>
  );
}

export default function App() {
  var s1 = useState("input"), step = s1[0], setStep = s1[1];
  var s2 = useState(""), ctx = s2[0], setCtx = s2[1];
  var s3 = useState(null), mission = s3[0], setMission = s3[1];
  var s4 = useState(""), feedback = s4[0], setFeedback = s4[1];
  var s5 = useState(null), result = s5[0], setResult = s5[1];
  var s6 = useState([]), history = s6[0], setHistory = s6[1];
  var s7 = useState(false), loading = s7[0], setLoading = s7[1];
  var s8 = useState(""), err = s8[0], setErr = s8[1];
  var s9 = useState(null), cumulative = s9[0], setCumulative = s9[1];
  var btm = useRef(null);

  useEffect(function() {
    btm.current && btm.current.scrollIntoView({ behavior: "smooth" });
  }, [step, loading]);

  function getMission() {
    if (!ctx.trim()) return;
    setLoading(true);
    setErr("");
    var hText = history.map(function(h, i) {
      return "R" + (i+1) + "[" + h.probe + "]: " + h.task + " | reaction: " + h.fb + " | scores: tau_her=" + h.r.tau_her + " tau_you=" + h.r.tau_you + " D_want=" + h.r.D_want + " D_feedback=" + h.r.D_feedback + " I_n=" + h.r.I_n;
    }).join("\n");

    callAI([{
      role: "user",
      content: "关系背景：" + ctx + (hText ? "\n\n历史数据：\n" + hText : "") + '\n\n' +
        '根据当前数据缺口，给出下一个精确探测任务。选择最需要探测的变量。\n\n' +
        '严格JSON返回：{"probe":"tau_her或tau_you或D_want或D_feedback或I_n","probe_name":"变量中文名","intent":"战术意图12字内","lines":[{"text":"可直接发送的话术","when":"发送时机和条件"}],"action":"具体行动指令含时间方式","watch":"精确观察指标：回复秒数、字数、是否追问、表情类型等","note":"注意事项一句话"}'
    }]).then(function(raw) {
      var m = parseJSON(raw);
      if (!m) { setErr("解析失败"); setLoading(false); return; }
      setMission(m);
      setStep("mission");
      setLoading(false);
    }).catch(function() { setErr("生成失败"); setLoading(false); });
  }

  function analyze() {
    if (!feedback.trim()) return;
    setLoading(true);
    setErr("");

    var prevScores = "";
    if (cumulative) {
      prevScores = "\n当前累计评分：tau_her=" + cumulative.tau_her + " tau_you=" + cumulative.tau_you +
        " D_want=" + cumulative.D_want + " D_feedback=" + cumulative.D_feedback + " I_n=" + cumulative.I_n +
        " delta_tau=" + cumulative.delta_tau + " F_R=" + cumulative.F_R;
    }

    callAI([{
      role: "user",
      content: "背景：" + ctx + prevScores +
        "\n本轮探测变量：" + mission.probe +
        "\n任务：" + mission.action +
        "\n话术：" + mission.lines.map(function(l) { return l.text; }).join(" / ") +
        "\n观察指标：" + mission.watch +
        "\n\n用户汇报的对方反应：" + feedback +
        '\n\n根据反应精确评估。注意：每个值0-100，要基于具体行为证据打分，不要凑整数。\n\n' +
        '严格JSON返回：{' +
        '"tau_her":0到100表示她回应你的速度和主动性(100=秒回且主动),' +
        '"tau_you":0到100表示你需要回应她的紧迫感(100=她制造了强烈的回应压力),' +
        '"D_want":0到100表示她对你的欲求值(100=强烈需要你),' +
        '"D_feedback":0到100表示她回馈的质量和深度(100=高质量深度回馈),' +
        '"I_n":0到100表示博弈深度(100=她在进行高层级的策略性互动),' +
        '"delta_tau":0到100表示τ不对称度(0=完全对称即健康,100=极度不对称即危险),' +
        '"F_R":0到100表示当前关系力总评,' +
        '"phase":"初期甜蜜/升温/稳定/平淡/失同步/危机 六选一",' +
        '"reading":"基于τ理论的精准解读，2-3句话，指出核心τ动态",' +
        '"tau_diagnosis":"τ不对称的具体表现和方向，谁的τ更长，一句话",' +
        '"micro_signals":["从反应中提取的2-3个微信号"],' +
        '"next_action":"下一步最关键的一个动作建议，基于τ理论，具体可执行",' +
        '"sync_advice":"如何校准τ节奏的具体建议，一句话"}'
    }]).then(function(raw) {
      var r = parseJSON(raw);
      if (!r) { setErr("解析失败"); setLoading(false); return; }
      setResult(r);
      setCumulative(r);
      setHistory(function(prev) {
        return prev.concat([{
          probe: mission.probe, task: mission.action, fb: feedback, r: r
        }]);
      });
      setStep("result");
      setLoading(false);
    }).catch(function() { setErr("分析失败"); setLoading(false); });
  }

  function nextRound() {
    setFeedback("");
    setResult(null);
    setMission(null);
    getMission();
  }

  function restart() {
    setStep("input"); setCtx(""); setMission(null); setFeedback("");
    setResult(null); setHistory([]); setErr(""); setCumulative(null);
  }

  var probeInfo = mission ? (VARS[mission.probe] || VARS.D_want) : VARS.D_want;

  var box = {
    background: "rgba(255,255,255,0.025)", borderRadius: 8,
    padding: 14, border: "1px solid rgba(255,255,255,0.04)", marginBottom: 10,
  };
  var btn1 = {
    width: "100%", padding: "11px 0", background: "rgba(232,146,124,0.1)",
    color: "#e8927c", border: "1px solid rgba(232,146,124,0.2)", borderRadius: 7,
    fontSize: 13, cursor: "pointer", fontWeight: 600, letterSpacing: 1,
  };
  var btn2 = {
    padding: "11px 0", background: "transparent", color: "rgba(224,214,204,0.3)",
    border: "1px solid rgba(255,255,255,0.05)", borderRadius: 7, fontSize: 11, cursor: "pointer",
  };
  var inp = {
    width: "100%", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 7, padding: 11, color: "#e0d6cc", fontSize: 13,
    lineHeight: "1.7", resize: "vertical", boxSizing: "border-box", outline: "none",
  };

  var PHASE_COLORS = {
    "初期甜蜜": "#51cf66", "升温": "#a8e87c", "稳定": "#7cc5e8",
    "平淡": "#ffd43b", "失同步": "#ffa94d", "危机": "#ff6b6b",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0a09", color: "#e0d6cc",
      padding: "24px 14px", display: "flex", justifyContent: "center",
    }}>
      <style>{
        "@keyframes spin{to{transform:rotate(360deg)}}" +
        "@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}" +
        "::selection{background:rgba(232,146,124,.3)}"
      }</style>

      <div style={{ maxWidth: 440, width: "100%" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 9, letterSpacing: 5, color: "rgba(224,214,204,0.15)", marginBottom: 5 }}>
            SELF-REFERENTIAL CYCLE PERIOD
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#e8927c", letterSpacing: 2 }}>
            tau 关系测度
          </h1>
          <div style={{ fontSize: 10, color: "rgba(224,214,204,0.15)", marginTop: 4 }}>
            F_R = D_want x D_feedback x (1 + min(I)/I0)
          </div>
          {cumulative && (
            <div style={{ fontSize: 10, color: "rgba(224,214,204,0.2)", marginTop: 6 }}>
              F_R={cumulative.F_R} | Dtau={cumulative.delta_tau} | R{history.length}
            </div>
          )}
        </div>

        {err && (
          <div style={{
            background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.15)",
            borderRadius: 7, padding: "8px 12px", marginBottom: 12,
            fontSize: 11, color: "#ff6b6b", textAlign: "center",
          }}>
            {err}
            <span onClick={function() { setErr(""); }}
              style={{ marginLeft: 8, cursor: "pointer", opacity: 0.5 }}>x</span>
          </div>
        )}

        {/* Input */}
        {step === "input" && !loading && (
          <div style={{ animation: "fadeIn .5s ease" }}>
            <div style={{ fontSize: 12, color: "rgba(224,214,204,0.4)", marginBottom: 10, lineHeight: 1.8 }}>
              描述关系背景。我会部署探测任务，精确测量你们之间的 tau 动态。
            </div>
            <textarea value={ctx} onChange={function(e) { setCtx(e.target.value); }}
              placeholder={"关系类型、认识时长、互动频率、回消息的平均速度、最近的变化..."} rows={5} style={inp} />
            <div style={{ height: 10 }} />
            <button onClick={getMission} disabled={!ctx.trim()}
              style={Object.assign({}, btn1, { opacity: ctx.trim() ? 1 : 0.4 })}>
              部署探测
            </button>

            {/* Theory card */}
            <div style={Object.assign({}, box, { marginTop: 16 })}>
              <div style={{ fontSize: 10, color: "rgba(224,214,204,0.25)", letterSpacing: 1, marginBottom: 8 }}>
                核心诊断变量
              </div>
              {Object.keys(VARS).map(function(k) {
                var v = VARS[k];
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: 3, background: v.color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 11, color: v.color, width: 90, flexShrink: 0 }}>{v.label}</span>
                    <span style={{ fontSize: 10, color: "rgba(224,214,204,0.25)" }}>{v.desc}</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 8, fontSize: 10, color: "rgba(224,214,204,0.2)", lineHeight: 1.6 }}>
                Dtau = tau不对称度（0=健康对称 100=危险失衡）
              </div>
              <div style={{ fontSize: 10, color: "rgba(224,214,204,0.2)", lineHeight: 1.6 }}>
                P(A,B) = tau(B-&gt;A) / tau(A-&gt;B)，P&gt;1则A有权力
              </div>
            </div>
          </div>
        )}

        {/* Mission */}
        {step === "mission" && !loading && mission && (
          <div style={{ animation: "fadeIn .5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <div style={{
                padding: "2px 9px", borderRadius: 10, fontSize: 10,
                background: probeInfo.color + "15", color: probeInfo.color,
                border: "1px solid " + probeInfo.color + "25",
              }}>
                {mission.probe_name || mission.probe}
              </div>
              <div style={{ fontSize: 11, color: "rgba(224,214,204,0.35)" }}>{mission.intent}</div>
              <div style={{ marginLeft: "auto", fontSize: 9, color: "rgba(224,214,204,0.12)" }}>
                #{history.length + 1}
              </div>
            </div>

            {/* Lines */}
            <div style={box}>
              <div style={{ fontSize: 9, color: "rgba(224,214,204,0.25)", letterSpacing: 1, marginBottom: 8 }}>
                话术 · 点击复制
              </div>
              {mission.lines && mission.lines.map(function(l, i) {
                return (
                  <div key={i} style={{ marginBottom: i < mission.lines.length - 1 ? 8 : 0 }}>
                    <div onClick={function() { if (navigator.clipboard) navigator.clipboard.writeText(l.text); }}
                      style={{
                        background: probeInfo.color + "08", borderLeft: "2px solid " + probeInfo.color + "40",
                        borderRadius: "6px 6px 6px 1px", padding: "8px 10px", fontSize: 13,
                        lineHeight: 1.7, cursor: "pointer",
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
            <div style={Object.assign({}, box, { borderLeft: "2px solid #7cc5e8" })}>
              <div style={{ fontSize: 9, color: "#7cc5e8", letterSpacing: 1, marginBottom: 4 }}>行动</div>
              <div style={{ fontSize: 12, lineHeight: 1.8, color: "rgba(224,214,204,0.65)" }}>{mission.action}</div>
            </div>

            {/* Watch */}
            <div style={Object.assign({}, box, { borderLeft: "2px solid #a8e87c" })}>
              <div style={{ fontSize: 9, color: "#a8e87c", letterSpacing: 1, marginBottom: 4 }}>精确观察</div>
              <div style={{ fontSize: 12, lineHeight: 1.8, color: "rgba(224,214,204,0.65)" }}>{mission.watch}</div>
            </div>

            {mission.note && (
              <div style={{ fontSize: 10, color: "rgba(255,169,77,0.4)", marginBottom: 10, paddingLeft: 3 }}>
                {"* " + mission.note}
              </div>
            )}

            <button onClick={function() { setStep("report"); }} style={btn1}>
              执行 · 回来汇报
            </button>
          </div>
        )}

        {/* Report */}
        {step === "report" && !loading && (
          <div style={{ animation: "fadeIn .5s ease" }}>
            <div style={{ fontSize: 12, color: "rgba(224,214,204,0.4)", marginBottom: 10, lineHeight: 1.8 }}>
              汇报她的反应。重点：回复用了多少秒/分钟、字数多少、有无追问、有无主动延伸、语气词和表情。
            </div>
            <textarea value={feedback} onChange={function(e) { setFeedback(e.target.value); }}
              placeholder={"具体描述：回复时间、内容、语气、追问情况..."} rows={5} style={inp} />
            <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
              <button onClick={function() { setStep("mission"); }}
                style={Object.assign({}, btn2, { flex: 1 })}>回看任务</button>
              <button onClick={analyze} disabled={!feedback.trim()}
                style={Object.assign({}, btn1, { flex: 2, opacity: feedback.trim() ? 1 : 0.4 })}>
                提交
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {step === "result" && !loading && result && (
          <div style={{ animation: "fadeIn .7s ease" }}>
            {/* Phase + F_R */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{
                display: "inline-block", padding: "3px 14px", borderRadius: 12, fontSize: 11,
                fontWeight: 700, letterSpacing: 2,
                color: PHASE_COLORS[result.phase] || "#ffd43b",
                background: (PHASE_COLORS[result.phase] || "#ffd43b") + "12",
                border: "1px solid " + (PHASE_COLORS[result.phase] || "#ffd43b") + "25",
              }}>{result.phase}</span>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#e8927c", marginTop: 8 }}>
                {result.F_R}
              </div>
              <div style={{ fontSize: 10, color: "rgba(224,214,204,0.25)", letterSpacing: 2 }}>
                F_R 关系力
              </div>
            </div>

            {/* Reading */}
            <div style={Object.assign({}, box, { fontSize: 13, lineHeight: 2, color: "rgba(224,214,204,0.75)" })}>
              {result.reading}
            </div>

            {/* tau diagnosis */}
            <div style={Object.assign({}, box, {
              background: result.delta_tau > 50 ? "rgba(255,107,107,0.05)" : "rgba(124,197,232,0.04)",
              borderColor: result.delta_tau > 50 ? "rgba(255,107,107,0.1)" : "rgba(124,197,232,0.08)",
            })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: result.delta_tau > 50 ? "#ff6b6b" : "#7cc5e8", letterSpacing: 1 }}>
                  tau 不对称诊断
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: result.delta_tau > 50 ? "#ff6b6b" : "#7cc5e8" }}>
                  Dtau={result.delta_tau}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(224,214,204,0.55)", lineHeight: 1.7 }}>
                {result.tau_diagnosis}
              </div>
            </div>

            {/* Micro signals */}
            {result.micro_signals && result.micro_signals.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                {result.micro_signals.map(function(s, i) {
                  return (
                    <span key={i} style={{
                      padding: "3px 9px", borderRadius: 12, fontSize: 10,
                      background: "rgba(232,146,124,0.06)", color: "rgba(224,214,204,0.5)",
                      border: "1px solid rgba(232,146,124,0.08)",
                    }}>{s}</span>
                  );
                })}
              </div>
            )}

            {/* Variable Bars */}
            <div style={box}>
              {Object.keys(VARS).map(function(k, i) {
                var v = VARS[k];
                var val = result[k] || 0;
                return (
                  <div key={k} style={{ marginBottom: i < 4 ? 10 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: v.color }}>{v.label}</span>
                      <span style={{ fontSize: 10, color: "rgba(224,214,204,0.2)" }}>{val}</span>
                    </div>
                    <Bar value={val} color={v.color} />
                  </div>
                );
              })}
            </div>

            {/* Advice cards */}
            <div style={Object.assign({}, box, {
              background: "rgba(232,146,124,0.04)", borderColor: "rgba(232,146,124,0.08)",
            })}>
              <div style={{ fontSize: 9, color: "#e8927c", letterSpacing: 1, marginBottom: 4 }}>下一步行动</div>
              <div style={{ fontSize: 12, color: "rgba(224,214,204,0.6)", lineHeight: 1.8 }}>{result.next_action}</div>
            </div>

            <div style={Object.assign({}, box, {
              background: "rgba(124,197,232,0.04)", borderColor: "rgba(124,197,232,0.08)",
            })}>
              <div style={{ fontSize: 9, color: "#7cc5e8", letterSpacing: 1, marginBottom: 4 }}>tau 校准建议</div>
              <div style={{ fontSize: 12, color: "rgba(224,214,204,0.6)", lineHeight: 1.8 }}>{result.sync_advice}</div>
            </div>

            <div style={{ display: "flex", gap: 7, marginTop: 4 }}>
              <button onClick={function() { setStep("history"); }}
                style={Object.assign({}, btn2, { flex: 1 })}>历史</button>
              <button onClick={nextRound} style={Object.assign({}, btn1, { flex: 2 })}>
                下一轮探测
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {step === "history" && (
          <div style={{ animation: "fadeIn .5s ease" }}>
            <div style={{ fontSize: 10, color: "rgba(224,214,204,0.2)", letterSpacing: 1, marginBottom: 12 }}>
              探测记录 ({history.length})
            </div>
            {history.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(224,214,204,0.12)", padding: 28, fontSize: 11 }}>无</div>
            )}
            {history.map(function(h, i) {
              var pi = VARS[h.probe] || VARS.D_want;
              return (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.02)", borderRadius: 7, padding: 10,
                  border: "1px solid rgba(255,255,255,0.03)", marginBottom: 6,
                  borderLeft: "3px solid " + pi.color,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: pi.color }}>{pi.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pi.color }}>F_R={h.r.F_R}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(224,214,204,0.35)", lineHeight: 1.5 }}>{h.task}</div>
                  <div style={{
                    fontSize: 9, color: "rgba(224,214,204,0.2)", marginTop: 3,
                    display: "flex", gap: 8, flexWrap: "wrap",
                  }}>
                    <span>Dw={h.r.D_want}</span>
                    <span>Df={h.r.D_feedback}</span>
                    <span>Dt={h.r.delta_tau}</span>
                    <span>In={h.r.I_n}</span>
                  </div>
                </div>
              );
            })}

            {/* Trend visualization */}
            {history.length >= 2 && (
              <div style={Object.assign({}, box, { marginTop: 10 })}>
                <div style={{ fontSize: 9, color: "rgba(224,214,204,0.2)", letterSpacing: 1, marginBottom: 8 }}>
                  F_R 趋势
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 50 }}>
                  {history.map(function(h, i) {
                    var pct = (h.r.F_R || 0) / 100;
                    return (
                      <div key={i} style={{
                        flex: 1, background: "rgba(232,146,124," + (0.3 + pct * 0.7) + ")",
                        borderRadius: "3px 3px 0 0", height: (pct * 100) + "%",
                        minHeight: 2, transition: "height .5s ease",
                      }} />
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                  <span style={{ fontSize: 8, color: "rgba(224,214,204,0.12)" }}>R1</span>
                  <span style={{ fontSize: 8, color: "rgba(224,214,204,0.12)" }}>R{history.length}</span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
              <button onClick={restart} style={Object.assign({}, btn2, { flex: 1 })}>重置</button>
              <button onClick={function() { setStep(result ? "result" : "mission"); }}
                style={Object.assign({}, btn1, { flex: 2 })}>继续</button>
            </div>
          </div>
        )}

        {loading && <Spinner text={step === "report" ? "tau 计算中..." : "部署中..."} />}

        <div ref={btm} />
        <div style={{ textAlign: "center", marginTop: 32, fontSize: 8, color: "rgba(224,214,204,0.06)" }}>
          tau(A=A) = infinity
        </div>
      </div>
    </div>
  );
}
