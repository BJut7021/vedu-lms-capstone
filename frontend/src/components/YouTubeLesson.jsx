import { useEffect, useRef, useState } from "react";
import { youtubeId } from "../services/video";
let loading;
function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!loading)
    loading = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          reject(
            new Error(
              "Trình phát YouTube không phản hồi. Kiểm tra kết nối hoặc mở nguồn gốc.",
            ),
          ),
        15000,
      );
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout);
        previous?.();
        resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Không tải được trình phát YouTube."));
      };
      document.head.appendChild(script);
    });
  return loading;
}
export default function YouTubeLesson({
  url,
  title,
  mediaRef,
  onEvent,
  onReady,
}) {
  const host = useRef(null),
    callbacks = useRef({ onEvent, onReady });
  const [error, setError] = useState("");
  useEffect(() => {
    callbacks.current = { onEvent, onReady };
  }, [onEvent, onReady]);
  useEffect(() => {
    let cancelled = false,
      player,
      restored = false;
    loadApi()
      .then((YT) => {
        if (cancelled) return;
        const child = document.createElement("div");
        host.current.appendChild(child);
        player = new YT.Player(child, {
          videoId: youtubeId(url),
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: {
            origin: window.location.origin,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              mediaRef.current = {
                get duration() {
                  return player.getDuration();
                },
                get currentTime() {
                  return player.getCurrentTime();
                },
                set currentTime(v) {
                  player.seekTo(v, true);
                },
                get paused() {
                  return player.getPlayerState() !== 1;
                },
                get playbackRate() {
                  return player.getPlaybackRate();
                },
                get readyState() {
                  return player.getDuration() > 0 ? 1 : 0;
                },
                pause() {
                  player.pauseVideo();
                },
              };
              restored = callbacks.current.onReady?.() === true;
            },
            onStateChange: (e) => {
              if (e.data === 1) {
                if (!restored)
                  restored = callbacks.current.onReady?.() === true;
                callbacks.current.onEvent?.({ seeking: true });
              } else if ([0, 2].includes(e.data))
                callbacks.current.onEvent?.({ playing: true });
              else if (e.data === 3)
                callbacks.current.onEvent?.({ seeking: true });
            },
            onPlaybackRateChange: () =>
              callbacks.current.onEvent?.({ seeking: true }),
            onError: () => {
              if (!cancelled)
                setError(
                  "Nguồn video không cho phát/nhúng hoặc tạm không khả dụng. Mở liên kết gốc; xem bên ngoài không được tự ghi nhận tiến độ trong VEDU.",
                );
            },
          },
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
      player?.destroy();
      mediaRef.current = null;
    };
  }, [url, mediaRef]);
  return (
    <div className="space-y-3">
      <div
        ref={host}
        title={title}
        className="aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black [&_iframe]:h-full [&_iframe]:w-full"
      />
      {error && (
        <p role="alert" className="text-sm text-amber-700">
          {error}
        </p>
      )}
      <p className="text-xs text-slate-500">
        Video nguồn YouTube/LearnFree, có thể phát sinh kết nối với bên cung
        cấp.{" "}
        <a href={url} target="_blank" rel="noreferrer" className="underline">
          Mở nguồn gốc
        </a>
        . Không tải lại hoặc nhận là video do VEDU sản xuất.
      </p>
    </div>
  );
}
