// Vercel serverless function. Key stays on the server (set GEMINI_API_KEY in Vercel).
// Get a free key at https://aistudio.google.com/apikey
const MODEL = "gemini-2.5-flash-lite"; // fast + free tier. If Google renames it, check AI Studio's model list.

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { business, language, tone, highlights } = req.body || {};
  if (!business || !language || !tone) return res.status(400).json({ error: "Missing fields" });

  const prompt = `Write one Google review for "${business}".
Language: ${language}. Tone: ${tone}.
Mention these things naturally: ${(highlights || []).join(", ") || "a good overall experience"}.
Rules: 2-3 sentences, first person, sounds like a real customer, no emojis, no hashtags, no quotes around it.
Do not invent prices, names, or facts. Output only the review text.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1, maxOutputTokens: 200 },
        }),
      }
    );
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return res.status(502).json({ error: "No review returned" });
    res.status(200).json({ review: text });
  } catch (e) {
    res.status(500).json({ error: "Generation failed" });
  }
};
