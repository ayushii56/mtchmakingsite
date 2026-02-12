import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1️⃣ Fetch eligible ticket users
  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id, email")
    .eq("booking_verified", true)
    .eq("questions_done", true)
    .eq("is_matched", false);

  if (userError || !users || users.length < 2) {
    return new Response("Not enough users to match.");
  }

  const userIds = users.map(u => u.id);

  // 2️⃣ Fetch answers
  const { data: answers } = await supabase
    .from("answers")
    .select("user_id, question_index, answer")
    .in("user_id", userIds);

  const answersMap: Record<string, number[]> = {};

  answers?.forEach(row => {
    if (!answersMap[row.user_id]) answersMap[row.user_id] = [];
    answersMap[row.user_id][row.question_index] = row.answer;
  });

  // 3️⃣ Compatibility
  const weights = [3,3,3,2,2,2,3,3,3,4,4,4,4,4,4,5,5,5,2,2,2];
  const maxScore = weights.reduce((a,b)=>a+b,0);

  function compatibility(a:number[], b:number[]) {
    let score = 0;
    for (let i=0;i<21;i++){
      if(a[i]===b[i]) score+=weights[i];
    }
    return score/maxScore;
  }

  const pairs:any[] = [];

  for (let i=0;i<users.length;i++){
    for (let j=i+1;j<users.length;j++){

      const u1 = users[i];
      const u2 = users[j];

      if (!answersMap[u1.id] || !answersMap[u2.id]) continue;

      const score = compatibility(
        answersMap[u1.id],
        answersMap[u2.id]
      );

      pairs.push({ u1, u2, score });
    }
  }

  pairs.sort((a,b)=>b.score-a.score);

  const matched = new Set<string>();

  for (const pair of pairs){

    if (matched.has(pair.u1.id) || matched.has(pair.u2.id))
      continue;

    // insert match
    await supabase.from("matches").insert({
      user_a_id: pair.u1.id,
      user_b_id: pair.u2.id,
      compatibility_score: pair.score
    });

    // lock users
    await supabase.from("users")
      .update({ is_matched: true })
      .in("id", [pair.u1.id, pair.u2.id]);

    matched.add(pair.u1.id);
    matched.add(pair.u2.id);

    // send emails
    await sendEmail(pair.u1.email);
    await sendEmail(pair.u2.email);
  }

  return new Response("Batch matching complete.");
});

async function sendEmail(email:string){

  await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{
      "Authorization":`Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      from:"Tug of Love <noreply@yourdomain.com>",
      to:email,
      subject:"Your Match is Here 💖",
      html:`
        <h2>Your match has been revealed 💘</h2>
        <p>Log into Tug of Love to see who you’ve been paired with.</p>
      `
    })
  });
}
