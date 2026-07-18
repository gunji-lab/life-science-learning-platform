(function () {
  const namespace = window.MyLabAICompass = window.MyLabAICompass || {};

  function normalizeText(value = '') {
    return String(value)
      .normalize('NFKC')
      .toLowerCase()
      .replace(/癌|ガン/g, 'がん')
      .replace(/[、。,.!?！？「」『』（）()［］\[\]【】・/／\\\s]/g, '');
  }

  function extractInputTerms(input = '') {
    const normalizedWhole = normalizeText(input);
    const roughTerms = String(input)
      .normalize('NFKC')
      .replace(/[、。,.!?！？「」『』（）()［］\[\]【】・/／\\]/g, ' ')
      .split(/\s+/)
      .flatMap((chunk) => chunk.split(/(?:が(?!ん)|を|に|へ|で|と|の|は|も|や|って|です|ます|した|したい|たい|好き|興味|気になる|面白い|面白そう|知りたい|ありますか|について|から|まで)/g))
      .map(normalizeText)
      .filter((term) => term.length >= 2);
    return new Set([normalizedWhole, ...roughTerms]);
  }

  namespace.normalizeText = normalizeText;
  namespace.extractInputTerms = extractInputTerms;
}());
