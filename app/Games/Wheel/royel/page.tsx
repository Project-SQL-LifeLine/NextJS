"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import "./royel.css";

const t = (en: string, bn: string) => en;

const numbers: { number: number; multiplier: number; weight: number; hot?: boolean }[] = [
  { number: 2,    multiplier: 2,   weight: 2500 },
  { number: 70,   multiplier: 40,  weight: 200  },
  { number: 3,    multiplier: 3,   weight: 2000 },
  { number: 1000, multiplier: 50,  weight: 150  },
  { number: 5,    multiplier: 5,   weight: 1000 },
  { number: 90,   multiplier: 60,  weight: 100  },
  { number: 8,    multiplier: 8,   weight: 800  },
  { number: 300,  multiplier: 70,  weight: 100  },
  { number: 10,   multiplier: 10,  weight: 500  },
  { number: 150,  multiplier: 80,  weight: 80   },
  { number: 200,  multiplier: 15,  weight: 500  },
  { number: 20,   multiplier: 100, weight: 50   },
  { number: 30,   multiplier: 20,  weight: 400  },
  { number: 40,   multiplier: 150, weight: 30   },
  { number: 500,  multiplier: 25,  weight: 300  },
  { number: 60,   multiplier: 200, weight: 50, hot: true },
  { number: 50,   multiplier: 30,  weight: 300  },
  { number: 80,   multiplier: 300, weight: 30   },
  { number: 700,  multiplier: 35,  weight: 200  },
  { number: 100,  multiplier: 500, weight: 10   },
];

const chipAmounts: number[] = [10, 50, 200, 500, 1000, 2500, 5000];

const getChipImage = (amount: number) => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return `/chip/${amount}.png`;
  }
  return `/NextJS/chip/${amount}.png`;
};

const colors: string[] = [
  "#214E3A", "#8B2929", "#28563E", "#7B2929",
  "#244A38", "#922F2F", "#28563E", "#7B2929",
  "#214E3A", "#922F2F", "#28563E", "#7B2929",
  "#214E3A", "#922F2F", "#28563E", "#7B2929",
  "#214E3A", "#922F2F", "#28563E", "#7B2929",
];

const ROUND_COUNTDOWN = 20;
const BET_LOCK_SECONDS = 5;
const SPIN_DURATION = 7000;

// 👇 ওয়েল-বেসড সাদা SVG লোডার
const WheelLoader = () => (
  <svg viewBox="0 0 100 100" className="wheel-loader-svg">
    <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.15)" strokeWidth="5" fill="none" />
    <circle cx="50" cy="50" r="45" stroke="#ffffff" strokeWidth="5" fill="none" strokeDasharray="60 220" strokeLinecap="round" />
    <circle cx="50" cy="50" r="28" stroke="rgba(255,255,255,0.4)" strokeWidth="3" fill="none" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <line key={deg} x1="50" y1="15" x2="50" y2="25" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" transform={`rotate(${deg} 50 50)`} />
    ))}
    <circle cx="50" cy="50" r="6" fill="#ffffff" />
  </svg>
);

export default function RoyelPage() {
  const [isLoading, setIsLoading] = useState(true);

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

    function updateBottomBar(): void {
      const balanceEl = document.getElementById("bottomBalance") as HTMLElement;
      balanceEl.textContent = balanceLoaded ? money(balance) : "...";
      document.getElementById("bottomTotalBet")!.textContent = money(getTotalBet());
    }

    async function fetchBalance(): Promise<void> {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          currentUserId = null; balanceLoaded = true; balance = 0; updateBottomBar(); return;
        }
        currentUserId = user.id;
        const { data: profile, error } = await supabase
          .from("profiles").select("balance").eq("id", user.id).single();
        if (error) { balanceLoaded = true; updateBottomBar(); return; }
        balance = profile?.balance != null ? Number(profile.balance) : 0;
        balanceLoaded = true; updateBottomBar(); renderGrid(); renderChips();
      } catch (err) {
        balanceLoaded = true; updateBottomBar();
      }
    }

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

    const modalBackdrop = document.getElementById("modalBackdrop") as HTMLDivElement;
    const modalTitle = document.getElementById("modalTitle") as HTMLHeadingElement;
    const modalContent = document.getElementById("modalContent") as HTMLDivElement;

    function openModal(title: string, content: string): void {
      modalTitle.textContent = title;
      modalContent.innerHTML = content;
      modalBackdrop.classList.add("open");
      menuPanel.classList.remove("open"); menuToggle.classList.remove("active");
    }

    document.getElementById("modalClose")!.addEventListener("click", () => modalBackdrop.classList.remove("open"));
    modalBackdrop.addEventListener("click", (e) => { if (e.target === modalBackdrop) modalBackdrop.classList.remove("open"); });

    document.getElementById("historyBtn")!.addEventListener("click", () => {
      if (!recentResults.length) {
        openModal(t("HISTORY", "হিস্ট্রি"), `<p class="modal-text">${t("No results available yet.", "এখনো কোনো রেজাল্ট নেই।")}</p>`);
        return;
      }
      const html = `<div class="history-list">${recentResults.map((r) => `
        <div class="history-item" style="background:${r.color}">${r.number}<small>${r.multiplier}X</small></div>
      `).join("")}</div>`;
      openModal(t("RESULT HISTORY", "রেজাল্ট হিস্ট্রি"), html);
    });

    document.getElementById("layoutBtn")!.addEventListener("click", () => {
      const compact = (document.getElementById("royelPage") as HTMLDivElement).classList.toggle("compact");
      openModal(t("LAYOUT", "লেআউট"), `<p class="modal-text">${t("Layout mode", "লেআউট মোড")}: <strong>${compact ? t("Compact", "কমপ্যাক্ট") : t("Normal", "নরমাল")}</strong></p>`);
    });

    document.getElementById("fairnessBtn")!.addEventListener("click", () => {
      openModal(t("FAIRNESS", "ফেয়ারনেস"), `<div class="modal-text">
         <strong>${t("Game Information", "গেমের তথ্য")}</strong><br>
         ${t("20 segments weighted random. House edge is maintained.", "২০টি সেগমেন্ট ওয়েটেড র‍্যান্ডম। হাউজ এজ নিশ্চিত করা হয়েছে।")}<br><br>
         <strong>${t("Provably Fair", "প্রমাণযোগ্য ফেয়ার")}</strong><br>
         HMAC-SHA256(client_seed:nonce, server_seed).
        </div>`);
    });

    const gradient = colors.map((color, index) => `${color} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`).join(",");
    wheel.style.background = `conic-gradient(${gradient})`;

    const centerX = 145;
    const centerY = 145;
    const labelRadius = 92;

    numbers.forEach((item, index) => {
      const segmentCenter = index * segmentAngle + segmentAngle / 2;

      const group = document.createElementNS(svgNS, "g");
      group.setAttribute("transform", `rotate(${segmentCenter} ${centerX} ${centerY})`);

      const numberText = document.createElementNS(svgNS, "text");
      numberText.setAttribute("x", String(centerX));
      numberText.setAttribute("y", String(centerY - labelRadius - 4));
      numberText.setAttribute("class", "wheel-number");
      numberText.textContent = item.hot ? `🔥${item.number}` : String(item.number);

      const multiplierText = document.createElementNS(svgNS, "text");
      multiplierText.setAttribute("x", String(centerX));
      multiplierText.setAttribute("y", String(centerY - labelRadius + 8));
      multiplierText.setAttribute("class", "wheel-multiplier");
      multiplierText.textContent = item.multiplier + "X";

      group.appendChild(numberText);
      group.appendChild(multiplierText);
      wheelLabels.appendChild(group);
    });

    function applyWheelRotation(degrees: number): void {
      wheelRotation = degrees;
      wheel.style.transform = `translate(-50%,-50%) rotate(${degrees}deg)`;
      wheelLabels.style.transform = `translate(-50%,-50%) rotate(${degrees}deg)`;
    }

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

    function renderChips(): void {
      const row = document.getElementById("chipRow") as HTMLDivElement;
      row.innerHTML = "";
      chipAmounts.forEach((amount) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip" + (selectedChip === amount ? " active" : "");
        chip.style.backgroundImage = `url('${getChipImage(amount)}')`;
        chip.setAttribute("aria-label", format(amount));
        
        chip.addEventListener("click", () => {
          if (!bettingOpen || spinning) return;
          selectedChip = amount;
          renderChips();
        });
        row.appendChild(chip);
      });
    }

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
          "number-card " + colorClass +
          (amount > 0 ? " selected" : "") +
          (isWinner ? " " + hitClass : "") +
          (!bettingOpen ? " locked" : "") +
          (item.hot ? " hot" : "");

        let chipDisplay = "";
        if (amount > 0) {
          const lastChip = chips.length ? chips[chips.length - 1] : selectedChip;
          chipDisplay = `
           <span class="bet-chip-display">
            <span class="bet-total">${money(amount)}</span>
            <span class="mini-chip" style="background-image: url('${getChipImage(lastChip)}');"></span>
           </span>`;
        }

        const hotBadge = item.hot ? '<span class="hot-badge">🔥 HOT</span>' : '';

        card.innerHTML = `
         ${hotBadge}
         <span class="number">${item.number}</span>
         <span class="multiplier">${item.multiplier}X</span>
         ${chipDisplay}`;

        card.addEventListener("click", () => addBet(item.number));
        grid.appendChild(card);
      });
    }

    function updateCenterTimer(value: number | string | null, type: string = ""): void {
      const timer = document.getElementById("wheelCountdown") as HTMLElement;
      if (value === null) { timer.className = "center-countdown hidden"; return; }
      timer.textContent = String(value);
      timer.className = "center-countdown" + (type ? " " + type : "");
    }

    // 👇 CSS Transition ব্যবহার করে ১০০% স্মুথ অ্যানিমেশন (ল্যাগ ফিক্স)
    function animateWheel(startAngle: number, endAngle: number, duration: number): Promise<void> {
      return new Promise((resolve) => {
        // ট্রানজিশন সেট করা হলো (ease-out কুইন্ট)
        wheel.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
        wheelLabels.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;

        // ব্রাউজারকে রি-ফ্লো করতে বাধ্য করা
        void wheel.offsetHeight;

        // ফাইনাল পজিশনে পাঠানো
        wheel.style.transform = `translate(-50%,-50%) rotate(${endAngle}deg)`;
        wheelLabels.style.transform = `translate(-50%,-50%) rotate(${endAngle}deg)`;

        // duration শেষ হওয়ার পর রিজলভ করা
        setTimeout(() => {
          wheel.style.transition = 'none';
          wheelLabels.style.transition = 'none';
          wheelRotation = endAngle;
          resolve();
        }, duration);
      });
    }

    function resetRound(): void {
      spinning = false; bettingOpen = true; roundPhase = "betting"; roundStartTime = Date.now();
      renderGrid(); renderChips(); updateBottomBar(); updateCenterTimer(ROUND_COUNTDOWN);
      void fetchBalance();
    }

    async function startAutomaticSpin(): Promise<void> {
      if (spinning) return;
      spinning = true; bettingOpen = false; roundPhase = "spinning";
      renderGrid(); updateCenterTimer(null); renderChips();

      const totalBet = getTotalBet();
      let winnerNumber = 0;
      let rpcData = null;

      if (totalBet > 0) {
        const payload = Object.keys(bets).map(k => ({ number: Number(k), amount: bets[Number(k)] }));
        try {
          const { data, error } = await supabase.rpc('play_wheel', { p_bets: payload });
          if (error) {
            openModal(t("ERROR", "এরর"), `<p class="modal-text" style="color:#ff4d4d">${error.message}</p>`);
            resetRound(); return;
          }
          rpcData = data;
          winnerNumber = Number(data.winner_number);
        } catch (err: any) {
          openModal(t("ERROR", "এরর"), `<p class="modal-text" style="color:#ff4d4d">${err.message || "Network Error"}</p>`);
          resetRound(); return;
        }
      } else {
        let rand = Math.random() * 9300;
        let cum = 0;
        for (let i = 0; i < numbers.length; i++) {
          cum += numbers[i].weight;
          if (rand < cum) { winnerNumber = numbers[i].number; break; }
        }
      }

      const winnerIndex = numbers.findIndex(n => n.number === winnerNumber);
      const segmentCenter = winnerIndex * segmentAngle + segmentAngle / 2;
      const current = ((wheelRotation % 360) + 360) % 360;
      const target = (360 - segmentCenter + 360) % 360;
      const extraSpins = 360 * 8;
      const distance = (target - current + 360) % 360;
      const endRotation = wheelRotation + extraSpins + distance;

      await animateWheel(wheelRotation, endRotation, SPIN_DURATION);
      finishDraw(winnerNumber, rpcData);
    }

    function finishDraw(winnerNumber: number, rpcData: any): void {
      const winLossElement = document.getElementById("winLoss") as HTMLElement;
      
      if (rpcData) {
        const netResult = Number(rpcData.profit);
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
      } else {
        winLossElement.textContent = "—";
        winLossElement.className = "bottom-value neutral";
      }

      const winData = numbers.find(n => n.number === winnerNumber);
      recentResults.unshift({
        number: winnerNumber,
        multiplier: winData ? winData.multiplier : 0,
        color: colors[numbers.findIndex((n) => n.number === winnerNumber)],
      });
      lastWinnerNumber = winnerNumber;
      renderRecentResults();

      bets = {};
      betChips = {};
      resetRound();
    }

    function updateTimer(): void {
      if (roundPhase === "betting") {
        const elapsed = (Date.now() - roundStartTime) / 1000;
        const remaining = Math.max(0, ROUND_COUNTDOWN - Math.floor(elapsed));
        if (remaining > BET_LOCK_SECONDS) {
          bettingOpen = true; updateCenterTimer(remaining);
        } else if (remaining > 0) {
          bettingOpen = false; updateCenterTimer(remaining, "warning");
          renderGrid(); renderChips();
        } else {
          bettingOpen = false; updateCenterTimer(null);
          startAutomaticSpin();
        }
      } else if (roundPhase === "spinning") {
        updateCenterTimer(null);
      }
    }

    // 👇 লোডিং ম্যানেজমেন্ট (কমপক্ষে ২.৫ সেকেন্ড)
    const startTime = Date.now();
    let dataLoaded = false;
    let minTimePassed = false;

    const checkReady = () => {
      if (dataLoaded && minTimePassed) {
        setIsLoading(false);
      }
    };

    fetchBalance().then(() => {
      dataLoaded = true;
      checkReady();
    });

    setTimeout(() => {
      minTimePassed = true;
      checkReady();
    }, 2500);

    applyWheelRotation(0); renderGrid(); renderChips(); renderRecentResults(); updateBottomBar();
    roundStartTime = Date.now(); roundPhase = "betting"; bettingOpen = true; updateCenterTimer("20");

    timerInterval = setInterval(updateTimer, 100);

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      document.removeEventListener("click", handleDocumentClick);
      wheelLabels.innerHTML = "";
    };
  }, []);

  return (
    <>
      {/* ওয়েল-বেসড লোডিং স্ক্রিন */}
      <div className={`loading-overlay ${isLoading ? "" : "hidden"}`}>
        <WheelLoader />
      </div>

      <div className="royel-page" id="royelPage">
        <div className="round-bar">
          <div className="recent-content">
            <div className="recent-grid" id="recentGrid"></div>
            <div className="top-controls">
              <button className="top-icon-btn" id="menuToggle" type="button" aria-label="Open menu" aria-expanded="false">
                <svg viewBox="0 0 24 24"><path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path></svg>
              </button>
            </div>
          </div>
          <div className="menu-panel" id="menuPanel">
            <div className="menu-title">LUCKY ROYALE</div>
            <button className="menu-option" id="historyBtn">◷ &nbsp; {t("History", "হিস্ট্রি")}</button>
            <button className="menu-option" id="layoutBtn">▦ &nbsp; {t("Layout", "লেআউট")}</button>
            <button className="menu-option" id="fairnessBtn">♧ &nbsp; {t("Limit Fairness", "ফেয়ারনেস")}</button>
          </div>
        </div>

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

        <section className="section">
          <div className="section-head">
            <h3>{t("SELECT YOUR NUMBERS", "আপনার নাম্বার সিলেক্ট করুন")}</h3>
            <span>{t("20 NUMBERS", "২০টি নাম্বার")}</span>
          </div>
          <div className="number-grid" id="numberGrid"></div>
        </section>

        <div className="bottom-card">
          <div className="chip-row" id="chipRow"></div>
          <div className="bottom-stats">
            <div className="bottom-item">
              <span className="bottom-label">{t("BALANCE", "ব্যালেন্স")}</span>
              <span className="bottom-value bottom-money" id="bottomBalance">...</span>
            </div>
            <div className="bottom-item center">
              <span className="bottom-label">{t("TOTAL BET", "মোট বাজি")}</span>
              <span className="bottom-value bottom-money" id="bottomTotalBet">৳0</span>
            </div>
            <div className="bottom-item right">
              <span className="bottom-label">{t("WIN / LOSS", "লাভ / লস")}</span>
              <span className="bottom-value neutral" id="winLoss">—</span>
            </div>
          </div>
        </div>

        <div className="modal-backdrop" id="modalBackdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3 id="modalTitle">{t("HISTORY", "হিস্ট্রি")}</h3>
              <button className="modal-close" id="modalClose">×</button>
            </div>
            <div id="modalContent"></div>
          </div>
        </div>
      </div>
    </>
  );
}
