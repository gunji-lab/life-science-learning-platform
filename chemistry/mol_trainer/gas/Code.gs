/* =========================================================
   mol Trainer Log System
   Google Apps Script
   physics_spring style auth-token flow
   ========================================================= */

const LOG_SHEET_NAME = "Log";
const COUNT_SHEET_NAME = "Counts";
const LOGIN_SHEET_NAME = "LoginLog";
const SCHOOL_DOMAIN = "toyo.jp";
const AUTH_TOKEN_HOURS = 12;
const AUTH_SECRET_PROPERTY = "MOL_AUTH_SECRET";
const STAFF_TEST_STUDENT_IDS = {
  "gunji@toyo.jp": "ADMIN_GUNJI"
};

// GitHub Pagesで公開したmol TrainerのURLに変更する（末尾の / は含めない）。
const NEW_TRAINER_BASE_URL = "https://gunji-lab.github.io/life-science-learning-platform/chemistry/mol_trainer";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No postData. HTMLからPOSTしてください。");
    }

    const data = JSON.parse(e.postData.contents);
    return json_(recordEventFromData_(data));
  } catch (err) {
    return json_({
      result: "error",
      message: err.message
    });
  }
}

function doGet(e) {
  const params = (e && e.parameter) || {};

  if (params.view === "app") {
    return buildAppEntryResponse_();
  }

  if (params.view === "auth") {
    return buildAuthResponse_(params);
  }

  if (params.view === "my") {
    try {
      return HtmlService
        .createHtmlOutput(buildStudentDashboardHtml_(getAuthenticatedStudentId_()))
        .setTitle("自分の学習状況")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (err) {
      return buildUniversityAccountGuide_(err.message);
    }
  }

  if (params.view === "progress") {
    return buildProgressResponse_(params);
  }

  if (params.view === "track") {
    return buildTrackResponse_(params);
  }

  if (params.view === "teacher") {
    try {
      if (getAuthenticatedStudentId_() !== "ADMIN_GUNJI") throw new Error("教員アカウント専用です。");
      return HtmlService
        .createHtmlOutput(buildTeacherDashboardHtml_())
        .setTitle("mol Trainer Dashboard")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (err) {
      return HtmlService.createHtmlOutput("<p>閲覧権限がありません。</p>").setTitle("閲覧権限なし");
    }
  }

  return HtmlService
    .createHtmlOutput(buildTeacherDashboardHtml_())
    .setTitle("mol Trainer Dashboard")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupHeaders_(
    getOrCreateSheet_(ss, LOG_SHEET_NAME),
    getOrCreateSheet_(ss, COUNT_SHEET_NAME),
    getOrCreateSheet_(ss, LOGIN_SHEET_NAME)
  );
}

function getAuthenticatedStudentId_() {
  const rawEmail = Session.getActiveUser().getEmail().trim();
  const email = rawEmail.toLowerCase();
  const suffix = "@" + SCHOOL_DOMAIN.toLowerCase();
  if (!email || !email.endsWith(suffix)) throw new Error("大学Googleアカウントでログインしてください。");
  if (STAFF_TEST_STUDENT_IDS[email]) return STAFF_TEST_STUDENT_IDS[email];
  const localPart = rawEmail.slice(0, -suffix.length);
  const match = localPart.match(/^s([0-9a-z]+)\d$/i);
  if (!match) throw new Error("学生用メールアドレスから学籍番号を取得できませんでした。");
  return match[1].toUpperCase();
}

function buildAuthResponse_(params) {
  let studentId;
  try {
    studentId = getAuthenticatedStudentId_();
  } catch (err) {
    return buildUniversityAccountGuide_(err.message);
  }

  const requested = String(params.return || "");
  const fallback = NEW_TRAINER_BASE_URL + "/index.html";
  const returnUrl = requested.indexOf(NEW_TRAINER_BASE_URL) === 0 ? requested : fallback;
  recordLogin_(studentId, returnUrl, "auth");
  const token = createAuthToken_(studentId);
  const destination = returnUrl + "#auth=" + encodeURIComponent(token);
  const destinationJson = JSON.stringify(destination);

  return HtmlService.createHtmlOutput(`<!doctype html><html lang="ja"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="refresh" content="1;url=${escapeHtml_(destination)}">
    <title>ログイン完了</title>
    <style>body{font-family:system-ui,sans-serif;background:#f6f8fb;color:#162033;margin:0}.card{max-width:560px;margin:10vh auto;background:#fff;border:1px solid #d8e1ec;border-radius:8px;padding:28px;box-shadow:0 14px 34px #16203317}a{display:inline-block;background:#0f766e;color:#fff;text-decoration:none;font-weight:800;padding:12px 18px;border-radius:8px}@media(max-width:640px){.card{margin:0;min-height:100vh;border:0;border-radius:0;box-shadow:none;box-sizing:border-box;padding:32px 22px}h1{font-size:2rem;line-height:1.2}p{font-size:1.05rem;line-height:1.8}a{display:flex;align-items:center;justify-content:center;min-height:54px}}</style></head>
    <body><main class="card"><h1>ログインしました</h1><p>学籍番号 ${escapeHtml_(studentId)} としてmol Trainerを開きます。自動で切り替わらない場合だけ、下のボタンを押してください。</p><p><a href="${escapeHtml_(destination)}" target="_top" rel="noopener">mol Trainerへ進む</a></p></main>
    <script>
      const destination = ${destinationJson};
      try {
        window.top.location.replace(destination);
      } catch (err) {
        window.location.replace(destination);
      }
    </script></body></html>`)
    .setTitle("mol Trainer ログイン");
}

function buildAppEntryResponse_() {
  let studentId;
  try {
    studentId = getAuthenticatedStudentId_();
  } catch (err) {
    return buildUniversityAccountGuide_(err.message);
  }

  const token = createAuthToken_(studentId);
  const destination = NEW_TRAINER_BASE_URL + "/index.html#auth=" + encodeURIComponent(token);
  recordLogin_(studentId, NEW_TRAINER_BASE_URL + "/index.html", "app");

  return HtmlService.createHtmlOutput(`<!doctype html><html lang="ja"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><title>mol Trainerへ移動中</title>
    <style>body{font-family:system-ui,sans-serif;background:#f6f8fb;color:#162033;margin:0}.card{max-width:560px;margin:10vh auto;background:#fff;border:1px solid #d8e1ec;border-top:5px solid #0f766e;border-radius:8px;padding:28px;box-shadow:0 14px 34px #16203317}a{display:inline-block;background:#0f766e;color:#fff;text-decoration:none;font-weight:800;padding:12px 18px;border-radius:8px}</style></head>
    <body><main class="card"><h1>ログインしました</h1><p>学籍番号 ${escapeHtml_(studentId)} としてmol Trainerを開きます。</p><p><a href="${escapeHtml_(destination)}">mol Trainerへ進む</a></p></main>
    <script>location.replace(${JSON.stringify(destination)});</script></body></html>`)
    .setTitle("mol Trainerへ移動中");
}

function buildUniversityAccountGuide_(detail) {
  const authUrl = ScriptApp.getService().getUrl() + "?view=auth&return=" + encodeURIComponent(NEW_TRAINER_BASE_URL + "/index.html");
  const addSessionUrl = "https://accounts.google.com/AddSession?hl=ja&continue=" + encodeURIComponent(authUrl);
  const chooserUrl = "https://accounts.google.com/AccountChooser?hd=" + encodeURIComponent(SCHOOL_DOMAIN) + "&continue=" + encodeURIComponent(authUrl);
  return HtmlService.createHtmlOutput(`<!doctype html><html lang="ja"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><title>大学アカウントでログイン</title>
    <style>body{font-family:system-ui,sans-serif;background:#f6f8fb;color:#162033;margin:0}.card{max-width:680px;margin:10vh auto;background:#fff;border:1px solid #d8e1ec;border-top:5px solid #0f766e;border-radius:8px;padding:28px}p{line-height:1.8}.actions{display:grid;gap:12px;margin:22px 0}a{display:flex;align-items:center;justify-content:center;min-height:50px;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:800;text-align:center}.secondary{background:#e7f6f3;color:#0b5e58}.help{color:#5e6b7f}</style></head>
    <body><main class="card"><h1>大学Googleアカウントでログイン</h1><p>本ページは <strong>@${escapeHtml_(SCHOOL_DOMAIN)}</strong> の大学アカウント専用です。個人Gmailだけでログインしている場合は、先に大学アカウントを追加してください。</p><p>${escapeHtml_(detail || "")}</p><div class="actions"><a href="${escapeHtml_(addSessionUrl)}">大学アカウントを追加してログイン</a><a class="secondary" href="${escapeHtml_(chooserUrl)}">追加済みの大学アカウントを選ぶ</a></div><p class="help">うまく切り替わらない場合は、シークレット／プライベートウィンドウでこのページを開き、大学アカウントだけでログインしてください。</p></main></body></html>`)
    .setTitle("大学アカウントでログイン");
}

function createAuthToken_(studentId) {
  const expires = Date.now() + AUTH_TOKEN_HOURS * 60 * 60 * 1000;
  const body = String(studentId) + "." + expires;
  return body + "." + signAuthBody_(body);
}

function verifyAuthToken_(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return { ok: false };
  const studentId = parts[0];
  const expires = Number(parts[1]);
  const body = studentId + "." + parts[1];
  if (!studentId || !expires || expires < Date.now()) return { ok: false };
  if (signAuthBody_(body) !== parts[2]) return { ok: false };
  return { ok: true, studentId };
}

function signAuthBody_(body) {
  const signature = Utilities.computeHmacSha256Signature(body, getAuthSecret_());
  return Utilities.base64EncodeWebSafe(signature).replace(/=+$/, "");
}

function getAuthSecret_() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty(AUTH_SECRET_PROPERTY);
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty(AUTH_SECRET_PROPERTY, secret);
  }
  return secret;
}

function getStageName_(event, payload) {
  if (event === "study_check_complete") return "Study Note";
  if (payload.stageId) return "Stage " + payload.stageId + " " + String(payload.stageTitle || "").trim();
  return String(payload.stage || event || "unknown");
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function setupHeaders_(logSheet, countSheet, loginSheet) {
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow([
      "学籍番号",
      "Stage",
      "Event",
      "得点",
      "問題数",
      "正答率",
      "所要時間[s]",
      "日時",
      "クリア",
      "Page",
      "UserAgent",
      "画面サイズ",
      "Payload"
    ]);
    logSheet.setFrozenRows(1);
  }

  if (countSheet.getLastRow() === 0) {
    countSheet.appendRow([
      "学籍番号",
      "Stage",
      "Stage挑戦回数",
      "全体挑戦回数",
      "最終更新"
    ]);
    countSheet.setFrozenRows(1);
  }

  if (loginSheet && loginSheet.getLastRow() === 0) {
    loginSheet.appendRow([
      "学籍番号",
      "日時",
      "戻り先",
      "認証入口"
    ]);
    loginSheet.setFrozenRows(1);
  }
}

function recordLogin_(studentId, returnUrl, entryView) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const loginSheet = getOrCreateSheet_(ss, LOGIN_SHEET_NAME);
    setupHeaders_(
      getOrCreateSheet_(ss, LOG_SHEET_NAME),
      getOrCreateSheet_(ss, COUNT_SHEET_NAME),
      loginSheet
    );
    loginSheet.appendRow([
      studentId,
      new Date(),
      String(returnUrl || ""),
      String(entryView || "")
    ]);
  } finally {
    lock.releaseLock();
  }
}

function buildTrackResponse_(params) {
  const callback = sanitizeCallbackName_(params.callback);
  let data;

  try {
    data = recordEventFromData_(JSON.parse(String(params.data || "{}")));
  } catch (err) {
    data = {
      result: "error",
      message: err.message
    };
  }

  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + JSON.stringify(data) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return json_(data);
}

function recordEventFromData_(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const verified = verifyAuthToken_(data.authToken);
    if (!verified.ok) throw new Error("大学Googleアカウントでログインし直してください。");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = getOrCreateSheet_(ss, LOG_SHEET_NAME);
    const countSheet = getOrCreateSheet_(ss, COUNT_SHEET_NAME);
    setupHeaders_(logSheet, countSheet);

    const payload = data.payload || {};
    const studentId = verified.studentId;
    const event = String(data.event || "");
    const stage = getStageName_(event, payload);
    const score = Number(payload.score || 0);
    const total = Number(payload.questionCount || payload.total || 0);
    const elapsed = payload.elapsed !== undefined ? Number(payload.elapsed) : "";
    const rate = total > 0 ? Math.round((score / total) * 100) + "%" : "";
    const passed = payload.passed === true || (total > 0 && score / total >= 0.7) ? "○" : "";
    const now = new Date();

    const attempts = updateAttempts_(countSheet, studentId, stage, now);

    logSheet.appendRow([
      studentId,
      stage,
      event,
      score,
      total,
      rate,
      elapsed,
      now,
      passed,
      String(data.page || ""),
      String(data.userAgent || ""),
      String(data.screen || ""),
      JSON.stringify(payload)
    ]);

    return {
      result: "success",
      stageAttempt: attempts.stageAttempt,
      totalAttempt: attempts.totalAttempt
    };
  } finally {
    lock.releaseLock();
  }
}

function buildProgressResponse_(params) {
  const callback = sanitizeCallbackName_(params.callback);
  const verified = verifyAuthToken_(params.token);
  const data = verified.ok ? getStudentProgress_(verified.studentId) : {
    ok: false,
    message: "ログインし直してください。",
    stages: {}
  };

  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + JSON.stringify(data) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return json_(data);
}

function getStudentProgress_(studentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  const rows = logSheet ? readSheetObjects_(logSheet) : [];
  const stages = {};
  let studyComplete = false;

  rows.forEach(row => {
    if (String(row["学籍番号"] || "") !== studentId) return;

    const event = String(row["Event"] || "");
    if (event === "study_check_complete") {
      studyComplete = true;
      return;
    }

    let payload = {};
    try {
      payload = JSON.parse(String(row["Payload"] || "{}"));
    } catch (err) {
      payload = {};
    }

    const stageId = Number(payload.stageId);
    if (!Number.isInteger(stageId)) return;

    const score = Number(row["得点"] || payload.score || 0);
    const total = Number(row["問題数"] || payload.questionCount || payload.total || 5);
    const cleared = String(row["クリア"] || "") === "○" || payload.passed === true;
    const current = stages[stageId] || {
      attempts: 0,
      bestScore: 0,
      total: total || 5,
      cleared: false,
      lastAt: ""
    };

    current.attempts += 1;
    current.bestScore = Math.max(current.bestScore, score);
    current.total = total || current.total;
    current.cleared = current.cleared || cleared;
    current.lastAt = row["日時"] || current.lastAt;
    stages[stageId] = current;
  });

  return {
    ok: true,
    studentId,
    studyComplete,
    stages
  };
}

function sanitizeCallbackName_(name) {
  const value = String(name || "");
  return /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(value) ? value : "";
}

function updateAttempts_(countSheet, studentId, stage, now) {
  const lastRow = countSheet.getLastRow();
  let stageAttempt = 1;
  let totalAttempt = 1;
  let stageRow = null;
  const studentRows = [];

  if (lastRow >= 2) {
    const values = countSheet.getRange(2, 1, lastRow - 1, 5).getValues();
    for (let i = 0; i < values.length; i++) {
      const row = i + 2;
      const rowStudentId = String(values[i][0]).trim();
      const rowStage = String(values[i][1]).trim();
      if (rowStudentId === studentId) {
        studentRows.push(row);
        totalAttempt = Math.max(totalAttempt, Number(values[i][3] || 0) + 1);
        if (rowStage === stage) {
          stageRow = row;
          stageAttempt = Number(values[i][2] || 0) + 1;
        }
      }
    }
  }

  if (stageRow) {
    countSheet.getRange(stageRow, 3, 1, 3).setValues([[stageAttempt, totalAttempt, now]]);
  } else {
    countSheet.appendRow([studentId, stage, stageAttempt, totalAttempt, now]);
  }

  for (const row of studentRows) {
    countSheet.getRange(row, 4).setValue(totalAttempt);
    countSheet.getRange(row, 5).setValue(now);
  }

  return { stageAttempt, totalAttempt };
}

function buildTeacherDashboardHtml_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  const countSheet = ss.getSheetByName(COUNT_SHEET_NAME);
  const loginSheet = ss.getSheetByName(LOGIN_SHEET_NAME);
  const logs = logSheet ? readSheetObjects_(logSheet).reverse() : [];
  const counts = countSheet ? readSheetObjects_(countSheet) : [];
  const logins = loginSheet ? readSheetObjects_(loginSheet).reverse() : [];

  const totalAttempts = logs.length;
  const students = {};
  logs.forEach(row => {
    const id = String(row["学籍番号"] || "");
    if (id) students[id] = true;
  });
  const loginStudents = {};
  logins.forEach(row => {
    const id = String(row["学籍番号"] || "");
    if (id) loginStudents[id] = true;
  });

  const recentRows = logs.slice(0, 80).map(row => `<tr>
    <td>${escapeHtml_(row["日時"])}</td>
    <td>${escapeHtml_(row["学籍番号"])}</td>
    <td>${escapeHtml_(row["Stage"])}</td>
    <td>${escapeHtml_(row["得点"])}/${escapeHtml_(row["問題数"])}</td>
    <td>${escapeHtml_(row["正答率"])}</td>
    <td>${escapeHtml_(row["所要時間[s]"])}</td>
    <td>${escapeHtml_(row["クリア"])}</td>
  </tr>`).join("");

  const countRows = counts.map(row => `<tr>
    <td>${escapeHtml_(row["学籍番号"])}</td>
    <td>${escapeHtml_(row["Stage"])}</td>
    <td>${escapeHtml_(row["Stage挑戦回数"])}</td>
    <td>${escapeHtml_(row["全体挑戦回数"])}</td>
    <td>${escapeHtml_(row["最終更新"])}</td>
  </tr>`).join("");

  const loginRows = logins.slice(0, 120).map(row => `<tr>
    <td>${escapeHtml_(row["日時"])}</td>
    <td>${escapeHtml_(row["学籍番号"])}</td>
    <td>${escapeHtml_(row["戻り先"])}</td>
    <td>${escapeHtml_(row["認証入口"])}</td>
  </tr>`).join("");

  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><title>mol Trainer Dashboard</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Yu Gothic",sans-serif;margin:0;background:#f6f8fb;color:#162033}
    main{max-width:1180px;margin:0 auto;padding:28px 16px 48px}
    h1{margin:0 0 14px;font-size:28px}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:22px}
    .kpi{background:#fff;border:1px solid #d8e1ec;border-radius:8px;padding:16px}.kpi b{display:block;font-size:28px}
    h2{margin:26px 0 10px}table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #d8e1ec}
    th,td{padding:10px 12px;border-bottom:1px solid #d8e1ec;text-align:left;font-size:13px;vertical-align:top}
    th{position:sticky;top:0;background:#eef7ff}tr:hover td{background:#f9fbfd}.table-wrap{overflow:auto}
    @media(max-width:760px){.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
  </style></head><body><main>
    <h1>mol Trainer Dashboard</h1>
    <div class="kpis"><div class="kpi">ログイン者数<b>${Object.keys(loginStudents).length}</b></div><div class="kpi">ログイン回数<b>${logins.length}</b></div><div class="kpi">提出者数<b>${Object.keys(students).length}</b></div><div class="kpi">提出数<b>${totalAttempts}</b></div></div>
    <h2>最近のログイン</h2><div class="table-wrap"><table><thead><tr><th>日時</th><th>学籍番号</th><th>戻り先</th><th>認証入口</th></tr></thead><tbody>${loginRows}</tbody></table></div>
    <h2>最近の提出</h2><div class="table-wrap"><table><thead><tr><th>日時</th><th>学籍番号</th><th>Stage</th><th>得点</th><th>正答率</th><th>時間</th><th>クリア</th></tr></thead><tbody>${recentRows}</tbody></table></div>
    <h2>挑戦回数</h2><div class="table-wrap"><table><thead><tr><th>学籍番号</th><th>Stage</th><th>Stage挑戦</th><th>全体挑戦</th><th>最終更新</th></tr></thead><tbody>${countRows}</tbody></table></div>
  </main></body></html>`;
}

function buildStudentDashboardHtml_(studentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  const allLogs = logSheet ? readSheetObjects_(logSheet) : [];
  const analysis = buildStudentAnalysis_(allLogs, studentId);
  const logs = analysis.myAttempts.slice().reverse();
  const rows = logs.slice(0, 80).map(row => `<tr>
    <td>${escapeHtml_(row["日時"])}</td>
    <td>${escapeHtml_(row["Stage"])}</td>
    <td>${escapeHtml_(row["得点"])}/${escapeHtml_(row["問題数"])}</td>
    <td>${escapeHtml_(row["正答率"])}</td>
    <td>${escapeHtml_(formatSeconds_(Number(row["所要時間[s]"] || 0)))}</td>
    <td>${escapeHtml_(row["クリア"])}</td>
  </tr>`).join("");

  const stageRows = analysis.stageStats.map(item => `<tr>
    <td>${escapeHtml_(item.stage)}</td>
    <td>${escapeHtml_(item.attempts)}</td>
    <td>${escapeHtml_(item.bestScore)}/${escapeHtml_(item.total)}</td>
    <td>${escapeHtml_(item.cleared ? "クリア" : "未クリア")}</td>
    <td>${escapeHtml_(formatSeconds_(item.activeSeconds))}</td>
  </tr>`).join("");

  const nextRankText = analysis.rank.next
    ? `あと ${analysis.rank.remaining} 回クリアで ${escapeHtml_(analysis.rank.next.name)}`
    : "最高ランクです";

  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><title>自分の学習状況</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Yu Gothic",sans-serif;margin:0;background:#f6f8fb;color:#162033}
    main{max-width:1080px;margin:0 auto;padding:28px 16px 52px}
    h1{margin:0 0 4px;font-size:clamp(26px,6vw,40px);letter-spacing:0}p{line-height:1.75}
    .muted{color:#5e6b7f}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0}
    .card{background:#fff;border:1px solid #d8e1ec;border-radius:8px;padding:16px;box-shadow:0 10px 26px rgba(22,32,51,.06)}
    .card span{display:block;color:#5e6b7f;font-size:13px;font-weight:800}.card b{display:block;margin-top:4px;font-size:28px;line-height:1.15}
    .rank-card{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;align-items:center;margin:18px 0}
    .rank-name{font-size:30px;font-weight:900;color:#0b5e58}.meter{height:12px;background:#dfe8f1;border-radius:999px;overflow:hidden;margin-top:10px}.meter i{display:block;height:100%;background:#0f766e;width:${analysis.rank.progress}%}
    h2{margin:28px 0 10px;font-size:22px}.table-wrap{overflow:auto;border-radius:8px;border:1px solid #d8e1ec;background:#fff}
    table{width:100%;border-collapse:collapse}th,td{padding:10px 12px;border-bottom:1px solid #d8e1ec;text-align:left;font-size:13px;white-space:nowrap}th{background:#eef7ff}
    .leaderboards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.big-rank{font-size:34px;font-weight:900}
    @media(max-width:760px){main{padding:22px 12px 44px}.grid,.rank-card,.leaderboards{grid-template-columns:1fr}.card b{font-size:24px}}
  </style></head>
  <body><main>
    <h1>自分の学習状況</h1>
    <p class="muted">学籍番号 ${escapeHtml_(studentId)}</p>

    <section class="rank-card card">
      <div><span>現在のランク</span><div class="rank-name">${escapeHtml_(analysis.rank.current.name)}</div><div class="meter" aria-label="ランク進捗"><i></i></div></div>
      <div><strong>${nextRankText}</strong><p class="muted">ランクはクリア回数で上がります。</p></div>
    </section>

    <section class="grid">
      <div class="card"><span>挑戦回数</span><b>${escapeHtml_(analysis.totalAttempts)}</b></div>
      <div class="card"><span>クリア回数</span><b>${escapeHtml_(analysis.clearCount)}</b></div>
      <div class="card"><span>アクティブ挑戦時間</span><b>${escapeHtml_(formatSeconds_(analysis.activeSeconds))}</b></div>
      <div class="card"><span>累計得点</span><b>${escapeHtml_(analysis.totalScore)}</b></div>
    </section>

    <section class="leaderboards">
      <div class="card"><span>通算ランキング</span><div class="big-rank">${escapeHtml_(formatRank_(analysis.totalRank, analysis.totalPlayers))}</div><p class="muted">累計得点で集計</p></div>
      <div class="card"><span>週のランキング</span><div class="big-rank">${escapeHtml_(formatRank_(analysis.weekRank, analysis.weekPlayers))}</div><p class="muted">直近7日間の得点で集計</p></div>
    </section>

    <h2>Stage別の状況</h2>
    <div class="table-wrap"><table><thead><tr><th>Stage</th><th>挑戦</th><th>最高点</th><th>状態</th><th>時間</th></tr></thead><tbody>${stageRows}</tbody></table></div>

    <h2>最近の挑戦</h2>
    <div class="table-wrap"><table><thead><tr><th>日時</th><th>Stage</th><th>得点</th><th>正答率</th><th>時間</th><th>クリア</th></tr></thead><tbody>${rows}</tbody></table></div>
  </main></body></html>`;
}

function buildStudentAnalysis_(logs, studentId) {
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const attempts = logs.filter(row => String(row["Event"] || "") === "stage_result");
  const myAttempts = attempts.filter(row => String(row["学籍番号"] || "") === studentId);
  const studentTotals = {};
  const weekTotals = {};
  const stageMap = {};

  attempts.forEach(row => {
    const id = String(row["学籍番号"] || "");
    if (!id) return;
    const score = Number(row["得点"] || 0);
    studentTotals[id] = (studentTotals[id] || 0) + score;
    if (isWithinWeek_(row["日時"], weekStart)) weekTotals[id] = (weekTotals[id] || 0) + score;
  });

  let totalScore = 0;
  let clearCount = 0;
  let activeSeconds = 0;

  myAttempts.forEach(row => {
    const score = Number(row["得点"] || 0);
    const total = Number(row["問題数"] || 5);
    const seconds = Number(row["所要時間[s]"] || 0);
    const stage = String(row["Stage"] || "Stage");
    const cleared = String(row["クリア"] || "") === "○";
    totalScore += score;
    activeSeconds += seconds;
    if (cleared) clearCount += 1;

    const current = stageMap[stage] || { stage, attempts: 0, bestScore: 0, total, cleared: false, activeSeconds: 0 };
    current.attempts += 1;
    current.bestScore = Math.max(current.bestScore, score);
    current.total = total || current.total;
    current.cleared = current.cleared || cleared;
    current.activeSeconds += seconds;
    stageMap[stage] = current;
  });

  const totalRank = calculateRank_(studentTotals, studentId);
  const weekRank = calculateRank_(weekTotals, studentId);
  return {
    totalAttempts: myAttempts.length,
    clearCount,
    activeSeconds,
    totalScore,
    myAttempts,
    stageStats: Object.values(stageMap).sort((a, b) => a.stage.localeCompare(b.stage, "ja")),
    totalRank: totalRank.rank,
    totalPlayers: totalRank.players,
    weekRank: weekRank.rank,
    weekPlayers: weekRank.players,
    rank: getLearningRank_(clearCount)
  };
}

function calculateRank_(scores, studentId) {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const index = entries.findIndex(entry => entry[0] === studentId);
  return { rank: index >= 0 ? index + 1 : null, players: entries.length };
}

function getLearningRank_(clearCount) {
  const ranks = [
    { name: "Starter", clears: 0 },
    { name: "Bronze", clears: 3 },
    { name: "Silver", clears: 7 },
    { name: "Gold", clears: 14 },
    { name: "Platinum", clears: 25 },
    { name: "Master", clears: 40 }
  ];
  let current = ranks[0];
  let next = null;
  for (let i = 0; i < ranks.length; i++) {
    if (clearCount >= ranks[i].clears) current = ranks[i];
    else {
      next = ranks[i];
      break;
    }
  }
  const previousClears = current.clears;
  const nextClears = next ? next.clears : current.clears;
  const range = Math.max(1, nextClears - previousClears);
  const progress = next ? Math.min(100, Math.round(((clearCount - previousClears) / range) * 100)) : 100;
  return {
    current,
    next,
    remaining: next ? Math.max(0, next.clears - clearCount) : 0,
    progress
  };
}

function isWithinWeek_(value, weekStart) {
  const date = value instanceof Date ? value : new Date(value);
  return !isNaN(date.getTime()) && date >= weekStart;
}

function formatRank_(rank, players) {
  return rank ? rank + " / " + players + "位" : "- / " + players + "位";
}

function formatSeconds_(seconds) {
  const value = Math.max(0, Math.round(Number(seconds || 0)));
  const minutes = Math.floor(value / 60);
  const rest = value % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return hours + "時間" + (minutes % 60) + "分";
  }
  return minutes + "分" + rest + "秒";
}

function readSheetObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).map(row => {
    const item = {};
    headers.forEach((header, index) => item[header] = row[index]);
    return item;
  });
}

function escapeHtml_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
