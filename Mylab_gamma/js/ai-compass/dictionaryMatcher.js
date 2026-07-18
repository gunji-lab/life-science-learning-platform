(function () {
  const namespace = window.MyLabAICompass = window.MyLabAICompass || {};

  function matchGeneralDictionary(input, dictionary = []) {
    const normalizedInput = namespace.normalizeText(input);
    const detectedTerms = [];
    const conceptScores = new Map();
    const matchedNormalForms = new Set();

    dictionary.forEach((entry) => {
      const candidates = [entry.keyword, ...(entry.aliases || [])].filter(Boolean);
      const hit = candidates.find((candidate) => normalizedInput.includes(namespace.normalizeText(candidate)));
      if (!hit) return;
      detectedTerms.push({ keyword: entry.keyword, matched: hit, concepts: entry.concepts || [] });
      candidates.forEach((candidate) => matchedNormalForms.add(namespace.normalizeText(candidate)));
      (entry.concepts || []).forEach((concept) => {
        conceptScores.set(concept, (conceptScores.get(concept) || 0) + 3);
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

  namespace.matchGeneralDictionary = matchGeneralDictionary;
}());
