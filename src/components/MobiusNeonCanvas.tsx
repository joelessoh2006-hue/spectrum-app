import React, { useEffect, useRef } from 'react';

interface MobiusNeonCanvasProps {
  progress: number; // 0.0 to 1.0
  width?: number;
  height?: number;
}

export const MobiusNeonCanvas: React.FC<MobiusNeonCanvasProps> = ({
  progress,
  width = 300,
  height = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI retina display
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (progress <= 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = width * 0.38;

    // Sample points along the lemniscate of Bernoulli
    const totalSamples = 360;
    const targetSample = Math.min(totalSamples, Math.floor(totalSamples * progress));

    const points: { x: number; y: number; t: number }[] = [];
    for (let i = 0; i <= totalSamples; i++) {
      const t = (i / totalSamples) * 2 * Math.PI;
      const denom = 1 + Math.sin(t) * Math.sin(t);
      const x = centerX + (scale * Math.cos(t)) / denom;
      const y = centerY + (scale * Math.sin(t) * Math.cos(t)) / denom;
      points.push({ x, y, t });
    }

    if (points.length === 0) return;

    // Create sweeping neon gradient
    const gradient = ctx.createLinearGradient(centerX - scale, centerY, centerX + scale, centerY);
    gradient.addColorStop(0.0, '#6C5CE7');  // Tech (Purple)
    gradient.addColorStop(0.5, '#55E6C1');  // Curiosité (Emerald)
    gradient.addColorStop(1.0, '#FF7675');  // Art (Amber/Red)

    // Helper to trace the path up to targetSample
    const tracePath = () => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i <= targetSample; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    };

    // 1. Outer Neon Glow Pass
    ctx.save();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#6C5CE7';
    ctx.shadowBlur = 24;
    ctx.globalAlpha = 0.35;
    tracePath();
    ctx.stroke();
    ctx.restore();

    // 2. Mid Neon Glow Pass
    ctx.save();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#55E6C1';
    ctx.shadowBlur = 14;
    ctx.globalAlpha = 0.7;
    tracePath();
    ctx.stroke();
    ctx.restore();

    // 3. Core Crisp Neon Stroke
    ctx.save();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 6;
    ctx.globalAlpha = 1.0;
    tracePath();
    ctx.stroke();
    ctx.restore();

    // 4. Comet head spark at current drawing tip
    if (targetSample > 0 && targetSample <= points.length - 1) {
      const currentPoint = points[targetSample];
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#55E6C1';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, 4.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }, [progress, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="max-w-full drop-shadow-[0_0_20px_rgba(108,92,231,0.25)]"
    />
  );
};
