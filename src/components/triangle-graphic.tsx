"use client";

import { useEffect, useRef } from "react";
import { renderTriangle } from "@/app/triangle";

export function TriangleGraphic() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cleanup: (() => void) | undefined;

    renderTriangle(canvas)
      .then((dispose) => {
        cleanup = dispose;
      })
      .catch((error) => {
        console.error("WebGPU triangle failed to render", error);
      });

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={173}
      className="bg-transparent"
      style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.35))" }}
    />
  );
}

