(function () {
  const namespace = window.MyLabAICompass = window.MyLabAICompass || {};

  function scoreLabs({ input = '', dictionaryResult, bridgeResult, labResearchTags = [], labs = [] }) {
    const inputTerms = namespace.extractInputTerms(input);
    const normalizedInput = namespace.normalizeText(input);
    const labsById = new Map(labs.map((lab) => [lab.id, lab]));

    return labResearchTags
      .map((record) => {
        const lab = labsById.get(record.lab_id);
        if (!lab) return null;
        const matched = new Map();
        let score = 0;

        function addDirectTermScore(term, baseWeight, sourceLabel) {
          const normalizedTerm = namespace.normalizeText(term);
          if (!normalizedTerm) return;
          const exactHit = inputTerms.has(normalizedTerm);
          const containsHit = canUseSubstringMatch(normalizedTerm) && normalizedInput.includes(normalizedTerm);
          if (!exactHit && !containsHit) return;
          const directWeight = baseWeight * directTermMultiplier(normalizedTerm, exactHit);
          score += directWeight;
          matched.set(sourceLabel || term, (matched.get(sourceLabel || term) || 0) + directWeight);
        }

        (record.keywords || []).forEach((keyword) => {
          const normalizedKeyword = namespace.normalizeText(keyword);
          if (!normalizedKeyword) return;
          addDirectTermScore(keyword, 3, keyword);
        });

        (record.search_terms || []).forEach((item) => {
          const term = typeof item === 'string' ? item : item.term;
          const weight = typeof item === 'string' ? 3 : item.weight || 3;
          addDirectTermScore(term, weight, term);
        });

        (record.research_tags || []).forEach((tagItem) => {
          const tag = tagItem.tag;
          const normalizedTag = namespace.normalizeText(tag);
          const labWeight = tagItem.weight || 1;
          const exactTagHit = inputTerms.has(normalizedTag);
          const containsTagHit = canUseSubstringMatch(normalizedTag) && normalizedInput.includes(normalizedTag);
          if (exactTagHit || containsTagHit) {
            const directWeight = (5 + labWeight) * directTermMultiplier(normalizedTag, exactTagHit);
            score += directWeight;
            matched.set(tag, (matched.get(tag) || 0) + directWeight);
            return;
          }
          const researchScore = bridgeResult.researchTagScores.get(tag) || bridgeResult.researchTagScores.get(normalizedTag) || 0;
          if (researchScore) {
            const bridgeWeight = researchScore * labWeight;
            score += bridgeWeight;
            matched.set(tag, (matched.get(tag) || 0) + bridgeWeight);
          }
          const conceptScore = dictionaryResult.conceptScores.get(tag) || 0;
          if (conceptScore) {
            const conceptWeight = conceptScore * Math.max(1, labWeight * 0.6);
            score += conceptWeight;
            matched.set(tag, (matched.get(tag) || 0) + conceptWeight);
          }
        });

        const matchedTags = [...matched.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
          .map(([tag]) => tag);
        return { lab, score, matched: matchedTags };
      })
      .filter((item) => item && item.score > 0)
      .sort((a, b) => b.score - a.score || b.matched.length - a.matched.length || a.lab.lab_name.localeCompare(b.lab.lab_name, 'ja'))
      .slice(0, 8);
  }

  function canUseSubstringMatch(normalizedTerm) {
    return normalizedTerm === 'がん' || normalizedTerm.length > 2 || !/^[ぁ-んァ-ヶー]+$/.test(normalizedTerm);
  }

  function directTermMultiplier(normalizedTerm, exactHit) {
    if (isSpecificTerm(normalizedTerm)) return exactHit ? 25 : 12;
    return exactHit ? 4 : 2;
  }

  function isSpecificTerm(normalizedTerm) {
    const broadTerms = new Set([
      '動物', '植物', '微生物', '細胞', '健康', '医療', '環境', '材料',
      '実験', '解析', '観察', '測定', '研究', '生物', '生命科学'
    ]);
    if (broadTerms.has(normalizedTerm)) return false;
    if (normalizedTerm === 'がん') return true;
    if (/^[a-z0-9]+$/i.test(normalizedTerm)) return normalizedTerm.length >= 3;
    return normalizedTerm.length >= 4 || /[ァ-ヶー]{3,}/.test(normalizedTerm);
  }

  namespace.scoreLabs = scoreLabs;
}());
