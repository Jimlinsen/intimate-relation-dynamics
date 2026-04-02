import { useState, useEffect, useRef } from "react";

const SYS = `你是一个整合了"自指性循环周期τ理论"与"关系力学"的亲密关系诊断智能体。

═══ 理论框架 ═══

【τ层·时间动力学】
- τ(x,D) = x从被提出到被反弹所需的时间
- 权力 P(A,B) = τ(B→A)/τ(A→B)，P>1则A有权力
- 恋爱初期：τ双向短且对称（秒回）；稳定期：τ延长但对称；危机期：τ出现不对称
- 修复 = 重新同步τ，不是多说话，是校准回应节奏
- 关系动力学：dF_R/dt = λ(D_want·D_feedback - F_R) - γ·Δτ²

【ℛ层·关系力结构】
四维关系空间，改写为亲密关系版：
- Q_Ⅰ 身体场：物理在场、肢体接触、行动（直接×现实）
- Q_Ⅱ 制度场：共同习惯、社交圈重叠、物质绑定（间接×现实）
- Q_Ⅲ 直觉场：化学反应、未言明的默契、直觉好感（直接×虚拟）
- Q_Ⅳ 价值场：世界观对齐、成长方向、精神共鸣（间接×虚拟）
关系力向量 F_R = (f_Ⅰ, f_Ⅱ, f_Ⅲ, f_Ⅳ)

【θ层·力的方向】
- θ_OC = F_秩序/F_创造 比值。θ_OC低=关系靠稳定维系；θ_OC高=关系靠新鲜感驱动
- 健康关系需要F_O和F_C的动态平衡

【I_n层·博弈深度】
I_1=需要对方 I_2=知道被需要 I_3=策略性互动 I_4=管理对方的策略 I_5=多层嵌套博弈 I_6+=超越大多数人
- min(I_A, I_B)决定关系的最大复杂度
- I差距过大→博弈层级不匹配→一方"降维打击"另一方

【Σ层·自指消化】
- Σ_stage = 阶段性自指消化（健康冲突、坦诚对话、周期性关系审视）
- Σ_debt = 未被消化的自指债务（回避的问题、压抑的不满、未说出的话）
- 自指守恒律：Σ_stage + Σ_debt = Σ_total
- 不做Σ_stage → Σ_debt积累 → 全面崩溃（摊牌/分手），无中间态
- 关系中的"祭祀—王权分离"：感情（F_C）和生活管理（F_O）不可同源控制

【C_V层·纵向因果】
- 横向因果C_H："他不回消息→我焦虑"（表层）
- 纵向因果C_V："关系的τ结构性失衡蕴含了这种焦虑必然出现"（根因）
- 诊断的核心产出永远是C_V，不是C_H

═══ 诊断变量 ═══

六个核心探测维度：
1. tau_asym (Δτ): τ不对称度，谁等谁更久
2. quad_profile (ℛ): 关系在四象限的分布，哪个象限最强/最弱
3. I_n: 博弈深度，双方在第几层互动
4. sigma_debt (Σ_debt): 自指债务，积压了多少未处理的问题
5. theta_OC: 秩序—创造平衡，靠稳定还是靠新鲜感
6. D_want: 欲求值，对方有多需要你

═══ 工作方式 ═══

1. 给出可直接执行的话术和行动，每个任务精确探测一个维度
2. 话术要可以直接复制粘贴发送
3. 用户汇报反应后，输出六维诊断 + 纵向因果 + 行动建议
4. 风格：军师式，犀利精准，绝不模糊安慰

═══ 关键规则 ═══
- 表层问题背后必须追问纵向因果
- Σ_debt是最危险的隐性变量：表面稳定可能Σ_debt极高
- θ_OC失衡是慢性病：纯F_O的关系会窒息，纯F_C的关系会失控
- 四象限中Q_Ⅳ（价值场）最难建立也最难摧毁`;

async function callAI(msgs) {
  try {
    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1400, system: SYS, messages: msgs }),
    });
    var d = await r.json();
    return d.content && d.content[0] ? d.content[0].text : "";
  } catch (e) { throw e; }
}

function pj(t) {
  try { return JSON.parse(t.replace(/```json/g, "").replace(/```/g, "").trim()); }
  catch (e) { return null; }
}

var DIMS = {
  tau_asym: { label: "Dtau", full: "tau不对称", color: "#e8927c" },
  quad_profile: { label: "R", full: "四象限分布", color: "#7cc5e8" },
  I_n: { label: "In", full: "博弈深度", color: "#f0c674" },
  sigma_debt: { label: "Sigma", full: "自指债务", color: "#cc6666" },
  theta_OC: { label: "OC", full: "秩序/创造", color: "#c49bde" },
  D_want: { label: "Dw", full: "欲求值", color: "#a8e87c" },
};

var PHASE_C = { "甜蜜共振": "#51cf66", "升温": "#a8e87c", "稳定对称": "#7cc5e8", "惯性平淡": "#ffd43b", "tau失同步": "#ffa94d", "sigma临界": "#ff6b6b" };

function Spin({ t }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ width: 20, height: 20, border: "2px solid rgba(232,146,124,.1)", borderTop: "2px solid #e8927c", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto 8px" }} />
      <div style={{ fontSize: 10, color: "rgba(224,214,204,.2)" }}>{t}</div>
    </div>
  );
}

function Bar({ v, c }) {
  var s = useState(0), w = s[0], sw = s[1];
  useEffect(function() { var t = setTimeout(function() { sw(v); }, 120); return function() { clearTimeout(t); }; }, [v]);
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,.04)", borderRadius: 2 }}>
      <div style={{ height: "100%", borderRadius: 2, background: c, width: w + "%", transition: "width .8s ease" }} />
    </div>
  );
}

function QuadChart({ q1, q2, q3, q4 }) {
  var mx = Math.max(q1, q2, q3, q4, 1);
  function cell(val, label, pos) {
    var pct = val / mx;
    return (
      <div style={{
        gridArea: pos, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "rgba(124,197,232," + (0.03 + pct * 0.12) + ")", borderRadius: 6, padding: 8,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(124,197,232," + (0.4 + pct * 0.6) + ")" }}>{val}</div>
        <div style={{ fontSize: 9, color: "rgba(224,214,204,.25)", marginTop: 2, textAlign: "center" }}>{label}</div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 4, height: 120, gridTemplateAreas: "'q3 q4' 'q1 q2'" }}>
      {cell(q1, "Q1 身体场", "q1")}
      {cell(q2, "Q2 制度场", "q2")}
      {cell(q3, "Q3 直觉场", "q3")}
      {cell(q4, "Q4 价值场", "q4")}
    </div>
  );
}

export default function App() {
  var ss = function(init) { return useState(init); };
  var s1 = ss("input"), step = s1[0], setStep = s1[1];
  var s2 = ss(""), ctx = s2[0], setCtx = s2[1];
  var s3 = ss(null), mission = s3[0], setMission = s3[1];
  var s4 = ss(""), fb = s4[0], setFb = s4[1];
  var s5 = ss(null), res = s5[0], setRes = s5[1];
  var s6 = ss([]), hist = s6[0], setHist = s6[1];
  var s7 = ss(false), ld = s7[0], setLd = s7[1];
  var s8 = ss(""), err = s8[0], setErr = s8[1];
  var btm = useRef(null);

  useEffect(function() { btm.current && btm.current.scrollIntoView({ behavior: "smooth" }); }, [step, ld]);

  function doMission() {
    if (!ctx.trim()) return;
    setLd(true); setErr("");
    var ht = hist.map(function(h, i) {
      return "R" + (i + 1) + "[" + h.probe + "]: " + h.task + " | fb: " + h.fb +
        " | F_R=" + h.r.F_R + " Dtau=" + h.r.tau_asym + " Sd=" + h.r.sigma_debt + " In=" + h.r.I_n;
    }).join("\n");

    callAI([{ role: "user", content: "关系背景：" + ctx + (ht ? "\n\n历史：\n" + ht : "") +
      '\n\n根据数据缺口选择最需要探测的维度，部署任务。\n\n严格JSON：' +
      '{"probe":"tau_asym或quad_profile或I_n或sigma_debt或theta_OC或D_want",' +
      '"probe_name":"中文名",' +
      '"intent":"战术意图12字",' +
      '"C_V":"这个探测背后的纵向因果假设，一句话",' +
      '"lines":[{"text":"可直接发送的话术","when":"时机"}],' +
      '"action":"行动指令",' +
      '"watch":"精确观察指标",' +
      '"note":"注意事项"}' }]).then(function(raw) {
      var m = pj(raw);
      if (!m) { setErr("解析失败"); setLd(false); return; }
      setMission(m); setStep("mission"); setLd(false);
    }).catch(function() { setErr("失败"); setLd(false); });
  }

  function doAnalyze() {
    if (!fb.trim()) return;
    setLd(true); setErr("");
    callAI([{ role: "user", content: "背景：" + ctx +
      "\n探测：" + mission.probe + " | 纵向因果假设：" + (mission.C_V || "") +
      "\n任务：" + mission.action +
      "\n话术：" + mission.lines.map(function(l) { return l.text; }).join("/") +
      "\n观察：" + mission.watch +
      "\n\n对方反应：" + fb +
      '\n\n六维诊断+纵向因果+行动。每个值0-100。\n\n严格JSON：{' +
      '"tau_asym":0到100(0=完美对称 100=极度失衡),' +
      '"tau_dir":"她的tau更长/你的tau更长/基本对称",' +
      '"P_ratio":"P(你,她)的值如1.3或0.7，>1你有权力<1她有权力",' +
      '"Q1":0到100身体场,' +
      '"Q2":0到100制度场,' +
      '"Q3":0到100直觉场,' +
      '"Q4":0到100价值场,' +
      '"quad_weakest":"最弱象限Q几及原因一句话",' +
      '"I_n":0到100博弈深度,' +
      '"I_n_level":"I_几(如I_3策略性互动)",' +
      '"sigma_debt":0到100自指债务(0=无积压 100=临界崩溃),' +
      '"sigma_signs":"自指债务的具体信号一句话",' +
      '"theta_OC":0到100(0=纯秩序 50=平衡 100=纯创造),' +
      '"D_want":0到100她的欲求值,' +
      '"F_R":0到100关系力总评,' +
      '"phase":"甜蜜共振/升温/稳定对称/惯性平淡/tau失同步/sigma临界 六选一",' +
      '"C_H":"横向因果一句话(表层原因)",' +
      '"C_V":"纵向因果一句话(结构性根因，必须比C_H深一层)",' +
      '"reading":"核心诊断2句话犀利",' +
      '"micro_signals":["微信号1","微信号2"],' +
      '"action":"下一步行动建议具体可执行",' +
      '"tau_sync":"tau校准建议一句话",' +
      '"sigma_rx":"自指消化建议：如何降低sigma_debt一句话"}'
    }]).then(function(raw) {
      var r = pj(raw);
      if (!r) { setErr("解析失败"); setLd(false); return; }
      setRes(r);
      setHist(function(p) { return p.concat([{ probe: mission.probe, task: mission.action, fb: fb, r: r }]); });
      setStep("result"); setLd(false);
    }).catch(function() { setErr("失败"); setLd(false); });
  }

  function next() { setFb(""); setRes(null); setMission(null); doMission(); }
  function reset() { setStep("input"); setCtx(""); setMission(null); setFb(""); setRes(null); setHist([]); setErr(""); }

  var pi = mission ? (DIMS[mission.probe] || DIMS.D_want) : DIMS.D_want;

  var bx = { background: "rgba(255,255,255,.025)", borderRadius: 7, padding: 12, border: "1px solid rgba(255,255,255,.04)", marginBottom: 8 };
  var b1 = { width: "100%", padding: "11px 0", background: "rgba(232,146,124,.1)", color: "#e8927c", border: "1px solid rgba(232,146,124,.2)", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600, letterSpacing: 1 };
  var b2 = { padding: "11px 0", background: "transparent", color: "rgba(224,214,204,.25)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 6, fontSize: 10, cursor: "pointer" };
  var inp = { width: "100%", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 6, padding: 10, color: "#e0d6cc", fontSize: 13, lineHeight: "1.7", resize: "vertical", boxSizing: "border-box", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0a09", color: "#e0d6cc", padding: "20px 12px", display: "flex", justifyContent: "center" }}>
      <style>{
        "@keyframes spin{to{transform:rotate(360deg)}}" +
        "@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}" +
        "::selection{background:rgba(232,146,124,.3)}"
      }</style>
      <div style={{ maxWidth: 420, width: "100%" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 8, letterSpacing: 5, color: "rgba(224,214,204,.12)" }}>tau + RELATIONAL FORCE</div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 0", color: "#e8927c", letterSpacing: 2 }}>关系力测度</h1>
          <div style={{ fontSize: 9, color: "rgba(224,214,204,.12)", marginTop: 3 }}>
            F_R = (f_I, f_II, f_III, f_IV) | P = tau(B-&gt;A)/tau(A-&gt;B) | Sigma_stage + Sigma_debt = Sigma_total
          </div>
          {res && <div style={{ fontSize: 9, color: "rgba(224,214,204,.18)", marginTop: 4 }}>F_R={res.F_R} | Dtau={res.tau_asym} | Sd={res.sigma_debt} | R{hist.length}</div>}
        </div>

        {err && (
          <div style={{ background: "rgba(255,107,107,.07)", borderRadius: 6, padding: "6px 10px", marginBottom: 10, fontSize: 10, color: "#ff6b6b", textAlign: "center" }}>
            {err} <span onClick={function() { setErr(""); }} style={{ cursor: "pointer", marginLeft: 6, opacity: .5 }}>x</span>
          </div>
        )}

        {/* INPUT */}
        {step === "input" && !ld && (
          <div style={{ animation: "fi .5s ease" }}>
            <div style={{ fontSize: 12, color: "rgba(224,214,204,.35)", marginBottom: 8, lineHeight: 1.8 }}>
              描述关系背景。我会部署探测任务，覆盖tau动态、四象限分布、博弈深度、自指债务、秩序/创造平衡五个层面。
            </div>
            <textarea value={ctx} onChange={function(e) { setCtx(e.target.value); }}
              placeholder={"关系类型、认识时长、互动频率、回消息速度、最近有没有回避某些话题..."} rows={5} style={inp} />
            <div style={{ height: 8 }} />
            <button onClick={doMission} disabled={!ctx.trim()} style={Object.assign({}, b1, { opacity: ctx.trim() ? 1 : .4 })}>部署探测</button>

            <div style={Object.assign({}, bx, { marginTop: 14 })}>
              <div style={{ fontSize: 9, color: "rgba(224,214,204,.2)", letterSpacing: 1, marginBottom: 6 }}>六维诊断模型</div>
              {Object.keys(DIMS).map(function(k) {
                var d = DIMS[k];
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: d.color, width: 45, flexShrink: 0 }}>{d.label}</span>
                    <span style={{ fontSize: 9, color: "rgba(224,214,204,.2)" }}>{d.full}</span>
                  </div>
                );
              })}
              <div style={{ fontSize: 9, color: "rgba(224,214,204,.12)", marginTop: 6, lineHeight: 1.5 }}>
                + 四象限ℛ分布 | 纵向因果C_V | 权力比P | 自指守恒Sigma
              </div>
            </div>
          </div>
        )}

        {/* MISSION */}
        {step === "mission" && !ld && mission && (
          <div style={{ animation: "fi .5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <div style={{ padding: "2px 8px", borderRadius: 8, fontSize: 9, background: pi.color + "12", color: pi.color, border: "1px solid " + pi.color + "20" }}>
                {mission.probe_name || mission.probe}
              </div>
              <div style={{ fontSize: 10, color: "rgba(224,214,204,.3)" }}>{mission.intent}</div>
              <div style={{ marginLeft: "auto", fontSize: 8, color: "rgba(224,214,204,.1)" }}>#{hist.length + 1}</div>
            </div>

            {/* C_V hypothesis */}
            {mission.C_V && (
              <div style={{ fontSize: 10, color: "rgba(196,155,222,.4)", marginBottom: 8, paddingLeft: 3, borderLeft: "2px solid rgba(196,155,222,.15)", paddingTop: 2, paddingBottom: 2, lineHeight: 1.6 }}>
                C_V假设：{mission.C_V}
              </div>
            )}

            <div style={bx}>
              <div style={{ fontSize: 8, color: "rgba(224,214,204,.2)", letterSpacing: 1, marginBottom: 6 }}>话术 · 点击复制</div>
              {mission.lines && mission.lines.map(function(l, i) {
                return (
                  <div key={i} style={{ marginBottom: i < mission.lines.length - 1 ? 6 : 0 }}>
                    <div onClick={function() { if (navigator.clipboard) navigator.clipboard.writeText(l.text); }}
                      style={{ background: pi.color + "06", borderLeft: "2px solid " + pi.color + "30", borderRadius: "5px 5px 5px 1px", padding: "7px 9px", fontSize: 13, lineHeight: 1.7, cursor: "pointer" }}>
                      {l.text}
                    </div>
                    <div style={{ fontSize: 8, color: "rgba(224,214,204,.15)", marginTop: 1, paddingLeft: 4 }}>{l.when}</div>
                  </div>
                );
              })}
            </div>

            <div style={Object.assign({}, bx, { borderLeft: "2px solid #7cc5e8" })}>
              <div style={{ fontSize: 8, color: "#7cc5e8", letterSpacing: 1, marginBottom: 3 }}>行动</div>
              <div style={{ fontSize: 12, lineHeight: 1.8, color: "rgba(224,214,204,.6)" }}>{mission.action}</div>
            </div>
            <div style={Object.assign({}, bx, { borderLeft: "2px solid #a8e87c" })}>
              <div style={{ fontSize: 8, color: "#a8e87c", letterSpacing: 1, marginBottom: 3 }}>观察</div>
              <div style={{ fontSize: 12, lineHeight: 1.8, color: "rgba(224,214,204,.6)" }}>{mission.watch}</div>
            </div>

            {mission.note && <div style={{ fontSize: 9, color: "rgba(255,169,77,.35)", marginBottom: 8, paddingLeft: 2 }}>* {mission.note}</div>}
            <button onClick={function() { setStep("report"); }} style={b1}>执行 · 回来汇报</button>
          </div>
        )}

        {/* REPORT */}
        {step === "report" && !ld && (
          <div style={{ animation: "fi .5s ease" }}>
            <div style={{ fontSize: 11, color: "rgba(224,214,204,.35)", marginBottom: 8, lineHeight: 1.8 }}>
              汇报反应。重点：回复时间、内容、语气、是否追问、是否回避某部分、表情符号。
            </div>
            <textarea value={fb} onChange={function(e) { setFb(e.target.value); }}
              placeholder={"她的具体反应..."} rows={5} style={inp} />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={function() { setStep("mission"); }} style={Object.assign({}, b2, { flex: 1 })}>回看</button>
              <button onClick={doAnalyze} disabled={!fb.trim()} style={Object.assign({}, b1, { flex: 2, opacity: fb.trim() ? 1 : .4 })}>提交</button>
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && !ld && res && (
          <div style={{ animation: "fi .7s ease" }}>
            {/* Phase + F_R */}
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <span style={{
                display: "inline-block", padding: "2px 12px", borderRadius: 10, fontSize: 10, fontWeight: 700, letterSpacing: 2,
                color: PHASE_C[res.phase] || "#ffd43b",
                background: (PHASE_C[res.phase] || "#ffd43b") + "10",
                border: "1px solid " + (PHASE_C[res.phase] || "#ffd43b") + "20",
              }}>{res.phase}</span>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#e8927c", marginTop: 6 }}>{res.F_R}</div>
              <div style={{ fontSize: 9, color: "rgba(224,214,204,.2)", letterSpacing: 2 }}>F_R 关系力</div>
            </div>

            {/* Reading */}
            <div style={Object.assign({}, bx, { fontSize: 13, lineHeight: 2, color: "rgba(224,214,204,.7)" })}>
              {res.reading}
            </div>

            {/* Causal Layers */}
            <div style={Object.assign({}, bx, { background: "rgba(196,155,222,.03)", borderColor: "rgba(196,155,222,.08)" })}>
              <div style={{ fontSize: 8, color: "#c49bde", letterSpacing: 1, marginBottom: 6 }}>因果分层</div>
              <div style={{ fontSize: 11, color: "rgba(224,214,204,.4)", lineHeight: 1.6, marginBottom: 4 }}>
                <span style={{ color: "rgba(224,214,204,.25)" }}>C_H 横向：</span>{res.C_H}
              </div>
              <div style={{ textAlign: "center", fontSize: 10, color: "rgba(196,155,222,.25)" }}>↓ 蕴含</div>
              <div style={{ fontSize: 12, color: "rgba(196,155,222,.7)", lineHeight: 1.7, marginTop: 4, paddingLeft: 8, borderLeft: "2px solid rgba(196,155,222,.2)" }}>
                <span style={{ fontSize: 9, color: "rgba(196,155,222,.4)" }}>C_V 纵向：</span><br />{res.C_V}
              </div>
            </div>

            {/* Quad Chart */}
            <div style={bx}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 8, color: "rgba(224,214,204,.2)", letterSpacing: 1 }}>四象限 R 分布</span>
                <span style={{ fontSize: 9, color: "rgba(224,214,204,.15)" }}>{res.quad_weakest}</span>
              </div>
              <QuadChart q1={res.Q1 || 0} q2={res.Q2 || 0} q3={res.Q3 || 0} q4={res.Q4 || 0} />
            </div>

            {/* tau + Power + Sigma row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div style={Object.assign({}, bx, { marginBottom: 0, textAlign: "center", background: res.tau_asym > 50 ? "rgba(255,107,107,.04)" : "rgba(232,146,124,.03)" })}>
                <div style={{ fontSize: 20, fontWeight: 700, color: res.tau_asym > 50 ? "#ff6b6b" : "#e8927c" }}>{res.tau_asym}</div>
                <div style={{ fontSize: 8, color: "rgba(224,214,204,.2)" }}>Dtau</div>
                <div style={{ fontSize: 8, color: "rgba(224,214,204,.15)", marginTop: 2 }}>{res.tau_dir}</div>
              </div>
              <div style={Object.assign({}, bx, { marginBottom: 0, textAlign: "center" })}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#f0c674" }}>{res.P_ratio}</div>
                <div style={{ fontSize: 8, color: "rgba(224,214,204,.2)" }}>P 权力比</div>
                <div style={{ fontSize: 8, color: "rgba(224,214,204,.15)", marginTop: 2 }}>{parseFloat(res.P_ratio) > 1 ? "你有权力" : parseFloat(res.P_ratio) < 1 ? "她有权力" : "对等"}</div>
              </div>
              <div style={Object.assign({}, bx, { marginBottom: 0, textAlign: "center", background: res.sigma_debt > 60 ? "rgba(204,102,102,.05)" : "rgba(204,102,102,.02)" })}>
                <div style={{ fontSize: 20, fontWeight: 700, color: res.sigma_debt > 60 ? "#ff6b6b" : "#cc6666" }}>{res.sigma_debt}</div>
                <div style={{ fontSize: 8, color: "rgba(224,214,204,.2)" }}>Sigma_debt</div>
                <div style={{ fontSize: 8, color: "rgba(224,214,204,.15)", marginTop: 2, lineHeight: 1.3 }}>{res.sigma_signs ? res.sigma_signs.slice(0, 20) : ""}</div>
              </div>
            </div>

            {/* Micro signals */}
            {res.micro_signals && res.micro_signals.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                {res.micro_signals.map(function(s, i) {
                  return <span key={i} style={{ padding: "2px 8px", borderRadius: 10, fontSize: 9, background: "rgba(232,146,124,.05)", color: "rgba(224,214,204,.45)", border: "1px solid rgba(232,146,124,.07)" }}>{s}</span>;
                })}
              </div>
            )}

            {/* Dimension Bars */}
            <div style={bx}>
              {[
                ["tau_asym", res.tau_asym, true],
                ["D_want", res.D_want, false],
                ["I_n", res.I_n, false],
                ["theta_OC", res.theta_OC, false],
                ["sigma_debt", res.sigma_debt, true],
              ].map(function(item, i) {
                var k = item[0], v = item[1], inv = item[2];
                var d = DIMS[k];
                return (
                  <div key={k} style={{ marginBottom: i < 4 ? 8 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 9, color: d.color }}>{d.label} {d.full}</span>
                      <span style={{ fontSize: 9, color: "rgba(224,214,204,.18)" }}>
                        {v}{k === "I_n" && res.I_n_level ? " " + res.I_n_level : ""}
                        {k === "theta_OC" ? (v < 35 ? " 偏秩序" : v > 65 ? " 偏创造" : " 平衡") : ""}
                      </span>
                    </div>
                    <Bar v={v || 0} c={inv && v > 50 ? "#ff6b6b" : d.color} />
                  </div>
                );
              })}
            </div>

            {/* Advice */}
            <div style={Object.assign({}, bx, { background: "rgba(232,146,124,.03)", borderColor: "rgba(232,146,124,.07)" })}>
              <div style={{ fontSize: 8, color: "#e8927c", letterSpacing: 1, marginBottom: 3 }}>行动</div>
              <div style={{ fontSize: 12, color: "rgba(224,214,204,.6)", lineHeight: 1.8 }}>{res.action}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div style={Object.assign({}, bx, { marginBottom: 0, background: "rgba(124,197,232,.03)", borderColor: "rgba(124,197,232,.06)" })}>
                <div style={{ fontSize: 8, color: "#7cc5e8", letterSpacing: 1, marginBottom: 2 }}>tau校准</div>
                <div style={{ fontSize: 10, color: "rgba(224,214,204,.5)", lineHeight: 1.6 }}>{res.tau_sync}</div>
              </div>
              <div style={Object.assign({}, bx, { marginBottom: 0, background: "rgba(204,102,102,.03)", borderColor: "rgba(204,102,102,.06)" })}>
                <div style={{ fontSize: 8, color: "#cc6666", letterSpacing: 1, marginBottom: 2 }}>Sigma消化</div>
                <div style={{ fontSize: 10, color: "rgba(224,214,204,.5)", lineHeight: 1.6 }}>{res.sigma_rx}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
              <button onClick={function() { setStep("history"); }} style={Object.assign({}, b2, { flex: 1 })}>历史</button>
              <button onClick={next} style={Object.assign({}, b1, { flex: 2 })}>下一轮</button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {step === "history" && (
          <div style={{ animation: "fi .5s ease" }}>
            <div style={{ fontSize: 9, color: "rgba(224,214,204,.18)", letterSpacing: 1, marginBottom: 10 }}>记录 ({hist.length})</div>
            {hist.length === 0 && <div style={{ textAlign: "center", color: "rgba(224,214,204,.1)", padding: 24, fontSize: 10 }}>无</div>}
            {hist.map(function(h, i) {
              var d = DIMS[h.probe] || DIMS.D_want;
              return (
                <div key={i} style={{ background: "rgba(255,255,255,.015)", borderRadius: 6, padding: 8, border: "1px solid rgba(255,255,255,.03)", marginBottom: 5, borderLeft: "3px solid " + d.color }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: d.color }}>{d.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#e8927c" }}>F_R={h.r.F_R}</span>
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(224,214,204,.3)", lineHeight: 1.4 }}>{h.task}</div>
                  <div style={{ fontSize: 8, color: "rgba(224,214,204,.15)", marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span>Dt={h.r.tau_asym}</span><span>Sd={h.r.sigma_debt}</span><span>In={h.r.I_n}</span><span>P={h.r.P_ratio}</span>
                  </div>
                </div>
              );
            })}

            {hist.length >= 2 && (
              <div style={Object.assign({}, bx, { marginTop: 8 })}>
                <div style={{ fontSize: 8, color: "rgba(224,214,204,.15)", letterSpacing: 1, marginBottom: 6 }}>F_R 趋势</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 40 }}>
                  {hist.map(function(h, i) {
                    var p = (h.r.F_R || 0) / 100;
                    return <div key={i} style={{ flex: 1, background: "rgba(232,146,124," + (.2 + p * .8) + ")", borderRadius: "2px 2px 0 0", height: Math.max(p * 100, 2) + "%", transition: "height .5s" }} />;
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button onClick={reset} style={Object.assign({}, b2, { flex: 1 })}>重置</button>
              <button onClick={function() { setStep(res ? "result" : "mission"); }} style={Object.assign({}, b1, { flex: 2 })}>继续</button>
            </div>
          </div>
        )}

        {ld && <Spin t={step === "report" ? "六维诊断 + 纵向因果分析..." : "部署中..."} />}
        <div ref={btm} />
        <div style={{ textAlign: "center", marginTop: 28, fontSize: 7, color: "rgba(224,214,204,.05)" }}>
          Sigma_stage + Sigma_debt = Sigma_total
        </div>
      </div>
    </div>
  );
}
