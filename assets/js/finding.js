// assets/js/finding.js

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;

  // 1️⃣ Get logged-in user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    alert("User not authenticated");
    return;
  }

  // 2️⃣ Check if emoji already assigned
  const { data: existingUser, error: userError } = await supabase
    .from("users")
    .select("emoji")
    .eq("id", user.id)
    .single();

  if (userError) {
    console.error(userError);
    return;
  }

  if (existingUser.emoji) {
    // Emoji already assigned → move on
    setTimeout(() => {
      window.location.href = "result.html";
    }, 2000);
    return;
  }

  // 3️⃣ Fetch one unassigned emoji
  const { data: emojiRow, error: emojiError } = await supabase
    .from("emojis")
    .select("*")
    .eq("is_assigned", false)
    .limit(1)
    .single();

  if (emojiError || !emojiRow) {
    alert("No emojis available 😢");
    return;
  }

  // 4️⃣ Assign emoji atomically
  const { error: assignError } = await supabase
    .from("emojis")
    .update({
      is_assigned: true,
      assigned_to_user_id: user.id
    })
    .eq("id", emojiRow.id);

  if (assignError) {
    console.error(assignError);
    alert("Emoji assignment failed");
    return;
  }

  // 5️⃣ Save emoji to user
  const { error: saveError } = await supabase
    .from("users")
    .update({
      emoji: emojiRow.emoji
    })
    .eq("id", user.id);

  if (saveError) {
    console.error(saveError);
    return;
  }

  // 6️⃣ Move forward
  setTimeout(() => {
    window.location.href = "result.html";
  }, 2000);
});
