document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabaseClient;

  const emojiDisplay = document.getElementById("emojiDisplay");
  const emojiBtn = document.getElementById("emojiBtn");
  const overlay = document.getElementById("overlay");
  const closePopup = document.getElementById("closePopup");

  if (!supabase) return;

  // 🔐 Get logged in user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  // 🎟 Fetch user's emoji
  const { data: userData, error } = await supabase
    .from("users")
    .select("emoji")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user:", error.message);
    return;
  }

  let emoji = userData?.emoji;

  // 🎲 Assign emoji if not already assigned
  if (!emoji) {

    const { data: availableEmoji } = await supabase
      .from("emojis")
      .select("*")
      .eq("is_assigned", false)
      .limit(1)
      .single();

    if (availableEmoji) {

      await supabase
        .from("users")
        .update({ emoji: availableEmoji.emoji })
        .eq("id", user.id);

      await supabase
        .from("emojis")
        .update({ is_assigned: true })
        .eq("id", availableEmoji.id);

      emoji = availableEmoji.emoji;
    }
  }

  // 🎉 Display emoji
  emojiDisplay.textContent = emoji || "💠";

  // 🎀 Popup logic
  if (emojiBtn && overlay && closePopup) {

    emojiBtn.addEventListener("click", () => {
      overlay.classList.remove("hidden");
    });

    closePopup.addEventListener("click", () => {
      overlay.classList.add("hidden");
    });

    // Optional: close when tapping outside card
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.add("hidden");
      }
    });

  }

});
