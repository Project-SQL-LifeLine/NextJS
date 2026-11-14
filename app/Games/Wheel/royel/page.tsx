"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import "./royel.css";

const numbers: { number: number; multiplier: number }[] = [
  { number: 10, multiplier: 10 },
  { number: 20, multiplier: 100 },
  { number: 30, multiplier: 20 },
  { number: 40, multiplier: 150 },
  { number: 50, multiplier: 30 },
  { number: 60, multiplier: 200 },
  { number: 70, multiplier: 40 },
  { number: 80, multiplier: 300 },
  { number: 90, multiplier: 60 },
  { number: 100, multiplier: 500 },
  { number: 150, multiplier: 80 },
  { number: 200, multiplier: 15 },
  { number: 300, multiplier: 70 },
  { number: 500, multiplier: 25 },
  { number: 700, multiplier: 35 },
  { number: 1000, multiplier: 50 },
];

const chipAmounts: number[] = [10, 50, 200, 500, 700, 1000];

const colors: string[] = [
  "#214E3A", "#8B2929", "#28563E", "#7B2929",
  "#244A38", "#922F2F", "#28563E", "#7B2929",
  "#214E3A", "#922F2F", "#28563E", "#7B2929",
  "#214E3A", "#922F2F", "#28563E", "#7B2929",
];

const ROUND_COUNTDOWN = 20;
const BET_LOCK_SECONDS = 5;
const SPIN_DURATION = 7000;

export default function RoyelPage() {
  useEffect(() => {
    let balance = 0;
    let balanceLoaded = false;
    let bets: Record<number, number> = {};
    let betChips: Record<number, number[]> = {};
    let selectedChip = 10;
    let spinning = false;
    let wheelRotation = 0;
    let bettingOpen = true;
    let roundPhase = "betting";
    let roundStartTime = Date.now();
    let recentResults: { number: number; multiplier: number; color: string }[] = [];
    let timerInterval: ReturnType<typeof setInterval> | null = null;
    let currentUserId: string | null = null;

    let lastWinnerNumber: number | null = null;

    const wheel = document.getElementById("wheel") as HTMLDivElement;
    const wheelLabels = document.getElementById("wheelLabels") as unknown as SVGSVGElement;
    const grid = document.getElementById("numberGrid") as HTMLDivElement;
    const segmentAngle = 360 / numbers.length;
    const svgNS = "http://www.w3.org/2000/svg";

    function format(n: number): string {
      return Number(n).toLocaleString("en-US");
    }
    function money(n: number): string {
      return "৳" + format(n);
    }
    function getTotalBet(): number {
      return Object.values(bets).reduce((s, a) => s + a, 0);
    }
    function setStatus(): void {}

    /* BOTTOM SUMMARY */
    function updateBottomBar(): void {
      const balanceEl = document.getElementById("bottomBalance") as HTMLElement;
      balanceEl.textContent = balanceLoaded ? money(balance) : "...";
      document.getElementById("bottomTotalBet")!.textContent = money(getTotalBet());
    }

    /* FETCH BALANCE FROM SUPABASE */
    async function fetchBalance(): Promise<void> {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (!user) {
          currentUserId = null;
          balanceLoaded = true;
          balance = 0;
          updateBottomBar();
          return;
        }

        currentUserId = user.id;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();

        if (error) {
          console.warn("Balance fetch error:", error.message);
          balanceLoaded = true;
          updateBottomBar();
          return;
        }

        if (profile && typeof profile.balance === "number") {
          balance = profile.balance;
        } else if (profile && profile.balance != null) {
          balance = Number(profile.balance);
        } else {
          balance = 0;
        }

        balanceLoaded = true;
        updateBottomBar();
        renderGrid();
        renderChips();
      } catch (err) {
        console.warn("Balance fetch exception:", err);
        balanceLoaded = true;
        updateBottomBar();
      }
    }

    /* MENU */
    const menuToggle = document.getElementById("menuToggle") as HTMLButtonElement;
    const menuPanel = document.getElementById("menuPanel") as HTMLDivElement;

    menuToggle.addEventListener("click", () => {
      const open = menuPanel.classList.toggle("open");
      menuToggle.classList.toggle("active", open);
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    function handleDocumentClick(event: MouseEvent): void {
      if (!menuPanel.contains(event.target as Node) && !menuToggle.contains(event.target as Node)) {
        menuPanel.classList.remove("open");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    }
    document.addEventListener("click", handleDocumentClick);

    /* MODAL */
    const modalBackdrop = document.getElementById("modalBackdrop") as HTMLDivElement;
    const modalTitle = document.getElementById("modalTitle") as HTMLHeadingElement;
    const modalContent = document.getElementById("modalContent") as HTMLDivElement;

    function openModal(title: string, content: string): void {
      modalTitle.textContent = title;
      modalContent.innerHTML = content;
      modalBackdrop.classList.add("open");
      menuPanel.classList.remove("open");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    }

    document.getElementById("modalClose")!.addEventListener("click", () => {
      modalBackdrop.classList.remove("open");
    });
    modalBackdrop.addEventListener("click", (event) => {
      if (event.target === modalBackdrop) modalBackdrop.classList.remove("open");
    });

    /* HISTORY */
    document.getElementById("historyBtn")!.addEventListener("click", () => {
      if (!recentResults.length) {
        openModal("HISTORY", '<p class="modal-text">No results available yet.</p>');
        return;
      }

      const html = `
        <div class="history-list">
         ${recentResults
           .map(
             (r) => `
          <div class="history-item" style="background:${r.color}">
           ${r.number}
           <small>${r.multiplier}X</small>
          </div>
         `
           )
           .join("")}
        </div>
       `;
      openModal("RESULT HISTORY", html);
    });

    /* LAYOUT */
    document.getElementById("layoutBtn")!.addEventListener("click", () => {
      const compact = (document.getElementById("royelPage") as HTMLDivElement).classList.toggle("compact");
      openModal(
        "LAYOUT",
        `<p class="modal-text">
         Layout mode: <strong>${compact ? "Compact" : "Normal"}</strong><br><br>
         ${compact ? "Compact layout is enabled." : "Normal layout is enabled."}
        </p>`
      );
    });

    /* LIMIT FAIRNESS */
    document.getElementById("fairnessBtn")!.addEventListener("click", () => {
      openModal(
        "LIMIT FAIRNESS",
        `
        <div class="modal-text">
         <strong>Game Information</strong><br>
         Each round selects one number from the 16 available numbers.<br><br>
         <strong>Random Result</strong><br>
         This demo uses browser-side random selection. It is not a certified
         random number system.<br><br>
         <strong>Bet Limit</strong><br>
         Your bet cannot exceed your available demo balance.<br><br>
         <strong>Important</strong><br>
         This is a demo interface only. Browser-side results and balances
         are not secure for real-money gaming.
        </div>
       `
      );
    });

    /* WHEEL COLORS */
    const gradient = colors
      .map((color, index) => {
        return `${color} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`;
      })
      .join(",");
    wheel.style.background = `conic-gradient(${gradient})`;

    /* WHEEL LABELS */
    const centerX = 145;
    const centerY = 145;
    const labelRadius = 105;
    const labelGroups: SVGGElement[] = [];

    numbers.forEach((item, index) => {
      const segmentCenter = index * segmentAngle + segmentAngle / 2;
      const angle = ((segmentCenter - 90) * Math.PI) / 180;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;

      const group = document.createElementNS(svgNS, "g");
      group.setAttribute("data-x", String(x));
      group.setAttribute("data-y", String(y));

      const numberText = document.createElementNS(svgNS, "text");
      numberText.setAttribute("x", String(x));
      numberText.setAttribute("y", String(y - 5));
      numberText.setAttribute("class", "wheel-number");
      numberText.textContent = String(item.number);

      const multiplierText = document.createElementNS(svgNS, "text");
      multiplierText.setAttribute("x", String(x));
      multiplierText.setAttribute("y", String(y + 9));
      multiplierText.setAttribute("class", "wheel-multiplier");
      multiplierText.textContent = item.multiplier + "X";

      group.appendChild(numberText);
      group.appendChild(multiplierText);
      wheelLabels.appendChild(group);
      labelGroups.push(group);
    });

    /* WHEEL ROTATION */
    function applyWheelRotation(degrees: number): void {
      wheelRotation = degrees;
      wheel.style.transform = `translate(-50%,-50%) rotate(${degrees}deg)`;
      wheelLabels.style.transform = `translate(-50%,-50%) rotate(${degrees}deg)`;

      labelGroups.forEach((group) => {
        const x = Number(group.getAttribute("data-x"));
        const y = Number(group.getAttribute("data-y"));
        group.setAttribute("transform", `rotate(${-degrees} ${x} ${y})`);
      });
    }

    /* RECENT RESULTS */
    function renderRecentResults(): void {
      const recentGrid = document.getElementById("recentGrid") as HTMLDivElement;
      recentGrid.innerHTML = "";

      recentResults.slice(0, 5).forEach((result) => {
        const cell = document.createElement("div");
        cell.className = "recent-cell";
        cell.style.background = result.color;
        cell.innerHTML = `<span>${result.number}</span><small>${result.multiplier}X</small>`;
        recentGrid.appendChild(cell);
      });
    }

    /* CHIP SELECTOR */
    function renderChips(): void {
      const row = document.getElementById("chipRow") as HTMLDivElement;
      row.innerHTML = "";

      chipAmounts.forEach((amount) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip" + (selectedChip === amount ? " active" : "");
        chip.textContent = format(amount);

        chip.addEventListener("click", () => {
          if (!bettingOpen || spinning) return;
          selectedChip = amount;
          renderChips();
        });

        row.appendChild(chip);
      });
    }

    /* PLACE BET BY SELECTED CHIP */
    function addBet(number: number): void {
      if (!bettingOpen || spinning) return;
      if (!balanceLoaded) return;

      const amount = selectedChip;

      if (balance < amount) return;

      balance -= amount;
      bets[number] = (bets[number] || 0) + amount;

      if (!betChips[number]) betChips[number] = [];
      betChips[number].push(amount);

      updateBottomBar();
      renderGrid();
    }

    /* NUMBER GRID */
    function renderGrid(): void {
      grid.innerHTML = "";

      numbers.forEach((item, index) => {
        const amount = bets[item.number] || 0;
        const chips = betChips[item.number] || [];

        const isRed = index % 2 === 1;
        const colorClass = isRed ? "roulette-red" : "roulette-green";

        const isWinner = lastWinnerNumber === item.number;
        const hitClass = isWinner ? (isRed ? "hit-red" : "hit-green") : "";

        const card = document.createElement("button");
        card.type = "button";
        card.className =
          "number-card " +
          colorClass +
          (amount > 0 ? " selected" : "") +
          (isWinner ? " " + hitClass : "") +
          (!bettingOpen ? " locked" : "");

        let chipDisplay = "";

        if (amount > 0) {
          const lastChip = chips.length ? chips[chips.length - 1] : selectedChip;

          chipDisplay = `
           <span class="bet-chip-display">
            <span class="bet-total">${money(amount)}</span>
            <span class="mini-chip">${format(lastChip)}</span>
           </span>
          `;
        }

        card.innerHTML = `
         <span class="number">${item.number}</span>
         <span class="multiplier">${item.multiplier}X</span>
         ${chipDisplay}
        `;

        card.addEventListener("click", () => {
          addBet(item.number);
        });

        grid.appendChild(card);
      });
    }

    /* CENTER TIMER */
    function updateCenterTimer(value: number | string | null, type: string = ""): void {
      const timer = document.getElementById("wheelCountdown") as HTMLElement;

      if (value === null) {
        timer.className = "center-countdown hidden";
        return;
      }

      timer.textContent = String(value);
      timer.className = "center-countdown" + (type ? " " + type : "");
    }

    /* SPIN ANIMATION */
    function animateWheel(startAngle: number, endAngle: number, duration: number): Promise<void> {
      return new Promise((resolve) => {
        const startTime = performance.now();

        function frame(now: number): void {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          const current = startAngle + (endAngle - startAngle) * eased;

          applyWheelRotation(current);

          if (progress < 1) {
            requestAnimationFrame(frame);
          } else {
            applyWheelRotation(endAngle);
            resolve();
          }
        }

        requestAnimationFrame(frame);
      });
    }

    /* AUTOMATIC SPIN */
    async function startAutomaticSpin(): Promise<void> {
      if (spinning) return;

      spinning = true;
      bettingOpen = false;
      roundPhase = "spinning";

      renderGrid();
      updateCenterTimer(null);
      renderChips();

      const winnerIndex = Math.floor(Math.random() * numbers.length);
      const winner = numbers[winnerIndex];

      const segmentCenter = winnerIndex * segmentAngle + segmentAngle / 2;
      const current = ((wheelRotation % 360) + 360) % 360;
      const target = (360 - segmentCenter + 360) % 360;
      const extraSpins = 360 * 8;
      const distance = (target - current + 360) % 360;
      const endRotation = wheelRotation + extraSpins + distance;

      await animateWheel(wheelRotation, endRotation, SPIN_DURATION);

      finishDraw(winner);
    }

    /* FINISH DRAW */
    function finishDraw(winner: { number: number; multiplier: number }): void {
      const totalBet = getTotalBet();
      const winningBet = bets[winner.number] || 0;
      const payout = winningBet * winner.multiplier;
      const netResult = payout - totalBet;

      if (winningBet > 0) {
        balance += payout;
      }

      const winLossElement = document.getElementById("winLoss") as HTMLElement;

      if (netResult > 0) {
        winLossElement.textContent = "+" + money(netResult);
        winLossElement.className = "bottom-value win";
      } else if (netResult < 0) {
        winLossElement.textContent = "-" + money(Math.abs(netResult));
        winLossElement.className = "bottom-value loss";
      } else {
        winLossElement.textContent = money(0);
        winLossElement.className = "bottom-value neutral";
      }

      recentResults.unshift({
        number: winner.number,
        multiplier: winner.multiplier,
        color: colors[numbers.findIndex((n) => n.number === winner.number)],
      });

      lastWinnerNumber = winner.number;

      renderRecentResults();

      bets = {};
      betChips = {};

      spinning = false;
      roundPhase = "betting";
      bettingOpen = true;
      roundStartTime = Date.now();

      renderGrid();
      renderChips();
      updateBottomBar();

      updateCenterTimer(ROUND_COUNTDOWN);

      /* Refresh real balance from DB after spin (read-only) */
      void fetchBalance();
    }

    /* COUNTDOWN */
    function updateTimer(): void {
      if (roundPhase === "betting") {
        const elapsed = (Date.now() - roundStartTime) / 1000;
        const remaining = Math.max(0, ROUND_COUNTDOWN - Math.floor(elapsed));

        if (remaining > BET_LOCK_SECONDS) {
          bettingOpen = true;
          updateCenterTimer(remaining);
        } else if (remaining > 0) {
          bettingOpen = false;
          updateCenterTimer(remaining, "warning");
          renderGrid();
          renderChips();
        } else {
          bettingOpen = false;
          updateCenterTimer(null);
          startAutomaticSpin();
        }
      } else if (roundPhase === "spinning") {
        updateCenterTimer(null);
      }
    }

    /* INITIALIZE */
    applyWheelRotation(0);
    renderGrid();
    renderChips();
    renderRecentResults();
    updateBottomBar();

    roundStartTime = Date.now();
    roundPhase = "betting";
    bettingOpen = true;
    updateCenterTimer("20");

    /* Fetch real balance from Supabase */
    void fetchBalance();

    timerInterval = setInterval(updateTimer, 100);

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      document.removeEventListener("click", handleDocumentClick);
      wheelLabels.innerHTML = "";
    };
  }, []);

  return (
    <div className="royel-page" id="royelPage">
      {/* RECENT RESULTS */}
      <div className="round-bar">
        <div className="recent-content">
          <div className="recent-grid" id="recentGrid"></div>

          <div className="top-controls">
            <button
              className="top-icon-btn"
              id="menuToggle"
              type="button"
              aria-label="Open menu"
              aria-expanded="false"
            >
              <svg viewBox="0 0 24 24">
                <path d="M4 6h16"></path>
                <path d="M4 12h16"></path>
                <path d="M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="menu-panel" id="menuPanel">
          <div className="menu-title">LUCKY ROYALE</div>
          <button className="menu-option" id="historyBtn">◷ &nbsp; History</button>
          <button className="menu-option" id="layoutBtn">▦ &nbsp; Layout</button>
          <button className="menu-option" id="fairnessBtn">♧ &nbsp; Limit Fairness</button>
        </div>
      </div>

      {/* WHEEL */}
      <div className="wheel-area">
        <div className="wheel-frame">
          <div className="wheel" id="wheel"></div>
          <svg className="wheel-label" id="wheelLabels" viewBox="0 0 290 290" aria-hidden="true"></svg>
          <div className="pointer-rotator"></div>
          <div className="wheel-center">
            <strong className="center-countdown" id="wheelCountdown">20</strong>
          </div>
        </div>
      </div>

      <div className="wheel-underline"></div>

      {/* NUMBER GRID */}
      <section className="section">
        <div className="section-head">
          <h3>SELECT YOUR NUMBERS</h3>
          <span>16 NUMBERS</span>
        </div>
        <div className="number-grid" id="numberGrid"></div>
      </section>

      {/* COMBINED CHIP + BALANCE CARD */}
      <div className="bottom-card">
        <div className="chip-row" id="chipRow"></div>

        <div className="bottom-stats">
          <div className="bottom-item">
            <span className="bottom-label">BALANCE</span>
            <span className="bottom-value bottom-money" id="bottomBalance">...</span>
          </div>

          <div className="bottom-item center">
            <span className="bottom-label">TOTAL BET</span>
            <span className="bottom-value bottom-money" id="bottomTotalBet">৳0</span>
          </div>

          <div className="bottom-item right">
            <span className="bottom-label">WIN / LOSS</span>
            <span className="bottom-value neutral" id="winLoss">—</span>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <div className="modal-backdrop" id="modalBackdrop">
        <div className="modal-box">
          <div className="modal-head">
            <h3 id="modalTitle">HISTORY</h3>
            <button className="modal-close" id="modalClose">×</button>
          </div>
          <div id="modalContent"></div>
        </div>
      </div>
    </div>
  );
}
