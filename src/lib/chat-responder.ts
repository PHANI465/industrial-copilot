import type { DocRecord } from "./types";
import { getDocuments, getAssets } from "./data-loader";

const STOP_WORDS = new Set([
  "the", "is", "at", "which", "on", "a", "an", "and", "or", "but", "in",
  "with", "to", "for", "of", "not", "no", "can", "do", "does", "did",
  "will", "would", "should", "could", "what", "why", "how", "when", "where",
  "who", "my", "me", "i", "it", "its", "this", "that", "be", "are", "was",
  "were", "been", "being", "have", "has", "had", "having", "about", "from",
  "just", "also", "more", "some", "any", "all", "each", "every", "get",
  "tell", "show", "give",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

let _idfCache: Map<string, number> | null = null;
let _docTokensCache: Map<string, string[]> | null = null;

function buildCorpusStats() {
  if (_idfCache && _docTokensCache) return;

  const docs = getDocuments();
  const totalDocs = docs.length;
  const docFreq = new Map<string, number>();
  const docTokens = new Map<string, string[]>();

  for (const doc of docs) {
    const allText = `${doc.title || ""} ${doc.content || ""}`;
    const tokens = tokenize(allText);
    const unique = new Set(tokens);
    docTokens.set(doc.doc_id, tokens);

    for (const token of unique) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, df] of docFreq) {
    idf.set(term, Math.log((totalDocs + 1) / (df + 1)) + 1);
  }

  _idfCache = idf;
  _docTokensCache = docTokens;
}

function tfidfScore(doc: DocRecord, queryTokens: string[], assetId?: string): number {
  buildCorpusStats();
  const idf = _idfCache!;
  const docTokensList = _docTokensCache!.get(doc.doc_id) || [];

  const termFreq = new Map<string, number>();
  for (const token of docTokensList) {
    termFreq.set(token, (termFreq.get(token) || 0) + 1);
  }
  const maxTf = Math.max(...termFreq.values(), 1);

  const titleTokens = new Set(tokenize(doc.title || ""));

  let score = 0;
  for (const qt of queryTokens) {
    const tf = (termFreq.get(qt) || 0) / maxTf;
    const idfVal = idf.get(qt) || 1;
    score += tf * idfVal;

    if (titleTokens.has(qt)) score += idfVal * 1.5;
  }

  if (assetId && doc.asset_id === assetId) score *= 1.8;

  const queryAssetTags = queryTokens.filter((t) => /^[a-z]-\d{3}$/i.test(t));
  for (const tag of queryAssetTags) {
    const tagUpper = tag.toUpperCase();
    if (doc.asset_id?.includes(tagUpper) || doc.title?.includes(tagUpper)) {
      score *= 1.5;
    }
  }

  return score;
}

function extractBestParagraph(content: string, queryTokens: string[]): string {
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 30);
  if (paragraphs.length === 0) return content.slice(0, 500);

  let bestPara = paragraphs[0];
  let bestScore = 0;

  for (const para of paragraphs) {
    const paraLower = para.toLowerCase();
    let score = 0;
    for (const token of queryTokens) {
      const regex = new RegExp(`\\b${token}`, "gi");
      const matches = paraLower.match(regex);
      if (matches) score += matches.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestPara = para;
    }
  }

  if (bestPara.length > 600) {
    bestPara = bestPara.slice(0, 600) + "...";
  }

  return bestPara.trim();
}

function resolveAssetId(tag: string): string | undefined {
  const assets = getAssets();
  return assets.find((a) => a.tag === tag)?.asset_id;
}

export function getRelevantDocContext(query: string, assetTag?: string): { context: string; sources: string[] } {
  const docs = getDocuments();
  const queryTokens = tokenize(query);
  const assetId = assetTag ? resolveAssetId(assetTag) : undefined;

  const scored = docs
    .map((doc) => ({ doc, score: tfidfScore(doc, queryTokens, assetId) }))
    .sort((a, b) => b.score - a.score);

  const minScore = 0.01;
  const relevant = scored.filter((s) => s.score > minScore);

  if (relevant.length === 0) {
    const fallback = assetId
      ? docs.filter((d) => d.asset_id === assetId)
      : docs.slice(0, 4);
    const snippets = fallback.map(
      (d) => `[${d.doc_id}] ${d.title} (${d.doc_type}):\n${(d.content || "").slice(0, 300)}`
    );
    return {
      context: snippets.join("\n\n---\n\n"),
      sources: fallback.map((d) => `${d.doc_id}: ${d.title}`),
    };
  }

  const topDocs = relevant.slice(0, 4);
  const parts = topDocs.map(({ doc }) => {
    const excerpt = extractBestParagraph(doc.content || "", queryTokens);
    return `[${doc.doc_id}] ${doc.title} (${doc.doc_type}):\n${excerpt}`;
  });

  return {
    context: parts.join("\n\n---\n\n"),
    sources: topDocs.map((s) => `${s.doc.doc_id}: ${s.doc.title}`),
  };
}

export function respondToChat(
  query: string,
  assetTag?: string
): { response: string; sources: string[] } {
  const docs = getDocuments();
  const queryTokens = tokenize(query);
  const assetId = assetTag ? resolveAssetId(assetTag) : undefined;

  if (queryTokens.length === 0) {
    return {
      response:
        "I can help you with questions about equipment operations, maintenance procedures, and troubleshooting. Try asking about pressure, temperature, vibration, or specific equipment like V-101, P-101, or E-301.",
      sources: [],
    };
  }

  const scored = docs
    .map((doc) => ({ doc, score: tfidfScore(doc, queryTokens, assetId) }))
    .filter((s) => s.score > 0.01)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      response: `I don't have specific documentation matching your query. Try mentioning equipment tags (V-101, P-101, K-201, E-301) or topics like pressure, vibration, startup, shutdown, or maintenance.`,
      sources: [],
    };
  }

  const topDocs = scored.slice(0, 3);
  const parts: string[] = [];

  for (const { doc } of topDocs) {
    const excerpt = extractBestParagraph(doc.content || "", queryTokens);
    parts.push(
      `**From ${doc.title}** (${doc.doc_id}):\n${excerpt}`
    );
  }

  const response = parts.join("\n\n---\n\n");
  const sources = topDocs.map((s) => `${s.doc.doc_id}: ${s.doc.title}`);

  return { response, sources };
}
