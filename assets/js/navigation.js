// assets/js/navigation.js

// -----------------------------
// BASIC NAVIGATION HANDLER
// -----------------------------

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      // For now, always go to login
      // Later this will check auth + progress
      window.location.href = "auth/login.html";
    });
  }
});


// -----------------------------
// FUTURE FLOW (MENTAL NOTE)
// -----------------------------
// This file will later:
// 1. Check if user is authenticated
// 2. Check progress flags from Supabase:
//    - email_verified
//    - profile_done
//    - preferences_done
//    - questions_done
//    - booking_verified
// 3. Redirect user to correct page
//
// Example (later):
// if (!loggedIn) -> login.html
// else if (!profile_done) -> onboarding/profile.html
// else if (!preferences_done) -> onboarding/preferences.html
// else if (!questions_done) -> onboarding/questions.html
// else if (!booking_verified) -> onboarding/booking.html
// else -> index.html (show "Your Match" tab)
