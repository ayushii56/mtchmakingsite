// assets/js/profile.js
console.log("profile.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profileForm");
  const phoneInput = document.getElementById("phone");

  phoneInput.addEventListener("input", () => {
    // allow numbers only
    phoneInput.value = phoneInput.value.replace(/\D/g, "");

    // enforce max 10 digits
    if (phoneInput.value.length >= 10) {
      phoneInput.value = phoneInput.value.slice(0, 10);
    }
  });
if (phoneInput.value.length !== 10) {
  alert("Phone number must be exactly 10 digits");
  return;
}

  if (!form) {
    console.error("profileForm not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    console.log("submit clicked");
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const gender = document.getElementById("gender")?.value.trim();

    if (!name || !phone || !gender) {
      alert("Please fill all fields 💖");
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

    const { error } = await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      name,
      phone,
      gender_identity: gender,
      profile_done: true
    });

    if (error) {
      console.error("FULL ERROR:", JSON.stringify(error, null, 2));
      alert(JSON.stringify(error, null, 2));
      return;
    }

    window.location.href = "preferences.html";
  });
});
