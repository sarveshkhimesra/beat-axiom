// Videos shown full-screen on the projector. These are <iframe> embeds
// (hosted externally) — nothing lives in the repo. To swap a video, just change the
// embed URL here, or override via the NEXT_PUBLIC_VIDEO_* env vars.
export type VideoKey = "cinematic" | "demo";

export const VIDEO_SOURCES: Record<VideoKey, { embedUrl: string; label: string }> = {
  cinematic: {
    embedUrl:
      process.env.NEXT_PUBLIC_VIDEO_CINEMATIC || "",
    label: "Cinematic intro",
  },
  demo: {
    embedUrl:
      process.env.NEXT_PUBLIC_VIDEO_DEMO || "",
    label: "How-to-play demo",
  },
};
