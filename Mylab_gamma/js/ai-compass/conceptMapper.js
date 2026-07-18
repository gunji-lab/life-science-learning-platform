(function () {
  const namespace = window.MyLabAICompass = window.MyLabAICompass || {};

  function mapConceptsToResearchTags(conceptScores = new Map(), bridge = []) {
    const bridgeByConcept = new Map(bridge.map((entry) => [entry.concept, entry]));
    const researchTagScores = new Map();
    const bridgeHits = [];

    conceptScores.forEach((conceptScore, concept) => {
      const bridgeEntry = bridgeByConcept.get(concept);
      if (!bridgeEntry) return;
      (bridgeEntry.research_tags || []).forEach((item) => {
        const weight = (item.weight || 1) * conceptScore;
        researchTagScores.set(item.tag, (researchTagScores.get(item.tag) || 0) + weight);
        bridgeHits.push({ concept, tag: item.tag, weight });
      });
    });

    return {
      bridgeHits,
      researchTagScores,
      researchTags: [...researchTagScores.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
        .map(([tag, score]) => ({ tag, score }))
    };
  }

  namespace.mapConceptsToResearchTags = mapConceptsToResearchTags;
}());
