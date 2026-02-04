// assets/js/booking.js
console.log("booking.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bookingForm");
  const input = document.getElementById("bookingCode");

  console.log("form:", form);
  console.log("input:", input);

  if (!form || !input) {
    alert("Booking form DOM not ready");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Booking form submitted");

    const bookingCode = input.value.trim();

    if (!bookingCode) {
      alert("Please enter booking ID");
      return;
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
      alert("Supabase not loaded");
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not logged in");
      return;
    }

    // 1️⃣ Check booking ID
    const { data, error } = await supabase
      .from("booking_ids")
      .select("*")
      .eq("booking_code", bookingCode)
      .single();

    if (error || !data) {
      alert("Invalid booking ID ❌");
      return;
    }

    if (data.is_used) {
      alert("This booking ID is already used ❌");
      return;
    }

    // 2️⃣ Claim booking ID
    const { error: claimError } = await supabase
      .from("booking_ids")
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date()
      })
      .eq("booking_code", bookingCode);

    if (claimError) {
      alert("Failed to verify booking ID");
      return;
    }

    // 3️⃣ Update user
    await supabase
      .from("users")
      .update({
        booking_verified: true,
        booking_code: bookingCode
      })
      .eq("id", user.id);

    alert("Booking ID verified 💖");
// 🎀 ASSIGN EMOJI VIA RPC (FINAL FIX)
const { data: emoji, error: emojiError } = await supabase
  .rpc("assign_emoji_to_user", { p_user_id: user.id });

if (emojiError) {
  console.error(emojiError);
  alert("Emoji assignment failed");
  return;
}

// save emoji on user profile
await supabase
  .from("users")
  .update({ emoji })
  .eq("id", user.id);


    window.location.href = "waiting.html";
  });
});
