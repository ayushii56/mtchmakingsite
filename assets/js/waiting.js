document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;
  const emojiDisplay = document.getElementById("emojiDisplay");
  const findMatchBtn = document.getElementById("findMatchBtn");

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Not logged in");
    return;
  }

  const { data, error } = await supabase
    .from("users")
    .select("emoji")
    .eq("id", user.id)
    .single();

  if (error || !data?.emoji) {
    emojiDisplay.textContent = "💔";
    return;
  }

  emojiDisplay.textContent = data.emoji;

  findMatchBtn.addEventListener("click", () => {
    window.location.href = "match.html";
  });
});
