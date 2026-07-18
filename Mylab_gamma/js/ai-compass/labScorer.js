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

        (record.keywords || []).forEach((keyword) => {
          const normalizedKeyword = namespace.normalizeText(keyword);
          if (!normalizedKeyword) return;
          if (inputTerms.has(normalizedKeyword) || normalizedInput.includes(normalizedKeyword)) {
            score += 5;
            matched.set(keyword, (matched.get(keyword) || 0) + 5);
          }
        });

        (record.research_tags || []).forEach((tagItem) => {
          const tag = tagItem.tag;
          const normalizedTag = namespace.normalizeText(tag);
          const labWeight = tagItem.weight || 1;
          if (inputTerms.has(normalizedTag) || normalizedInput.includes(normalizedTag)) {
            const directWeight = 5 + labWeight;
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

  namespace.scoreLabs = scoreLabs;
}());
