import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  try {

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const affectedEmails = [
      "tanishaa.3010@gmail.com",
      "maazansari846@gmail.com",
      "mishravidisha21@gmail.com",
      "chaitanyapramod2002@gmail.com",
      "priyal.damani.business@gmail.com",
      "jagjyot0228@gmail.com",
      "kevalchheda0019@gmail.com",
      "bahreekripa@gmail.com",
      "pandeyayushi676@gmail.com",
      "bravesnehal@gmail.com",
      "yadavdiya265@gmail.com",
      "alavani.aarya@gmail.com",
      "subhramondalpapai@gmail.com",
      "kreeshaiyer10@gmail.com",
      "akshayj070605@gmail.com",
      "saibalchbanerjee18@gmail.com"
    ];

    let emailsSent = 0;

    for (const email of affectedEmails) {

      const { data: user } = await supabase
        .from("users")
        .select("id, email, emoji")
        .eq("email", email)
        .single();

      if (!user) continue;

      const { data: match } = await supabase
        .from("matches")
        .select("user_a_id, user_b_id")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .single();

      if (!match) continue;

      const partnerId =
        match.user_a_id === user.id
          ? match.user_b_id
          : match.user_a_id;

      const { data: partner } = await supabase
        .from("users")
        .select("emoji, phone")
        .eq("id", partnerId)
        .single();

      if (!partner || !user.email) continue;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Tug of Love <hello@exclusivpresents.com>",
          to: user.email,
          subject: "✨ Your Correct Match Details 💖",
          html: `
            <h2>Your Updated Match Details 💘</h2>

            <p>Your emoji: <b>${user.emoji}</b></p>

            <h3>Find your match by their emoji sticker or call them!</h3>

            <p>Your match's emoji: <b>${partner.emoji}</b></p>
            <p>Phone: <b>${partner.phone ?? "Not provided"}</b></p>

            <p>See you at Raasta Khar on 14th Feb ✨</p>
          `
        })
      });

      emailsSent++;
    }

    return new Response(`Corrected ${emailsSent} emails successfully.`);

  } catch (err) {
    console.error("CRASH:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
