// assets/js/auth.js

document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleLogin");

  if (!googleBtn) {
    console.error("Google button not found");
    return;
  }

  googleBtn.addEventListener("click", async () => {
    console.log("Google login clicked");

    const { error } =
      await window.supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://mtchmakingsite.vercel.app/onboarding/profile.html"
        }
      });

    if (error) {
      console.error("OAuth error:", error);
      alert("Google login failed");
    }
  });
});
