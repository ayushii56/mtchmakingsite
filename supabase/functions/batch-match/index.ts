import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ==============================
  // 1️⃣ Fetch Eligible Users
  // ==============================

  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id, email, gender_identity, sexual_orientation")
    .eq("questions_done", true)
    .eq("is_matched", false);

  if (userError || !users || users.length < 2) {
    return new Response("Not enough users to match.");
  }

  const userIds = users.map(u => u.id);

  // ==============================
  // 2️⃣ Fetch Answers
  // ==============================

  const { data: answers } = await supabase
    .from("answers")
    .select("user_id, question_index, answer")
    .in("user_id", userIds);

  const answersMap: Record<string, number[]> = {};

  answers?.forEach(row => {
    if (!answersMap[row.user_id]) answersMap[row.user_id] = [];
    answersMap[row.user_id][row.question_index] = row.answer;
  });

  // ==============================
  // 3️⃣ Hard Compatibility Logic
  // ==============================

  type Gender = "male" | "female" | "non-binary";
  type Orientation = "straight" | "gay" | "lesbian" | "bisex" | "other";

  function getAttractionSet(gender: Gender, orientation: Orientation): Gender[] {

    if (orientation === "straight") {
      if (gender === "male") return ["female"];
      if (gender === "female") return ["male"];
      if (gender === "non-binary") return ["male", "female"];
    }

    if (orientation === "gay") {
      if (gender === "male") return ["male"];
      if (gender === "female") return ["female"];
      if (gender === "non-binary") return ["non-binary"];
    }

    if (orientation === "lesbian") {
      return ["female"];
    }

    if (orientation === "bisex" || orientation === "other") {
      return ["male", "female", "non-binary"];
    }

    return [];
  }

  function isCompatible(a: any, b: any): boolean {
    const aAttracted = getAttractionSet(a.gender_identity, a.sexual_orientation);
    const bAttracted = getAttractionSet(b.gender_identity, b.sexual_orientation);

    return (
      aAttracted.includes(b.gender_identity) &&
      bAttracted.includes(a.gender_identity)
    );
  }

  // ==============================
  // 4️⃣ Weighted Similarity
  // ==============================

  const weights = [3,3,3,2,2,2,3,3,3,4,4,4,4,4,4,5,5,5,2,2,2];
  const maxScore = weights.reduce((a,b)=>a+b,0);

  function computeSimilarity(a:number[], b:number[]) {
    let score = 0;
    for (let i=0;i<weights.length;i++){
      if(a[i] === b[i]) score += weights[i];
    }
    return score / maxScore;
  }

  // ==============================
  // 5️⃣ Build Top-5 Preference Map
  // ==============================

  const preferenceMap: Record<string, { id:string, score:number }[]> = {};

  for (const A of users) {

    preferenceMap[A.id] = [];

    for (const B of users) {

      if (A.id === B.id) continue;

      if (!isCompatible(A, B)) continue;

      if (!answersMap[A.id] || !answersMap[B.id]) continue;

      const score = computeSimilarity(
        answersMap[A.id],
        answersMap[B.id]
      );

      preferenceMap[A.id].push({ id: B.id, score });
    }

    // Sort descending
    preferenceMap[A.id].sort((a,b)=>b.score - a.score);

    // Keep Top 5
    preferenceMap[A.id] = preferenceMap[A.id].slice(0,5);
  }

  // ==============================
  // 6️⃣ Mutual Top-5 Stable Matching
  // ==============================

  function isMutual(a:string, b:string){
    return (
      preferenceMap[a].some(p=>p.id===b) &&
      preferenceMap[b].some(p=>p.id===a)
    );
  }

  const unmatched = new Set(users.map(u=>u.id));
  const matches: Record<string,string> = {};
  const proposalIndex: Record<string,number> = {};

  users.forEach(u=>proposalIndex[u.id]=0);

  while(true){

    const proposer = Array.from(unmatched).find(
      id => proposalIndex[id] < preferenceMap[id].length
    );

    if(!proposer) break;

    const candidate = preferenceMap[proposer][proposalIndex[proposer]].id;
    proposalIndex[proposer]++;

    if(!isMutual(proposer,candidate)) continue;

    if(!matches[candidate]){
      matches[proposer] = candidate;
      matches[candidate] = proposer;
      unmatched.delete(proposer);
      unmatched.delete(candidate);
    } else {

      const current = matches[candidate];
      const prefs = preferenceMap[candidate];

      const prefersNew =
        prefs.findIndex(p=>p.id===proposer) <
        prefs.findIndex(p=>p.id===current);

      if(prefersNew){
        matches[proposer] = candidate;
        matches[candidate] = proposer;
        unmatched.delete(proposer);
        unmatched.add(current);
        delete matches[current];
      }
    }
  }

  // ==============================
  // 7️⃣ Save Matches + Email
  // ==============================

  for (const [a,b] of Object.entries(matches)) {

    if (a < b) {

      const score = computeSimilarity(
        answersMap[a],
        answersMap[b]
      );

      await supabase.from("matches").insert({
        user_a_id: a,
        user_b_id: b,
        compatibility_score: score
      });

      await supabase.from("users")
        .update({ is_matched: true })
        .in("id",[a,b]);

      await sendEmail(supabase, a, b);
      await sendEmail(supabase, b, a);
    }
  }

  return new Response("Batch matching complete.");
});


// ==============================
// EMAIL FUNCTION
// ==============================

async function sendEmail(supabase:any, userId:string, matchId:string){

  const { data: user } = await supabase
    .from("users")
    .select("email, emoji")
    .eq("id", userId)
    .single();

  const { data: match } = await supabase
    .from("users")
    .select("emoji")
    .eq("id", matchId)
    .single();

  await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{
      "Authorization":`Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      from:"Tug of Love <exclusivpresents@gmail.com>",
      to:user.email,
      subject:"Your Match is Here 💖",
      html:`
        <h2>Your match has been revealed 💘</h2>
        <p>Your emoji: <b>${user.emoji}</b></p>
        <p>Your match's emoji: <b>${match.emoji}</b></p>
        <p>See you at Raasta Khar ✨</p>
      `
    })
  });
}
