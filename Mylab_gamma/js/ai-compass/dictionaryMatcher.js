(function () {
  const namespace = window.MyLabAICompass = window.MyLabAICompass || {};

  function matchGeneralDictionary(input, dictionary = []) {
    const normalizedInput = namespace.normalizeText(input);
    const inputTerms = namespace.extractInputTerms(input);
    const detectedTerms = [];
    const conceptScores = new Map();
    const matchedNormalForms = new Set();

    dictionary.forEach((entry) => {
      const candidates = [entry.keyword, ...(entry.aliases || [])].filter(Boolean);
      const hit = candidates.find((candidate) => matchesCandidate(normalizedInput, inputTerms, candidate));
      if (!hit) return;
      detectedTerms.push({ keyword: entry.keyword, matched: hit, concepts: entry.concepts || [] });
      candidates.forEach((candidate) => matchedNormalForms.add(namespace.normalizeText(candidate)));
      const weight = entry.weight || 3;
      (entry.concepts || []).forEach((concept) => {
        conceptScores.set(concept, (conceptScores.get(concept) || 0) + weight);
      });
    });

    return {
      detectedTerms,
      conceptScores,
      concepts: [...conceptScores.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
        .map(([concept, score]) => ({ concept, score })),
      unknownTerms: namespace.extractUnknownWords(input, matchedNormalForms)
    };
  }

  function matchesCandidate(normalizedInput, inputTerms, candidate) {
    const normalizedCandidate = namespace.normalizeText(candidate);
    if (!normalizedCandidate) return false;
    const exactHit = inputTerms.has(normalizedCandidate);
    if (exactHit) return true;
    if (isShortKanaTerm(normalizedCandidate) && normalizedCandidate !== 'がん') return false;
    return normalizedInput.includes(normalizedCandidate);
  }

  function isShortKanaTerm(value) {
    return value.length <= 2 && /^[ぁ-んァ-ヶー]+$/.test(value);
  }

  namespace.matchGeneralDictionary = matchGeneralDictionary;
}());
