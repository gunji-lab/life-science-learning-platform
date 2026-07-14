let labs = [];
let eventData = null;
let selected = new Set();
let selectedEventFilters = new Set();
let selectedEventDate = '';
let favorites = new Set(safeStoredFavorites());

const interestRoutes = [
  {
    id: 'animals',
    label: '動物やからだが気になる',
    description: '動物の形、動き、発生、神経などから生命を見たい人へ。',
    required: ['動物', '野生動物', '哺乳類', '鳥類', '魚類', 'キリン', '骨格', '筋肉', '心臓', '神経', '脳', '比較解剖学', '機能形態学', 'バイオメカニクス'],
    terms: ['動物', '野生動物', '哺乳類', '鳥類', '魚類', 'キリン', '骨格', '筋肉', '形態', '発生', '胚', '心臓', '神経', '脳', '行動', '運動', '比較解剖学', '機能形態学', 'バイオメカニクス']
  },
  {
    id: 'health',
    label: '病気・健康・医療に興味がある',
    description: '健康、毒性、医療、リスク、こころと体の状態を考えたい人へ。',
    terms: ['健康', '医療', '毒性', '環境健康', '環境保健', 'メンタルヘルス', 'リスク', '曝露', '公衆衛生', '細胞外小胞', 'ストレス応答', '運動', '代謝', 'ダイオキシン', '受容体']
  },
  {
    id: 'plants_food',
    label: '植物や食べものに関わりたい',
    description: '植物、作物、食料、栄養、植物が作る成分に興味がある人へ。',
    terms: ['植物', 'イネ', '作物', '光合成', '植物生理', '植物ホルモン', '成長制御', '植物バイオーム', '食料', '栄養', '収量', '植物化学', '天然物', '植物生化学']
  },
  {
    id: 'environment',
    label: '環境問題を考えたい',
    description: '水、地球環境、生態系、生物多様性、環境リスクを考えたい人へ。',
    terms: ['水環境', '水質', '地球環境', '気候変動', '環境変動', '環境保全', '環境修復', '生態系', '生態学', '生態リスク', '生物多様性', '保全', '海洋生態系', '持続可能性', '物質循環', '環境問題']
  },
  {
    id: 'micro_world',
    label: '微生物や見えない世界が気になる',
    description: '微生物、極限環境、酵素、放射線、宇宙につながる生命を見たい人へ。',
    terms: ['微生物', 'バクテリア', '極限環境', '超好熱菌', '極域', '南極', '低温適応', '放射線', '宇宙', '酵素', '生体触媒', '発酵', '微生物学', '電気微生物']
  },
  {
    id: 'dna_cells',
    label: 'DNA・細胞・遺伝子を知りたい',
    description: 'DNA、細胞、遺伝子、タンパク質など、生命の小さなしくみへ。',
    terms: ['DNA', 'DNA修復', '遺伝子', '遺伝子解析', 'ゲノム', '突然変異', '細胞', '細胞培養', '細胞工学', 'iPS細胞', '分子生物学', 'タンパク質', '分子遺伝学', '代謝', '分子']
  },
  {
    id: 'experiments',
    label: '実験や分析が好き',
    description: '実験、観察、培養、化学分析、測定を通して確かめたい人へ。',
    terms: ['顕微鏡', '細胞培養', '培養', '化学分析', '成分分析', '測定', '生理測定', '生化学', '有機化学', '糖質', '糖鎖', '材料', '酵素活性', '分子生物学実験', '物理実験', '標本', '解剖', 'CT']
  },
  {
    id: 'fieldwork',
    label: '野外で生き物を調べたい',
    description: 'フィールド調査、野生動物、生態系、自然環境を自分の目で見たい人へ。',
    terms: ['フィールド', '野外', '野生動物', '自然環境', '生態系', '生物多様性', '分布', '分類', '海洋生態系', '水環境', '保全', '行動観察']
  },
  {
    id: 'data',
    label: 'データで生命を読み解きたい',
    description: 'データ解析、統計、情報、ゲノム、計測から生命を理解したい人へ。',
    terms: ['データ解析', '統計', '生物統計', '情報', 'ゲノム', 'バイオインフォマティクス', '計測', 'リスク評価', '疫学', '分布データ', '環境データ']
  }
];
const syllabusUrl = 'https://g-sys.toyo.ac.jp/syllabus/';
const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];
const deptClass = (department) => department === '生命科学科' ? 'life' : 'resource';
const departmentMeta = {
  '生命科学科': {
    className: 'life',
    description: '動物・人体・細胞などから、生命のしくみと健康・進化の問いを探る研究室。'
  },
  '生物資源学科': {
    className: 'resource',
    description: '植物や微生物の力を、食料・環境・社会へ生かす研究室。'
  }
};

init();

async function init() {
  bindNavigation();
  bindModalClose();
  updateFavoriteCount();

  try {
    const [labResponse, eventResponse] = await Promise.all([
      fetch('data/labs.json'),
      fetch('data/events.json')
    ]);
    if (!labResponse.ok) throw new Error(`labs.json: ${labResponse.status}`);
    if (!eventResponse.ok) throw new Error(`events.json: ${eventResponse.status}`);
    labs = await labResponse.json();
    eventData = await eventResponse.json();
    selectedEventDate = eventData.dates?.[0]?.date || '';
    renderHomeTags();
    renderInterest();
    renderLabList();
    renderVisitors();
  } catch (error) {
    showLoadError(error);
  }
}

function safeStoredFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem('mylab-favorites') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function bindNavigation() {
  qsa('.tab').forEach((button) => {
    button.onclick = () => switchView(button.dataset.view);
  });
  qsa('[data-go]').forEach((button) => {
    button.onclick = () => switchView(button.dataset.go);
  });
  qs('#clear-filters').onclick = () => {
    selected.clear();
    renderInterest();
  };
  qs('#lab-search').oninput = renderLabList;
  qs('#department-filter').onchange = renderLabList;
  qs('#clear-favorites').onclick = () => {
    if (favorites.size && confirm('お気に入りをすべて解除しますか？')) {
      favorites.clear();
      saveFavorites();
      renderFavorites();
    }
  };
}

function bindModalClose() {
  qsa('[data-close]').forEach((item) => {
    item.onclick = () => {
      qs('#modal').classList.remove('open');
      qs('#modal').setAttribute('aria-hidden', 'true');
    };
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && qs('#modal').classList.contains('open')) {
      qs('[data-close]').click();
    }
  });
}

function switchView(name) {
  qsa('.view').forEach((view) => view.classList.remove('active'));
  qs(`#view-${name}`).classList.add('active');
  qsa('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderCurrentView();
}

function renderCurrentView() {
  const active = qs('.view.active')?.id.replace('view-', '');
  if (active === 'interest') renderInterest();
  if (active === 'labs') renderLabList();
  if (active === 'visitors') renderVisitors();
  if (active === 'favorites') renderFavorites();
}

function saveFavorites() {
  localStorage.setItem('mylab-favorites', JSON.stringify([...favorites]));
  updateFavoriteCount();
}

function updateFavoriteCount() {
  const count = qs('#favorite-count');
  if (count) count.textContent = favorites.size;
}

function toggleFavorite(id) {
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  saveFavorites();
  renderCurrentView();
}

function renderHomeTags() {
  const container = qs('#home-tags');
  container.innerHTML = '';
  interestRoutes.forEach((route) => {
    if (routeMatchCount(route)) container.appendChild(tagButton(route));
  });
}

function tagButton(route) {
  const button = document.createElement('button');
  button.className = 'interest-tag';
  button.textContent = route.label;
  button.onclick = () => {
    selected = new Set([route.id]);
    switchView('interest');
  };
  return button;
}

function renderTagPanels() {
  const panel = qs('#interest-tags');
  panel.innerHTML = '';
  const intro = document.createElement('div');
  intro.className = 'keyword-panel-head';
  intro.innerHTML = '<strong>高校生のことばで選ぶ</strong><p>研究室データのキーワードや研究方法から、入口タグを自動で判定しています。</p>';
  panel.appendChild(intro);

  const routeGrid = document.createElement('div');
  routeGrid.className = 'interest-route-grid';
  interestRoutes.forEach((route) => {
    const count = routeMatchCount(route);
    if (!count) return;
    const button = document.createElement('button');
    button.className = `interest-route${selected.has(route.id) ? ' selected' : ''}`;
    button.innerHTML = `<span>${escapeHtml(route.label)}</span><small>${count} LABS</small><p>${escapeHtml(route.description)}</p>`;
    button.onclick = () => {
      selected.has(route.id) ? selected.delete(route.id) : selected.add(route.id);
      renderInterest();
    };
    routeGrid.appendChild(button);
  });
  panel.appendChild(routeGrid);
}

function routeById(id) {
  return interestRoutes.find((route) => route.id === id);
}

function routeMatchCount(route) {
  return labs.filter((lab) => matchesRoute(lab, route)).length;
}

function matchesRoute(lab, route) {
  const overrides = lab.interest_overrides || [];
  if (overrides.includes(route.id) || overrides.includes(route.label)) return true;
  const text = routeText(lab);
  if (route.required && !route.required.some((term) => text.includes(String(term).toLowerCase()))) {
    return false;
  }
  return route.terms.some((term) => text.includes(String(term).toLowerCase()));
}

function searchableText(lab) {
  return [
    lab.lab_name,
    lab.pi_name,
    lab.position,
    lab.department,
    lab.summary,
    lab.question,
    lab.description,
    ...(lab.keywords || []),
    ...(lab.methods || []),
    ...(lab.courses || []).map((course) => course.title)
  ].join(' ').toLowerCase();
}

function routeText(lab) {
  return [
    lab.lab_name,
    lab.summary,
    lab.question,
    lab.description,
    ...(lab.keywords || []),
    ...(lab.methods || [])
  ].join(' ').toLowerCase();
}

function card(lab, match = '') {
  const article = document.createElement('article');
  const isFav = favorites.has(lab.id);
  article.className = `lab-card card ${deptClass(lab.department)}`;
  article.innerHTML = `
    <span class="lab-dept">${escapeHtml(lab.department)}</span>
    <div class="lab-card-head">
      <div>
        <h3>${escapeHtml(lab.lab_name)}</h3>
        <p class="pi-name">${escapeHtml(lab.pi_name)} ${escapeHtml(lab.position)}</p>
      </div>
    </div>
    <p class="catch">${escapeHtml(lab.summary)}</p>
    <div class="card-question"><span>QUESTION</span><strong>${escapeHtml(lab.question)}</strong></div>
    <div class="keywords">${lab.keywords.slice(0, 5).map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`).join('')}</div>
    <div class="lab-actions">
      <button class="favorite-button ${isFav ? 'active' : ''}" aria-label="${isFav ? 'お気に入りから外す' : 'お気に入りに追加'}">${isFav ? '♥' : '♡'}</button>
      <span class="match">${escapeHtml(match)}</span>
      <button class="open-lab">研究室をのぞく →</button>
    </div>`;
  article.querySelector('.favorite-button').onclick = (event) => {
    event.stopPropagation();
    toggleFavorite(lab.id);
  };
  article.querySelector('.open-lab').onclick = (event) => {
    event.stopPropagation();
    openModal(lab);
  };
  article.onclick = () => openModal(lab);
  article.tabIndex = 0;
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', `${lab.lab_name}の詳細を見る`);
  article.onkeydown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(lab);
    }
  };
  return article;
}

function renderGroupedLabs(container, items, matchLabel) {
  container.innerHTML = '';
  container.classList.add('grouped');
  if (!items.length) {
    container.innerHTML = '<div class="empty-result card">条件に合う研究室がありません。</div>';
    return;
  }
  ['生命科学科', '生物資源学科'].forEach((department) => {
    const groupItems = items.filter((lab) => lab.department === department);
    if (!groupItems.length) return;
    const meta = departmentMeta[department];
    const section = document.createElement('section');
    section.className = 'department-group';
    section.innerHTML = `
      <div class="department-heading ${meta.className}">
        <div><span class="department-label">DEPARTMENT</span><h3>${department}</h3><p>${meta.description}</p></div>
        <span class="department-count">${groupItems.length} LABS</span>
      </div>
      <div class="department-cards"></div>`;
    const cards = section.querySelector('.department-cards');
    groupItems.forEach((lab) => cards.appendChild(card(lab, matchLabel ? matchLabel(lab) : '')));
    container.appendChild(section);
  });
}

function renderInterest() {
  renderTagPanels();
  const selectedRoutes = [...selected].map(routeById).filter(Boolean);
  const filtered = labs.filter((lab) => {
    return !selectedRoutes.length || selectedRoutes.some((route) => matchesRoute(lab, route));
  });
  renderGroupedLabs(qs('#interest-results'), filtered, (lab) => {
    const routeLabels = selectedRoutes.filter((route) => matchesRoute(lab, route)).map((route) => route.label);
    return routeLabels.length ? `${routeLabels.length}入口に一致` : '';
  });
  qs('#result-count').textContent = `${filtered.length} labs`;
  const selectedLabels = selectedRoutes.map((route) => route.label);
  qs('#result-message').textContent = selected.size
    ? `「${selectedLabels.join('・')}」に関連する研究室です。`
    : `${labs.length}研究室を表示しています。`;
}

function renderLabList() {
  const query = qs('#lab-search').value.trim().toLowerCase();
  const department = qs('#department-filter').value;
  const filtered = labs.filter((lab) => {
    const departmentMatch = department === 'all' || lab.department === department;
    return departmentMatch && (!query || searchableText(lab).includes(query));
  });
  renderGroupedLabs(qs('#lab-list'), filtered);
}

function renderFavorites() {
  renderGroupedLabs(qs('#favorite-list'), labs.filter((lab) => favorites.has(lab.id)));
}

function renderVisitors() {
  if (!eventData) return;
  renderEventSummary();
  renderEventDates();
  renderEventFilters();

  const programs = filteredPrograms();
  const list = qs('#event-list');
  list.innerHTML = '';
  if (!programs.length) {
    list.innerHTML = '<div class="empty-result card">条件に合うプログラムがありません。</div>';
  } else {
    programs.forEach((program) => list.appendChild(eventCard(program)));
  }
  qs('#event-count').textContent = `${programs.length} programs`;
  const currentDate = currentEventDateBlock();
  qs('#event-message').textContent = selectedEventFilters.size
    ? `${currentDate?.label || ''}の「${[...selectedEventFilters].join('・')}」に合うプログラムです。`
    : `${currentDate?.label || ''}のプログラムを表示しています。`;
}

function renderEventSummary() {
  const summary = qs('#event-summary');
  const dates = eventData.dates || [];
  const currentDate = currentEventDateBlock();
  const programCount = currentDate?.programs?.length || 0;
  summary.innerHTML = `
    <div>
      <span class="eyebrow">EVENT</span>
      <h3>${escapeHtml(eventData.event)}</h3>
      <p>${escapeHtml(eventData.lead || '今日、会える先生・見られる研究を知るページです。')}</p>
    </div>
    <div class="event-summary-stats">
      <span><strong>${dates.length}</strong>日程</span>
      <span><strong>${programCount}</strong>件表示</span>
    </div>`;
}

function renderEventDates() {
  const container = qs('#event-date-tabs');
  if (!container) return;
  container.innerHTML = '';
  (eventData.dates || []).forEach((dateBlock) => {
    const button = document.createElement('button');
    button.className = `event-date-tab${selectedEventDate === dateBlock.date ? ' active' : ''}`;
    button.innerHTML = `<span>${escapeHtml(dateBlock.label)}</span><small>${dateBlock.programs?.length || 0}件</small>`;
    button.onclick = () => {
      selectedEventDate = dateBlock.date;
      selectedEventFilters.clear();
      renderVisitors();
    };
    container.appendChild(button);
  });
}

function renderEventFilters() {
  const filters = ['実験プログラム', '学科紹介', '学科相談', 'お気に入り', '生命科学科', '生物資源学科'];
  const container = qs('#event-filters');
  container.innerHTML = `
    <div class="keyword-panel-head">
      <strong>当日の見方で絞る</strong>
      <p>気になる形式や学科を選ぶと、見学候補をしぼれます。</p>
    </div>
    <div class="event-filter-grid"></div>`;
  const grid = container.querySelector('.event-filter-grid');
  filters.forEach((filter) => {
    const button = document.createElement('button');
    button.className = `event-filter${selectedEventFilters.has(filter) ? ' selected' : ''}`;
    button.textContent = filter;
    button.onclick = () => {
      selectedEventFilters.has(filter) ? selectedEventFilters.delete(filter) : selectedEventFilters.add(filter);
      renderVisitors();
    };
    grid.appendChild(button);
  });
  if (selectedEventFilters.size) {
    const clear = document.createElement('button');
    clear.className = 'event-filter clear';
    clear.textContent = 'クリア';
    clear.onclick = () => {
      selectedEventFilters.clear();
      renderVisitors();
    };
    grid.appendChild(clear);
  }
}

function flattenPrograms() {
  return (eventData?.dates || []).flatMap((dateBlock) => {
    return (dateBlock.programs || []).map((program) => ({
      ...program,
      date: dateBlock.date,
      dateLabel: dateBlock.label
    }));
  });
}

function currentEventDateBlock() {
  return (eventData?.dates || []).find((dateBlock) => dateBlock.date === selectedEventDate) || eventData?.dates?.[0];
}

function filteredPrograms() {
  const filters = [...selectedEventFilters];
  const dateBlock = currentEventDateBlock();
  const programs = (dateBlock?.programs || []).map((program) => ({
    ...program,
    date: dateBlock.date,
    dateLabel: dateBlock.label
  }));
  return programs.filter((program) => {
    if (!filters.length) return true;
    return filters.some((filter) => programMatchesFilter(program, filter));
  });
}

function programMatchesFilter(program, filter) {
  const programLabs = labsForProgram(program);
  if (filter === 'お気に入り') return programLabs.some((lab) => favorites.has(lab.id));
  if (program.type === filter) return true;
  if ((program.tags || []).includes(filter)) return true;
  return programLabs.some((lab) => lab.department === filter);
}

function labsForProgram(program) {
  const ids = program.lab_ids || (program.lab_id ? [program.lab_id] : []);
  return ids.map((id) => labs.find((lab) => lab.id === id)).filter(Boolean);
}

function eventCard(program) {
  const article = document.createElement('article');
  const programLabs = labsForProgram(program);
  const primaryLab = programLabs[0];
  const isSingle = programLabs.length === 1;
  article.className = `event-card card ${primaryLab ? deptClass(primaryLab.department) : ''}`;
  article.innerHTML = `
    <div class="event-card-top">
      <span class="event-date">${escapeHtml(program.dateLabel)}</span>
      <span class="event-type">${escapeHtml(program.type)}</span>
    </div>
    <h3>${escapeHtml(displayProgramTitle(program.title))}</h3>
    <p class="event-program">${escapeHtml(program.program)}</p>
    <dl class="event-meta">
      <div><dt>時間</dt><dd>${program.times?.length ? program.times.map((time) => `<span>${escapeHtml(time)}</span>`).join('') : '当日案内を確認'}</dd></div>
      <div><dt>場所</dt><dd>${escapeHtml(program.place || '当日案内を確認')}</dd></div>
      <div><dt>対象</dt><dd>${escapeHtml(program.audience || '受験生・保護者')}</dd></div>
    </dl>
    ${program.notes?.length ? `<div class="event-notes">${program.notes.map((note) => `<span>${escapeHtml(note)}</span>`).join('')}</div>` : ''}
    <div class="event-actions"></div>`;

  const actions = article.querySelector('.event-actions');
  if (isSingle && primaryLab) {
    const favorite = document.createElement('button');
    const isFav = favorites.has(primaryLab.id);
    favorite.className = `favorite-button ${isFav ? 'active' : ''}`;
    favorite.setAttribute('aria-label', isFav ? 'お気に入りから外す' : 'お気に入りに追加');
    favorite.textContent = isFav ? '♥' : '♡';
    favorite.onclick = () => toggleFavorite(primaryLab.id);
    actions.appendChild(favorite);

    const detail = document.createElement('button');
    detail.className = 'open-lab';
    detail.textContent = '担当する先生は？ →';
    detail.onclick = () => openModal(primaryLab);
    actions.appendChild(detail);
  } else {
    const label = document.createElement('span');
    label.className = 'event-action-label';
    label.textContent = '担当する先生は？';
    actions.appendChild(label);
    programLabs.forEach((lab) => {
      const button = document.createElement('button');
      button.className = 'event-lab-button';
      button.textContent = `${lab.pi_name.replace(/\s+/g, ' ')}先生`;
      button.onclick = () => openModal(lab);
      actions.appendChild(button);
    });
  }
  return article;
}

function displayProgramTitle(title = '') {
  const parts = String(title).split('：');
  return parts.length > 1 ? parts.slice(1).join('：') : title;
}

function courseCards(courses) {
  return courses.map((course) => `
    <article class="course-card">
      <span class="course-meta">${escapeHtml(course.meta)}</span>
      <strong>${escapeHtml(course.title)}</strong>
      <p>${escapeHtml(course.description)}</p>
    </article>`).join('');
}

function moreCards(lab) {
  const candidates = [
    {
      key: 'official_lab',
      icon: '🏫',
      label: '研究室紹介',
      title: '大学公式の研究室ページ',
      desc: '研究テーマや研究室からのメッセージを見る。'
    },
    {
      key: 'mock_lecture',
      icon: '🎥',
      label: '模擬授業',
      title: lab.links.mock_lecture_title || 'Web体験授業',
      desc: '高校生向けの授業コンテンツを見る。'
    },
    {
      key: 'researchmap',
      icon: '📄',
      label: 'researchmap',
      title: '研究者情報',
      desc: '論文・学会発表・研究活動を確認する。'
    },
    {
      key: 'lab_homepage',
      icon: '🌐',
      label: '研究室HP',
      title: '研究室ホームページ',
      desc: '研究室独自の発信を見る。'
    }
  ];
  return candidates
    .filter((item) => lab.links[item.key])
    .map((item) => `<a class="more-card" href="${lab.links[item.key]}" target="_blank" rel="noopener">
      <span class="more-icon">${item.icon}</span>
      <div><span class="more-label">${item.label}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.desc)}</p></div>
      <span class="more-arrow">→</span>
    </a>`).join('');
}

function openModal(lab) {
  const isFav = favorites.has(lab.id);
  qs('#modal-content').innerHTML = `
    <div class="modal-title ${deptClass(lab.department)}">
      <span class="eyebrow">OPEN THE LAB DOOR</span>
      <span class="modal-dept">${escapeHtml(lab.department)}</span>
      <h2>${escapeHtml(lab.lab_name)}</h2>
      <p class="pi">${escapeHtml(lab.pi_name)} ${escapeHtml(lab.position)}</p>
    </div>
    <p class="modal-catch">${escapeHtml(lab.summary)}</p>
    <button class="modal-favorite favorite-button ${isFav ? 'active' : ''}">${isFav ? '♥ お気に入りから外す' : '♡ お気に入りに追加'}</button>
    <section class="hero-question"><span>QUESTION</span><h3>${escapeHtml(lab.question)}</h3></section>
    <div class="detail-grid">
      <section class="detail-box full"><h3>この研究室では</h3><p>${escapeHtml(lab.description)}</p></section>
      <section class="detail-box"><h3>主な研究方法</h3><ul>${lab.methods.map((method) => `<li>${escapeHtml(method)}</li>`).join('')}</ul></section>
      <section class="detail-box"><h3>こんな人におすすめ</h3><ul>${lab.recommended_for.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
      <section class="detail-box full"><h3>キーワード</h3><div class="keywords">${lab.keywords.map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`).join('')}</div></section>
    </div>
    <section class="detail-section">
      <div class="detail-section-head">
        <span class="eyebrow">COURSES</span>
        <h3>この先生から学べる授業</h3>
        <p>年度によって担当科目は変わります。詳細は公式シラバスで確認してください。</p>
      </div>
      <div class="course-grid">${courseCards(lab.courses || [])}</div>
      <p class="syllabus-note"><a href="${syllabusUrl}" target="_blank" rel="noopener">公式シラバスを見る →</a></p>
    </section>
    <section class="detail-section next-door">
      <div class="detail-section-head">
        <span class="eyebrow">LEARN MORE</span>
        <h3>次の扉を開く。</h3>
        <p>研究室について、もう少し知りたくなった人へ。</p>
      </div>
      <div class="more-grid">${moreCards(lab)}</div>
    </section>
    ${lab.needs_review ? '<p class="source-note">公開情報を高校生向けに要約した確認用ドラフトです。正式公開前に各研究室での確認を想定しています。</p>' : ''}
  `;
  qs('#modal-content .modal-favorite').onclick = () => {
    toggleFavorite(lab.id);
    openModal(lab);
  };
  qs('#modal').classList.add('open');
  qs('#modal').setAttribute('aria-hidden', 'false');
}

function showLoadError(error) {
  qsa('.lab-grid').forEach((grid) => {
    grid.innerHTML = `<div class="empty-result card">研究室データを読み込めませんでした。ローカルサーバーから開いてください。<br>${escapeHtml(error.message)}</div>`;
  });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}
