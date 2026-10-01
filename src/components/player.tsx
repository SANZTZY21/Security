"use client";
import { useRef, useState } from "react";
import { Maximize, RotateCcw } from "lucide-react";
export function VideoPlayer({
  episodeId,
  sources,
  resume = 0,
  authenticated,
}: {
  episodeId: string;
  sources: { id: string; url: string; height: number | null }[];
  resume?: number;
  authenticated: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [selected, setSelected] = useState(sources[0]?.id);
  const source = sources.find((item) => item.id === selected) || sources[0];
  const restore = useRef({ position: resume, rate: 1, playing: false });
  const switching = useRef(false);
  function changeSource(id: string) {
    const video = ref.current;
    if (!video) return;
    restore.current = {
      position: video.currentTime,
      rate: video.playbackRate,
      playing: !video.paused,
    };
    switching.current = true;
    setError(false);
    setSelected(id);
  }
  const session = useRef<string | null>(null);
  const pending = useRef(false);
  const last = useRef(0);
  const [ad, setAd] = useState<{
    eventId: string;
    name: string;
    image: string;
    destination: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [theater, setTheater] = useState(false);
  const [error, setError] = useState(false);
  async function ping(force = false) {
    const video = ref.current;
    if (
      switching.current ||
      !authenticated ||
      !video ||
      (!force && video.paused) ||
      pending.current ||
      (!force && Date.now() - last.current < 5000)
    )
      return;
    pending.current = true;
    last.current = Date.now();
    try {
      if (!session.current) {
        const res = await fetch("/api/playback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ episodeId }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        session.current = body.data;
      } else {
        const res = await fetch("/api/playback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.current,
            position: video.currentTime,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        if (body.data.ad) {
          setAd(body.data.ad);
          video.pause();
          setMessage("Jeda sponsor setelah dua episode selesai.");
        } else if (body.data.ad_due) {
          setMessage(
            "Jeda sponsor: tidak ada kampanye aktif saat ini. Kamu dapat melanjutkan menonton.",
          );
        } else if (body.data.completed)
          setMessage("Episode selesai. Progres dan XP telah disimpan.");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Progres belum tersimpan.");
    } finally {
      pending.current = false;
    }
  }
  return (
    <div className={theater ? "video-shell theater" : "video-shell"}>
      <video
        ref={ref}
        controls
        playsInline
        preload="metadata"
        src={source?.url}
        onLoadedMetadata={() => {
          const video = ref.current;
          if (!video) return;
          video.currentTime = Math.min(
            restore.current.position,
            video.duration,
          );
          video.playbackRate = restore.current.rate;
          switching.current = false;
          if (restore.current.playing)
            void video
              .play()
              .catch(() => setMessage("Tekan putar untuk melanjutkan."));
        }}
        onPlay={() => void ping()}
        onTimeUpdate={() => void ping()}
        onEnded={() => void ping(true)}
        onPause={() => void ping(true)}
        onError={() => setError(true)}
        aria-label="Pemutar video berizin"
      />
      <div className="player-toolbar">
        <span className="green">● SUMBER BERIZIN</span>
        <label>
          Resolusi{" "}
          <select
            aria-label="Resolusi video"
            value={source?.id}
            onChange={(event) => changeSource(event.target.value)}
          >
            {sources.map((item, index) => (
              <option key={item.id} value={item.id}>
                {item.height ? `${item.height}p` : "Asli"}
                {sources.filter((s) => s.height === item.height).length > 1
                  ? ` · sumber ${index + 1}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kecepatan{" "}
          <select
            aria-label="Kecepatan pemutaran"
            defaultValue="1"
            onChange={(e) => {
              if (ref.current)
                ref.current.playbackRate = Number(e.target.value);
            }}
          >
            {[0.5, 1, 1.25, 1.5, 2].map((n) => (
              <option key={n} value={n}>
                {n}×
              </option>
            ))}
          </select>
        </label>
        <button
          className="icon-button"
          onClick={() => setTheater(!theater)}
          aria-label="Mode teater"
        >
          <Maximize size={18} />
        </button>
      </div>
      {ad && (
        <section className="panel sponsor-panel" aria-label="Iklan sponsor">
          <span className="eyebrow">SPONSOR ZETAHUB</span>
          <h3>{ad.name}</h3>
          <a
            href={ad.destination}
            target="_blank"
            rel="sponsored noopener noreferrer"
          >
            <img
              src={ad.image}
              alt={ad.name}
              onLoad={() =>
                void fetch("/api/ads", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    eventId: ad.eventId,
                    status: "shown",
                  }),
                })
              }
              onError={() => {
                void fetch("/api/ads", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    eventId: ad.eventId,
                    status: "unavailable",
                  }),
                });
                setAd(null);
                setMessage("Sponsor tidak dapat dimuat. Silakan lanjutkan.");
              }}
            />
          </a>
          <button
            className="button outline"
            onClick={() => {
              void fetch("/api/ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  eventId: ad.eventId,
                  status: "dismissed",
                }),
              });
              setAd(null);
              setMessage("Kamu dapat melanjutkan ke episode berikutnya.");
            }}
          >
            Lanjutkan menonton
          </button>
        </section>
      )}
      {error && (
        <div className="notice" role="alert">
          Video gagal dimuat. Periksa jaringan Anda.
          <button
            className="button outline"
            onClick={() => {
              if (ref.current) {
                restore.current = {
                  position: ref.current.currentTime || restore.current.position,
                  rate: ref.current.playbackRate,
                  playing: true,
                };
                switching.current = true;
                setError(false);
                ref.current.load();
              }
            }}
          >
            <RotateCcw size={15} /> Coba lagi
          </button>
        </div>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {!authenticated && (
        <p className="notice">
          Masuk untuk menyimpan progres dan mendapatkan XP.
        </p>
      )}
    </div>
  );
}
