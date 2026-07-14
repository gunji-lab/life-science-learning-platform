let labs = [];
let selected = new Set();
let activeCategory = 'all';
let favorites = new Set(safeStoredFavorites());

const keywordCategories = [
  {
    id: 'animals',
    label: '動物・からだ',
    description: '動物の形、行動、発生、神経を入口に探す。',
    keywords: ['動物', '野生動物', '行動', '神経', '脳', '神経細胞', '運動', '感覚', '発生', '胚', '心臓', '形態', '器官形成', '骨格', '筋肉', '鳥類', 'キリン', '哺乳類', '魚類', '比較解剖学', '機能形態学', 'バイオメカニクス', '比較生物学', '進化']
  },
  {
    id: 'cells',
    label: '細胞・遺伝子',
    description: '細胞、DNA、タンパク質、分子のしくみから探す。',
    keywords: ['細胞', '細胞培養', '細胞工学', 'iPS細胞', 'DNA', '遺伝子', '遺伝子解析', 'ゲノム', '突然変異', 'DNA修復', '分子遺伝学', '分子生物学', 'タンパク質', '受容体', '代謝', '代謝物', 'マイオカイン', '細胞外小胞', 'ストレス応答', '環境ストレス']
  },
  {
    id: 'health',
    label: '健康・医療',
    description: '健康、医療、環境保健、リスクを入口に探す。',
    keywords: ['健康', '医療', 'メンタルヘルス', '環境保健', '疫学', '生物統計', '公衆衛生', '曝露', '毒性', '化学物質', '環境化学物質', 'ダイオキシン', 'リスク評価', '生態リスク', '生物応答', '環境影響', '耐性']
  },
  {
    id: 'environment',
    label: '環境・生態系',
    description: '水、地球環境、生態系、生物多様性から探す。',
    keywords: ['環境', '環境応答', '環境適応', '環境保全', '自然環境', '環境変動', '環境問題', '地球環境', '気候変動', '環境科学', '水環境', '水質', '浄化', '生態系', '生態学', '生態工学', '海洋生態系', '生物多様性', '多様性', '分類', '分布', '種多様性', '自然史', '保全', '持続可能性', '物質循環']
  },
  {
    id: 'plants',
    label: '植物・食料',
    description: '植物、作物、食料、栄養から探す。',
    keywords: ['植物', 'イネ', '作物学', '植物生理学', '光合成', '植物ホルモン', '成長制御', '発芽', '形態形成', '栽培実験', '植物バイオーム', '植物化学', '化学成分', '天然物', '生理活性', '食料', '食料問題', '栄養', '収量']
  },
  {
    id: 'microbes',
    label: '微生物・極限環境',
    description: '微生物、極限環境、宇宙、低温や高温への適応から探す。',
    keywords: ['微生物', 'バクテリア', '極限環境', '超好熱菌', '極域', '南極', '低温適応', '放射線', '宇宙', '生命の限界', '電気微生物', '電気化学', '環境浄化', '酵素', '生体触媒', '応用微生物', '発酵', '生理工学']
  },
  {
    id: 'tools',
    label: '技術・データ・ものづくり',
    description: 'データ解析、計測、化学、材料、商品開発から探す。',
    keywords: ['データ解析', '計測', 'フィールド調査', '顕微鏡', '化学', '有機化学', '化学分析', '分子化学', '生化学', '糖質', '糖鎖', '多糖', '材料', '構造解析', '生物資源', 'バイオテクノロジー', 'ものづくり', '商品開発', 'バイオプロセス', 'エネルギー', '生体分子', 'モータータンパク質', '細胞運動', '生命科学', '情報学']
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
    const response = await fetch('data/labs.json');
    if (!response.ok) throw new Error(`labs.json: ${response.status}`);
    labs = await response.json();
    renderHomeTags();
    renderHomeCategories();
    renderInterest();
    renderLabList();
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
    activeCategory = 'all';
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
  featuredKeywords().forEach((tag) => container.appendChild(tagButton(tag)));
}

function renderHomeCategories() {
  const container = qs('#home-categories');
  if (!container) return;
  container.innerHTML = '';
  keywordCategories.forEach((category) => {
    const button = document.createElement('button');
    button.className = 'category-card';
    button.innerHTML = `<span>${escapeHtml(category.label)}</span><strong>${categoryMatchCount(category)} LABS</strong><p>${escapeHtml(category.description)}</p>`;
    button.onclick = () => {
      activeCategory = category.id;
      selected.clear();
      switchView('interest');
    };
    container.appendChild(button);
  });
}

function featuredKeywords() {
  const priority = ['動物', '神経', '細胞', '健康', '微生物', '植物', 'DNA', '環境', '食料問題', 'データ解析'];
  const available = new Set(allKeywords());
  return priority.filter((keyword) => available.has(keyword));
}

function allKeywords() {
  return [...new Set(labs.flatMap((lab) => lab.keywords || []))].sort((a, b) => a.localeCompare(b, 'ja'));
}

function categoryList() {
  return [
    { id: 'all', label: 'すべて', description: 'すべてのキーワードから探す。', keywords: allKeywords() },
    ...keywordCategories,
    { id: 'other', label: 'その他', description: 'どの入口にもまだ整理していないキーワード。', keywords: uncategorizedKeywords() }
  ].filter((category) => category.id !== 'other' || category.keywords.length);
}

function uncategorizedKeywords() {
  const assigned = new Set(keywordCategories.flatMap((category) => category.keywords));
  return allKeywords().filter((keyword) => !assigned.has(keyword));
}

function categoryKeywords(categoryId = activeCategory) {
  const category = categoryList().find((item) => item.id === categoryId) || categoryList()[0];
  const available = new Set(allKeywords());
  return category.keywords.filter((keyword) => available.has(keyword));
}

function categoryMatchCount(category) {
  const keywords = category.keywords;
  return labs.filter((lab) => keywords.some((keyword) => matches(lab, keyword))).length;
}

function tagButton(tag, categoryId = 'all') {
  const button = document.createElement('button');
  button.className = 'interest-tag';
  button.textContent = tag;
  button.onclick = () => {
    activeCategory = categoryId;
    selected = new Set([tag]);
    switchView('interest');
  };
  return button;
}

function renderTagPanels() {
  const panel = qs('#interest-tags');
  panel.innerHTML = '';
  const categoryWrap = document.createElement('div');
  categoryWrap.className = 'category-tabs';
  categoryList().forEach((category) => {
    const button = document.createElement('button');
    button.className = `category-tab${activeCategory === category.id ? ' active' : ''}`;
    button.innerHTML = `<span>${escapeHtml(category.label)}</span><small>${categoryKeywords(category.id).length}</small>`;
    button.onclick = () => {
      activeCategory = category.id;
      selected.clear();
      renderInterest();
    };
    categoryWrap.appendChild(button);
  });
  panel.appendChild(categoryWrap);

  const active = categoryList().find((category) => category.id === activeCategory) || categoryList()[0];
  const keywordWrap = document.createElement('div');
  keywordWrap.className = 'keyword-panel';
  keywordWrap.innerHTML = `<div class="keyword-panel-head"><strong>${escapeHtml(active.label)}</strong><p>${escapeHtml(active.description)}</p></div>`;
  const keywordGrid = document.createElement('div');
  keywordGrid.className = 'keyword-grid';
  categoryKeywords().forEach((tag) => {
    const button = document.createElement('button');
    button.className = `interest-tag${selected.has(tag) ? ' selected' : ''}`;
    button.textContent = tag;
    button.onclick = () => {
      selected.has(tag) ? selected.delete(tag) : selected.add(tag);
      renderInterest();
    };
    keywordGrid.appendChild(button);
  });
  keywordWrap.appendChild(keywordGrid);
  panel.appendChild(keywordWrap);
}

function matches(lab, tag) {
  return searchableText(lab).includes(String(tag).toLowerCase());
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
  article.querySelector('.open-lab').onclick = () => openModal(lab);
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
  const activeKeywords = activeCategory === 'all' ? [] : categoryKeywords();
  const filtered = labs.filter((lab) => {
    const categoryMatch = !activeKeywords.length || activeKeywords.some((tag) => matches(lab, tag));
    const keywordMatch = !selected.size || [...selected].some((tag) => matches(lab, tag));
    return categoryMatch && keywordMatch;
  });
  renderGroupedLabs(qs('#interest-results'), filtered, (lab) => {
    const matchesSelected = [...selected].filter((tag) => matches(lab, tag)).length;
    if (matchesSelected) return `${matchesSelected} keyword match`;
    if (activeKeywords.length) return 'category match';
    return '';
  });
  qs('#result-count').textContent = `${filtered.length} labs`;
  const active = categoryList().find((category) => category.id === activeCategory) || categoryList()[0];
  qs('#result-message').textContent = selected.size
    ? `「${active.label}」の中で「${[...selected].join('・')}」に関連する研究室です。`
    : activeCategory === 'all'
      ? `${labs.length}研究室を表示しています。`
      : `「${active.label}」に関連する研究室です。`;
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
