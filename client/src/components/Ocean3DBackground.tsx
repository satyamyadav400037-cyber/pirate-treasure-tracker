import { useEffect, useRef } from "react";

export default function Ocean3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle system for golden sea dust & ocean light motes
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.5 - 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    // 3D Coin parameters
    let coinAngle = 0;
    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Ocean Depth Ambient Gradient
      const bgGradient = ctx.createRadialGradient(
        width * 0.7,
        height * 0.2,
        50,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      bgGradient.addColorStop(0, "rgba(20, 68, 82, 0.15)");
      bgGradient.addColorStop(0.5, "rgba(9, 31, 41, 0.08)");
      bgGradient.addColorStop(1, "rgba(6, 17, 24, 0)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Render Gold Motes / Dust Particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity = p.opacity + Math.sin(p.pulse) * 0.2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(231, 170, 78, ${Math.max(0, currentOpacity)})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#f3c66b";
        ctx.fill();
        ctx.restore();
      });

      // 3. Render 3D Rotating Golden Pirate Doubloon Emblem in top-right corner background
      coinAngle += 0.015;
      const coinX = width - 140;
      const coinY = 130;
      const coinRadius = 38;
      const coinThickness = Math.cos(coinAngle) * coinRadius;

      ctx.save();
      ctx.translate(coinX, coinY);

      // Interactive subtle tilt based on mouse position
      const tiltX = (mouseY - height / 2) * 0.0003;
      const tiltY = (mouseX - width / 2) * 0.0003;
      ctx.rotate(tiltX);

      // Coin Glow
      ctx.shadowBlur = 22;
      ctx.shadowColor = "rgba(243, 198, 107, 0.4)";

      // Draw 3D Coin Edge
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(3, Math.abs(coinThickness)), coinRadius, tiltY, 0, Math.PI * 2);
      const coinGrad = ctx.createLinearGradient(-coinRadius, -coinRadius, coinRadius, coinRadius);
      coinGrad.addColorStop(0, "#fce4ad");
      coinGrad.addColorStop(0.3, "#e7aa4e");
      coinGrad.addColorStop(0.7, "#9a662d");
      coinGrad.addColorStop(1, "#fce4ad");
      ctx.fillStyle = coinGrad;
      ctx.fill();

      // Inner Coin Detail (Engraved Skull Symbol)
      if (Math.abs(coinThickness) > 8) {
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.abs(coinThickness) * 0.75, coinRadius * 0.75, tiltY, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(42, 27, 14, 0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Crossbones mark
        ctx.fillStyle = "rgba(42, 27, 14, 0.85)";
        ctx.font = `${Math.abs(coinThickness) * 0.5}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("☠", 0, 0);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.85,
      }}
    />
  );
}
