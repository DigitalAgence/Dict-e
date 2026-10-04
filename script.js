/* =========================================================
   DONNÉES
========================================================= */

let words = JSON.parse(localStorage.getItem("dictationWords")) || [];

let quizWords = [];
let currentIndex = 0;
let score = 0;
let waiting = false;
let currentMode = null;

/* =========================================================
   NAVIGATION
========================================================= */

const tabs = document.querySelectorAll(".tab");
const sections = document.querySelectorAll(".section");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    sections.forEach((s) => s.classList.remove("active"));

    tab.classList.add("active");

    const section = document.getElementById(tab.dataset.section);

    section.classList.add("active");
  });
});

/* =========================================================
   AJOUTER UN MOT
========================================================= */

document.getElementById("addWord").addEventListener("click", addWord);

document.getElementById("wordInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addWord();
  }
});

function addWord() {
  const input = document.getElementById("wordInput");

  const word = input.value.trim();

  if (!word) {
    showMessage("⚠️ Écris un mot.", "#d33");

    return;
  }

  const alreadyExists = words.some(
    (w) => w.toLowerCase() === word.toLowerCase(),
  );

  if (alreadyExists) {
    showMessage("⚠️ Ce mot existe déjà.", "#d33");

    return;
  }

  words.push(word);

  saveWords();

  input.value = "";

  showMessage("✅ Mot ajouté !", "#209447");

  displayWords();
}

/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text, color) {
  const message = document.getElementById("addMessage");

  message.textContent = text;
  message.style.color = color;
}

/* =========================================================
   SAUVEGARDE
========================================================= */

function saveWords() {
  localStorage.setItem("dictationWords", JSON.stringify(words));
}

/* =========================================================
   AFFICHER LES MOTS
========================================================= */

function displayWords() {
  const list = document.getElementById("wordList");

  const count = document.getElementById("wordCount");

  count.textContent = words.length;

  list.innerHTML = "";

  if (words.length === 0) {
    list.innerHTML = `
            <div class="empty">
                <div class="empty-icon">📖</div>

                <h3>Aucun mot pour le moment</h3>

                <p>
                    Ajoute tes premiers mots pour commencer
                    tes dictées.
                </p>
            </div>
        `;

    return;
  }

  words.forEach((word, index) => {
    const item = document.createElement("div");

    item.className = "word-item";

    item.innerHTML = `

            <div class="word-number">
                ${index + 1}
            </div>

            <strong>
                ${escapeHTML(word)}
            </strong>

            <div class="word-actions">

                <button
                    class="listen-small"
                    title="Écouter"
                >
                    🔊
                </button>

                <button
                    class="delete-word"
                    title="Supprimer"
                >
                    🗑️
                </button>

            </div>
        `;

    item
      .querySelector(".listen-small")
      .addEventListener("click", () => speakWord(word));

    item
      .querySelector(".delete-word")
      .addEventListener("click", () => deleteWord(index));

    list.appendChild(item);
  });
}

/* =========================================================
   SUPPRIMER
========================================================= */

function deleteWord(index) {
  if (!confirm("Supprimer ce mot de ta liste ?")) {
    return;
  }

  words.splice(index, 1);

  saveWords();

  displayWords();
}

/* =========================================================
   CHOIX DU MODE
========================================================= */

document
  .getElementById("visibleMode")
  .addEventListener("click", () => chooseMode("visible"));

document
  .getElementById("hiddenMode")
  .addEventListener("click", () => chooseMode("hidden"));

function chooseMode(mode) {
  if (words.length === 0) {
    alert("Ajoute d'abord quelques mots dans « Mes mots ».");

    return;
  }

  currentMode = mode;

  document.getElementById("dictationChoice").classList.add("hidden");

  document.getElementById("game").classList.remove("hidden");

  if (mode === "visible") {
    document.getElementById("gameModeTitle").textContent =
      "👀 Dictée avec mots apparents";
  } else {
    document.getElementById("gameModeTitle").textContent =
      "🧠 Dictée sans mot apparent";
  }

  startGame();
}

/* =========================================================
   RETOUR AUX MODES
========================================================= */

document.getElementById("backToModes").addEventListener("click", () => {
  speechSynthesis.cancel();

  document.getElementById("game").classList.add("hidden");

  document.getElementById("dictationChoice").classList.remove("hidden");
});

/* =========================================================
   COMMENCER LA DICTÉE
========================================================= */

document.getElementById("startGame").addEventListener("click", startGame);

function startGame() {
  if (words.length === 0) {
    return;
  }

  quizWords = [...words].sort(() => Math.random() - 0.5);

  currentIndex = 0;
  score = 0;
  waiting = false;

  document.getElementById("score").textContent = "0";

  document.getElementById("totalWords").textContent = `/ ${quizWords.length}`;

  showWord();
}

/* =========================================================
   LECTURE VOCALE
========================================================= */

function speakWord(word) {
  if (!("speechSynthesis" in window)) {
    alert("La lecture vocale n'est pas disponible sur ce navigateur.");

    return;
  }

  speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(word);

  speech.lang = "fr-FR";
  speech.rate = 0.72;
  speech.pitch = 1;
  speech.volume = 1;

  speechSynthesis.speak(speech);
}

/* =========================================================
   AFFICHER LE MOT
========================================================= */

function showWord() {
  waiting = false;

  const word = quizWords[currentIndex];

  const progress = (currentIndex / quizWords.length) * 100;

  document.getElementById("progressBar").style.width = progress + "%";

  document.getElementById("questionNumber").textContent =
    `Mot ${currentIndex + 1}`;

  const visible = currentMode === "visible";

  document.getElementById("gameContent").innerHTML = `

        <div class="listen">
            ${visible ? "👀" : "🧠"}
        </div>

        ${
          visible
            ? `
                    <div class="visible-word">
                        ${escapeHTML(word)}
                    </div>

                    <p class="mode-help">
                        👀 Regarde attentivement le mot.
                    </p>
                `
            : `
                    <h2>Écoute attentivement</h2>

                    <p class="mode-help">
                        🧠 Le mot n'est pas affiché.
                        Essaie de t'en souvenir.
                    </p>
                `
        }

        <button
            class="btn listen-button"
            id="listenButton"
        >
            🔊 Écouter le mot
        </button>


        <div class="answer-container">

            <input
                type="text"
                id="answerInput"
                class="answer-input"
                placeholder="Écris le mot..."
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
            >

            <button
                class="btn primary check-button"
                id="checkButton"
            >
                ✓ Vérifier
            </button>

        </div>


        <div
            class="feedback"
            id="feedback"
        ></div>

    `;

  document
    .getElementById("listenButton")
    .addEventListener("click", () => speakWord(word));

  document.getElementById("checkButton").addEventListener("click", checkAnswer);

  const input = document.getElementById("answerInput");

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      checkAnswer();
    }
  });

  setTimeout(() => {
    speakWord(word);

    input.focus();
  }, 500);
}

/* =========================================================
   VÉRIFIER
========================================================= */

function checkAnswer() {
  if (waiting) {
    return;
  }

  const input = document.getElementById("answerInput");

  const answer = input.value.trim();

  const feedback = document.getElementById("feedback");

  if (!answer) {
    feedback.innerHTML = `<span class="wrong">
                ⚠️ Écris une réponse.
            </span>`;

    input.focus();

    return;
  }

  waiting = true;

  const correctWord = quizWords[currentIndex];

  if (answer.toLowerCase() === correctWord.toLowerCase()) {
    score++;

    document.getElementById("score").textContent = score;

    feedback.innerHTML = `

            <div class="correct">
                🎉 Bravo !
            </div>

            <div class="feedback-small">
                Bonne orthographe !
            </div>

        `;
  } else {
    feedback.innerHTML = `

            <div class="wrong">
                ❌ Pas tout à fait...
            </div>

            <div class="correct-word">
                La bonne réponse :
                <strong>
                    ${escapeHTML(correctWord)}
                </strong>
            </div>

        `;
  }

  setTimeout(nextWord, 1800);
}

/* =========================================================
   MOT SUIVANT
========================================================= */

function nextWord() {
  currentIndex++;

  if (currentIndex >= quizWords.length) {
    finishGame();
  } else {
    showWord();
  }
}

/* =========================================================
   FIN DE PARTIE
========================================================= */

function finishGame() {
  document.getElementById("progressBar").style.width = "100%";

  const percentage = Math.round((score / quizWords.length) * 100);

  let message;
  let emoji;

  if (percentage === 100) {
    emoji = "🏆";
    message = "Parfait ! Aucune faute.";
  } else if (percentage >= 80) {
    emoji = "🌟";
    message = "Excellent niveau d'orthographe !";
  } else if (percentage >= 60) {
    emoji = "👏";
    message = "Très bien ! Continue à t'entraîner.";
  } else {
    emoji = "💪";
    message = "Continue tes dictées pour progresser.";
  }

  const modeText =
    currentMode === "visible" ? "avec mots apparents" : "sans mots apparents";

  document.getElementById("gameContent").innerHTML = `

        <div class="result">

            <div class="result-icon">
                ${emoji}
            </div>

            <h2>
                Dictée terminée !
            </h2>

            <p class="result-mode">
                Dictée ${modeText}
            </p>

            <div class="final-score">
                ${score}
                <span>/ ${quizWords.length}</span>
            </div>

            <div class="percentage">
                ${percentage}% de réussite
            </div>

            <p class="result-message">
                ${message}
            </p>

            <div class="result-actions">

                <button
                    class="btn primary"
                    id="restart"
                >
                    🔄 Recommencer
                </button>

                <button
                    class="btn secondary"
                    id="changeMode"
                >
                    🎧 Changer de mode
                </button>

            </div>

        </div>

    `;

  document.getElementById("restart").addEventListener("click", startGame);

  document.getElementById("changeMode").addEventListener("click", () => {
    document.getElementById("game").classList.add("hidden");

    document.getElementById("dictationChoice").classList.remove("hidden");
  });
}

/* =========================================================
   PROTECTION HTML
========================================================= */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   INITIALISATION
========================================================= */

displayWords();
