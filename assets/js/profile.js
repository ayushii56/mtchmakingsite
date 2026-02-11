console.log("profile.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profileForm");
  const phoneInput = document.getElementById("phone");

  if (!form || !phoneInput) {
    console.error("Form or phone input not found");
    return;
  }

  // Phone input restriction
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  });

  // Submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("submit clicked");

    const name = document.getElementById("name").value.trim();
    const phone = phoneInput.value.trim();
    const gender = document.getElementById("gender").value.trim();

    if (!name || !phone || !gender) {
      alert("Please fill all fields 💖");
      return;
    }

    if (phone.length !== 10) {
      alert("Phone number must be exactly 10 digits");
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
      console.error(error);
      alert("Something went wrong saving profile");
      return;
    }

    window.location.href = "preferences.html";
  });
});