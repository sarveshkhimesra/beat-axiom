"use client";

import { useEffect, useState } from "react";

// Decrypts text on screen — scrambles glyphs, then resolves left-to-right into
// the real message. The "fun" reveal for a secret dropping onto the projector.
export function DecryptText({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    const glyphs = "!<>-_\\/[]{}=+*^?#@$%&░▒▓01";
    const frames = 34;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / frames) * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (i < reveal || text[i] === " " || text[i] === "\n") out += text[i];
        else out += glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      setShown(out);
      if (frame >= frames) {
        setShown(text);
        clearInterval(id);
      }
    }, 45);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span className={className} style={style}>
      {shown}
    </span>
  );
}
