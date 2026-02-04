// assets/js/match.js
console.log("match.js loaded");

const QUESTION_WEIGHTS = [
  3,3,3,  // energy
  2,2,2,  // vibecheck
  3,3,3,  // habits
  4,4,4,  // show up
  4,4,4,  // real talk
  5,5,5,  // long game
  2,2,2   // just saying
];

const MAX_SCORE = QUESTION_WEIGHTS.reduce((a, b) => a + b, 0);
const TOP_K = 5;

function computeCompatibility(a, b) {
  let score = 0;
  for (let i = 0; i < 21; i++) {
    if (a[i] === b[i]) score += QUESTION_WEIGHTS[i];
  }
  return score / MAX_SCORE;
}

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;
  if (!supabase) {
    alert("Supabase not loaded");
    return;
  }

  // ---------------- USER ----------------
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Not logged in");
    return;
  }

  // -------- CHECK EXISTING MATCH --------
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .single();

  if (existingMatch) {
    await renderMatch(existingMatch, user.id);
    return;
  }

  // ---------- FETCH VALID PAIRS ----------
  const { data: pairs, error: pairError } = await supabase
    .from("valid_pairs")
    .select("*")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  if (pairError || !pairs || pairs.length === 0) {
    alert("No compatible matches found 💔");
    return;
  }

  // ---------- FETCH ANSWERS ----------
  const userIds = new Set();
  pairs.forEach(p => {
    userIds.add(p.user_a);
    userIds.add(p.user_b);
  });

  const { data: answersRows, error: ansError } = await supabase
    .from("answers")
    .select("user_id, question_index, answer")
    .in("user_id", Array.from(userIds));

  if (ansError || !answersRows) {
    alert("Failed to load answers");
    return;
  }

  const answersMap = {};
  answersRows.forEach(r => {
    if (!answersMap[r.user_id]) answersMap[r.user_id] = [];
    answersMap[r.user_id][r.question_index] = r.answer;
  });

  // ---------- BUILD CANDIDATES ----------
  const candidates = [];

  pairs.forEach(p => {
    const a = p.user_a;
    const b = p.user_b;

    if (!answersMap[a] || !answersMap[b]) return;

    const score = computeCompatibility(
      answersMap[a],
      answersMap[b]
    );

    candidates.push({ a, b, score });
  });

  candidates.sort((x, y) => y.score - x.score);

  // ---------- BUILD PREFERENCES ----------
  const preferences = {};

  candidates.forEach(({ a, b, score }) => {
    if (!preferences[a]) preferences[a] = [];
    if (!preferences[b]) preferences[b] = [];

    preferences[a].push({ id: b, score });
    preferences[b].push({ id: a, score });
  });

  Object.keys(preferences).forEach(uid => {
    preferences[uid] = preferences[uid]
      .sort((x, y) => y.score - x.score)
      .slice(0, TOP_K);
  });

  // ---------- STABLE MATCHING ----------
  let chosen = null;

  for (const { a, b, score } of candidates) {
    const aTop = preferences[a]?.some(p => p.id === b);
    const bTop = preferences[b]?.some(p => p.id === a);

    if (aTop && bTop) {
      chosen = { a, b, score };
      break;
    }
  }

  if (!chosen) {
    alert("No mutual top match found 💔");
    return;
  }

  // ---------- SAVE MATCH (REAL FIX) ----------
  const { data: savedMatch, error: matchError } = await supabase
    .from("matches")
    .insert({
      user_a_id: chosen.a,
      user_b_id: chosen.b,
      compatibility_score: chosen.score
    })
    .select()
    .single();

  if (matchError) {
    console.error("Match save failed:", matchError);
    alert("Failed to save match");
    return;
  }

  await renderMatch(savedMatch, user.id);
});

// ================= RENDER MATCH =================
async function renderMatch(match, currentUserId) {
  const supabase = window.supabaseClient;

  const partnerId =
    match.user_a_id === currentUserId
      ? match.user_b_id
      : match.user_a_id;

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, emoji")
    .in("id", [currentUserId, partnerId]);

  if (error || !users) {
    alert("Failed to load match details");
    return;
  }

  const you = users.find(u => u.id === currentUserId);
  const partner = users.find(u => u.id === partnerId);

  document.getElementById("yourName").textContent = you.name;
  document.getElementById("yourEmoji").textContent = you.emoji;

  document.getElementById("partnerName").textContent = partner.name;
  document.getElementById("partnerEmoji").textContent = partner.emoji;

  document.getElementById("compatibilityScore").textContent =
    Math.round(match.compatibility_score * 100) + "%";

  const quotes = [
    "Some connections don’t scream. They stay.",
    "It wasn’t luck. It was alignment.",
    "Right energy, right time.",
    "Two people. One frequency.",
    "This felt easy for a reason."
  ];

  document.getElementById("matchQuote").textContent =
    quotes[Math.floor(Math.random() * quotes.length)];
}
