/* =========================
   DONNÉES
========================= */

let words = JSON.parse(localStorage.getItem("dictationWords")) || [];

let quizWords = [];

let currentIndex = 0;

let score = 0;

let waiting = false;

/* =========================
   NAVIGATION
========================= */

const tabs = document.querySelectorAll(".tab");

const sections = document.querySelectorAll(".section");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));

    sections.forEach((s) => s.classList.remove("active"));

    tab.classList.add("active");

    document.getElementById(tab.dataset.section).classList.add("active");
  });
});

/* =========================
   AJOUTER UN MOT
========================= */

document.getElementById("addWord").addEventListener("click", addWord);

document
  .getElementById("wordInput")
  .addEventListener("keydown", function (event) {
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

function showMessage(text, color) {
  const message = document.getElementById("addMessage");

  message.textContent = text;

  message.style.color = color;
}

/* =========================
   SAUVEGARDE
========================= */

function saveWords() {
  localStorage.setItem("dictationWords", JSON.stringify(words));
}

/* =========================
   AFFICHER LES MOTS
========================= */

function displayWords() {
  const list = document.getElementById("wordList");

  list.innerHTML = "";

  if (words.length === 0) {
    list.innerHTML = `
            <div class="empty">
                Aucun mot ajouté.
            </div>
        `;

    return;
  }

  words.forEach((word, index) => {
    const item = document.createElement("div");

    item.className = "word-item";

    item.innerHTML = `

            <strong>
                ${escapeHTML(word)}
            </strong>

            <button
                class="btn danger"
                data-index="${index}"
            >
                🗑️ Supprimer
            </button>

        `;

    item
      .querySelector("button")
      .addEventListener("click", () => deleteWord(index));

    list.appendChild(item);
  });
}

/* =========================
   SUPPRIMER
========================= */

function deleteWord(index) {
  words.splice(index, 1);

  saveWords();

  displayWords();
}

/* =========================
   COMMENCER
========================= */

document.getElementById("startGame").addEventListener("click", startGame);

function startGame() {
  if (words.length === 0) {
    document.getElementById("gameContent").innerHTML = `

            <div class="listen">
                ⚠️
            </div>

            <h2>
                Aucun mot
            </h2>

            <p>
                Ajoute d'abord des mots
                dans l'onglet « Mes mots ».
            </p>

        `;

    return;
  }

  /*
   * Mélange les mots.
   */

  quizWords = [...words].sort(() => Math.random() - 0.5);

  currentIndex = 0;

  score = 0;

  document.getElementById("score").textContent = "0";

  showWord();
}

/* =========================
   LIRE LE MOT
========================= */

function speakWord(word) {
  if (!("speechSynthesis" in window)) {
    alert("La lecture vocale n'est pas disponible sur ce navigateur.");

    return;
  }

  speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(word);

  speech.lang = "fr-FR";

  speech.rate = 0.75;

  speech.pitch = 1;

  speech.volume = 1;

  speechSynthesis.speak(speech);
}

/* =========================
   AFFICHER LE MOT
========================= */

function showWord() {
  waiting = false;

  const word = quizWords[currentIndex];

  const progress = (currentIndex / quizWords.length) * 100;

  document.getElementById("progressBar").style.width = progress + "%";

  document.getElementById("gameContent").innerHTML = `

        <div class="listen">
            🔊
        </div>

        <h2>
            Écoute attentivement
        </h2>

        <p class="instruction">
            Écoute le mot puis écris-le.
        </p>

        <button
            class="btn primary"
            id="listenButton"
        >
            🔊 Écouter le mot
        </button>

        <div style="margin-top:25px;">

            <input
                type="text"
                id="answerInput"
                class="answer-input"
                placeholder="Écris le mot..."
                autocomplete="off"
                spellcheck="false"
            >

        </div>

        <button
            class="btn primary"
            id="checkButton"
        >
            ✓ Vérifier
        </button>

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

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      checkAnswer();
    }
  });

  /*
   * Lecture automatique.
   */

  setTimeout(() => speakWord(word), 500);
}

/* =========================
   VÉRIFIER
========================= */

function checkAnswer() {
  if (waiting) return;

  const input = document.getElementById("answerInput");

  const answer = input.value.trim();

  if (!answer) {
    document.getElementById("feedback").innerHTML = "⚠️ Écris une réponse.";

    return;
  }

  waiting = true;

  const correctWord = quizWords[currentIndex];

  if (answer.toLowerCase() === correctWord.toLowerCase()) {
    score++;

    document.getElementById("score").textContent = score;

    document.getElementById("feedback").innerHTML = `
            <span class="correct">
                ✅ Bravo ! Bonne orthographe.
            </span>
        `;
  } else {
    document.getElementById("feedback").innerHTML = `

            <span class="wrong">
                ❌ Ce n'est pas correct.
            </span>

            <div class="correct-word">
                La bonne réponse était :
                <strong>
                    ${escapeHTML(correctWord)}
                </strong>
            </div>

        `;
  }

  setTimeout(nextWord, 1800);
}

/* =========================
   MOT SUIVANT
========================= */

function nextWord() {
  currentIndex++;

  if (currentIndex >= quizWords.length) {
    finishGame();
  } else {
    showWord();
  }
}

/* =========================
   FIN
========================= */

function finishGame() {
  document.getElementById("progressBar").style.width = "100%";

  const percentage = Math.round((score / quizWords.length) * 100);

  let message;

  if (percentage === 100) {
    message = "🏆 Parfait ! Aucune faute.";
  } else if (percentage >= 80) {
    message = "👏 Excellent niveau d'orthographe !";
  } else if (percentage >= 60) {
    message = "👍 Très bien ! Continue à t'entraîner.";
  } else {
    message = "💪 Continue tes dictées pour progresser.";
  }

  document.getElementById("gameContent").innerHTML = `

        <div class="listen">
            🏆
        </div>

        <h2>
            Dictée terminée !
        </h2>

        <p class="score">
            ${score} / ${quizWords.length}
        </p>

        <p>
            ${percentage}% de réussite
        </p>

        <p style="margin-top:20px;">
            ${message}
        </p>

        <button
            class="btn primary"
            id="restart"
        >
            🔄 Recommencer
        </button>

    `;

  document.getElementById("restart").addEventListener("click", startGame);
}

/* =========================
   PROTECTION HTML
========================= */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   INITIALISATION
========================= */

displayWords();
