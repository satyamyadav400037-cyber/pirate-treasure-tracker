import React, { useState, useEffect, useRef } from "react";
import {
  Anchor, Award, BarChart3, Coins, Compass, Download, Edit3, Flame, Gift, Globe, Grid2X2, HelpCircle,
  Key, Lock, MapPin, Music, Navigation, Shield, ShieldAlert, Skull, Sparkles, Sword, Volume2, VolumeX, Waves, Zap
} from "lucide-react";
import { toast } from "sonner";

// ==========================================
// 1. CAPTAINS ROSTER MODAL
// ==========================================
export type Captain = {
  id: string;
  name: string;
  ship: string;
  rank: string;
  morale: number; // 0-100
  crewCount: number;
  assignedIsland: string;
  flagshipImage: string;
};

const INITIAL_CAPTAINS: Captain[] = [
  { id: "cap-1", name: "Captain Edward 'Blackbeard' Teach", ship: "Queen Anne's Revenge", rank: "Commodore", morale: 94, crewCount: 180, assignedIsland: "Tortuga Haven", flagshipImage: "🏴‍☠️" },
  { id: "cap-2", name: "Captain Anne Bonny", ship: "The Bloody Gem", rank: "First Mate Commander", morale: 88, crewCount: 110, assignedIsland: "Port Royal Harbor", flagshipImage: "⚔️" },
  { id: "cap-3", name: "Captain Henry Morgan", ship: "Satisfaction", rank: "Admiral of the Fleet", morale: 96, crewCount: 240, assignedIsland: "Isla de Muerta", flagshipImage: "👑" },
  { id: "cap-4", name: "Captain Calico Jack Rackham", ship: "The Royal James", rank: "Corsair Captain", morale: 79, crewCount: 85, assignedIsland: "Smuggler's Cove", flagshipImage: "💀" },
  { id: "cap-5", name: "Captain Madame Ching", ship: "Red Flag Sovereign", rank: "Grand Pirate Queen", morale: 99, crewCount: 320, assignedIsland: "Malabar Bay", flagshipImage: "🐉" },
];

export function CaptainsRosterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [captains, setCaptains] = useState<Captain[]>(INITIAL_CAPTAINS);
  const [totalLoot, setTotalLoot] = useState<number>(450000);

  if (!isOpen) return null;

  const captainShare = Math.round((totalLoot * 0.20) / Math.max(captains.length, 1));
  const crewShare = Math.round((totalLoot * 0.80) / Math.max(captains.reduce((acc, c) => acc + c.crewCount, 0), 1));

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="treasure-modal" style={{ width: "min(680px, 94vw)" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">FLEET COMMAND</span>
            <h2>🏴‍☠️ Pirate Captains & Crew Roster</h2>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        {/* Pirate Code Share Calculator */}
        <div style={{ background: "rgba(243, 198, 107, 0.1)", border: "1px solid rgba(243, 198, 107, 0.3)", padding: "12px", borderRadius: "8px", margin: "14px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          <div>
            <span style={{ fontSize: "10px", color: "#819698", display: "block" }}>TOTAL FLEET PLUNDER</span>
            <b style={{ color: "#f3c66b", fontSize: "15px" }}>{new Intl.NumberFormat().format(totalLoot)} Doubloons</b>
          </div>
          <div>
            <span style={{ fontSize: "10px", color: "#819698", display: "block" }}>PIRATE CAPTAIN SHARE (20%)</span>
            <b style={{ color: "#4bd68b", fontSize: "15px" }}>{new Intl.NumberFormat().format(captainShare)} / Captain</b>
          </div>
          <div>
            <span style={{ fontSize: "10px", color: "#819698", display: "block" }}>CREW MEMBER SHARE (80%)</span>
            <b style={{ color: "#60a5fa", fontSize: "15px" }}>{new Intl.NumberFormat().format(crewShare)} / Pirate</b>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
          {captains.map((cap) => (
            <div key={cap.id} style={{ background: "rgba(12, 37, 46, 0.8)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "28px" }}>{cap.flagshipImage}</span>
                <div>
                  <strong style={{ color: "#f3c66b", fontSize: "14px", display: "block" }}>{cap.name}</strong>
                  <span style={{ color: "#d5e5e5", fontSize: "11px" }}>Ship: <b>{cap.ship}</b> ({cap.rank})</span>
                  <small style={{ display: "block", color: "#819698", fontSize: "10px" }}>Stationed: {cap.assignedIsland} · Crew: {cap.crewCount} corsairs</small>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10px", color: "#819698", display: "block" }}>Crew Morale</span>
                <b style={{ color: cap.morale > 85 ? "#4bd68b" : "#f5bb42", fontSize: "13px" }}>{cap.morale}%</b>
                <button
                  style={{ marginTop: "4px", padding: "3px 8px", background: "rgba(243, 198, 107, 0.2)", color: "#f3c66b", border: "1px solid #f3c66b", borderRadius: "4px", fontSize: "10px", cursor: "pointer" }}
                  onClick={() => toast.success(`Boosted morale for ${cap.name}'s crew with rum ration!`)}
                >
                  🍺 Give Rum Rations
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. CURSED ARTIFACTS & CLUE DECODER MODAL
// ==========================================
export function ClueDecoderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [riddleInput, setRiddleInput] = useState("");
  const [decryptedText, setDecryptedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecode = () => {
    if (!riddleInput.trim()) return;
    if (riddleInput.toLowerCase().includes("blackbeard") || riddleInput.toLowerCase().includes("tortuga")) {
      setDecryptedText("✨ SOLVED! Secret Coordinates Unlocked: Lat 18.42° N, Lng -77.10° W [Gold Vault Beneath Dead Man's Cave]");
    } else {
      setDecryptedText(`📜 Decoded Cipher: "${riddleInput.toUpperCase().split("").reverse().join("")}" -> Check the eastern reefs under full moon.`);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="treasure-modal" style={{ width: "min(560px, 94vw)" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">MYSTERIOUS CIPHER</span>
            <h2>📜 Cursed Artifacts & Clue Decoder</h2>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: "rgba(168, 85, 247, 0.12)", border: "1px solid rgba(168, 85, 247, 0.3)", padding: "12px", borderRadius: "8px", margin: "12px 0" }}>
          <strong style={{ color: "#c084fc", fontSize: "13px", display: "block" }}>🔮 Known Cursed Relics Charted:</strong>
          <ul style={{ fontSize: "11px", color: "#e9d5ff", marginTop: "6px", paddingLeft: "16px", lineHeight: "1.6" }}>
            <li><b>Aztec Gold Medallion:</b> Curse Level: <i>HIGH</i> (Ghost Fleet Summoner)</li>
            <li><b>Kraken Abyssal Skull:</b> Curse Level: <i>CATASTROPHIC</i> (Tidal Whirlpools)</li>
            <li><b>Blood Ruby of Tortuga:</b> Curse Level: <i>LOW</i> (Attracts Privateers)</li>
          </ul>
        </div>

        <div className="form-group" style={{ marginTop: "14px" }}>
          <label style={{ color: "#f3c66b" }}>Enter Pirate Cipher Riddle Note:</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Tortuga Blackbeard 1718..."
            value={riddleInput}
            onChange={(e) => setRiddleInput(e.target.value)}
          />
        </div>

        <button className="button gold wide" style={{ marginTop: "10px" }} onClick={handleDecode}>
          🔑 Decrypt Clue Cipher
        </button>

        {decryptedText && (
          <div style={{ background: "rgba(75, 214, 139, 0.15)", border: "1px solid #4bd68b", padding: "12px", borderRadius: "8px", marginTop: "14px", color: "#4bd68b", fontSize: "12px", fontWeight: "bold" }}>
            {decryptedText}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. TREASURE COMMODITY EXCHANGE
// ==========================================
export function CommodityExchangeCard({ totalValue }: { totalValue: number }) {
  const spanishDollars = Math.round(totalValue * 2.2);
  const rumBarrels = Math.round(totalValue / 450);
  const ironCannons = Math.round(totalValue / 1200);
  const silkBales = Math.round(totalValue / 850);
  const piecesOfEight = Math.round(totalValue * 8);

  return (
    <div className="chart-card panel" style={{ marginTop: "14px" }}>
      <div className="chart-head">
        <div>
          <span className="eyebrow">COMMODITY VALUATION</span>
          <h3>💰 Treasure Loot Commodity Converter</h3>
        </div>
        <Coins size={22} color="#f3c66b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginTop: "16px" }}>
        <div style={{ background: "rgba(12,37,46,0.8)", border: "1px solid rgba(243,198,107,0.2)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
          <span style={{ fontSize: "20px" }}>💵</span>
          <b style={{ display: "block", color: "#f3c66b", fontSize: "14px", marginTop: "4px" }}>{new Intl.NumberFormat().format(spanishDollars)}</b>
          <small style={{ color: "#819698", fontSize: "10px" }}>Spanish Dollars</small>
        </div>

        <div style={{ background: "rgba(12,37,46,0.8)", border: "1px solid rgba(243,198,107,0.2)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
          <span style={{ fontSize: "20px" }}>🍺</span>
          <b style={{ display: "block", color: "#f5bb42", fontSize: "14px", marginTop: "4px" }}>{new Intl.NumberFormat().format(rumBarrels)}</b>
          <small style={{ color: "#819698", fontSize: "10px" }}>Barrels of Rum</small>
        </div>

        <div style={{ background: "rgba(12,37,46,0.8)", border: "1px solid rgba(243,198,107,0.2)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
          <span style={{ fontSize: "20px" }}>💣</span>
          <b style={{ display: "block", color: "#ff6861", fontSize: "14px", marginTop: "4px" }}>{new Intl.NumberFormat().format(ironCannons)}</b>
          <small style={{ color: "#819698", fontSize: "10px" }}>Iron Cannons</small>
        </div>

        <div style={{ background: "rgba(12,37,46,0.8)", border: "1px solid rgba(243,198,107,0.2)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
          <span style={{ fontSize: "20px" }}>📜</span>
          <b style={{ display: "block", color: "#60a5fa", fontSize: "14px", marginTop: "4px" }}>{new Intl.NumberFormat().format(silkBales)}</b>
          <small style={{ color: "#819698", fontSize: "10px" }}>Silk Bales</small>
        </div>

        <div style={{ background: "rgba(12,37,46,0.8)", border: "1px solid rgba(243,198,107,0.2)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
          <span style={{ fontSize: "20px" }}>🪙</span>
          <b style={{ display: "block", color: "#4bd68b", fontSize: "14px", marginTop: "4px" }}>{new Intl.NumberFormat().format(piecesOfEight)}</b>
          <small style={{ color: "#819698", fontSize: "10px" }}>Pieces of Eight</small>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. PIRATE SOUND DECK ENGINE
// ==========================================
export function PirateSoundDeck() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSoundEffect = (type: "waves" | "cannon" | "coin") => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === "coin") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      } else if (type === "cannon") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      } else {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      toast.success(`🔊 Playing Pirate SFX: ${type.toUpperCase()}`);
    } catch {
      toast.error("Audio Web Synthesizer blocked by browser.");
    }
  };

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <button className="button ghost compact" onClick={() => playSoundEffect("waves")} title="Ocean Waves Sound">
        🌊 Waves
      </button>
      <button className="button ghost compact" onClick={() => playSoundEffect("cannon")} title="Cannon Fire Sound">
        💣 Cannon
      </button>
      <button className="button ghost compact" onClick={() => playSoundEffect("coin")} title="Gold Coins Sound">
        🪙 Coins
      </button>
    </div>
  );
}

// ==========================================
// 7. WANTED PIRATES BOUNTY BOARD
// ==========================================
export function BountyBoardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const bounties = [
    { name: "Rear Admiral Lord Thomas Hamilton", bounty: "250,000 Doubloons", navy: "Royal Navy Battleship Commander", location: "Hispaniola Trench" },
    { name: "Captain Hector Barbossa", bounty: "180,000 Doubloons", navy: "Privateer Marauder", location: "Isla de Muerta" },
    { name: "Don Juan de Silva", bounty: "300,000 Doubloons", navy: "Spanish Armada Treasure Fleet Admiral", location: "Malabar Coast" },
  ];

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="treasure-modal" style={{ width: "min(620px, 94vw)" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">MOST WANTED ENEMY TARGETS</span>
            <h2>🎯 Royal Navy & Corsair Bounty Board</h2>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
          {bounties.map((b, idx) => (
            <div key={idx} style={{ background: "rgba(185, 28, 28, 0.15)", border: "1px solid #f87171", padding: "12px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "#ff6861", fontSize: "14px" }}>{b.name}</strong>
                <span style={{ color: "#d5e5e5", fontSize: "11px", display: "block" }}>{b.navy}</span>
                <small style={{ color: "#819698", fontSize: "10px" }}>Last Spotted: {b.location}</small>
              </div>
              <div style={{ textAlign: "right" }}>
                <b style={{ color: "#f3c66b", fontSize: "14px", display: "block" }}>{b.bounty}</b>
                <button
                  style={{ marginTop: "4px", padding: "4px 8px", background: "#e7aa4e", color: "#102832", border: "0", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                  onClick={() => toast.success(`Target ${b.name} tracked on naval chart!`)}
                >
                  🎯 Track Target
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 9. PIRATE CODE RULEBOOK MODAL
// ==========================================
export function PirateCodeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="treasure-modal" style={{ width: "min(600px, 94vw)" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">THE BROTHERHOOD ARTICLES</span>
            <h2>📜 Pirate Code & Articles Compliance</h2>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: "rgba(12, 37, 46, 0.9)", border: "1px solid rgba(243, 198, 107, 0.3)", padding: "14px", borderRadius: "8px", marginTop: "14px", lineHeight: "1.6", fontSize: "12px", color: "#d5e5e5" }}>
          <strong style={{ color: "#f3c66b", display: "block", marginBottom: "8px" }}>ARTICLE I: EQUAL VOTES & EQUAL SHARES</strong>
          Every corsair has an equal vote in affairs of moment and equal title to fresh provisions and strong liquor.<br /><br />
          <strong style={{ color: "#f3c66b", display: "block", marginBottom: "8px" }}>ARTICLE II: HONESTY IN PLUNDER</strong>
          If any crew member defrauds the company to the value of a single doubloon, they shall be marooned on an uninhabited key.<br /><br />
          <strong style={{ color: "#f3c66b", display: "block", marginBottom: "8px" }}>ARTICLE III: NIGHT LIGHTS OUT</strong>
          The candles and lamps to be put out at eight o'clock at night. If any crew desire to drink after that hour, they shall do so on open deck.
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 10. TAVERN & TRADE PORT RUM ECONOMY
// ==========================================
export function TavernRumEconomyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="treasure-modal" style={{ width: "min(580px, 94vw)" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">CONTRABAND COMMERCE</span>
            <h2>🍻 Tavern & Trade Port Rum Economy</h2>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "14px" }}>
          <div style={{ background: "rgba(12,37,46,0.8)", border: "1px solid rgba(243,198,107,0.2)", padding: "12px", borderRadius: "8px" }}>
            <strong style={{ color: "#f3c66b", fontSize: "13px" }}>Tortuga Tavern Rum Rate</strong>
            <b style={{ display: "block", color: "#4bd68b", fontSize: "16px", marginTop: "4px" }}>12 Doubloons / Barrel</b>
            <small style={{ color: "#819698", fontSize: "10px" }}>High Stock · Excellent Quality</small>
          </div>

          <div style={{ background: "rgba(12,37,46,0.8)", border: "1px solid rgba(243,198,107,0.2)", padding: "12px", borderRadius: "8px" }}>
            <strong style={{ color: "#f3c66b", fontSize: "13px" }}>Port Royal Trade Price</strong>
            <b style={{ display: "block", color: "#ff6861", fontSize: "16px", marginTop: "4px" }}>24 Doubloons / Barrel</b>
            <small style={{ color: "#819698", fontSize: "10px" }}>Naval Embargo · Scarce Supply</small>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 11. LEGENDARY ACHIEVEMENTS MODAL
// ==========================================
export function AchievementsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const trophies = [
    { title: "⚓ Master Navigator", desc: "Plotted over 10 distinct island treasure caches.", unlocked: true, icon: "🧭" },
    { title: "🦑 Kraken Slayer", desc: "Navigated past 5 Leviathan & Whirlpool Danger Zones.", unlocked: true, icon: "⚔️" },
    { title: "🪙 Millionaire Captain", desc: "Accumulated over 1,000,000 doubloons in total ledger gold.", unlocked: true, icon: "👑" },
    { title: "👻 Ghost Fleet Commander", desc: "Sailed the Black Pearl across 500 Nautical Miles.", unlocked: true, icon: "🏴‍☠️" },
  ];

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="treasure-modal" style={{ width: "min(600px, 94vw)" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">HONORS & TROPHIES</span>
            <h2>🏆 Legendary Pirate Achievements</h2>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "14px" }}>
          {trophies.map((t, idx) => (
            <div key={idx} style={{ background: "rgba(12,37,46,0.8)", border: "1px solid rgba(75,214,139,0.3)", padding: "12px", borderRadius: "8px", display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "28px" }}>{t.icon}</span>
              <div>
                <strong style={{ color: "#4bd68b", fontSize: "13px", display: "block" }}>{t.title}</strong>
                <span style={{ color: "#819698", fontSize: "10px" }}>{t.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 12. FINANCIAL FLEET PROJECTIONS CARD
// ==========================================
export function FleetProjectionsCard() {
  return (
    <div className="chart-card panel" style={{ marginTop: "14px" }}>
      <div className="chart-head">
        <div>
          <span className="eyebrow">FINANCIAL FORECAST</span>
          <h3>📊 Fleet Plunder & Repair Projection</h3>
        </div>
        <BarChart3 size={20} color="#4bd68b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "14px" }}>
        <div style={{ background: "rgba(12,37,46,0.8)", padding: "12px", borderRadius: "8px" }}>
          <span style={{ fontSize: "10px", color: "#819698" }}>PROJECTED Q3 PLUNDER</span>
          <b style={{ color: "#4bd68b", fontSize: "15px", display: "block", marginTop: "2px" }}>+320,000 Gold</b>
        </div>
        <div style={{ background: "rgba(12,37,46,0.8)", padding: "12px", borderRadius: "8px" }}>
          <span style={{ fontSize: "10px", color: "#819698" }}>ESTIMATED FLEET REPAIRS</span>
          <b style={{ color: "#ff6861", fontSize: "15px", display: "block", marginTop: "2px" }}>-45,000 Gold</b>
        </div>
        <div style={{ background: "rgba(12,37,46,0.8)", padding: "12px", borderRadius: "8px" }}>
          <span style={{ fontSize: "10px", color: "#819698" }}>NET CREW DIVIDEND</span>
          <b style={{ color: "#f3c66b", fontSize: "15px", display: "block", marginTop: "2px" }}>+275,000 Gold</b>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 13. JOLLY ROGER FLAG BUILDER MODAL
// ==========================================
export function JollyRogerBuilderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [bgColor, setBgColor] = useState("#060e12");
  const [symbol, setSymbol] = useState("☠️");

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="treasure-modal" style={{ width: "min(500px, 94vw)" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">FLEET EMBLEM DESIGNER</span>
            <h2>🏴‍☠️ Custom Jolly Roger Flag Builder</h2>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
          <div style={{ width: "220px", height: "140px", background: bgColor, border: "3px solid #f3c66b", borderRadius: "8px", display: "grid", placeItems: "center", fontSize: "52px", boxShadow: "0 0 20px rgba(0,0,0,0.8)" }}>
            {symbol}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "14px" }}>
          <button className="button ghost compact" onClick={() => setSymbol("☠️")}>☠️ Skull</button>
          <button className="button ghost compact" onClick={() => setSymbol("⚔️")}>⚔️ Cutlasses</button>
          <button className="button ghost compact" onClick={() => setSymbol("👑")}>👑 Crown</button>
          <button className="button ghost compact" onClick={() => setSymbol("🐉")}>🐉 Dragon</button>
        </div>

        <button className="button gold wide" onClick={() => { toast.success("Custom Jolly Roger hoisted on Flagship!"); onClose(); }}>
          🏴‍☠️ Hoist Custom Flag
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 14. CAPTAIN'S LOGBOOK & JOURNAL EDITOR MODAL
// ==========================================
export function LogbookEditorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [logTitle, setLogTitle] = useState("");
  const [logBody, setLogBody] = useState("");
  const [entries, setEntries] = useState<{ title: string; body: string; date: string }[]>([
    { title: "Sighted Royal Navy Frigate near Tortuga", body: "Winds favor our course. Blackbeard ordered full sail towards smuggler bay.", date: "15 June 1718" },
  ]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!logTitle.trim()) return;
    setEntries([{ title: logTitle, body: logBody, date: new Date().toLocaleDateString() }, ...entries]);
    setLogTitle("");
    setLogBody("");
    toast.success("Captain log entry recorded into voyage journal!");
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="treasure-modal" style={{ width: "min(640px, 94vw)" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">VOYAGE JOURNAL</span>
            <h2>📓 Captain's Logbook & Journal Editor</h2>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div className="form-group" style={{ marginTop: "12px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Log Title (e.g. Sighted Spanish Galleon...)"
            value={logTitle}
            onChange={(e) => setLogTitle(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginTop: "8px" }}>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Record captain notes, weather observations, and plunder notes..."
            value={logBody}
            onChange={(e) => setLogBody(e.target.value)}
          />
        </div>

        <button className="button gold wide" style={{ marginTop: "8px" }} onClick={handleSave}>
          ✍️ Record Journal Entry
        </button>

        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
          {entries.map((item, idx) => (
            <div key={idx} style={{ background: "rgba(12, 37, 46, 0.8)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong style={{ color: "#f3c66b", fontSize: "12px" }}>{item.title}</strong>
                <small style={{ color: "#819698", fontSize: "10px" }}>{item.date}</small>
              </div>
              <p style={{ color: "#d5e5e5", fontSize: "11px", marginTop: "4px" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
