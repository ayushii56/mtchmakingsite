// // // // assets/js/finding.js

// // // document.addEventListener("DOMContentLoaded", async () => {
// // //   const supabase = window.supabaseClient;

// // //   // 1️⃣ Get logged-in user
// // //   const {
// // //     data: { user },
// // //     error: authError
// // //   } = await supabase.auth.getUser();

// // //   if (authError || !user) {
// // //     alert("User not authenticated");
// // //     return;
// // //   }

// // //   // 2️⃣ Check if emoji already assigned
// // //   const { data: existingUser, error: userError } = await supabase
// // //     .from("users")
// // //     .select("emoji")
// // //     .eq("id", user.id)
// // //     .single();

// // //   if (userError) {
// // //     console.error(userError);
// // //     return;
// // //   }

// // //   if (existingUser.emoji) {
// // //     // Emoji already assigned → move on
// // //     setTimeout(() => {
// // //       window.location.href = "result.html";
// // //     }, 2000);
// // //     return;
// // //   }

// // //   // 3️⃣ Fetch one unassigned emoji
// // //   const { data: emojiRow, error: emojiError } = await supabase
// // //     .from("emojis")
// // //     .select("*")
// // //     .eq("is_assigned", false)
// // //     .limit(1)
// // //     .single();

// // //   if (emojiError || !emojiRow) {
// // //     alert("No emojis available 😢");
// // //     return;
// // //   }

// // //   // 4️⃣ Assign emoji atomically
// // //   const { error: assignError } = await supabase
// // //     .from("emojis")
// // //     .update({
// // //       is_assigned: true,
// // //       assigned_to_user_id: user.id
// // //     })
// // //     .eq("id", emojiRow.id);

// // //   if (assignError) {
// // //     console.error(assignError);
// // //     alert("Emoji assignment failed");
// // //     return;
// // //   }

// // //   // 5️⃣ Save emoji to user
// // //   const { error: saveError } = await supabase
// // //     .from("users")
// // //     .update({
// // //       emoji: emojiRow.emoji
// // //     })
// // //     .eq("id", user.id);

// // //   if (saveError) {
// // //     console.error(saveError);
// // //     return;
// // //   }

// // //   // 6️⃣ Move forward
// // //   setTimeout(() => {
// // //     window.location.href = "result.html";
// // //   }, 2000);
// // // });

// // document.addEventListener("DOMContentLoaded", async () => {

// //   const supabase = window.supabaseClient;

// //   const { data: { user } } = await supabase.auth.getUser();
// //   if (!user) return;

// //   // 1️⃣ Check if already matched
// //   const { data: existingMatch } = await supabase
// //     .from("matches")
// //     .select("*")
// //     .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
// //     .single();

// //   if (existingMatch) {
// //     window.location.href = "result.html";
// //     return;
// //   }

// //   // 2️⃣ Fetch all unmatched walkins
// //   const { data: candidates } = await supabase
// //     .from("users")
// //     .select("*")
// //     .eq("is_matched", false)
// //     .eq("user_type", "walkin")
// //     .neq("id", user.id);

// //   if (!candidates || candidates.length === 0) {
// //     await supabase.from("users")
// //       .update({ is_waitlisted: true })
// //       .eq("id", user.id);

// //     alert("You're on the waitlist 💫 Stay nearby.");
// //     return;
// //   }

// //   // 3️⃣ Fetch answers for similarity
// //   const { data: answers } = await supabase
// //     .from("answers")
// //     .select("*")
// //     .in("user_id", [user.id, ...candidates.map(c => c.id)]);

// //   const answersMap = {};
// //   answers.forEach(r => {
// //     if (!answersMap[r.user_id]) answersMap[r.user_id] = [];
// //     answersMap[r.user_id][r.question_index] = r.answer;
// //   });

// //   function computeCompatibility(a, b) {
// //     const weights = [3,3,3,2,2,2,3,3,3,4,4,4,4,4,4,5,5,5,2,2,2];
// //     const max = weights.reduce((x,y)=>x+y,0);
// //     let score = 0;
// //     for (let i=0;i<21;i++){
// //       if(a[i]===b[i]) score+=weights[i];
// //     }
// //     return score/max;
// //   }

// //   let best = null;
// //   let bestScore = 0;

// //   for (let c of candidates) {
// //     const score = computeCompatibility(
// //       answersMap[user.id],
// //       answersMap[c.id]
// //     );
// //     if (score > bestScore) {
// //       bestScore = score;
// //       best = c;
// //     }
// //   }

// //   // 4️⃣ Threshold 70%
// //   if (best && bestScore >= 0.7) {

// //     await supabase.rpc("safe_match", {
// //       u1: user.id,
// //       u2: best.id,
// //       score: bestScore
// //     });

// //     window.location.href = "result.html";

// //   } else {

// //     await supabase.from("users")
// //       .update({ is_waitlisted: true })
// //       .eq("id", user.id);

// //     alert("No strong match yet. You're on the waitlist 💫");
// //   }

// // });


// document.addEventListener("DOMContentLoaded", async () => {

//   const supabase = window.supabaseClient;

//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) {
//     window.location.href = "login.html";
//     return;
//   }

//   // Check if match exists
//   const { data: match } = await supabase
//     .from("matches")
//     .select("*")
//     .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
//     .single();

//   if (!match) {
//     document.querySelector(".match-title").innerText =
//       "Your match will be revealed at 5 PM 💌";
//     document.querySelector(".match-subtitle").innerText =
//       "Sit tight — something special is coming ✨";
//     return;
//   }

//   // Determine partner
//   const partnerId =
//     match.user_a_id === user.id
//       ? match.user_b_id
//       : match.user_a_id;

//   const { data: partner } = await supabase
//     .from("users")
//     .select("name, emoji")
//     .eq("id", partnerId)
//     .single();

//   document.getElementById("yourName").innerText = "You";
//   document.getElementById("partnerName").innerText = partner.name;
//   document.getElementById("partnerEmoji").innerText = partner.emoji;

// });
document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabaseClient;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check existing match
  const { data: existing } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .single();

  if (existing) {
    window.location.href = "result.html";
    return;
  }

  // Fetch current user profile
  const { data: me } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch unmatched walkins only
  const { data: candidates } = await supabase
    .from("users")
    .select("*")
    .eq("is_matched", false)
    .eq("user_type", "walkin")
    .neq("id", user.id);

  if (!candidates || candidates.length === 0) {
    await supabase
      .from("users")
      .update({ is_waitlisted: true })
      .eq("id", user.id);

    showWaitMessage();
    return;
  }

  // Fetch answers
  const ids = [user.id, ...candidates.map(c => c.id)];

  const { data: answers } = await supabase
    .from("answers")
    .select("*")
    .in("user_id", ids);

  const answersMap = {};
  answers.forEach(r => {
    if (!answersMap[r.user_id]) answersMap[r.user_id] = [];
    answersMap[r.user_id][r.question_index] = r.answer;
  });

  const weights = [3,3,3,2,2,2,3,3,3,4,4,4,4,4,4,5,5,5,2,2,2];
  const max = weights.reduce((a,b)=>a+b,0);

  function compatibility(a,b){
    let score=0;
    for(let i=0;i<21;i++){
      if(a[i]===b[i]) score+=weights[i];
    }
    return score/max;
  }

  let best=null;
  let bestScore=0;

  for(const c of candidates){

    if(!answersMap[c.id]) continue;

    const score = compatibility(
      answersMap[user.id],
      answersMap[c.id]
    );

    if(score>bestScore){
      bestScore=score;
      best=c;
    }
  }

  if(best && bestScore>=0.7){

    const { data } = await supabase.rpc("safe_match",{
      u1:user.id,
      u2:best.id,
      score:bestScore
    });

    if(data){
      window.location.href="result.html";
    } else {
      showWaitMessage();
    }

  } else {

    await supabase
      .from("users")
      .update({ is_waitlisted:true })
      .eq("id",user.id);

    showWaitMessage();
  }

});

function showWaitMessage(){
  document.body.innerHTML = `
    <div style="text-align:center;margin-top:100px">
      <h2>✨ You're on the waitlist</h2>
      <p>Stay nearby — we'll match you if someone compatible joins.</p>
    </div>
  `;
}
