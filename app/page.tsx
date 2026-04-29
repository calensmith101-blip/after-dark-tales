"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// All story limits, credits, and payment gates have been removed.
// familyUnlocked and forbiddenUnlocked are always true.

const STORAGE_KEY = "adt_profiles_v2";
const SESSION_KEY = "adt_session_v2";
const AGE_KEY = "adt_age_verified_v2";
const FORBIDDEN_KEY = "adt_forbidden_unlocked_v2";

// Old keys from the paywall version — wiped on load so no limits carry over
const LEGACY_KEYS = [
  "adt_story_count_v2",
  "adt_credits_v2",
  "adt_family_unlocked_v2",
  "adt_forbidden_count_v2",
];

function wipeLegacyStorage() {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

const MAIN_GENRES = [
  "Horror",
  "Dark Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Suspense",
  "Romance",
  "Romantasy",
  "Psychological Thriller",
  "Dark Fiction",
  "Magical Dark",
  "Darker Romance",
  "Forbidden Themes",
  "Sensual Tension",
  "Nighttime Fantasy",
  "Paranormal",
  "Supernatural",
  "Gothic",
  "Crime",
  "Historical Fiction",
  "Slow Burn",
  "Enemies to Lovers",
  "Second Chance",
  "Vampire Romance",
  "Werewolf & Shifter",
];

const FORBIDDEN_GENRES = [
  "Explicit Romance",
  "Erotic Thriller",
  "Forbidden Desires",
  "Dark Erotica",
  "Sensual Fantasy",
  "Steamy Paranormal",
  "Erotic Horror",
  "Explicit Dark Fiction",
];

const STORY_LENGTHS = ["Short (10 min)", "Standard (20 min)", "Long (30 min)"];

const STYLE_SUGGESTIONS = [
  "Slow burn and brooding...",
  "Darkly romantic and atmospheric...",
  "Suspenseful with sensual tension...",
  "Gothic and mysterious...",
  "Raw and emotionally intense...",
  "Elegant, literary and immersive...",
  "Fast paced and thrilling...",
  "Deeply atmospheric and cinematic...",
];

type Profile = {
  id: string;
  displayName: string;
  avatar?: string;
};

type Layer = "main" | "forbidden";

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = makeId();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return [
    { id: makeId(), displayName: "" },
    { id: makeId(), displayName: "" },
    { id: makeId(), displayName: "" },
  ];
}

function saveProfiles(profiles: Profile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {}
}

function isAgeVerified(): boolean {
  try {
    return localStorage.getItem(AGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setAgeVerified() {
  try {
    localStorage.setItem(AGE_KEY, "1");
  } catch {}
}

function isForbiddenUnlocked(): boolean {
  try {
    return localStorage.getItem(FORBIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

function unlockForbidden() {
  try {
    localStorage.setItem(FORBIDDEN_KEY, "1");
  } catch {}
}

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeLayer, setActiveLayer] = useState<Layer>("main");
  const [genre, setGenre] = useState("");
  const [style, setStyle] = useState("");
  const [length, setLength] = useState("Short (10 min)");
  const [comments, setComments] = useState("");
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [ageVerified, setAgeVerifiedState] = useState(false);
  const [forbiddenUnlocked, setForbiddenUnlocked] = useState(false);

  const [showAgeGate, setShowAgeGate] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState<Profile | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [ageError, setAgeError] = useState("");

  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | undefined>(undefined);

  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.85);

  const [stylePlaceholder, setStylePlaceholder] = useState(STYLE_SUGGESTIONS[0]);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    wipeLegacyStorage(); // clear old story counts, credits, limits on every load
    setProfiles(loadProfiles());
    setAgeVerifiedState(isAgeVerified());
    setForbiddenUnlocked(isForbiddenUnlocked());
    if (!isAgeVerified()) setShowAgeGate(true);
  }, []);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % STYLE_SUGGESTIONS.length;
      setStylePlaceholder(STYLE_SUGGESTIONS[i]);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const submitAge = () => {
    setAgeError("");
    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);

    if (!day || !month || !year || dobYear.length !== 4) {
      setAgeError("Please enter a valid date of birth.");
      return;
    }

    const dob = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthOffset = today.getMonth() - dob.getMonth();
    if (monthOffset < 0 || (monthOffset === 0 && today.getDate() < dob.getDate())) age--;

    if (age < 18) {
      setAgeError("You must be 18 or over to use After Dark Tales.");
      return;
    }

    setAgeVerified();
    setAgeVerifiedState(true);
    setShowAgeGate(false);
  };

  const startReading = () => {
    if (!story || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(story);
    utterance.rate = speechRate;
    utterance.pitch = 0.95;
    utterance.volume = 1;
    utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
    utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
    utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false); };
    window.speechSynthesis.speak(utterance);
  };

  const pauseReading = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeReading = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const persistProfiles = (nextProfiles: Profile[]) => {
    setProfiles(nextProfiles);
    saveProfiles(nextProfiles);
  };

  const openEdit = (profile: Profile) => {
    setShowEditProfile(profile);
    setEditName(profile.displayName);
    setEditAvatar(profile.avatar);
  };

  const saveProfile = () => {
    if (!showEditProfile) return;
    persistProfiles(
      profiles.map((profile) =>
        profile.id === showEditProfile.id
          ? { ...profile, displayName: editName.trim(), avatar: editAvatar }
          : profile,
      ),
    );
    setShowEditProfile(null);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePressStart = (profile: Profile) => {
    pressTimer.current = setTimeout(() => openEdit(profile), 600);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const generateStory = async () => {
    if (!ageVerified) {
      setShowAgeGate(true);
      return;
    }

    try {
      setLoading(true);
      setStory("");
      stopReading();
      setStatus("Writing your story...");

      const genres = activeLayer === "forbidden" ? FORBIDDEN_GENRES : MAIN_GENRES;
      const usedGenre = genre.trim() || genres[Math.floor(Math.random() * 5)];

      // Always use absolute URL — relative URLs break in Android Capacitor WebViews
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://after-dark-tales.vercel.app";

      const response = await fetch(`${API_BASE_URL}/api/generate-story`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          genre: usedGenre,
          style: style.trim() || "Darkly atmospheric",
          length,
          comments: comments.trim(),
          sessionId: getOrCreateSessionId(),
          ageVerified: true,
          layer: activeLayer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Story API failed:", response.status, data);
        if (data?.error === "ACCESS_SUSPENDED") {
          setStatus("Access unavailable.");
          return;
        }
        if (data?.error === "CONTENT_VIOLATION") {
          setStatus(`Please review your request. ${data.warningsRemaining} warning(s) remaining.`);
          return;
        }
        throw new Error(data?.error || data?.message || "Story generation failed");
      }

      setStory(data.story || "No story generated.");
      setStatus("Story ready.");
    } catch (err) {
      console.error("Android story generation error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      {showAgeGate && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🌙</div>
            <h2 style={{ color: "#d4a853" }}>After Dark Tales</h2>
            <p style={{ color: "#8b7355", marginBottom: 24, fontSize: "0.95rem" }}>
              After Dark Tales is intended for adult readers. Please confirm that you are 18 or over to continue.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
              <input placeholder="DD" maxLength={2} value={dobDay} onChange={(e) => setDobDay(e.target.value)} style={{ width: 60, textAlign: "center" }} />
              <input placeholder="MM" maxLength={2} value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} style={{ width: 60, textAlign: "center" }} />
              <input placeholder="YYYY" maxLength={4} value={dobYear} onChange={(e) => setDobYear(e.target.value)} style={{ width: 80, textAlign: "center" }} />
            </div>
            {ageError && <p style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: 12 }}>{ageError}</p>}
            <button className="btn-primary" onClick={submitAge}>Enter After Dark Tales</button>
            <p style={{ fontSize: "0.72rem", color: "#4a3f30", marginTop: 16 }}>
              Your date of birth is used only to confirm eligibility on this device.
            </p>
          </div>
        </div>
      )}

      <div className="topbar">
        <h1 className="app-title">After Dark Tales</h1>
        <p style={{ color: "#8b7355", fontSize: "0.85rem" }}>Personalised fiction for late-night readers</p>
        <p className="status-text">
          Status: {status}
        </p>
        <p className="status-text">✨ Unlimited reading</p>
        <p style={{ marginTop: 10 }}>
          <Link className="inline-link" href="/privacy">Privacy Policy</Link>
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => { setActiveLayer("main"); setGenre(""); }}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 12,
            border: activeLayer === "main" ? "1px solid #d4a853" : "1px solid rgba(212,168,83,0.2)",
            background: activeLayer === "main" ? "rgba(212,168,83,0.12)" : "rgba(212,168,83,0.03)",
            color: activeLayer === "main" ? "#d4a853" : "#4a3f30",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "sans-serif",
            fontSize: "0.9rem",
          }}
        >
          🌙 Signature Collection
        </button>
        <button
          type="button"
          onClick={() => {
            if (!forbiddenUnlocked) {
              unlockForbidden();
              setForbiddenUnlocked(true);
            }
            setActiveLayer("forbidden");
            setGenre("");
          }}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 12,
            border: activeLayer === "forbidden" ? "1px solid #9f1239" : "1px solid rgba(159,18,57,0.3)",
            background: activeLayer === "forbidden" ? "rgba(159,18,57,0.12)" : "rgba(159,18,57,0.04)",
            color: activeLayer === "forbidden" ? "#fb7185" : "#9f1239",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "sans-serif",
            fontSize: "0.9rem",
          }}
        >
          🔥 After Dark: Forbidden Tales
        </button>
      </div>

      {activeLayer === "forbidden" && (
        <div
          style={{
            background: "rgba(159,18,57,0.08)",
            border: "1px solid rgba(159,18,57,0.3)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <p style={{ margin: 0, color: "#fb7185", fontSize: "0.85rem", fontFamily: "sans-serif" }}>
            🔥 You are viewing the <strong>After Dark: Forbidden Tales</strong> — a more explicit adult fiction layer for verified readers.
          </p>
        </div>
      )}

      <div className="profiles-section">
        <h2 style={{ fontSize: "0.9rem", color: "#4a3f30", marginBottom: 12, fontFamily: "sans-serif" }}>
          Your Profiles <span className="hint-inline">Press and hold to edit</span>
        </h2>
        <div className="profiles-grid">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="profile-card"
              onMouseDown={() => handlePressStart(profile)}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={() => handlePressStart(profile)}
              onTouchEnd={handlePressEnd}
            >
              <div className="profile-avatar" style={{ backgroundImage: profile.avatar ? `url(${profile.avatar})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
                {!profile.avatar && (profile.displayName ? profile.displayName[0].toUpperCase() : "?")}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#8b7355" }}>{profile.displayName || "Empty"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <label>Genre</label>
        <div className="tag-grid">
          {(activeLayer === "forbidden" ? FORBIDDEN_GENRES : MAIN_GENRES).map((item) => (
            <button key={item} type="button" className={`tag ${genre === item ? "tag-active" : ""}`} onClick={() => setGenre(genre === item ? "" : item)}>
              {item}
            </button>
          ))}
        </div>
        {genre && <p className="hint">Selected: {genre} — or enter your own below</p>}
        <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Enter a genre or choose one above..." style={{ marginTop: 8 }} />

        <label style={{ marginTop: 16 }}>Style & Tone</label>
        <input value={style} onChange={(e) => setStyle(e.target.value)} placeholder={stylePlaceholder} />
        <p className="hint">Describe the mood, pace, or atmosphere you want</p>

        <label style={{ marginTop: 16 }}>Story Length</label>
        <div className="tag-grid" style={{ marginTop: 8 }}>
          {STORY_LENGTHS.map((item) => (
            <button key={item} type="button" className={`tag ${length === item ? "tag-active" : ""}`} onClick={() => setLength(item)}>
              {item}
            </button>
          ))}
        </div>

        <label style={{ marginTop: 16 }}>Story Notes</label>
        <textarea
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add characters, themes, settings, or details you'd like included. You can include your own name if you'd like it woven into the story."
        />

        <button
          type="button"
          className="btn-primary"
          onClick={generateStory}
          disabled={loading}
          style={{
            background:
              activeLayer === "forbidden"
                ? "linear-gradient(135deg, #7f1d1d, #9f1239)"
                : "linear-gradient(135deg, #92400e, #d4a853)",
          }}
        >
          {loading
            ? "✨ Writing your story..."
            : activeLayer === "forbidden"
              ? "🔥 Create Forbidden Story"
              : "✨ Create Story"}
        </button>
      </div>

      <div className="card">
        <h2>📖 Your Story</h2>
        <div className="story-box" style={{ fontFamily: "Georgia, serif", lineHeight: 2, fontSize: "1.05rem" }}>
          {story || "Your story will appear here..."}
        </div>

        {story && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: "0.75rem", color: "#4a3f30", minWidth: 90, fontFamily: "sans-serif" }}>Reading speed</span>
              <input type="range" min="0.5" max="1.8" step="0.1" value={speechRate} onChange={(e) => { setSpeechRate(parseFloat(e.target.value)); if (isSpeaking) stopReading(); }} style={{ flex: 1, accentColor: "#d4a853" }} />
              <span style={{ fontSize: "0.75rem", color: "#4a3f30", minWidth: 60, fontFamily: "sans-serif" }}>
                {speechRate <= 0.6 ? "Slow" : speechRate <= 1.0 ? "Normal" : speechRate <= 1.4 ? "Fast" : "Very fast"}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!isSpeaking ? (
                <button type="button" onClick={startReading} style={{ flex: 2, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(212,168,83,0.4)", background: "rgba(212,168,83,0.1)", color: "#d4a853", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>
                  🔊 Read Aloud
                </button>
              ) : (
                <>
                  <button type="button" onClick={isPaused ? resumeReading : pauseReading} style={{ flex: 2, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(212,168,83,0.4)", background: "rgba(212,168,83,0.15)", color: "#d4a853", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>
                    {isPaused ? "▶ Resume" : "⏸ Pause"}
                  </button>
                  <button type="button" onClick={stopReading} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(212,168,83,0.15)", background: "transparent", color: "#8b7355", fontSize: "0.82rem", cursor: "pointer", fontFamily: "sans-serif" }}>
                    ⏹ Stop
                  </button>
                </>
              )}
              <button type="button" onClick={() => { navigator.clipboard?.writeText(story); alert("Story copied."); }} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(212,168,83,0.15)", background: "transparent", color: "#8b7355", fontSize: "0.82rem", cursor: "pointer", fontFamily: "sans-serif" }}>
                📋 Copy
              </button>
              <button type="button" onClick={() => { setShowReportModal(true); setReportSent(false); setReportReason(""); }} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)", color: "#f87171", fontSize: "0.82rem", cursor: "pointer", fontFamily: "sans-serif" }}>
                🚩 Report
              </button>
            </div>

            {isSpeaking && (
              <p style={{ fontSize: "0.75rem", color: "#d4a853", marginTop: 8, textAlign: "center", fontFamily: "sans-serif" }}>
                {isPaused ? "⏸ Paused" : "🔊 Reading aloud — works through Bluetooth speakers and headphones"}
              </p>
            )}
          </div>
        )}
      </div>

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {reportSent ? (
              <>
                <h2>✅ Report Received</h2>
                <p style={{ color: "#8b7355", marginBottom: 20 }}>
                  Thank you. Reports help improve our content safeguards.
                </p>
                <button type="button" className="btn-primary" onClick={() => setShowReportModal(false)}>Close</button>
              </>
            ) : (
              <>
                <h2>🚩 Report Content</h2>
                <p style={{ color: "#8b7355", marginBottom: 16, fontSize: "0.9rem" }}>
                  If this story appears to breach our content rules, please let us know.
                </p>
                <label>Reason</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                  <option value="">Select a reason...</option>
                  <option value="minors">Content involving minors</option>
                  <option value="nonconsensual">Non-consensual content</option>
                  <option value="hateful">Hateful or discriminatory content</option>
                  <option value="other">Other concern</option>
                </select>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!reportReason}
                    onClick={() => {
                      console.error("[REPORT]", { reason: reportReason, time: new Date().toISOString() });
                      setReportSent(true);
                    }}
                  >
                    Submit Report
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: editAvatar ? `url(${editAvatar}) center/cover` : "linear-gradient(135deg, #92400e, #d4a853)",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1.5rem",
                fontWeight: 700,
                border: "2px solid rgba(212,168,83,0.4)",
                color: "#0a0a0f",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {!editAvatar && (editName ? editName[0].toUpperCase() : "?")}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
            <p className="hint" style={{ textAlign: "center", marginBottom: 16 }}>Tap the circle to upload a photo</p>
            <label>Display Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nickname or name..." />
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={saveProfile}>Save Profile</button>
              <button type="button" className="btn-secondary" onClick={() => setShowEditProfile(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
