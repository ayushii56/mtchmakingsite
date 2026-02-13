document.addEventListener("DOMContentLoaded", () => {

  const supabase = window.supabaseClient;

  const form = document.getElementById("profileForm");
  const phoneInput = document.getElementById("phone");

  if (!form || !phoneInput || !supabase) {
    console.error("Missing DOM elements or supabase client");
    return;
  }

  // Restrict phone to 10 digits
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  });

  const continueBtn = document.getElementById("continueBtn");

    continueBtn.addEventListener("click", async () => {

      const name = document.getElementById("name").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const gender = document.getElementById("gender").value;
      const orientation = document.getElementById("orientation").value;

      if (!name || !phone || !gender || !orientation) {
        alert("Please fill all fields.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("User not logged in.");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          name,
          phone,
          gender_identity: gender,
          sexual_orientation: orientation,
          profile_done: true,
          is_matched: false
        })
        .eq("id", user.id);

      if (error) {
        alert("Error saving profile.");
        return;
      }

      localStorage.removeItem("tol_q_index");
      localStorage.removeItem("tol_answers");
      window.location.href = "questions.html";
    });
    });
