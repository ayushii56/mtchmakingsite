// assets/js/result.js

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;

  // UI elements
  const yourEmojiEl = document.getElementById("yourEmoji");
  const partnerEmojiEl = document.getElementById("partnerEmoji");
  const yourNameEl = document.getElementById("yourName");
  const partnerNameEl = document.getElementById("partnerName");
  const footerEl = document.querySelector(".match-footer");

  // Cute, soft quotes
  const quotes = [
    "Two souls, one tug of love — perfectly balanced."
];

  // 1️⃣ Get logged-in user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    alert("User not authenticated");
    return;
  }

  // 2️⃣ Get match row
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .single();

  if (matchError || !match) {
    alert("Match not found yet 💔");
    return;
  }

  // 3️⃣ Identify partner
  const partnerId =
    match.user_a_id === user.id
      ? match.user_b_id
      : match.user_a_id;

  // 4️⃣ Fetch both users
  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("id, name, emoji")
    .in("id", [user.id, partnerId]);

  if (usersError || !usersData || usersData.length !== 2) {
    alert("Unable to load match details");
    return;
  }

  const you = usersData.find((u) => u.id === user.id);
  const partner = usersData.find((u) => u.id === partnerId);

  // 5️⃣ Populate UI
  yourEmojiEl.textContent = you.emoji;
  yourNameEl.textContent = you.name;

  partnerEmojiEl.textContent = partner.emoji;
  partnerNameEl.textContent = partner.name;

  // 6️⃣ Random quote
  const randomQuote =
    quotes[Math.floor(Math.random() * quotes.length)];

  footerEl.textContent = randomQuote;
});
