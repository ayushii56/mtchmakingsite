// assets/js/preferences.js

console.log("preferences.js loaded");

window.addEventListener("load", () => {

  const supabase = window.supabaseClient;
  if (!supabase) {
    alert("Supabase not loaded");
    return;
  }

  const form = document.getElementById("preferencesForm");

  // match CURRENT HTML structure
  const selects = form.querySelectorAll("select");
  const orientationSelect = selects[0];
  const openOrientationSelect = selects[1];

  const pillGroup = document.getElementById("attractedGenders");

  console.log({ form, orientationSelect, openOrientationSelect, pillGroup });

  /* ---------- PILL CLICK ---------- */
  pillGroup.addEventListener("click", (e) => {
    const pill = e.target.closest(".pref-pill");
    if (!pill) return;
    pill.classList.toggle("selected");
  });

  /* ---------- SUBMIT ---------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sexualOrientation = orientationSelect.value;
    const openToDifferent = openOrientationSelect.value === "Yes";

    const selectedPills =
      pillGroup.querySelectorAll(".pref-pill.selected");

    const attractedGenders =
      [...selectedPills].map(p => p.dataset.value);

    if (!sexualOrientation) {
      alert("Select sexual orientation");
      return;
    }

    if (attractedGenders.length === 0) {
      alert("Select attraction");
      return;
    }

    const { data: { user } } =
      await supabase.auth.getUser();

    /* USERS TABLE — unchanged */
    await supabase
      .from("users")
      .update({
        sexual_orientation: sexualOrientation,
        open_to_different_orientations: openToDifferent,
        preferences_done: true
      })
      .eq("id", user.id);

    /* ATTRACTIONS TABLE — unchanged */
    await supabase
      .from("user_attractions")
      .delete()
      .eq("user_id", user.id);

    await supabase
      .from("user_attractions")
      .insert(
        attractedGenders.map(g => ({
          user_id: user.id,
          attracted_gender: g
        }))
      );

    window.location.href = "./quiz-intro.html";
  });

});