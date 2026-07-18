(function () {
  const namespace = window.MyLabAICompass = window.MyLabAICompass || {};

  function summarizeReason({ detectedTerms = [], concepts = [], researchTags = [], matched = [] }) {
    return {
      detectedTerms: detectedTerms.map((item) => item.matched || item.keyword).slice(0, 5),
      concepts: concepts.map((item) => item.concept).slice(0, 5),
      researchTags: researchTags.map((item) => item.tag).slice(0, 5),
      matchedTags: matched.slice(0, 5)
    };
  }

  namespace.summarizeReason = summarizeReason;
}());
