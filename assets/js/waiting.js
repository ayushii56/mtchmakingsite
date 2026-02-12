// document.addEventListener("DOMContentLoaded", async () => {
//   const supabase = window.supabaseClient;
//   const emojiDisplay = document.getElementById("emojiDisplay");
//   const findMatchBtn = document.getElementById("findMatchBtn");

//   const {
//     data: { user }
//   } = await supabase.auth.getUser();

//   if (!user) {
//     alert("Not logged in");
//     return;
//   }

//   const { data, error } = await supabase
//     .from("users")
//     .select("emoji")
//     .eq("id", user.id)
//     .single();

//   if (error || !data?.emoji) {
//     emojiDisplay.textContent = "💔";
//     return;
//   }

//   emojiDisplay.textContent = data.emoji;

//   findMatchBtn.addEventListener("click", () => {
//     window.location.href = "match.html";
//   });
// });
document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabaseClient;

  const emojiDisplay = document.getElementById("emojiDisplay");
  const findMatchBtn = document.getElementById("findMatchBtn");
  const bookingForm = document.getElementById("bookingForm");
  const ticketRight = document.querySelector(".ticket-right");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Not logged in");
    return;
  }

  // Get event mode
  const { data: eventState } = await supabase
    .from("event_state")
    .select("mode")
    .eq("id", 1)
    .single();

  // Get user info
  const { data: userData } = await supabase
    .from("users")
    .select("emoji, booking_verified")
    .eq("id", user.id)
    .single();

  if (!eventState) {
    alert("Event mode not set.");
    return;
  }

  // 🟦 PRE EVENT MODE
  if (eventState.mode === "pre_event") {

    if (!userData.booking_verified) {
      // User must enter ticket
      ticketRight.style.display = "block";
      findMatchBtn.style.display = "none";
      emojiDisplay.textContent = "🎟️";
      return;
    }

    // Ticket verified
    emojiDisplay.textContent = userData.emoji || "💠";

    ticketRight.style.display = "none";
    findMatchBtn.style.display = "none";

    const desc = document.querySelector(".ticket-desc");
    desc.innerHTML = `
      Your match will be revealed at 5 PM 💌 <br>
      See you at the event ✨
    `;

  }

  // 🟨 LIVE MODE
  if (eventState.mode === "live") {

    ticketRight.style.display = "none";
    findMatchBtn.style.display = "none";

    // If no emoji yet, assign one automatically
    if (!userData.emoji) {

      const { data: availableEmoji } = await supabase
        .from("emojis")
        .select("*")
        .eq("is_assigned", false)
        .limit(1)
        .single();

      if (availableEmoji) {

        await supabase.from("users")
          .update({ emoji: availableEmoji.emoji })
          .eq("id", user.id);

        await supabase.from("emojis")
          .update({
            is_assigned: true,
            assigned_to_user_id: user.id
          })
          .eq("id", availableEmoji.id);

        emojiDisplay.textContent = availableEmoji.emoji;
      }

    } else {
      emojiDisplay.textContent = userData.emoji;
    }

    // Go directly to live matching
    setTimeout(() => {
      window.location.href = "finding.html";
    }, 1500);
  }

});
