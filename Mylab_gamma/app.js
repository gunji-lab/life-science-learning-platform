let labs = [];
let eventData = null;
let departments = [];
let aiDictionary = [];
let aiLabDictionary = [];
let aiGeneralDictionary = [];
let aiResearchBridge = [];
let aiLabResearchTags = [];
let aiLoggingConfig = {
  enabled: false,
  endpoint: '',
  site_id: 'mylab-gamma',
  send_user_agent: false
};
let aiLastResult = null;
let aiLastLogId = '';
let selected = new Set();
let selectedDetailTerms = new Set();
let selectedEventFilters = new Set();
let selectedEventDate = '';
let selectedLabJumpDepartment = '';
let selectedRecommendationDepartment = '';
let selectedQuestionDepartment = '';
let favorites = new Set(safeStoredFavorites());

const validViews = ['home', 'interest', 'ai-compass', 'ai-admin', 'labs', 'visitors', 'favorites'];
const aiLogStorageKey = 'mylab-ai-compass-logs';

const interestRoutes = [
  {
    id: 'animals',
    label: '動物やからだが気になる',
    description: '動物の形、動き、発生、神経などから生命を見たい人へ。',
    required: ['動物', '野生動物', '哺乳類', '鳥類', '魚類', 'キリン', '骨格', '筋肉', '心臓', '神経', '脳', '比較解剖学', '機能形態学', 'バイオメカニクス'],
    terms: ['動物', '野生動物', '哺乳類', '鳥類', '魚類', 'キリン', '小型哺乳類', 'コウモリ', '海鳥', '脊椎動物', '骨格', '筋肉', '形態', '発生', '胚', '心臓', '神経', '脳', '行動', '動物行動', '運動', '比較解剖学', '機能形態学', 'バイオメカニクス', '動物福祉']
  },
  {
    id: 'health',
    label: '病気・健康・医療に興味がある',
    description: '健康、毒性、医療、リスク、こころと体の状態を考えたい人へ。',
    terms: ['健康', '医療', '毒性', '環境健康', '環境保健', 'メンタルヘルス', 'リスク', '曝露', '公衆衛生', '細胞外小胞', 'ダイオキシン', '受容体', 'がん', '炎症', '免疫', '感染症', 'アレルギー', 'ストレス', '介護予防', 'リハビリテーション', '医療機器', '福祉機器', '生殖', '不妊', '再生医療']
  },
  {
    id: 'plants_food',
    label: '植物や食べものに関わりたい',
    description: '植物、作物、食料、栄養、植物が作る成分に興味がある人へ。',
    terms: ['植物', 'イネ', 'イネ科植物', '作物', '光合成', '植物生理', '植物ホルモン', '成長制御', 'ストリゴラクトン', '植物栄養', '鉄吸収', 'ムギネ酸類', '植物バイオーム', '水草', '水陸両生植物', '品種育成', '食料', '栄養', '収量', '植物化学', '天然物', '植物生化学', '特化代謝産物', '二次代謝産物']
  },
  {
    id: 'environment',
    label: '環境問題を考えたい',
    description: '水、地球環境、生態系、生物多様性、環境リスクを考えたい人へ。',
    terms: ['環境', '水環境', '水質', '地球環境', '気候変動', '環境変動', '環境保全', '環境修復', '環境浄化', '生態系', '生態学', '生態リスク', '生物多様性', '保全', '海洋生態系', '持続可能性', '物質循環', '環境問題', '重金属', '環境低負荷農業']
  },
  {
    id: 'micro_world',
    label: '微生物や見えない世界が気になる',
    description: '微生物、極限環境、酵素、放射線、宇宙につながる生命を見たい人へ。',
    terms: ['微生物', 'バクテリア', '糸状菌', '極限環境', '極限環境微生物', '超好熱菌', '極域', '南極', '北極', '低温適応', '放射線', '放射線抵抗性細菌', '宇宙', '酵素', '生体触媒', '発酵', '微生物学', '電気微生物', '電気活性微生物', '発電菌', '有機溶媒耐性微生物', '有用微生物', 'プラスチック分解菌', '重金属耐性菌', '微生物多様性']
  },
  {
    id: 'dna_cells',
    label: 'DNA・細胞・遺伝子を知りたい',
    description: 'DNA、細胞、遺伝子、タンパク質など、生命の小さなしくみへ。',
    terms: ['DNA', 'DNA修復', '遺伝子', '遺伝子解析', 'ゲノム', '突然変異', '細胞', '細胞培養', '細胞工学', 'iPS細胞', '分子生物学', 'タンパク質', '分子遺伝学', '分子', '神経回路', '細胞接着', '糖鎖間相互作用']
  },
  {
    id: 'experiments',
    label: '実験や分析が好き',
    description: '実験、観察、培養、化学分析、測定を通して確かめたい人へ。',
    terms: ['顕微鏡', '顕微鏡観察', '電子顕微鏡', '細胞培養', '培養', '化学', '化学分析', '分析化学', '成分分析', '測定', '生理測定', '生化学', '有機化学', '糖質', '糖鎖', '材料', 'バイオマテリアル', '医療材料', 'センサ', '生体センサ', '生体信号計測', '酵素活性', '分子生物学実験', '物理実験', '標本', '解剖', 'CT']
  },
  {
    id: 'fieldwork',
    label: '野外で生き物を調べたい',
    description: 'フィールド調査、野生動物、生態系、自然環境を自分の目で見たい人へ。',
    required: ['フィールド', '野外', '野生動物', '自然環境', '水環境', '海洋生態系', '分布', '分類', '地球環境調査'],
    terms: ['フィールド', '野外', '野生動物', '自然環境', '生態系', '生物多様性', '分布', '分類', '海洋生態系', '水環境', '保全']
  },
  {
    id: 'data',
    label: 'データで生命を読み解きたい',
    description: 'データ解析、統計、情報、ゲノム、計測から生命を理解したい人へ。',
    terms: ['データ解析', '統計', '統計モデリング', '生物統計', '情報', 'ゲノム', 'バイオインフォマティクス', '生物情報学', '計測', '信号処理', '画像解析', 'AI', '機械学習', 'リスク評価', '疫学', '分布データ', '環境データ', 'モーションキャプチャ', 'バイオロギング']
  }
];
const homeRouteIds = ['animals', 'plants_food', 'micro_world', 'environment', 'health'];
const tagParents = {
  'キリン': ['哺乳類', '動物'],
  '哺乳類': ['動物'],
  '鳥類': ['動物'],
  '魚類': ['動物'],
  '野生動物': ['動物'],
  '海鳥': ['鳥類', '動物', '海洋生態系'],
  '小型哺乳類': ['哺乳類', '動物'],
  'コウモリ': ['小型哺乳類', '哺乳類', '動物'],
  '脊椎動物': ['動物'],
  '骨格筋': ['筋肉', '動物'],
  '動物行動': ['行動', '動物'],
  '動物福祉': ['動物', '健康'],
  '神経細胞': ['神経', '細胞'],
  '神経回路': ['神経', '脳'],
  '器官形成': ['発生', '形態'],
  '形態形成': ['発生', '形態'],
  '行動観察': ['行動'],
  '行動計測': ['行動', '計測'],
  '行動・運動データ解析': ['行動', '運動', 'データ解析'],
  'CT・3D形態解析': ['CT', '形態', '測定'],
  '解剖と標本観察': ['解剖', '標本', '形態'],
  '組織・形態観察': ['形態', '顕微鏡'],
  '形態観察': ['形態', '顕微鏡'],
  '組織観察': ['顕微鏡'],
  '胚の観察': ['胚', '発生', '顕微鏡'],
  '顕微鏡解析': ['顕微鏡'],
  '顕微鏡観察': ['顕微鏡'],
  '脳': ['神経'],
  '電気生理': ['神経'],
  '電気生理学': ['神経'],
  '神経機能解析': ['神経'],
  '神経生理学': ['神経'],
  '神経生理学的解析': ['神経'],
  'フィールド調査': ['フィールド', '野外'],
  '生態データ解析': ['生態系', 'データ解析'],
  '生態系評価': ['生態系', '測定'],
  '生態影響評価': ['生態系', '測定'],
  '生態解析': ['生態系'],
  '分布データ解析': ['分布', 'データ解析'],
  '分類・同定': ['分類'],
  '水質': ['水環境', '環境'],
  '水質調査': ['水環境', '環境'],
  '地球環境': ['環境', '環境問題'],
  '地球環境調査': ['地球環境', '環境'],
  '気候変動': ['環境問題', '環境変動'],
  '重金属': ['環境', '化学物質'],
  '環境保全': ['環境', '保全'],
  '環境修復': ['環境保全', '環境'],
  '環境浄化': ['環境保全', '環境'],
  '環境低負荷農業': ['環境保全', '環境', '植物'],
  '環境科学': ['環境'],
  '環境影響': ['環境'],
  '環境データ解析': ['環境データ', 'データ解析', '環境'],
  '環境情報の整理': ['環境データ', 'データ解析', '環境'],
  '環境保健': ['環境', '健康'],
  '環境健康': ['環境', '健康'],
  '曝露': ['環境保健', '健康'],
  '公衆衛生': ['健康'],
  'メンタルヘルス': ['健康'],
  '生殖': ['健康'],
  '不妊': ['生殖', '健康'],
  '炎症': ['健康'],
  'がん': ['健康'],
  'がん転移': ['がん', '健康'],
  '免疫': ['健康'],
  '再生医療': ['医療', '健康', '細胞'],
  '医療機器': ['医療', '健康', 'ものづくり'],
  '福祉機器': ['医療', '健康', 'ものづくり'],
  '介護ロボット': ['福祉機器', '医療機器', '医療'],
  'バイタルサイン': ['健康', '計測'],
  'リハビリテーション': ['健康'],
  '介護予防': ['健康'],
  '身体活動': ['健康', '運動'],
  'ストレス': ['健康'],
  '感染症': ['免疫', '健康'],
  'アレルギー': ['免疫', '健康'],
  '細胞外小胞': ['細胞', '健康'],
  '細胞接着': ['細胞'],
  '糖鎖間相互作用': ['糖鎖', '細胞接着', '細胞'],
  '毒性': ['健康'],
  '毒性評価': ['毒性', '測定'],
  'ダイオキシン': ['毒性', '環境化学物質'],
  '受容体': ['細胞', 'タンパク質'],
  'iPS細胞': ['細胞'],
  'ヒトiPS細胞': ['iPS細胞', '細胞'],
  '疾患モデル': ['健康', '細胞'],
  'エピジェネティクス': ['ゲノム', '遺伝子'],
  'ゲノム編集': ['ゲノム', '遺伝子'],
  'マルチオミクス解析': ['ゲノム', 'データ解析'],
  '細胞培養': ['細胞', '培養'],
  '動物細胞の培養': ['細胞', '培養', '動物'],
  '細胞工学': ['細胞'],
  '細胞運動': ['細胞', '運動'],
  '遺伝子解析': ['遺伝子', 'DNA'],
  '遺伝子発現解析': ['遺伝子', '分子生物学'],
  '遺伝子・ゲノム解析': ['遺伝子', 'ゲノム', 'DNA'],
  '遺伝子・タンパク質解析': ['遺伝子', 'タンパク質', '分子生物学'],
  'ゲノム': ['遺伝子', 'DNA'],
  'DNA修復': ['DNA'],
  'DNA修復解析': ['DNA修復', 'DNA'],
  'DNA修復実験': ['DNA修復', 'DNA', '分子生物学実験'],
  '突然変異': ['DNA', '遺伝子'],
  '突然変異解析': ['突然変異', 'DNA', '遺伝子'],
  '分子遺伝学': ['遺伝子', '分子生物学'],
  '分子生物学': ['分子', '遺伝子'],
  '分子生物学実験': ['分子生物学', '遺伝子', '実験'],
  'タンパク質解析': ['タンパク質', '分子生物学'],
  '生物情報学': ['情報', 'データ解析'],
  'バクテリア': ['微生物'],
  '糸状菌': ['微生物'],
  'アカパンカビ': ['糸状菌', '微生物'],
  '超好熱菌': ['微生物', '極限環境'],
  '電気微生物': ['微生物'],
  '電気活性微生物': ['電気微生物', '微生物'],
  '発電菌': ['電気活性微生物', '電気微生物', '微生物'],
  '放射線抵抗性細菌': ['細菌', '微生物', '放射線'],
  '有機溶媒耐性微生物': ['極限環境微生物', '微生物'],
  '極限環境微生物': ['微生物', '極限環境'],
  '有用微生物': ['微生物', '生物資源'],
  'プラスチック分解菌': ['微生物', '環境浄化'],
  '重金属耐性菌': ['微生物', '環境浄化', '重金属'],
  '微生物多様性': ['微生物', '生物多様性'],
  '応用微生物': ['微生物'],
  '微生物培養': ['微生物', '培養'],
  '微生物分離・培養': ['微生物', '培養'],
  '微生物解析': ['微生物'],
  '発酵': ['微生物'],
  '極域': ['極限環境'],
  '南極': ['極域', '極限環境'],
  '北極': ['極域', '極限環境'],
  '低温適応': ['極域', '極限環境'],
  '低温環境実験': ['低温適応', '極限環境'],
  '生命の限界': ['極限環境'],
  '放射線': ['極限環境'],
  '宇宙': ['極限環境'],
  '酵素活性': ['酵素', '測定'],
  '酵素活性測定': ['酵素活性', '酵素', '測定'],
  '酵素・代謝解析': ['酵素', '代謝', '測定'],
  '生体触媒': ['酵素', '微生物'],
  '植物ホルモン': ['植物'],
  'ストリゴラクトン': ['植物ホルモン', '植物'],
  'オーキシン': ['植物ホルモン', '植物'],
  'サイトカイニン': ['植物ホルモン', '植物'],
  '植物栄養': ['植物'],
  '鉄吸収': ['植物栄養', '植物'],
  'ムギネ酸類': ['鉄吸収', '植物栄養', '植物'],
  'イネ科植物': ['イネ', '植物', '作物'],
  '水草': ['植物'],
  '水陸両生植物': ['水草', '植物'],
  '植物生理学': ['植物', '植物生理'],
  '植物生理': ['植物'],
  '植物バイオーム': ['植物', '環境'],
  '植物化学': ['植物', '化学'],
  '植物生化学': ['植物', '生化学'],
  '特化代謝産物': ['二次代謝産物', '植物化学', '植物'],
  '二次代謝産物': ['植物化学', '植物', '化学'],
  'テルペノイド': ['二次代謝産物', '植物化学'],
  'フラボノイド': ['二次代謝産物', '植物化学'],
  'モミラクトン': ['特化代謝産物', '植物化学', 'イネ'],
  'クマリン': ['二次代謝産物', '植物化学'],
  '色素': ['植物化学', '化学成分'],
  '植物成分分析': ['植物', '成分分析', '化学分析'],
  '植物栽培': ['植物'],
  '植物の栽培実験': ['植物', '栽培実験'],
  '植物栽培実験': ['植物', '栽培実験'],
  'イネ': ['植物', '作物', '食料'],
  '作物': ['植物', '食料'],
  '作物学': ['作物', '植物'],
  '品種育成': ['作物', '植物', '食料'],
  '光合成': ['植物'],
  '収量': ['作物', '食料'],
  '食料問題': ['食料'],
  '栄養': ['食料', '健康'],
  '天然物': ['化学', '植物化学'],
  '有機化学': ['化学'],
  '分析化学': ['化学分析', '化学'],
  '有機化学実験': ['有機化学', '化学分析'],
  '化学成分': ['化学分析'],
  '化学物質': ['化学'],
  '化学構造解析': ['化学分析', '構造解析'],
  '生化学実験': ['生化学', '実験'],
  '生理測定': ['測定'],
  '生理応答の測定': ['生理測定', '測定'],
  '光合成・生理測定': ['光合成', '生理測定', '測定'],
  '計測': ['測定'],
  '光計測': ['計測', '測定'],
  '電気化学測定': ['電気化学', '測定'],
  '成分分析と品種評価': ['成分分析', '測定'],
  '糖質合成・分析': ['糖質', '糖鎖', '化学分析'],
  'オリゴ糖': ['糖鎖', '糖質'],
  '糖クラスター': ['糖鎖', '材料'],
  '多糖': ['糖質'],
  '材料評価': ['材料', '測定'],
  'バイオマテリアル': ['医療材料', '材料', '医療'],
  '医療材料': ['材料', '医療'],
  '生体材料工学': ['バイオマテリアル', '材料'],
  '高分子材料': ['材料', '化学'],
  'ナノ材料': ['材料', '化学'],
  '金属錯体': ['高分子材料', '化学'],
  '薬物送達': ['医療', '健康'],
  'バイオ界面': ['バイオマテリアル', '材料'],
  'バイオセンサー': ['センサ', '医療機器'],
  'ウェアラブルセンサ': ['バイオセンサー', 'センサ'],
  '生体センサ': ['センサ', '医療機器'],
  'センサ開発': ['センサ', '測定'],
  '機器開発': ['医療機器', 'ものづくり'],
  '微細加工': ['材料', 'ものづくり'],
  'マイクロニードル': ['医療材料', '医療機器'],
  '濡れ性': ['材料', '化学'],
  '生体信号': ['計測', '健康'],
  '生体信号計測': ['生体信号', '計測'],
  '信号処理': ['データ解析'],
  '脳波': ['脳', '生体信号'],
  '心電図': ['生体信号', '計測'],
  '嚥下': ['健康'],
  '量子ビーム': ['放射線', '物理実験'],
  'プラズマ': ['物理実験', '医療'],
  '材料改質': ['材料', 'ものづくり'],
  'ユーザ評価': ['データ解析', '測定'],
  '人間工学': ['健康', 'データ解析'],
  '身体活動測定': ['身体活動', '測定'],
  '構造解析': ['測定'],
  '機能評価': ['測定'],
  '生理活性評価': ['生理活性', '測定'],
  'リスク評価': ['リスク', 'データ解析'],
  '疫学': ['健康', 'データ解析'],
  '疫学調査': ['疫学', 'データ解析'],
  '生物統計': ['統計', 'データ解析'],
  '生物統計解析': ['生物統計', '統計', 'データ解析'],
  '統計モデリング': ['統計', 'データ解析'],
  'モーションキャプチャ': ['行動計測', '計測'],
  'バイオロギング': ['フィールド調査', '計測'],
  '情報学': ['情報', 'データ解析'],
  '資料解析': ['データ解析']
};
const syllabusUrl = 'https://g-sys.toyo.ac.jp/syllabus/';
const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];
const displayLabName = (lab) => lab.lab_name.endsWith('研究室') ? lab.lab_name : `${lab.lab_name}研究室`;
const structuredTags = (lab) => [
  ...(lab.tags?.targets || []),
  ...(lab.tags?.fields || []),
  ...(lab.tags?.methods || [])
];
const displayKeywords = (lab) => uniqueTerms([...(lab.keywords || []), ...structuredTags(lab)]);
const fallbackDepartmentMeta = {
  className: 'department-extra',
  description: '生命科学部の多様な問いに向き合う研究室。',
  color: '#4d6f91',
  soft: '#eef5fb',
  line: '#c8d9e8'
};

init();

async function init() {
  bindNavigation();
  bindModalClose();
  updateFavoriteCount();

  try {
    const [
      labResponse,
      eventResponse,
      departmentResponse,
      dictionaryResponse,
      labDictionaryResponse,
      loggingConfigResponse,
      generalDictionaryResponse,
      researchBridgeResponse,
      labResearchTagsResponse
    ] = await Promise.all([
      fetch('data/labs.json'),
      fetch('data/events.json'),
      fetch('data/departments.json'),
      fetch('data/ai_research_dictionary.csv'),
      fetch('data/ai_lab_dictionary.csv'),
      fetch('data/ai_compass_logging_config.json'),
      fetch('data/ai-compass/general_dictionary.json'),
      fetch('data/ai-compass/research_bridge.json'),
      fetch('data/ai-compass/lab_research_tags.json')
    ]);
    if (!labResponse.ok) throw new Error(`labs.json: ${labResponse.status}`);
    if (!eventResponse.ok) throw new Error(`events.json: ${eventResponse.status}`);
    if (!departmentResponse.ok) throw new Error(`departments.json: ${departmentResponse.status}`);
    labs = await labResponse.json();
    eventData = await eventResponse.json();
    departments = await departmentResponse.json();
    aiDictionary = dictionaryResponse.ok ? parseDictionaryCsv(await dictionaryResponse.text()) : [];
    aiLabDictionary = labDictionaryResponse.ok ? parseLabDictionaryCsv(await labDictionaryResponse.text()) : [];
    aiGeneralDictionary = generalDictionaryResponse.ok ? await generalDictionaryResponse.json() : [];
    aiResearchBridge = researchBridgeResponse.ok ? await researchBridgeResponse.json() : [];
    aiLabResearchTags = labResearchTagsResponse.ok ? await labResearchTagsResponse.json() : [];
    aiLoggingConfig = loggingConfigResponse.ok
      ? { ...aiLoggingConfig, ...(await loggingConfigResponse.json()) }
      : aiLoggingConfig;
    selectedLabJumpDepartment = '';
    selectedRecommendationDepartment = '';
    selectedQuestionDepartment = '';
    selectedEventDate = eventData.dates?.[0]?.date || '';
    renderDepartmentFilter();
    renderDirectoryLead();
    renderHomeTags();
    renderInterest();
    renderAICompass();
    renderLabList();
    renderVisitors();
    applyHashView({ scroll: false });
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
  window.addEventListener('popstate', () => applyHashView({ scroll: true }));
  window.addEventListener('hashchange', () => applyHashView({ scroll: true }));
  qsa('.tab').forEach((button) => {
    button.onclick = () => switchView(button.dataset.view);
  });
  qsa('[data-go]').forEach((button) => {
    button.onclick = () => switchView(button.dataset.go);
  });
  qs('#clear-filters').onclick = () => {
    selected.clear();
    selectedDetailTerms.clear();
    renderInterest();
  };
  const aiForm = qs('#ai-compass-form');
  if (aiForm) {
    aiForm.onsubmit = (event) => {
      event.preventDefault();
      runAICompassSearch(qs('#ai-compass-input')?.value || '');
    };
  }
  qsa('[data-ai-example]').forEach((button) => {
    button.onclick = () => {
      const input = qs('#ai-compass-input');
      if (!input) return;
      input.value = button.dataset.aiExample || '';
      input.focus();
    };
  });
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

function normalizeViewName(name) {
  return validViews.includes(name) ? name : 'home';
}

function hashViewName() {
  try {
    return normalizeViewName(decodeURIComponent(window.location.hash.replace(/^#/, '')) || 'home');
  } catch {
    return 'home';
  }
}

function applyHashView(options = {}) {
  switchView(hashViewName(), { updateHash: false, scroll: options.scroll ?? false });
}

function switchView(name, options = {}) {
  const viewName = normalizeViewName(name);
  const updateHash = options.updateHash ?? true;
  const shouldScroll = options.scroll ?? true;
  const target = qs(`#view-${viewName}`);
  if (!target) return;
  qsa('.view').forEach((view) => view.classList.remove('active'));
  target.classList.add('active');
  qsa('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewName));
  if (updateHash && window.location.hash !== `#${viewName}`) {
    history.pushState({ view: viewName }, '', `#${viewName}`);
  }
  if (shouldScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  renderCurrentView();
}

function renderCurrentView() {
  const active = qs('.view.active')?.id.replace('view-', '');
  if (active === 'interest') renderInterest();
  if (active === 'ai-compass') renderAICompass();
  if (active === 'ai-admin') renderAICompassAdmin();
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

function getDepartmentMeta(department) {
  const configured = departments.find((item) => item.name === department) || {};
  return { ...fallbackDepartmentMeta, ...configured };
}

function deptClass(department) {
  return getDepartmentMeta(department).className || fallbackDepartmentMeta.className;
}

function departmentNames(items = labs) {
  const present = new Set(items.map((lab) => lab.department).filter(Boolean));
  const configured = departments.map((department) => department.name).filter((name) => present.has(name));
  const unknown = [...present].filter((name) => !configured.includes(name)).sort((a, b) => a.localeCompare(b, 'ja'));
  return [...configured, ...unknown];
}

function uniqueTerms(terms = []) {
  const seen = new Set();
  return terms.filter((term) => {
    if (!term || seen.has(term)) return false;
    seen.add(term);
    return true;
  });
}

function departmentCount(department, items = labs) {
  return items.filter((lab) => lab.department === department).length;
}

function applyDepartmentTheme(element, department) {
  if (!element || !department) return;
  const meta = getDepartmentMeta(department);
  element.classList.add('department-themed');
  element.style.setProperty('--dept-color', meta.color);
  element.style.setProperty('--dept-soft', meta.soft);
  element.style.setProperty('--dept-line', meta.line);
}

function renderDepartmentFilter() {
  const select = qs('#department-filter');
  if (!select) return;
  const current = select.value || 'all';
  select.innerHTML = '<option value="all">すべての学科</option>';
  departmentNames().forEach((department) => {
    const option = document.createElement('option');
    option.value = department;
    option.textContent = department;
    select.appendChild(option);
  });
  select.value = current === 'all' || departmentNames().includes(current) ? current : 'all';
}

function renderDirectoryLead() {
  const lead = qs('#lab-directory-lead');
  if (!lead) return;
  const names = departmentNames();
  const departmentText = names.length ? names.join('・') : '各学科';
  lead.textContent = `東洋大学生命科学部の${departmentText}、計${labs.length}研究室を掲載しています。`;
}

function toggleFavorite(id) {
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  saveFavorites();
  renderCurrentView();
}

function renderHomeTags() {
  const container = qs('#home-tags');
  container.innerHTML = '';
  homeRouteIds.map(routeById).filter(Boolean).forEach((route) => {
    if (routeMatchCount(route)) container.appendChild(tagButton(route));
  });
}

function tagButton(route) {
  const button = document.createElement('button');
  button.className = 'interest-tag';
  button.textContent = route.label;
  button.onclick = () => {
    selected = new Set([route.id]);
    selectedDetailTerms.clear();
    switchView('interest');
    scrollToDetailTerms();
  };
  return button;
}

function renderTagPanels() {
  const panel = qs('#interest-tags');
  panel.innerHTML = '';
  const intro = document.createElement('div');
  intro.className = 'keyword-panel-head';
  intro.innerHTML = '<strong>トピックで選ぶ</strong><p>研究室データのキーワードや研究方法から自動で判定しています。</p>';
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
      selected = new Set([route.id]);
      selectedDetailTerms.clear();
      renderInterest();
      scrollToDetailTerms();
    };
    routeGrid.appendChild(button);
  });
  panel.appendChild(routeGrid);
  renderDetailTermPanel(panel);
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
  const text = labTagText(lab);
  if (route.required && !route.required.some((term) => text.includes(String(term).toLowerCase()))) {
    return false;
  }
  return route.terms.some((term) => text.includes(String(term).toLowerCase()));
}

function availableDetailTerms() {
  return [...selected]
    .map(routeById)
    .filter(Boolean)
    .flatMap((route) => route.terms);
}

function pruneSelectedDetailTerms() {
  const available = new Set(availableDetailTerms());
  selectedDetailTerms = new Set([...selectedDetailTerms].filter((term) => available.has(term)));
}

function renderDetailTermPanel(panel) {
  const selectedRoutes = [...selected].map(routeById).filter(Boolean);
  if (!selectedRoutes.length) return;

  const detail = document.createElement('div');
  detail.className = 'detail-term-panel';
  detail.innerHTML = `
    <div class="keyword-panel-head">
      <div>
        <strong>このトピックに含まれるキーワード</strong>
        <p>気になる言葉を選ぶと、より近い研究室にしぼれます。</p>
      </div>
      <button class="detail-term-clear" type="button"${selectedDetailTerms.size ? '' : ' disabled'}>クリア</button>
    </div>
    <div class="detail-term-grid"></div>`;
  const clearButton = detail.querySelector('.detail-term-clear');
  clearButton.onclick = () => {
    selectedDetailTerms.clear();
    renderInterest();
  };
  const grid = detail.querySelector('.detail-term-grid');
  const seen = new Set();
  selectedRoutes.forEach((route) => {
    route.terms.forEach((term) => {
      if (seen.has(term)) return;
      seen.add(term);
      const count = labs.filter((lab) => matchesRoute(lab, route) && labMatchesTerm(lab, term)).length;
      if (!count) return;
      const button = document.createElement('button');
      button.className = `detail-term${selectedDetailTerms.has(term) ? ' selected' : ''}`;
      button.innerHTML = `<span>${escapeHtml(term)}</span><small>${count}</small>`;
      button.onclick = () => {
        selectedDetailTerms.has(term) ? selectedDetailTerms.delete(term) : selectedDetailTerms.add(term);
        renderInterest();
      };
      grid.appendChild(button);
    });
  });
  panel.appendChild(detail);
}

function scrollToDetailTerms() {
  window.setTimeout(() => {
    const target = qs('.detail-term-panel');
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, 80);
}

function labMatchesTerm(lab, term) {
  return expandedLabTerms(lab).has(String(term).toLowerCase());
}

function labRouteScore(lab, selectedRoutes) {
  const routeTerms = selectedRoutes.flatMap((route) => route.terms);
  const targetTerms = selectedDetailTerms.size ? [...selectedDetailTerms] : routeTerms;
  const matched = [...new Set(targetTerms)].filter((term) => labMatchesTerm(lab, term));
  const routeLabels = selectedRoutes.filter((route) => matchesRoute(lab, route)).map((route) => route.label);
  return {
    score: matched.length + routeLabels.length + (selectedDetailTerms.size ? matched.length * 2 : 0),
    matched,
    routeLabels
  };
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
    ...(lab.major_categories || []),
    ...structuredTags(lab),
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
    ...(lab.major_categories || []),
    ...structuredTags(lab),
    ...(lab.keywords || []),
    ...(lab.methods || [])
  ].join(' ').toLowerCase();
}

function labTagText(lab) {
  return [...expandedLabTerms(lab)].join(' ');
}

function labRawTags(lab) {
  return [
    ...(lab.major_categories || []),
    ...structuredTags(lab),
    ...(lab.keywords || []),
    ...(lab.methods || [])
  ];
}

function expandedLabTerms(lab) {
  return expandTerms(labRawTags(lab));
}

function expandTerms(terms) {
  const expanded = new Set();
  const visit = (term) => {
    const value = String(term || '').trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (expanded.has(key)) return;
    expanded.add(key);
    (tagParents[value] || []).forEach(visit);
  };
  terms.forEach(visit);
  return expanded;
}

function displayMatchedTerms(lab, terms) {
  return terms;
}

function card(lab, match = '') {
  const article = document.createElement('article');
  const isFav = favorites.has(lab.id);
  const recommended = (lab.recommended_for || []).slice(0, 2);
  const keywords = displayKeywords(lab).slice(0, 4);
  const recommendedHtml = recommended.length ? `
    <section class="lab-recommended-preview" aria-label="こんな人におすすめ">
      <span class="lab-mini-label">こんな人におすすめ</span>
      <ul>${recommended.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </section>` : '';
  const keywordsHtml = keywords.length ? `
    <div class="keywords">${keywords.map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`).join('')}</div>` : '';
  const matchHtml = match ? `<span class="match">${escapeHtml(match)}</span>` : '';
  article.className = `lab-card card ${deptClass(lab.department)}`;
  article.dataset.labId = lab.id;
  applyDepartmentTheme(article, lab.department);
  article.innerHTML = `
    <div class="lab-card-topline">
      <span class="lab-dept">${escapeHtml(lab.department)}</span>
      <button class="favorite-button ${isFav ? 'active' : ''}" aria-label="${isFav ? 'お気に入りから外す' : 'お気に入りに追加'}">${isFav ? '♥' : '♡'}</button>
    </div>
    <header class="lab-card-head">
      <h3>${escapeHtml(displayLabName(lab))}</h3>
      <p class="pi-name">${escapeHtml(lab.pi_name)} ${escapeHtml(lab.position)}</p>
    </header>
    <section class="lab-question">
      <span class="lab-question-label">QUESTION</span>
      <p>${escapeHtml(lab.question)}</p>
    </section>
    <p class="catch">${escapeHtml(lab.summary)}</p>
    ${recommendedHtml}
    ${keywordsHtml}
    <div class="lab-actions">
      ${matchHtml}
      <button class="open-lab">次の扉をひらく →</button>
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
  article.setAttribute('aria-label', `${displayLabName(lab)}の詳細を見る`);
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
  departmentNames(items).forEach((department) => {
    const groupItems = items.filter((lab) => lab.department === department);
    if (!groupItems.length) return;
    const meta = getDepartmentMeta(department);
    const section = document.createElement('section');
    section.className = 'department-group';
    section.dataset.department = department;
    section.innerHTML = `
      <div class="department-heading ${meta.className}">
        <div><span class="department-label">DEPARTMENT</span><h3>${department}</h3><p>${meta.description}</p></div>
        <span class="department-count">${groupItems.length} LABS</span>
      </div>
      <div class="department-cards"></div>`;
    applyDepartmentTheme(section.querySelector('.department-heading'), department);
    const cards = section.querySelector('.department-cards');
    groupItems.forEach((lab) => cards.appendChild(card(lab, matchLabel ? matchLabel(lab) : '')));
    container.appendChild(section);
  });
}

function renderInterest() {
  renderTagPanels();
  const selectedRoutes = [...selected].map(routeById).filter(Boolean);
  const filtered = rankedInterestLabs(selectedRoutes);
  renderInterestIndex(qs('#interest-results'), filtered);
  qs('#result-count').textContent = `${filtered.length} labs`;
  const selectedLabels = selectedRoutes.map((route) => route.label);
  const detailText = selectedDetailTerms.size ? `、詳細キーワード「${[...selectedDetailTerms].join('・')}」` : '';
  qs('#result-message').textContent = selected.size
    ? `「${selectedLabels.join('・')}」${detailText}に近い順で表示しています。`
    : `${labs.length}研究室を表示しています。`;
}

function rankedInterestLabs(selectedRoutes) {
  if (!selectedRoutes.length) return labs.map((lab) => ({ lab, score: 0, matched: [], routeLabels: [] }));
  return labs
    .map((lab) => ({ lab, ...labRouteScore(lab, selectedRoutes) }))
    .filter((item) => {
      const routeHit = selectedRoutes.some((route) => matchesRoute(item.lab, route));
      const detailHit = !selectedDetailTerms.size || item.matched.some((term) => selectedDetailTerms.has(term));
      return routeHit && detailHit;
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.matched.length !== a.matched.length) return b.matched.length - a.matched.length;
      return a.lab.lab_name.localeCompare(b.lab.lab_name, 'ja');
    });
}

function renderRankedLabs(container, items) {
  container.innerHTML = '';
  container.classList.remove('grouped');
  if (!items.length) {
    container.innerHTML = '<div class="empty-result card">条件に合う研究室がありません。</div>';
    return;
  }
  items.forEach((item) => {
    const matchedText = displayMatchedTerms(item.lab, item.matched).slice(0, 4).join('・');
    const label = matchedText ? `一致: ${matchedText}${item.matched.length > 4 ? ` ほか${item.matched.length - 4}件` : ''}` : '';
    container.appendChild(card(item.lab, label));
  });
}

function renderInterestIndex(container, items) {
  container.innerHTML = '';
  container.classList.remove('lab-grid', 'grouped');
  container.classList.add('interest-index-list');
  if (!items.length) {
    container.innerHTML = '<div class="empty-result card">条件に合う研究室がありません。</div>';
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'interest-index-grid';
  items.forEach((item) => {
    const matched = displayMatchedTerms(item.lab, item.matched).slice(0, 3);
    grid.appendChild(miniLabButton(item.lab, {
      keywords: matched.length ? matched : displayKeywords(item.lab).slice(0, 3),
      showDepartment: true,
      onClick: () => openModal(item.lab)
    }));
  });
  container.appendChild(grid);
}

function parseDictionaryCsv(text = '') {
  const rows = parseCsv(text);
  const header = rows.shift() || [];
  const indexes = Object.fromEntries(header.map((name, index) => [name.trim(), index]));
  return rows
    .map((row) => ({
      word: (row[indexes.word] || '').trim(),
      synonym: (row[indexes.synonym] || '').trim(),
      tag: (row[indexes.tag] || '').trim(),
      weight: Number(row[indexes.weight] || 1)
    }))
    .filter((entry) => entry.word && entry.tag);
}

function parseLabDictionaryCsv(text = '') {
  const rows = parseCsv(text);
  const header = rows.shift() || [];
  const indexes = Object.fromEntries(header.map((name, index) => [name.trim(), index]));
  return rows
    .map((row) => ({
      lab_id: (row[indexes.lab_id] || '').trim(),
      word: (row[indexes.word] || '').trim(),
      synonym: (row[indexes.synonym] || '').trim(),
      field: (row[indexes.field] || '').trim(),
      weight: Number(row[indexes.weight] || 1),
      source: (row[indexes.source] || '').trim(),
      needs_review: (row[indexes.needs_review] || '').trim()
    }))
    .filter((entry) => entry.lab_id && entry.word);
}

function parseCsv(text = '') {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function renderAICompass() {
  renderAICompassAdmin();
  if (!aiLastResult) {
    const results = qs('#ai-compass-results');
    if (results) results.innerHTML = '';
  }
}

function runAICompassSearch(rawInput) {
  const input = rawInput.trim();
  const resultArea = qs('#ai-compass-results');
  if (!input) {
    resultArea.innerHTML = '<div class="empty-result card">気になることを一言でいいので書いてみてください。</div>';
    return;
  }
  const analysis = analyzeAICompassInput(input);
  const matches = scoreAICompassLabs(analysis, input);
  const log = saveAICompassLog(input, analysis, matches);
  aiLastLogId = log.id;
  aiLastResult = { input, analysis, matches };
  renderAICompassResults(aiLastResult);
  renderAICompassAdmin();
}

function analyzeAICompassInput(input) {
  if (window.MyLabAICompass && aiGeneralDictionary.length && aiResearchBridge.length) {
    const dictionaryResult = window.MyLabAICompass.matchGeneralDictionary(input, aiGeneralDictionary);
    const bridgeResult = window.MyLabAICompass.mapConceptsToResearchTags(dictionaryResult.conceptScores, aiResearchBridge);
    const tagScores = new Map();
    dictionaryResult.concepts.forEach((item) => tagScores.set(item.concept, item.score));
    bridgeResult.researchTags.forEach((item) => tagScores.set(item.tag, (tagScores.get(item.tag) || 0) + item.score));
    return {
      engine: 'two-layer-json',
      dictionaryResult,
      bridgeResult,
      matchedEntries: dictionaryResult.detectedTerms,
      tagScores,
      tags: [...tagScores.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
        .map(([tag, score]) => ({ tag, score })),
      unknownTerms: dictionaryResult.unknownTerms
    };
  }
  const normalized = normalizeCompassText(input);
  const matchedEntries = [];
  const tagScores = new Map();
  aiDictionary.forEach((entry) => {
    const candidates = [entry.word, ...entry.synonym.split('|')].map((item) => item.trim()).filter(Boolean);
    const hit = candidates.some((candidate) => normalized.includes(normalizeCompassText(candidate)));
    if (!hit) return;
    matchedEntries.push(entry);
    tagScores.set(entry.tag, (tagScores.get(entry.tag) || 0) + entry.weight);
    (tagParents[entry.tag] || []).forEach((parent) => {
      tagScores.set(parent, (tagScores.get(parent) || 0) + Math.max(1, entry.weight * 0.45));
    });
  });
  return {
    matchedEntries,
    tagScores,
    tags: [...tagScores.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
      .map(([tag, score]) => ({ tag, score })),
    unknownTerms: extractUnknownTerms(input, matchedEntries)
  };
}

function normalizeCompassText(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/癌|ガン/g, 'がん')
    .replace(/[、。,.!?！？「」『』（）()［］\[\]【】・/／\\\s]/g, '');
}

function extractUnknownTerms(input, matchedEntries) {
  const matchedWords = new Set(matchedEntries.flatMap((entry) => [entry.word, ...entry.synonym.split('|')])
    .map((term) => normalizeCompassText(term))
    .filter(Boolean));
  const rough = String(input)
    .normalize('NFKC')
    .replace(/[、。,.!?！？「」『』（）()［］\[\]【】・/／\\]/g, ' ')
    .split(/\s+/)
    .flatMap((chunk) => chunk.split(/(?:が|を|に|へ|で|と|の|は|も|や|って|です|ます|した|たい|好き|興味|気になる|面白い|面白そう|知りたい|ありますか)/g))
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
  return uniqueTerms(rough)
    .filter((term) => !matchedWords.has(normalizeCompassText(term)))
    .slice(0, 8);
}

function scoreAICompassLabs(analysis, input = '') {
  if (analysis.engine === 'two-layer-json' && window.MyLabAICompass && aiLabResearchTags.length) {
    return window.MyLabAICompass.scoreLabs({
      input,
      dictionaryResult: analysis.dictionaryResult,
      bridgeResult: analysis.bridgeResult,
      labResearchTags: aiLabResearchTags,
      labs
    });
  }
  const tagScores = analysis.tagScores || new Map();
  const normalizedInput = normalizeCompassText(input);
  if (!tagScores.size && !normalizedInput) return [];
  const inputTerms = extractAICompassInputTerms(input);
  const normalizedTagScores = new Map([...tagScores.entries()].map(([tag, weight]) => [normalizeCompassText(tag), weight]));
  const labDictionaryById = aiLabDictionary.reduce((map, entry) => {
    if (!map.has(entry.lab_id)) map.set(entry.lab_id, []);
    map.get(entry.lab_id).push(entry);
    return map;
  }, new Map());
  return labs
    .map((lab) => {
      const labEntries = labDictionaryById.get(lab.id) || [];
      const labTerms = expandedLabTerms(lab);
      const matched = new Map();
      let score = 0;
      labEntries.forEach((entry) => {
        const candidates = [entry.word, ...entry.synonym.split('|')]
          .map((item) => item.trim())
          .filter(Boolean);
        const exactUserTermHit = candidates.some((candidate) => inputTerms.has(normalizeCompassText(candidate)));
        const directHit = exactUserTermHit || candidates.some((candidate) => normalizedInput.includes(normalizeCompassText(candidate)));
        if (directHit) {
          const weight = (entry.weight || 1) * (exactUserTermHit ? 3 : 2);
          score += weight;
          matched.set(entry.word, (matched.get(entry.word) || 0) + weight);
          return;
        }
        const tagHit = candidates.find((candidate) => tagScores.has(candidate) || normalizedTagScores.has(normalizeCompassText(candidate)));
        if (tagHit) {
          const tagWeight = tagScores.get(tagHit) || normalizedTagScores.get(normalizeCompassText(tagHit)) || entry.weight || 1;
          const weight = Math.max(1, Math.max(entry.weight || 1, tagWeight) * 0.75);
          score += weight;
          matched.set(entry.word, (matched.get(entry.word) || 0) + weight);
        }
      });
      tagScores.forEach((weight, tag) => {
        if (!labTerms.has(String(tag).toLowerCase())) return;
        const fallbackWeight = Math.max(0.25, weight * 0.2);
        score += fallbackWeight;
        matched.set(tag, (matched.get(tag) || 0) + fallbackWeight);
      });
      const matchedTerms = [...matched.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
        .map(([term]) => term);
      const questionBonus = matchedTerms.some((tag) => lab.question?.includes(tag)) ? 1.5 : 0;
      return { lab, score: score + questionBonus, matched: uniqueTerms(matchedTerms) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.matched.length !== a.matched.length) return b.matched.length - a.matched.length;
      return a.lab.lab_name.localeCompare(b.lab.lab_name, 'ja');
    })
    .slice(0, 8);
}

function extractAICompassInputTerms(input = '') {
  const normalizedWhole = normalizeCompassText(input);
  const roughTerms = String(input)
    .normalize('NFKC')
    .replace(/[、。,.!?！？「」『』（）()［］\[\]【】・/／\\]/g, ' ')
    .split(/\s+/)
    .flatMap((chunk) => chunk.split(/(?:が(?!ん)|を|に|へ|で|と|の|は|も|や|って|です|ます|した|したい|たい|好き|興味|気になる|面白い|面白そう|知りたい|ありますか|について|から|まで)/g))
    .map((term) => normalizeCompassText(term))
    .filter((term) => term.length >= 2);
  return new Set([normalizedWhole, ...roughTerms]);
}

function renderAICompassResults(result) {
  const container = qs('#ai-compass-results');
  const tags = result.analysis.tags.slice(0, 8);
  const unknown = result.analysis.unknownTerms;
  const matches = result.matches;
  const detectedTerms = result.analysis.dictionaryResult?.detectedTerms || [];
  const concepts = result.analysis.dictionaryResult?.concepts || [];
  const researchTags = result.analysis.bridgeResult?.researchTags || [];
  const topQuestion = matches[0]?.lab?.question || 'あなたの興味は、どんな研究の問いにつながるだろう？';
  container.innerHTML = `
    <section class="ai-result-block card">
      <span class="eyebrow">INTEREST MAP</span>
      <h3>あなたの興味を整理しました</h3>
      ${detectedTerms.length ? `<div class="ai-reason-map"><div><strong>検出された入力語</strong><p>${detectedTerms.map((item) => `<span>${escapeHtml(item.matched || item.keyword)}</span>`).join('')}</p></div><div><strong>一般概念</strong><p>${concepts.slice(0, 8).map((item) => `<span>${escapeHtml(item.concept)}</span>`).join('')}</p></div><div><strong>研究タグ</strong><p>${researchTags.slice(0, 8).map((item) => `<span>${escapeHtml(item.tag)}</span>`).join('')}</p></div></div>` : ''}
      ${tags.length ? `<div class="ai-tag-list">${tags.map((item) => `<span>✓ ${escapeHtml(item.tag)}</span>`).join('')}</div>` : '<p class="ai-learning">この言葉はまだ学習中です。検索結果は参考程度にご利用ください。</p>'}
      ${unknown.length ? `<p class="ai-learning">まだ辞書で拾いきれていない言葉: ${unknown.map(escapeHtml).join('、')}</p>` : ''}
    </section>
    <section class="hero-question ai-today-question"><span>TODAY'S QUESTION</span><h3>${escapeHtml(topQuestion)}</h3></section>
    <section class="ai-result-block card">
      <div class="ai-result-head">
        <div><span class="eyebrow">LABORATORY</span><h3>おすすめ研究室</h3></div>
        <span>${matches.length} labs</span>
      </div>
      <div class="ai-match-grid"></div>
      <div class="ai-feedback">
        <span>この結果は参考になりましたか？</span>
        <button type="button" data-ai-feedback="up">👍 参考になった</button>
        <button type="button" data-ai-feedback="down">👎 ちがうかも</button>
      </div>
    </section>
    <section class="ai-result-block card">
      <span class="eyebrow">NEXT</span>
      <h3>興味から探す</h3>
      <p>辞書で見つかったキーワードを手がかりに、既存のトピック検索でも研究室を見比べられます。</p>
      <button class="secondary" type="button" id="ai-go-interest">興味から探すへ →</button>
    </section>`;
  const grid = container.querySelector('.ai-match-grid');
  if (!matches.length) {
    grid.innerHTML = '<div class="empty-result">一致する研究室がまだ少ないようです。辞書育成支援ページに未登録語として保存しました。</div>';
  } else {
    matches.slice(0, 4).forEach((item) => grid.appendChild(aiMatchCard(item)));
  }
  container.querySelectorAll('[data-ai-feedback]').forEach((button) => {
    button.onclick = () => recordAICompassFeedback(button.dataset.aiFeedback);
  });
  qs('#ai-go-interest').onclick = () => switchView('interest');
}

function aiMatchCard(item) {
  const article = document.createElement('article');
  const lab = item.lab;
  const reason = item.matched.slice(0, 4);
  const reasonText = reason.length ? `「${escapeHtml(reason.join('」「'))}」が研究室タグと一致しました。` : '関連する研究タグが見つかりました。';
  article.className = `ai-match-card ${deptClass(lab.department)}`;
  applyDepartmentTheme(article, lab.department);
  article.innerHTML = `
    <span class="lab-jump-dept">${escapeHtml(lab.department)}</span>
    <strong>${escapeHtml(displayLabName(lab))}</strong>
    <span class="lab-jump-pi">${escapeHtml(lab.pi_name)} ${escapeHtml(lab.position)}</span>
    <p>${escapeHtml(lab.summary)}</p>
    <div class="lab-jump-keywords">${reason.map((tag) => `<em>${escapeHtml(tag)}</em>`).join('')}</div>
    <p class="ai-reason">${reasonText}<br><small>推薦スコア: ${Math.round(item.score)}</small></p>
    <button class="open-lab" type="button">研究室をのぞく →</button>`;
  article.querySelector('.open-lab').onclick = () => {
    recordAICompassClick(lab.id);
    openModal(lab);
  };
  return article;
}

function aiCompassLogs() {
  try {
    const logs = JSON.parse(localStorage.getItem(aiLogStorageKey) || '[]');
    return Array.isArray(logs) ? logs : [];
  } catch {
    return [];
  }
}

function saveAICompassLogs(logs) {
  localStorage.setItem(aiLogStorageKey, JSON.stringify(logs.slice(-250)));
}

function saveAICompassLog(input, analysis, matches) {
  const log = {
    id: `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    input,
    extractedTags: analysis.tags.slice(0, 12).map((item) => item.tag),
    detectedTerms: (analysis.dictionaryResult?.detectedTerms || []).map((item) => item.matched || item.keyword),
    concepts: (analysis.dictionaryResult?.concepts || []).slice(0, 12).map((item) => item.concept),
    researchTags: (analysis.bridgeResult?.researchTags || []).slice(0, 12).map((item) => item.tag),
    unknownTerms: analysis.unknownTerms,
    displayedLabs: matches.slice(0, 8).map((item) => item.lab.id),
    clickedLabs: [],
    feedback: ''
  };
  const logs = aiCompassLogs();
  logs.push(log);
  saveAICompassLogs(logs);
  sendAICompassLogEvent('search', log);
  return log;
}

function updateAICompassLog(updater) {
  const logs = aiCompassLogs();
  const index = logs.findIndex((log) => log.id === aiLastLogId);
  if (index === -1) return;
  logs[index] = updater(logs[index]);
  saveAICompassLogs(logs);
  renderAICompassAdmin();
}

function recordAICompassClick(labId) {
  updateAICompassLog((log) => ({
    ...log,
    clickedLabs: uniqueTerms([...(log.clickedLabs || []), labId])
  }));
  sendAICompassLogEvent('click', { id: aiLastLogId, clickedLab: labId });
}

function recordAICompassFeedback(value) {
  updateAICompassLog((log) => ({ ...log, feedback: value }));
  sendAICompassLogEvent('feedback', { id: aiLastLogId, feedback: value });
  const target = qs('.ai-feedback');
  if (target) target.classList.add('answered');
}

function sendAICompassLogEvent(eventType, data = {}) {
  if (!aiLoggingConfig.enabled || !aiLoggingConfig.endpoint) return;
  const payload = {
    event_type: eventType,
    site_id: aiLoggingConfig.site_id || 'mylab-gamma',
    log_id: data.id || aiLastLogId || '',
    timestamp: data.createdAt || new Date().toISOString(),
    page_url: location.href,
    input_text: data.input || '',
    extracted_tags: Array.isArray(data.extractedTags) ? data.extractedTags.join('|') : '',
    concepts: Array.isArray(data.concepts) ? data.concepts.join('|') : '',
    research_tags: Array.isArray(data.researchTags) ? data.researchTags.join('|') : '',
    unknown_terms: Array.isArray(data.unknownTerms) ? data.unknownTerms.join('|') : '',
    displayed_labs: Array.isArray(data.displayedLabs) ? data.displayedLabs.join('|') : '',
    clicked_lab: data.clickedLab || '',
    feedback: data.feedback || '',
    user_agent: aiLoggingConfig.send_user_agent ? navigator.userAgent : ''
  };
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(aiLoggingConfig.endpoint, new Blob([body], { type: 'text/plain;charset=utf-8' }));
      if (sent) return;
    }
    fetch(aiLoggingConfig.endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body
    }).catch(() => queueAICompassLog(payload));
  } catch {
    queueAICompassLog(payload);
  }
}

function queueAICompassLog(payload) {
  try {
    const queued = JSON.parse(localStorage.getItem('mylab-ai-compass-log-queue') || '[]');
    const safeQueue = Array.isArray(queued) ? queued : [];
    safeQueue.push(payload);
    localStorage.setItem('mylab-ai-compass-log-queue', JSON.stringify(safeQueue.slice(-100)));
  } catch {
    // Logging must never interrupt the user-facing search flow.
  }
}

function renderAICompassAdmin() {
  const container = qs('#ai-compass-admin');
  if (!container) return;
  const logs = aiCompassLogs();
  const unknownRanking = rankAIItems(logs.flatMap((log) => log.unknownTerms || []));
  const clickRanking = rankAIItems(logs.flatMap((log) => log.clickedLabs || []));
  const up = logs.filter((log) => log.feedback === 'up').length;
  const down = logs.filter((log) => log.feedback === 'down').length;
  const success = logs.filter((log) => (log.displayedLabs || []).length).length;
  container.innerHTML = `
    <div class="ai-admin-head">
      <div>
        <span class="eyebrow">DICTIONARY GARDEN</span>
        <h3>辞書育成支援ページ</h3>
        <p>入力ログはこのブラウザ内に保存されます。個人情報は入力しない前提で、辞書改善の手がかりだけを見ます。</p>
      </div>
      <button class="text-button" type="button" id="ai-clear-logs"${logs.length ? '' : ' disabled'}>ログを消す</button>
    </div>
    <div class="ai-admin-stats">
      <span><strong>${logs.length}</strong>検索</span>
      <span><strong>${logs.length ? Math.round((success / logs.length) * 100) : 0}%</strong>成功率</span>
      <span><strong>${up}</strong>👍</span>
      <span><strong>${down}</strong>👎</span>
    </div>
    <div class="ai-admin-grid">
      <section>
        <h4>未登録語ランキング</h4>
        ${aiRankingList(unknownRanking, 'まだ未登録語はありません。')}
      </section>
      <section>
        <h4>クリック数ランキング</h4>
        ${aiRankingList(clickRanking.map((item) => ({ ...item, label: labLabelById(item.label) })), 'クリックログはまだありません。')}
      </section>
    </div>
      <section class="ai-dictionary-editor">
      <h4>辞書登録メモを作る</h4>
      <p>未登録語を見ながら、共通辞書CSVに追記する候補行を作れます。研究室ごとの語は <code>data/ai_lab_dictionary.csv</code> に追記します。</p>
      <div class="ai-editor-grid">
        <input id="ai-dict-word" type="text" placeholder="word 例: クラゲ">
        <input id="ai-dict-synonym" type="text" placeholder="synonym 例: 水族館|海の生き物">
        <input id="ai-dict-tag" type="text" placeholder="tag 例: 動物">
        <input id="ai-dict-weight" type="number" min="1" max="5" value="4" placeholder="weight">
      </div>
      <output id="ai-dict-preview">word,synonym,tag,weight</output>
    </section>
    <details class="ai-log-detail">
      <summary>最近の入力を見る</summary>
      <ul>${logs.slice(-8).reverse().map((log) => `<li><strong>${escapeHtml(log.input)}</strong><span>${escapeHtml((log.extractedTags || []).slice(0, 5).join('・') || 'タグなし')}</span></li>`).join('')}</ul>
    </details>`;
  const clear = qs('#ai-clear-logs');
  if (clear) {
    clear.onclick = () => {
      if (!confirm('AI Research Compass βのローカルログを削除しますか？')) return;
      saveAICompassLogs([]);
      renderAICompassAdmin();
    };
  }
  qsa('#ai-dict-word,#ai-dict-synonym,#ai-dict-tag,#ai-dict-weight').forEach((input) => {
    input.oninput = renderDictionaryPreview;
  });
  renderDictionaryPreview();
}

function renderDictionaryPreview() {
  const preview = qs('#ai-dict-preview');
  if (!preview) return;
  const values = ['#ai-dict-word', '#ai-dict-synonym', '#ai-dict-tag', '#ai-dict-weight']
    .map((selector) => csvCell(qs(selector)?.value || ''));
  preview.textContent = values.join(',');
}

function csvCell(value) {
  const text = String(value).trim();
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rankAIItems(items) {
  const counts = new Map();
  items.filter(Boolean).forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ja'))
    .slice(0, 10);
}

function aiRankingList(items, emptyText) {
  if (!items.length) return `<p class="ai-empty">${escapeHtml(emptyText)}</p>`;
  return `<ol>${items.map((item) => `<li><span>${escapeHtml(item.label)}</span><strong>${item.count}</strong></li>`).join('')}</ol>`;
}

function labLabelById(id) {
  const lab = labs.find((item) => item.id === id);
  return lab ? displayLabName(lab) : id;
}

function renderLabList() {
  const query = qs('#lab-search').value.trim().toLowerCase();
  const department = qs('#department-filter').value;
  const filtered = labs.filter((lab) => {
    const departmentMatch = department === 'all' || lab.department === department;
    return departmentMatch && (!query || searchableText(lab).includes(query));
  });
  renderLabJumpList(filtered);
  renderLabCardNav(filtered);
  renderLabRecommendationList(filtered);
  const list = qs('#lab-list');
  list.innerHTML = '';
  list.classList.remove('grouped');
  list.hidden = true;
}

function renderLabJumpList(items) {
  const container = qs('#lab-jump-list');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '';
    container.hidden = true;
    return;
  }
  const departments = departmentNames(items);
  const available = departments.filter((department) => items.some((lab) => lab.department === department));
  if (!available.includes(selectedLabJumpDepartment)) selectedLabJumpDepartment = '';
  const visibleItems = items.filter((lab) => lab.department === selectedLabJumpDepartment);
  const activeClass = deptClass(selectedLabJumpDepartment);
  container.hidden = false;
  container.className = `lab-jump-list card ${activeClass}`;
  applyDepartmentTheme(container, selectedLabJumpDepartment);
  container.innerHTML = `
    <div class="lab-jump-head">
      <div>
        <span class="eyebrow">LAB QUICK INDEX</span>
        <h3>研究室名から見る</h3>
      </div>
      <span>${selectedLabJumpDepartment ? `${visibleItems.length} labs` : 'Select department'}</span>
    </div>
    <div class="lab-jump-tabs" aria-label="学科を切り替える"></div>
    <div class="lab-jump-grid"></div>`;
  const tabs = container.querySelector('.lab-jump-tabs');
  departments.forEach((department) => {
    const count = items.filter((lab) => lab.department === department).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `lab-jump-tab ${deptClass(department)}${department === selectedLabJumpDepartment ? ' active' : ''}`;
    button.disabled = !count;
    button.innerHTML = `<span>${escapeHtml(department)}</span><small>${count}</small>`;
    applyDepartmentTheme(button, department);
    button.onclick = () => {
      selectedLabJumpDepartment = department;
      renderLabList();
    };
    tabs.appendChild(button);
  });
  const grid = container.querySelector('.lab-jump-grid');
  if (!selectedLabJumpDepartment) {
    grid.innerHTML = '<p class="index-empty">学科を選ぶと、研究室名・先生名・キーワードを一覧で見られます。</p>';
    return;
  }
  visibleItems.forEach((lab) => grid.appendChild(miniLabButton(lab, {
    keywords: displayKeywords(lab).slice(0, 3),
    showDepartment: false,
    extraClass: activeClass,
    onClick: () => openModal(lab)
  })));
}

function renderLabRecommendationList(items) {
  const container = qs('#lab-recommend-list');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '';
    container.hidden = true;
    return;
  }
  const departments = departmentNames(items);
  const available = departments.filter((department) => items.some((lab) => lab.department === department));
  if (!available.includes(selectedRecommendationDepartment)) selectedRecommendationDepartment = '';
  const visibleItems = items.filter((lab) => lab.department === selectedRecommendationDepartment);
  const activeClass = deptClass(selectedRecommendationDepartment);
  container.hidden = false;
  container.className = `lab-recommend-list card ${activeClass}`;
  applyDepartmentTheme(container, selectedRecommendationDepartment);
  container.innerHTML = `
    <div class="lab-jump-head">
      <div>
        <span class="eyebrow">RECOMMEND INDEX</span>
        <h3>おすすめから見る</h3>
      </div>
      <span>${selectedRecommendationDepartment ? `${visibleItems.length} labs` : 'Select department'}</span>
    </div>
    <div class="lab-jump-tabs" aria-label="学科を切り替える"></div>
    <div class="recommend-index-grid"></div>`;
  const tabs = container.querySelector('.lab-jump-tabs');
  departments.forEach((department) => {
    const count = departmentCount(department, items);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `lab-jump-tab ${deptClass(department)}${department === selectedRecommendationDepartment ? ' active' : ''}`;
    button.disabled = !count;
    button.innerHTML = `<span>${escapeHtml(department)}</span><small>${count}</small>`;
    applyDepartmentTheme(button, department);
    button.onclick = () => {
      selectedRecommendationDepartment = department;
      renderLabList();
    };
    tabs.appendChild(button);
  });
  const grid = container.querySelector('.recommend-index-grid');
  if (!selectedRecommendationDepartment) {
    grid.innerHTML = '<p class="index-empty">学科を選ぶと、「こんな人におすすめ」から研究室を探せます。</p>';
    return;
  }
  visibleItems.forEach((lab) => grid.appendChild(recommendationIndexButton(lab)));
}

function renderLabCardNav(items) {
  const container = qs('#lab-card-nav');
  if (!container) return;
  const departments = departmentNames(items)
    .map((department) => ({
      department,
      count: items.filter((lab) => lab.department === department).length
    }))
    .filter((item) => item.count);
  if (!departments.length) {
    container.innerHTML = '';
    container.hidden = true;
    return;
  }
  if (!departments.some((item) => item.department === selectedQuestionDepartment)) selectedQuestionDepartment = '';
  const visibleItems = items.filter((lab) => lab.department === selectedQuestionDepartment);
  const activeClass = deptClass(selectedQuestionDepartment);
  container.hidden = false;
  container.className = `lab-card-nav card ${activeClass}`;
  applyDepartmentTheme(container, selectedQuestionDepartment);
  container.innerHTML = `
    <div class="lab-jump-head">
      <div>
        <span class="eyebrow">LAB CARDS</span>
        <h3>研究の問いから見る</h3>
      </div>
      <span>${selectedQuestionDepartment ? `${visibleItems.length} labs` : 'Select department'}</span>
    </div>
    <div class="lab-jump-tabs" aria-label="学科を切り替える"></div>
    <div class="question-index-grid"></div>`;
  const buttons = container.querySelector('.lab-jump-tabs');
  departments.forEach(({ department, count }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `lab-jump-tab ${deptClass(department)}${department === selectedQuestionDepartment ? ' active' : ''}`;
    button.innerHTML = `<span>${escapeHtml(department)}</span><small>${count}</small>`;
    applyDepartmentTheme(button, department);
    button.onclick = () => {
      selectedQuestionDepartment = department;
      renderLabList();
    };
    buttons.appendChild(button);
  });
  const grid = container.querySelector('.question-index-grid');
  if (!selectedQuestionDepartment) {
    grid.innerHTML = '<p class="index-empty">学科を選ぶと、研究室ごとのQuestionを一覧で見比べられます。</p>';
    return;
  }
  visibleItems.forEach((lab) => grid.appendChild(questionIndexButton(lab)));
}

function miniLabButton(lab, options = {}) {
  const button = document.createElement('button');
  const className = options.extraClass || deptClass(lab.department);
  button.className = `lab-jump-item ${className}`;
  button.type = 'button';
  applyDepartmentTheme(button, lab.department);
  const dept = options.showDepartment ? `<span class="lab-jump-dept">${escapeHtml(lab.department)}</span>` : '';
  const keywords = (options.keywords || []).slice(0, 3);
  button.innerHTML = `
    ${dept}
    <strong>${escapeHtml(displayLabName(lab))}</strong>
    <span class="lab-jump-pi">${escapeHtml(lab.pi_name)} ${escapeHtml(lab.position)}</span>
    <span class="lab-jump-keywords">${keywords.map((keyword) => `<em>${escapeHtml(keyword)}</em>`).join('')}</span>`;
  button.onclick = options.onClick || (() => openModal(lab));
  return button;
}

function recommendationIndexButton(lab) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `recommend-index-item ${deptClass(lab.department)}`;
  applyDepartmentTheme(button, lab.department);
  const recommendations = (lab.recommended_for || []).slice(0, 2);
  button.innerHTML = `
    <strong>${escapeHtml(displayLabName(lab))}</strong>
    <span class="recommend-index-pi">${escapeHtml(lab.pi_name)} ${escapeHtml(lab.position)}</span>
    <ul>${recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  button.onclick = () => openModal(lab);
  return button;
}

function questionIndexButton(lab) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `question-index-item ${deptClass(lab.department)}`;
  applyDepartmentTheme(button, lab.department);
  const keywords = displayKeywords(lab).slice(0, 3);
  button.innerHTML = `
    <strong>${escapeHtml(displayLabName(lab))}</strong>
    <span class="question-index-pi">${escapeHtml(lab.pi_name)} ${escapeHtml(lab.position)}</span>
    <p>${escapeHtml(lab.question)}</p>
    <span class="lab-jump-keywords">${keywords.map((keyword) => `<em>${escapeHtml(keyword)}</em>`).join('')}</span>`;
  button.onclick = () => openModal(lab);
  return button;
}

function scrollToDepartmentGroup(department) {
  const target = [...document.querySelectorAll('#lab-list .department-group')]
    .find((item) => item.dataset.department === department);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - 74;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function scrollToLabCard(labId) {
  const target = [...document.querySelectorAll('#lab-list .lab-card')]
    .find((item) => item.dataset.labId === labId);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - 74;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  target.focus({ preventScroll: true });
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
  renderEventQuickIndex(programs);
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
  const filters = ['実験プログラム', '学科紹介', '学科相談', 'お気に入り', ...departmentNames()];
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
    if (departmentNames().includes(filter)) applyDepartmentTheme(button, filter);
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

function renderEventQuickIndex(programs) {
  const container = qs('#event-quick-index');
  if (!container) return;
  if (!programs.length) {
    container.innerHTML = '';
    container.hidden = true;
    return;
  }
  const currentDate = currentEventDateBlock();
  container.hidden = false;
  container.innerHTML = `
    <div class="event-index-head">
      <div>
        <span class="eyebrow">EVENT QUICK INDEX</span>
        <h3>${escapeHtml(currentDate?.label || '当日')}のプログラム早見表</h3>
      </div>
      <span>${programs.length} programs</span>
    </div>
    <div class="event-index-grid"></div>`;
  const grid = container.querySelector('.event-index-grid');
  programs.forEach((program) => grid.appendChild(eventIndexButton(program)));
}

function eventIndexButton(program) {
  const button = document.createElement('button');
  const programLabs = labsForProgram(program);
  const primaryLab = programLabs[0];
  const teacherNames = programLabs.map((lab) => `${lab.pi_name.replace(/\s+/g, ' ')}先生`).join('・');
  const time = program.times?.[0] || '時間は当日案内';
  button.type = 'button';
  button.className = `event-index-item ${primaryLab ? deptClass(primaryLab.department) : ''}`;
  if (primaryLab) applyDepartmentTheme(button, primaryLab.department);
  button.innerHTML = `
    <span class="event-index-type">${escapeHtml(program.type)}</span>
    <strong>${escapeHtml(displayProgramTitle(program.title))}</strong>
    <span class="event-index-meta">${escapeHtml(time)} / ${escapeHtml(program.place || '場所は当日案内')}</span>
    ${teacherNames ? `<span class="event-index-teacher">${escapeHtml(teacherNames)}</span>` : ''}`;
  button.onclick = () => scrollToEventCard(program.id);
  return button;
}

function scrollToEventCard(programId) {
  const target = [...document.querySelectorAll('#event-list .event-card')]
    .find((item) => item.dataset.programId === programId);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - 74;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  target.focus({ preventScroll: true });
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
  if (primaryLab) applyDepartmentTheme(article, primaryLab.department);
  article.dataset.programId = program.id;
  article.tabIndex = 0;
  article.innerHTML = `
    <div class="event-card-topline">
      <span class="event-date">${escapeHtml(program.dateLabel)}</span>
      <span class="event-type">${escapeHtml(program.type)}</span>
    </div>
    <header class="event-card-head">
      <span class="event-card-label">PROGRAM</span>
      <h3>${escapeHtml(displayProgramTitle(program.title))}</h3>
    </header>
    <p class="event-program">${escapeHtml(program.program)}</p>
    <dl class="event-meta">
      <div><dt>時間</dt><dd>${program.times?.length ? program.times.map((time) => `<span>${escapeHtml(time)}</span>`).join('') : '当日案内を確認'}</dd></div>
      <div><dt>場所</dt><dd>${escapeHtml(program.place || '当日案内を確認')}</dd></div>
      <div><dt>対象</dt><dd>${escapeHtml(program.audience || '受験生・保護者')}</dd></div>
    </dl>
    ${program.notes?.length ? `<div class="event-notes">${program.notes.map((note) => `<span>${escapeHtml(note)}</span>`).join('')}</div>` : ''}
    <section class="event-teachers" aria-label="担当する先生">
      <span class="event-action-label">担当する先生は？</span>
      <div class="event-actions"></div>
    </section>`;

  const actions = article.querySelector('.event-actions');
  programLabs.forEach((lab) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `event-lab-button ${deptClass(lab.department)}`;
    applyDepartmentTheme(button, lab.department);
    button.textContent = `${lab.pi_name.replace(/\s+/g, ' ')}先生`;
    button.onclick = () => openModal(lab);
    actions.appendChild(button);
  });
  if (isSingle && primaryLab) {
    const favorite = document.createElement('button');
    const isFav = favorites.has(primaryLab.id);
    favorite.type = 'button';
    favorite.className = `favorite-button ${isFav ? 'active' : ''}`;
    favorite.setAttribute('aria-label', isFav ? 'お気に入りから外す' : 'お気に入りに追加');
    favorite.textContent = isFav ? '♥' : '♡';
    favorite.onclick = () => toggleFavorite(primaryLab.id);
    actions.appendChild(favorite);
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
  const linkCards = candidates
    .filter((item) => lab.links[item.key])
    .map((item) => `<a class="more-card" href="${lab.links[item.key]}" target="_blank" rel="noopener">
      <span class="more-icon">${item.icon}</span>
      <div><span class="more-label">${item.label}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.desc)}</p></div>
      <span class="more-arrow">→</span>
    </a>`);
  const mediaCards = (lab.media_links || []).map((item) => `<a class="more-card media-link" href="${item.url}" target="_blank" rel="noopener">
      <span class="more-icon">${item.type === 'official_video' ? '🎥' : '📰'}</span>
      <div><span class="more-label">${escapeHtml(item.label || '公式記事')}</span><strong>${escapeHtml(item.title)}</strong><p>東洋大学公式サイトの記事で、先生の研究や専門分野を読む。</p></div>
      <span class="more-arrow">→</span>
    </a>`);
  return [...linkCards, ...mediaCards].join('');
}

function openModal(lab) {
  const isFav = favorites.has(lab.id);
  const coursesSection = (lab.courses || []).length ? `
    <section class="detail-section">
      <div class="detail-section-head">
        <span class="eyebrow">COURSES</span>
        <h3>この先生から学べる授業</h3>
        <p>年度によって担当科目は変わります。詳細は公式シラバスで確認してください。</p>
      </div>
      <div class="course-grid">${courseCards(lab.courses || [])}</div>
      <p class="syllabus-note"><a href="${syllabusUrl}" target="_blank" rel="noopener">公式シラバスを見る →</a></p>
    </section>` : '';
  qs('#modal-content').innerHTML = `
    <div class="modal-title ${deptClass(lab.department)}">
      <span class="eyebrow">OPEN THE LAB DOOR</span>
      <span class="modal-dept">${escapeHtml(lab.department)}</span>
      <h2>${escapeHtml(displayLabName(lab))}</h2>
      <p class="pi">${escapeHtml(lab.pi_name)} ${escapeHtml(lab.position)}</p>
    </div>
    <p class="modal-catch">${escapeHtml(lab.summary)}</p>
    <button class="modal-favorite favorite-button ${isFav ? 'active' : ''}">${isFav ? '♥ お気に入りから外す' : '♡ お気に入りに追加'}</button>
    <section class="hero-question"><span>QUESTION</span><h3>${escapeHtml(lab.question)}</h3></section>
    <div class="detail-grid">
      <section class="detail-box full"><h3>この研究室では</h3><p>${escapeHtml(lab.description)}</p></section>
      <section class="detail-box"><h3>主な研究方法</h3><ul>${lab.methods.map((method) => `<li>${escapeHtml(method)}</li>`).join('')}</ul></section>
      <section class="detail-box"><h3>こんな人におすすめ</h3><ul>${lab.recommended_for.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
      <section class="detail-box full"><h3>大区分・キーワード</h3><div class="keywords">${displayKeywords(lab).map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`).join('')}</div></section>
    </div>
    ${coursesSection}
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
  applyDepartmentTheme(qs('#modal-content .modal-title'), lab.department);
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
