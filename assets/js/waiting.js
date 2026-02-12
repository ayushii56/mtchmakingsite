document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabaseClient;

  const emojiDisplay = document.getElementById("emojiDisplay");
  const statusMessage = document.getElementById("statusMessage");
  const bookingSection = document.getElementById("bookingSection");
  const liveMatchBtn = document.getElementById("liveMatchBtn");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: eventState } = await supabase
    .from("event_state")
    .select("mode")
    .eq("id", 1)
    .maybeSingle();

  if (!eventState) return;

  const { data: userData } = await supabase
    .from("users")
    .select("emoji, booking_verified")
    .eq("id", user.id)
    .single();

  // ===============================
  // PRE-EVENT MODE
  // ===============================
  if (eventState.mode === "pre_event") {

    liveMatchBtn.style.display = "none";

    // 🚫 DO NOT SHOW EMOJI YET
    if (!userData.booking_verified) {

      emojiDisplay.textContent = "🎟️";
      statusMessage.innerHTML = "Enter your ticket ID to receive your emoji ✨";
      bookingSection.style.display = "block";

      return;
    }

    // ✅ AFTER TICKET VERIFIED
    bookingSection.style.display = "none";
    emojiDisplay.textContent = userData.emoji;

    statusMessage.innerHTML = `
      Your match will be revealed at 5 PM via email 💌 <br>
      See you at the event ✨
    `;

    return;
  }

  // ===============================
  // LIVE MODE
  // ===============================
  if (eventState.mode === "live") {

    bookingSection.style.display = "none";

    if (!userData.emoji) {

      const { data: availableEmoji } = await supabase
        .from("emojis")
        .select("*")
        .eq("is_assigned", false)
        .limit(1)
        .maybeSingle();

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

    statusMessage.innerHTML = `
      Click below to find your match 💘
    `;

    liveMatchBtn.style.display = "block";

    liveMatchBtn.addEventListener("click", () => {
      window.location.href = "finding.html";
    });
  }
});
