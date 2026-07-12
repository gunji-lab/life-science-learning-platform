const grid = document.getElementById('stage-grid');
const groupLabels = { prep: '準備', basic: '基礎', practice: '実践' };
let currentGroup = '';

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
    <div class="stage-meta"><span>${best ? `最高 ${best}/5` : '未挑戦'}</span><span>${stage.meta} →</span></div>
  `;
  grid.appendChild(a);
});
