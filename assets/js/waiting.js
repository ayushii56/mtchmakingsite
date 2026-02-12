document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabaseClient;

  const emojiDisplay = document.getElementById("emojiDisplay");
  const statusMessage = document.getElementById("statusMessage");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  // Fetch user
  const { data: userData } = await supabase
    .from("users")
    .select("emoji")
    .eq("id", user.id)
    .single();

  let emoji = userData?.emoji;

  // Assign emoji if not assigned
  if (!emoji) {

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

      emoji = availableEmoji.emoji;
    }
  }

  emojiDisplay.textContent = emoji || "💠";

  // Countdown
  const eventDate = new Date("2026-02-14T17:00:00+05:30");

  function updateCountdown() {

    const now = new Date();
    const diff = eventDate - now;

    if (diff <= 0) {
      statusMessage.innerHTML = `
        Your match has been revealed via email 💌 <br>
        See you at Raasta Khar ✨
      `;
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    statusMessage.innerHTML = `
      All good things come slow 💘 <br><br>
      <strong>${days}d ${hours}h ${minutes}m</strong> <br>
      until Tug of Love ✨ <br><br>
      Matches revealed via email before the event 💌
    `;
  }

  updateCountdown();
  setInterval(updateCountdown, 60000);

});
