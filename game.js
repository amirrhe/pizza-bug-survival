(function () {
  const GAME_DURATION = 45;       // seconds
  const BUG_SPAWN_INTERVAL = 900; // ms
  const BUG_TRAVEL_TIME = 6500;   // ms to reach the pizza
  const MAX_HEALTH = 3;
  const EVENT_INTERVAL = 8000;    // ms between random events

  const scoreDisplay = document.getElementById("scoreDisplay");
  const timeDisplay = document.getElementById("timeDisplay");
  const healthDisplay = document.getElementById("healthDisplay");
  const messageText = document.getElementById("messageText");
  const gameArea = document.getElementById("gameArea");
  const startBtn = document.getElementById("startBtn");
  const dogEl = document.getElementById("dog");
  const seniorDevEl = document.getElementById("seniorDev");
  const internEl = document.getElementById("intern");

  let score = 0;
  let timeLeft = GAME_DURATION;
  let health = MAX_HEALTH;

  let gameRunning = false;
  let bugs = new Set();

  let spawnIntervalId = null;
  let timerIntervalId = null;
  let eventIntervalId = null;

  // NEW: while an event is playing, pause bug spawning
  let eventActive = false;

  const bugClickMessages = [
    "Bug squashed. QA approves. ✅",
    "Nice click! Production is safe… for now.",
    "You just closed a Jira ticket with your mouse.",
    "Critical bug removed. Pizza continues to exist.",
    "That bug never made it to main. Good job.",
    "That bug was marked 'won’t fix'… until you clicked it.",
    "Jira status: RESOLVED by pure reflex.",
  ];

  const bugReachMessages = [
    "A bug reached the pizza. Deploy panic mode. 😱",
    "Oops. That one slipped into production.",
    "Pizza now contains traces of bug. Delicious.",
    "Sprint velocity just dropped by 20%.",
    "That bug is now a 'known issue' in release notes."
  ];

  const neutralMessages = [
    "Protect the pizza! Click bugs before they reach the slice. 🐛",
    "Bugs spawn from the edges. They love pizza carbs.",
    "Tip: when in doubt, click the bug.",
    "Real devs ship bug-free pizza to production.",
    "If it moves toward the pizza, it’s probably a problem.",
  ];

  const dogMessages = [
    "Debugger dog ran through and knocked bugs away. 🐶",
    "Doggo just refactored half your bug list.",
    "Debugger dog: 1, bugs: 0.",
    "Someone yelled 'WHO LET THE DOG OUT?' and your bugs disappeared.",
    "Dog sniffed the bugs and refused to file a ticket."
  ];

  const internMessages = [
    "Intern joined the project. Bug population doubled. 🧑‍💻",
    "Intern: 'I just changed one small thing…'",
    "Intern pushed a 'tiny' commit. May the pizza survive.",
    "Intern added a global variable 'tmp' in production.",
    "Intern: 'I fixed the bug by commenting out that line.'"
  ];

  const seniorDevMessages = [
    "Senior dev ran 'rm -rf / bugs'. Half of them vanished. 👴",
    "Senior dev performed a legendary one-liner fix.",
    "Half the bugs are gone. Also half the logs, but it's fine.",
    "Senior dev: 'It works on my machine'—and somehow it fixed production.",
    "Senior dev closed 10 bugs with one commit message: 'cleanup'."
  ];

  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }

  function updateTimeDisplay() {
    timeDisplay.textContent = timeLeft + "s";
  }

  function updateHealthDisplay() {
    const full = "🍕".repeat(health);
    const empty = "▫️".repeat(MAX_HEALTH - health);
    healthDisplay.textContent = full + empty;
  }

  function setMessage(text) {
    messageText.textContent = text;
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clearAllIntervals() {
    [spawnIntervalId, timerIntervalId, eventIntervalId].forEach((id) => {
      if (id) clearInterval(id);
    });
    spawnIntervalId = timerIntervalId = eventIntervalId = null;
  }

  function removeBug(bug) {
    if (!bug || !bug.parentElement) return;
    bugs.delete(bug);
    bug.remove();
  }

  function squashBug(bug) {
    if (!bug || bug.dataset.dead === "1") return;
    bug.dataset.dead = "1";
    bugs.delete(bug);
    bug.classList.add("bug-squash");
    setTimeout(() => {
      if (bug.parentElement) bug.remove();
    }, 200);
  }

  function bugReachedPizza(bug) {
    if (!gameRunning) return;
    if (!bug || bug.dataset.dead === "1") return;
    bug.dataset.dead = "1";
    bugs.delete(bug);
    if (bug.parentElement) bug.remove();

    health -= 1;
    if (health < 0) health = 0;
    updateHealthDisplay();
    setMessage(randomFrom(bugReachMessages));

    if (health <= 0) {
      endGame("The pizza was overwhelmed by bugs. 🍕💀");
    }
  }

  function spawnBug() {
    if (!gameRunning) return;
    if (eventActive) return; // NEW: pause spawns while event text is visible

    const areaRect = gameArea.getBoundingClientRect();
    const centerX = areaRect.width / 2;
    const centerY = areaRect.height / 2;
    const radius = Math.min(areaRect.width, areaRect.height) / 2 + 30;

    const angle = Math.random() * Math.PI * 2;
    const startX = centerX + radius * Math.cos(angle);
    const startY = centerY + radius * Math.sin(angle);

    const bug = document.createElement("div");
    bug.className = "bug";
    bug.textContent = "🐛";

    // prepare for animation
    bug.style.left = startX + "px";
    bug.style.top = startY + "px";
    bug.style.transitionDuration = BUG_TRAVEL_TIME + "ms";
    bug.dataset.dead = "0";

    gameArea.appendChild(bug);
    bugs.add(bug);

    // Click handler
    bug.addEventListener("click", function (e) {
      if (!gameRunning) return;
      e.stopPropagation();
      if (bug.dataset.dead === "1") return;
      score += 1;
      updateScoreDisplay();
      setMessage(randomFrom(bugClickMessages));
      squashBug(bug);
    });

    // When transition ends, bug reached center
    const onTransitionEnd = (ev) => {
      if (ev.propertyName !== "left" && ev.propertyName !== "top") return;
      bug.removeEventListener("transitionend", onTransitionEnd);
      bugReachedPizza(bug);
    };
    bug.addEventListener("transitionend", onTransitionEnd);

    // Trigger animation to center (next frame)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bug.style.left = centerX + "px";
        bug.style.top = centerY + "px";
      });
    });
  }

  /* Random Events (with delays so you can read them) */

  function triggerDogEvent() {
    if (!gameRunning) return;
    if (bugs.size === 0) return;

    eventActive = true;

    dogEl.classList.remove("show");
    void dogEl.offsetWidth; // force reflow
    dogEl.classList.add("show");

    setMessage(randomFrom(dogMessages));

    // Wait a bit so player can read the text, THEN knock bugs
    setTimeout(() => {
      if (!gameRunning) return;

      bugs.forEach((bug) => {
        if (!bug || bug.dataset.dead === "1") return;
        bug.dataset.dead = "1";
        bug.classList.add("bug-knocked");
        setTimeout(() => {
          if (bug && bug.parentElement) bug.remove();
        }, 500);
      });
      bugs.clear();
    }, 800); // delay in ms

    // After a bit more time, allow spawns again
    setTimeout(() => {
      dogEl.classList.remove("show");
      eventActive = false;
    }, 2200);
  }

  function triggerInternEvent() {
    if (!gameRunning) return;

    eventActive = true;

    internEl.classList.remove("show");
    void internEl.offsetWidth;
    internEl.classList.add("show");

    setMessage(randomFrom(internMessages));

    // Wait so user can read, then spawn extra bugs
    setTimeout(() => {
      if (!gameRunning) return;

      const currentBugs = Array.from(bugs);
      const limit = Math.min(currentBugs.length || 3, 7); // if no bugs, still spawn a few
      for (let i = 0; i < limit; i++) {
        spawnBug();
      }
    }, 900);

    setTimeout(() => {
      internEl.classList.remove("show");
      eventActive = false;
    }, 2200);
  }

  function triggerSeniorDevEvent() {
    if (!gameRunning) return;
    if (bugs.size === 0) return;

    eventActive = true;

    seniorDevEl.classList.remove("show");
    void seniorDevEl.offsetWidth;
    seniorDevEl.classList.add("show");

    setMessage(randomFrom(seniorDevMessages));

    // Wait, then nuke half the bugs
    setTimeout(() => {
      if (!gameRunning) return;

      const currentBugs = Array.from(bugs);
      const half = Math.floor(currentBugs.length / 2);
      for (let i = 0; i < half; i++) {
        squashBug(currentBugs[i]);
      }
    }, 900);

    setTimeout(() => {
      seniorDevEl.classList.remove("show");
      eventActive = false;
    }, 2200);
  }

  function triggerRandomEvent() {
    if (!gameRunning) return;
    if (eventActive) return; // don’t stack events on top of each other

    const roll = Math.random();
    if (roll < 0.4) {
      triggerDogEvent();
    } else if (roll < 0.75) {
      triggerInternEvent();
    } else {
      triggerSeniorDevEvent();
    }
  }

  /* Game lifecycle */

  function startTimer() {
    timerIntervalId = setInterval(() => {
      if (!gameRunning) return;
      timeLeft -= 1;
      if (timeLeft < 0) timeLeft = 0;
      updateTimeDisplay();
      if (timeLeft <= 0) {
        endGame("Time’s up! Pizza survived the sprint. 🍕🚀");
      }
    }, 1000);
  }

  function startSpawningBugs() {
    spawnIntervalId = setInterval(() => {
      if (!gameRunning) return;
      spawnBug();
    }, BUG_SPAWN_INTERVAL);
  }

  function startEvents() {
    eventIntervalId = setInterval(() => {
      if (!gameRunning) return;
      triggerRandomEvent();
    }, EVENT_INTERVAL);
  }

  function resetGame() {
    clearAllIntervals();
    bugs.forEach((bug) => {
      if (bug && bug.parentElement) bug.remove();
    });
    bugs.clear();

    score = 0;
    timeLeft = GAME_DURATION;
    health = MAX_HEALTH;
    eventActive = false;

    updateScoreDisplay();
    updateTimeDisplay();
    updateHealthDisplay();
    setMessage(randomFrom(neutralMessages));

    gameRunning = true;
    startBtn.disabled = true;
    startBtn.textContent = "Playing...";

    startSpawningBugs();
    startTimer();
    startEvents();
  }

  function endGame(reasonText) {
    if (!gameRunning) return;
    gameRunning = false;
    clearAllIntervals();
    eventActive = false;

    // Remove remaining bugs
    bugs.forEach((bug) => {
      if (bug && bug.parentElement) bug.remove();
    });
    bugs.clear();

    startBtn.disabled = false;
    startBtn.textContent = "Play again";

    let finalMessage = "";
    if (health <= 0) {
      finalMessage = "Final score: " + score + ". " + reasonText;
    } else {
      if (score >= 35) {
        finalMessage =
          "Final score: " + score +
          ". ChizCode Champion! You defended the pizza like a true production ninja.";
      } else if (score >= 18) {
        finalMessage =
          "Final score: " + score +
          ". Solid defense! QA will only complain a little.";
      } else {
        finalMessage =
          "Final score: " + score +
          ". So many bugs… it felt like a Monday deploy.";
      }
    }
    setMessage(finalMessage);
  }

  /* Event binding */

  startBtn.addEventListener("click", () => {
    if (!gameRunning) {
      resetGame();
    }
  });

  // Initial UI
  updateScoreDisplay();
  updateTimeDisplay();
  updateHealthDisplay();
  setMessage("Press 'Start game' to protect the pizza from incoming bugs. 🐛🍕");
})();
