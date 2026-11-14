"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import MenuBar from "./Components/MenuBar"; 
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
  
  const [recentResults, setRecentResults] = useState<{ number: number; multiplier: number; color: string }[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [clientSeed, setClientSeed] = useState("");
  const [serverSeedHash, setServerSeedHash] = useState("");
  const [nonce, setNonce] = useState(0);
  
  const [selectedChip, setSelectedChip] = useState(10);
  const [isChipMenuOpen, setIsChipMenuOpen] = useState(false);

  const [modal, setModal] = useState({ open: false, title: "", content: "" });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = (type: "bet" | "win") => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === "bet") { osc.frequency.value = 600; gain.gain.value = 0.1; }
      if (type === "win") { osc.frequency.value = 800; gain.gain.value = 0.2; }
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) { /* ignore */ }
  };

  const openModal = (title: string, content: string) => {
    setModal({ open: true, title, content });
  };

  const handleClientSeedChange = async (newSeed: string) => {
    setClientSeed(newSeed);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ pf_client_seed: newSeed }).eq("id", user.id);
      }
    } catch (e) {
      console.warn("Failed to save client seed to DB", e);
    }
  };

  useEffect(() => {
    let balance = 0;
    let balanceLoaded = false;
    let bets: Record<number, number> = {};
    let betChips: Record<number, number[]> = {};
    let spinning = false;
    let wheelRotation = 0;
    let bettingOpen = true;
    let roundPhase = "betting";
    let roundStartTime = Date.now();
    let timerInterval: ReturnType<typeof setInterval> | null = null;
    let currentUserId: string | null = null;
    let lastWinnerNumber: number | null = null;

    const wheel = document.getElementById("wheel") as HTMLDivElement;
    const wheelLabels = document.getElementById("wheelLabels") as unknown as SVGSVGElement;
    const grid = document.getElementById("numberGrid") as HTMLDivElement;
    const segmentAngle = 360 / numbers.length;
    const svgNS = "http://www.w3.org/2000/svg";

    function format(n: number): string { return Number(n).toLocaleString("en-US"); }
    function money(n: number): string { return "৳" + format(n); }
    function getTotalBet(): number { return Object.values(bets).reduce((s, a) => s + a, 0); }

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
          .from("profiles").select("balance, pf_client_seed, pf_server_seed_hash, game_nonces").eq("id", user.id).single();
          
        if (error) { balanceLoaded = true; updateBottomBar(); return; }
        
        balance = profile?.balance != null ? Number(profile.balance) : 0;
        setClientSeed(profile?.pf_client_seed || "");
        setServerSeedHash(profile?.pf_server_seed_hash || "");
        setNonce(profile?.game_nonces?.wheel || 0);

        balanceLoaded = true; updateBottomBar(); renderGrid();
      } catch (err) {
        balanceLoaded = true; updateBottomBar();
      }
    }

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

    function addBet(number: number): void {
      if (!bettingOpen || spinning) return;
      if (!balanceLoaded) return;
      const amount = selectedChip;
      if (balance < amount) return; 
      
      playSound("bet"); 
      
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

    function animateWheel(startAngle: number, endAngle: number, duration: number): Promise<void> {
      return new Promise((resolve) => {
        wheel.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
        wheelLabels.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
        void wheel.offsetHeight;
        wheel.style.transform = `translate(-50%,-50%) rotate(${endAngle}deg)`;
        wheelLabels.style.transform = `translate(-50%,-50%) rotate(${endAngle}deg)`;
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
      renderGrid(); updateBottomBar(); updateCenterTimer(ROUND_COUNTDOWN);
      void fetchBalance();
    }

    async function startAutomaticSpin(): Promise<void> {
      if (spinning) return;
      spinning = true; bettingOpen = false; roundPhase = "spinning";
      renderGrid(); updateCenterTimer(null);

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
          setNonce(data.nonce);
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
          playSound("win"); 
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
      const newResult = {
        number: winnerNumber,
        multiplier: winData ? winData.multiplier : 0,
        color: colors[numbers.findIndex((n) => n.number === winnerNumber)],
      };
      
      setRecentResults(prev => [newResult, ...prev].slice(0, 5)); 
      
      lastWinnerNumber = winnerNumber;

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
          renderGrid();
        } else {
          bettingOpen = false; updateCenterTimer(null);
          startAutomaticSpin();
        }
      } else if (roundPhase === "spinning") {
        updateCenterTimer(null);
      }
    }

    let dataLoaded = false;
    let minTimePassed = false;

    const checkReady = () => {
      if (dataLoaded && minTimePassed) setIsLoading(false);
    };

    fetchBalance().then(() => {
      dataLoaded = true;
      checkReady();
    });

    setTimeout(() => {
      minTimePassed = true;
      checkReady();
    }, 2500);

    applyWheelRotation(0); renderGrid(); updateBottomBar();
    roundStartTime = Date.now(); roundPhase = "betting"; bettingOpen = true; updateCenterTimer("20");

    timerInterval = setInterval(updateTimer, 100);

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      wheelLabels.innerHTML = "";
    };
  }, [soundOn]); 

  return (
    <>
      <div className={`loading-overlay ${isLoading ? "" : "hidden"}`}>
        <WheelLoader />
      </div>

      <div className="royel-page" id="royelPage">
        
        {/* 👇 Backdrop এখানে সরানো হয়েছে, যাতে পুরো স্ক্রিন ঢাকা পড়ে */}
        {isChipMenuOpen && (
          <div className="chip-radial-backdrop" onClick={() => setIsChipMenuOpen(false)}></div>
        )}

        <div className="round-bar">
          <div className="recent-content">
            <div className="recent-grid">
              {recentResults.map((r, i) => (
                <div key={i} className="recent-cell" style={{ background: r.color }}>
                  <span>{r.number}</span><small>{r.multiplier}X</small>
                </div>
              ))}
            </div>
            <div className="top-controls">
              <MenuBar
                recentResults={recentResults}
                onOpenModal={openModal}
                isSoundOn={soundOn}
                onToggleSound={() => setSoundOn(prev => !prev)}
                clientSeed={clientSeed}
                serverSeedHash={serverSeedHash}
                nonce={nonce}
                onChangeClientSeed={handleClientSeedChange}
              />
            </div>
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
          <div className={`chip-radial-container ${isChipMenuOpen ? "open" : ""}`}>
            {/* ব্যাকড্রপ এখান থেকে সরানো হয়েছে */}

            <div className="chip-arc">
              {chipAmounts.map((amount, index) => {
                const totalChips = chipAmounts.length;
                const startAngle = -75; 
                const endAngle = 75;
                const angleStep = (endAngle - startAngle) / (totalChips - 1);
                const angle = startAngle + index * angleStep;
                
                return (
                  <button
                    key={amount}
                    className={`chip-arc-item ${selectedChip === amount ? "active" : ""}`}
                    style={{
                      "--angle": `${angle}deg`,
                      backgroundImage: `url('${getChipImage(amount)}')`
                    }}
                    onClick={() => {
                      setSelectedChip(amount);
                      setIsChipMenuOpen(false);
                    }}
                  ></button>
                );
              })}
            </div>

            <button 
              className="chip-main-btn"
              style={{ backgroundImage: `url('${getChipImage(selectedChip)}')` }}
              onClick={() => setIsChipMenuOpen(!isChipMenuOpen)}
            ></button>
          </div>

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

        <div className={`modal-backdrop ${modal.open ? "open" : ""}`} onClick={() => setModal(prev => ({ ...prev, open: false }))}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{modal.title}</h3>
              <button className="modal-close" onClick={() => setModal(prev => ({ ...prev, open: false }))}>×</button>
            </div>
            <div id="modalContent" dangerouslySetInnerHTML={{ __html: modal.content }}></div>
          </div>
        </div>
      </div>
    </>
  );
}
