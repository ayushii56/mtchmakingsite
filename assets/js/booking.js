// assets/js/booking.js

console.log("booking.js loaded");

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("bookingForm");
  const input = document.getElementById("bookingCode");

  if (!form || !input) return;

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const bookingCode = input.value.trim().toUpperCase();
    if (!bookingCode) {
      alert("Please enter booking ID");
      return;
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
      alert("Supabase not loaded");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("User not logged in");
      return;
    }

    // 1️⃣ Check booking ID
    const { data: bookingData, error } = await supabase
      .from("booking_ids")
      .select("*")
      .eq("booking_code", bookingCode)
      .maybeSingle();

    if (error || !bookingData) {
      alert("Invalid booking ID ❌");
      return;
    }

    if (bookingData.is_used) {
      alert("This booking ID is already used ❌");
      return;
    }

    // 2️⃣ Mark booking ID as used
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

    // 3️⃣ Mark user as verified
    await supabase
      .from("users")
      .update({
        booking_verified: true,
        booking_code: bookingCode
      })
      .eq("id", user.id);

    // 4️⃣ Assign emoji via RPC
    const { data: emoji, error: emojiError } = await supabase
      .rpc("assign_emoji_to_user", { p_user_id: user.id });

    if (emojiError || !emoji) {
      console.error(emojiError);
      alert("Emoji assignment failed");
      return;
    }

    // 5️⃣ Save emoji on user
    await supabase
      .from("users")
      .update({ emoji })
      .eq("id", user.id);

    alert("Booking ID verified 💖");

    // 6️⃣ Reload page so waiting.js updates UI
    window.location.reload();

  });

});
