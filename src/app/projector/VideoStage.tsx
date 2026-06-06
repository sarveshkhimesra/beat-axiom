"use client";

import { VIDEO_SOURCES, VideoKey } from "@/lib/content/videos";

// Full-screen video on the projector. Facilitator drives play/stop.
export function VideoStage({ video }: { video: VideoKey }) {
  const { embedUrl, label } = VIDEO_SOURCES[video];

  if (!embedUrl) {
    return (
      <main className="h-screen w-screen flex flex-col items-center justify-center" style={{ background: "#000" }}>
        <div className="font-mono-display text-2xl" style={{ color: "#8888aa" }}>
          {label} — not set yet
        </div>
        <div className="font-mono-display text-sm mt-2" style={{ color: "#4a5a78" }}>
          add the video embed URL in src/lib/content/videos.ts
        </div>
      </main>
    );
  }

  // No autoplay: the projector just switches to the video player and the
  // operator presses play. A manual play click counts as the user gesture, so
  // the video plays WITH sound — no muted-then-unmute dance.
  return (
    <main className="h-screen w-screen flex items-center justify-center" style={{ background: "#000" }}>
      <iframe
        key={video}
        src={embedUrl}
        title={label}
        className="w-full h-full"
        style={{ border: 0 }}
        allow="encrypted-media; autoplay; fullscreen"
        allowFullScreen
      />
    </main>
  );
}
