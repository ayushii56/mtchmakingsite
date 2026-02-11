// assets/js/questions.js

document.addEventListener("DOMContentLoaded", async () => {

  const questionText = document.getElementById("questionText");
  const progressText = document.getElementById("progressText");
  const agreeBtn = document.getElementById("agreeBtn");
  const disagreeBtn = document.getElementById("disagreeBtn");

  const arrowUp = document.getElementById("arrowUp");
  const arrowDown = document.getElementById("arrowDown");

 const questions = [
    // 1️⃣ YOU BETTER MATCH MY ENERGY
    "I would pick a chill night-in over a chaotic night-out.",
    "I enjoy dates that don’t need lots of spending or a Google Calendar itinerary.",
    "Deep conversations are my idea of a good time.",

    // 2️⃣ IRL VIBECHECK
    "People usually find me more attractive in person than in photos.",
    "I’m better in conversation in person than on text.",
    "People often misjudge me at first.",

    // 3️⃣ OLD HABITS DIE HARD
    "I ignored a red flag because the vibes were good.",
    "I stayed because I hoped things would change.",
    "My last connection taught me something (even if it hurt a little).",

    // 4️⃣ HOW I SHOW UP
    "Once I’m in, I show up consistently.",
    "I listen fully, not just wait for my turn to speak.",
    "I buy gifts and plan surprises for my partner.",

    // 5️⃣ REAL TALK
    "I would rather hear the truth than be kept comfortable.",
    "I say what I feel instead of only saying what they would want to hear.",
    "Respect and emotional availability is hotter to me than having everything in common.",

    // 6️⃣ THE LONG GAME
    "I am open to building something real, not just killing time.",
    "I believe attraction can grow, not just spark instantly.",
    "I’m okay taking things slow if it feels right.",

    // 7️⃣ JUST SAYING
    "I trust my gut more than outside opinions.",
    "I don’t believe in playing hard to get.",
    "I think timing matters almost as much as chemistry."
  ];
  let currentIndex = parseInt(localStorage.getItem("tol_q_index")) || 0;
  let answers = JSON.parse(localStorage.getItem("tol_answers")) || [];

  const supabase = window.supabaseClient;
  let user = null;

  if (supabase) {
    const res = await supabase.auth.getUser();
    user = res?.data?.user || null;
  }

  function renderQuestion() {
    questionText.textContent = questions[currentIndex];
    progressText.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

    agreeBtn.checked = false;
    disagreeBtn.checked = false;
  }

  // ⭐ Animation wrapper
function animateQuestionChange(updateFn) {

  const q = document.getElementById("questionText");
  const p = document.getElementById("progressText");

  // slide old question up
  q.style.transition = "transform 0.3s ease, opacity 0.3s ease";
  p.style.transition = "transform 0.3s ease, opacity 0.3s ease";

  q.style.transform = "translateY(-40px)";
  p.style.transform = "translateY(-40px)";
  q.style.opacity = "0";
  p.style.opacity = "0";

  setTimeout(() => {

    // place new question BELOW
    updateFn();

    q.style.transition = "none";
    p.style.transition = "none";

    q.style.transform = "translateY(40px)";
    p.style.transform = "translateY(40px)";
    q.style.opacity = "0";
    p.style.opacity = "0";

    requestAnimationFrame(() => {

      // animate upward into position
      q.style.transition = "transform 0.3s ease, opacity 0.3s ease";
      p.style.transition = "transform 0.3s ease, opacity 0.3s ease";

      q.style.transform = "translateY(0)";
      p.style.transform = "translateY(0)";
      q.style.opacity = "1";
      p.style.opacity = "1";

    });

  }, 300);
}
  async function saveAnswer(value) {

    answers[currentIndex] = value;
    localStorage.setItem("tol_answers", JSON.stringify(answers));

    if (supabase && user) {
      const { error } = await supabase
        .from("answers")
        .upsert({
          user_id: user.id,
          question_index: currentIndex,
          answer: value
        });

      if (error) console.error("Supabase save failed:", error.message);
    }

    currentIndex++;
    localStorage.setItem("tol_q_index", currentIndex);

    if (currentIndex < questions.length) {

      animateQuestionChange(renderQuestion);

    } else {

      completeQuestionnaire();
    }
  }

  async function completeQuestionnaire() {

    localStorage.removeItem("tol_q_index");

    if (supabase && user) {
      await supabase
        .from("users")
        .update({ questions_done: true })
        .eq("id", user.id);
    }

    window.location.href = "waiting.html";
  }

  agreeBtn.addEventListener("click", () => saveAnswer(1));
  disagreeBtn.addEventListener("click", () => saveAnswer(0));

  arrowUp?.addEventListener("click", () => {

    if (currentIndex > 0) {

      currentIndex--;
      localStorage.setItem("tol_q_index", currentIndex);
      animateQuestionChange(renderQuestion);
    }
  });

  arrowDown?.addEventListener("click", () => {

    if (currentIndex < questions.length - 1) {

      currentIndex++;
      localStorage.setItem("tol_q_index", currentIndex);
      animateQuestionChange(renderQuestion);
    }
  });

  renderQuestion();

});