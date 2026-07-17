const grid = document.getElementById('stage-grid');
const authPanel = document.getElementById('auth-panel');
const learningPanel = document.getElementById('learning-panel');
const startLogin = document.getElementById('start-login');
const chooseLogin = document.getElementById('choose-login');
const dashboardLink = document.getElementById('dashboard-link');
const groupLabels = { prep: '準備', basic: '基礎', practice: '実践' };
let currentGroup = '';
const stageCards = new Map();

function showLoggedInHome(){
  if(authPanel) authPanel.classList.add('hidden');
  if(learningPanel) learningPanel.classList.remove('hidden');
}

function showLoginHome(){
  if(authPanel) authPanel.classList.remove('hidden');
  if(learningPanel) learningPanel.classList.add('hidden');
}

window.MOL_STAGES.forEach(stage => {
  if (stage.group !== currentGroup) {
    currentGroup = stage.group;
    const heading = document.createElement('div');
    heading.className = `module-group-heading ${stage.group}`;
    heading.innerHTML = `<span>${groupLabels[stage.group]}</span><small>${stage.group === 'prep' ? 'まず確認' : stage.group === 'basic' ? '基本を身につける' : '実験につなげる'}</small>`;
    grid.appendChild(heading);
  }

  const a = document.createElement('a');
  a.className = `stage-card ${stage.group}`;
  a.href = `stage.html?stage=${stage.id}`;
  const best = Number(localStorage.getItem(`molStage${stage.id}Best`) || 0);
  a.innerHTML = `
    <div class="stage-number">${stage.label}</div>
    <h3>${stage.title}</h3>
    <p>${stage.description}</p>
    <div class="stage-meta"><span data-progress>${best ? `最高 ${best}/5` : '未挑戦'}</span><span>${stage.meta} →</span></div>
  `;
  grid.appendChild(a);
  stageCards.set(stage.id, a);
});

function applyProgress(progress){
  if(!progress || !progress.stages) return;
  Object.entries(progress.stages).forEach(([id, item]) => {
    const card = stageCards.get(Number(id));
    if(!card) return;
    const label = card.querySelector('[data-progress]');
    if(!label) return;
    if(item.cleared){
      label.textContent = `クリア ${item.bestScore || 0}/${item.total || 5}`;
      card.classList.add('cleared');
      return;
    }
    if(item.attempts){
      label.textContent = `未クリア 最高 ${item.bestScore || 0}/${item.total || 5}`;
      card.classList.add('not-cleared');
    }
  });
}

function loadProgress(){
  if(!window.MolTracker || !window.MolTracker.isReady()) return;
  const callbackName = `molProgress_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  window[callbackName] = data => {
    applyProgress(data);
    delete window[callbackName];
    script.remove();
  };
  const script = document.createElement('script');
  script.src = window.MolTracker.progressUrl(callbackName);
  script.onerror = () => {
    delete window[callbackName];
    script.remove();
  };
  document.body.appendChild(script);
}

if(window.MolTracker){
  if(startLogin) startLogin.href = window.MolTracker.addSessionUrl();
  if(chooseLogin) chooseLogin.href = window.MolTracker.accountChooserUrl();
  if(dashboardLink) dashboardLink.href = window.MolTracker.dashboardUrl();
  if(window.MolTracker.isReady()){
    showLoggedInHome();
    loadProgress();
  }else{
    showLoginHome();
  }
}
