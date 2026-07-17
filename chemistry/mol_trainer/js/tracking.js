window.MOL_TRACKING = {
  gasUrl: "https://script.google.com/macros/s/AKfycbw0X89rHTk6ByZrIDoZdePR5L7ik-51DwxzGzZkRvTC6OJrEiZM7Oyw425YYLhFVgZC4g/exec",
  trainerBaseUrl: "https://gunji-lab.github.io/life-science-learning-platform/chemistry/mol_trainer",
  tokenStorageKey: "molTrainerAuthToken"
};

(function(){
  const config = window.MOL_TRACKING;

  function cleanUrl(){
    return location.href.replace(/#.*$/, "");
  }

  function hasGasUrl(){
    return Boolean(config.gasUrl && !config.gasUrl.includes("PASTE_GAS_WEB_APP_URL_HERE"));
  }

  function readAuthFromHash(){
    const match = location.hash.match(/(?:^|[#&])auth=([^&]+)/);
    if (!match) return;
    localStorage.setItem(config.tokenStorageKey, decodeURIComponent(match[1]));
    history.replaceState(null, document.title, cleanUrl());
  }

  function getToken(){
    return localStorage.getItem(config.tokenStorageKey) || "";
  }

  function loginUrl(){
    const returnUrl = cleanUrl();
    return `${config.gasUrl}?view=auth&return=${encodeURIComponent(returnUrl)}`;
  }

  function addSessionUrl(){
    return `https://accounts.google.com/AddSession?hl=ja&continue=${encodeURIComponent(loginUrl())}`;
  }

  function accountChooserUrl(){
    return `https://accounts.google.com/AccountChooser?hd=toyo.jp&continue=${encodeURIComponent(loginUrl())}`;
  }

  function dashboardUrl(){
    return `${config.gasUrl}?view=my`;
  }

  function progressUrl(callbackName){
    const params = new URLSearchParams({
      view: "progress",
      token: getToken(),
      callback: callbackName
    });
    return `${config.gasUrl}?${params.toString()}`;
  }

  function trackUrl(eventName, payload, callbackName){
    const body = {
      authToken: getToken(),
      event: eventName,
      page: location.pathname.split("/").pop() || "index.html",
      sentAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      payload
    };
    const params = new URLSearchParams({
      view: "track",
      data: JSON.stringify(body),
      callback: callbackName
    });
    return `${config.gasUrl}?${params.toString()}`;
  }

  function sendByScript(url, callbackName){
    window[callbackName] = () => {
      delete window[callbackName];
      script.remove();
    };
    const script = document.createElement("script");
    script.src = url;
    script.onerror = () => {
      delete window[callbackName];
      script.remove();
    };
    document.body.appendChild(script);
  }

  function renderLoginGate(){
    if (!hasGasUrl() || getToken() || window.MOL_AUTH_OPTIONAL === true) return;
    document.body.className = "auth-required";
    document.body.innerHTML = `
      <main id="mol-login-gate" class="login-gate">
        <section class="login-panel">
          <p class="login-eyebrow">mol Trainer</p>
          <h1>大学Googleアカウントでログイン</h1>
          <p>本ページは <strong>@toyo.jp</strong> の大学アカウント専用です。個人Gmailだけでログインしている場合は、先に大学アカウントを追加してください。</p>
          <div class="login-actions">
            <a class="primary-login" href="${addSessionUrl()}">大学アカウントを追加してログイン</a>
            <a class="secondary-login" href="${accountChooserUrl()}">追加済みの大学アカウントを選ぶ</a>
          </div>
          <p class="login-help">うまく切り替わらない場合は、シークレット／プライベートウィンドウでこのページを開き、大学アカウントだけでログインしてください。</p>
        </section>
      </main>
    `;
  }

  function injectStyles(){
    if (document.getElementById("mol-auth-style")) return;
    const style = document.createElement("style");
    style.id = "mol-auth-style";
    style.textContent = `
      body.auth-required{margin:0;background:#f6f8fb;color:#162033}
      .login-gate{min-height:100vh;display:grid;place-items:center;padding:24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif}
      .login-panel{width:min(680px,100%);background:#fff;border:1px solid #d8e1ec;border-top:5px solid #0f766e;border-radius:8px;padding:clamp(24px,6vw,40px);box-shadow:0 16px 36px rgba(22,32,51,.08)}
      .login-eyebrow{margin:0 0 8px;color:#0b5e58;font-size:.86rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      .login-panel h1{margin:0 0 18px;font-size:clamp(2rem,8vw,3rem);line-height:1.15;letter-spacing:0}
      .login-panel p{font-size:1.06rem;line-height:1.8;margin:0 0 18px}
      .login-actions{display:grid;gap:12px;margin:24px 0}
      .login-actions a{display:flex;align-items:center;justify-content:center;min-height:54px;padding:13px 18px;border-radius:8px;text-decoration:none;font-weight:900;text-align:center}
      .primary-login{background:#0f766e;color:#fff}
      .secondary-login{background:#e7f6f3;color:#0b5e58}
      .login-help{color:#5e6b7f;font-size:.98rem!important}
    `;
    document.head.appendChild(style);
  }

  readAuthFromHash();
  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    renderLoginGate();
  });

  window.MolTracker = {
    isReady(){
      return hasGasUrl() && Boolean(getToken());
    },

    loginUrl,

    addSessionUrl,

    accountChooserUrl,

    dashboardUrl,

    progressUrl,

    getToken,

    track(eventName, payload = {}) {
      if (!hasGasUrl()) return;
      const authToken = getToken();
      if (!authToken) {
        renderLoginGate();
        return;
      }

      const callbackName = `molTrack_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      sendByScript(trackUrl(eventName, payload, callbackName), callbackName);
    }
  };
})();
