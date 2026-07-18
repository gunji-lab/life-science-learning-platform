(function () {
  const namespace = window.MyLabAICompass = window.MyLabAICompass || {};
  const STOPWORDS = new Set([
    'です',
    'ます',
    'して',
    'したい',
    '知りたい',
    '興味',
    '研究',
    '大学',
    '生命科学',
    'について',
    'どんな',
    'あります',
    'あり',
    'なり',
    'つな',
    '気になる',
    '好き',
    'つながる',
    'つながり',
    '生命科学部',
    '研究テーマ',
  ]);

  function extractUnknownWords(input, matchedNormalForms = new Set()) {
    const rough = String(input)
      .normalize('NFKC')
      .replace(/[、。,.!?！？「」『』（）()［］\[\]【】・/／\\]/g, ' ')
      .split(/\s+/)
      .flatMap((chunk) => chunk.split(/(?:が|を|に|へ|で|と|の|は|も|や|って|です|ます|した|たい|好き|興味|気になる|面白い|面白そう|知りたい|ありますか)/g))
      .map((term) => term.trim())
      .filter((term) => term.length >= 2);
    const seen = new Set();
    return rough
      .filter((term) => {
        const normalized = namespace.normalizeText(term);
        if (!normalized || normalized.length < 2 || seen.has(normalized) || STOPWORDS.has(normalized)) return false;
        if ([...matchedNormalForms].some((form) => form && (normalized.includes(form) || form.includes(normalized)))) return false;
        seen.add(normalized);
        return true;
      })
      .slice(0, 8);
  }

  namespace.extractUnknownWords = extractUnknownWords;
}());
