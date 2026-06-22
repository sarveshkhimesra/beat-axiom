import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Beat AXIOM",
    short_name: "AXIOM",
    description: "An AI-powered sales duel. Can you beat AXIOM?",
    start_url: "/",
    display: "standalone",
    background_color: "#060810",
    theme_color: "#060810",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
