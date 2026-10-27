import React, { useEffect, useRef } from 'react';
import { useInvestigation, ThreatStage } from '../../context/InvestigationContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
}

interface DataPacket {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

export const LivingCyberBackground: React.FC = () => {
  const { activeStage, activeModule } = useInvestigation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Responsive particle count
    const isTextHeavy = activeModule === 'audit-ledger' || activeModule === 'privacy' || activeModule === 'terms';
    const baseParticleCount = prefersReducedMotion ? 0 : isTextHeavy ? 24 : Math.min(65, Math.floor((width * height) / 22000));

    // Palettes based on activeStage
    const getStageColors = (stage: ThreatStage) => {
      switch (stage) {
        case 'OBSERVE':
          return { primary: 'rgba(117, 150, 200, ', accent: 'rgba(198, 164, 90, ', highlight: 'rgba(0, 210, 255, ' };
        case 'TRACE':
          return { primary: 'rgba(198, 164, 90, ', accent: 'rgba(0, 210, 255, ', highlight: 'rgba(255, 215, 0, ' };
        case 'DETECT':
          return { primary: 'rgba(168, 85, 247, ', accent: 'rgba(224, 82, 82, ', highlight: 'rgba(198, 164, 90, ' };
        case 'RESPOND':
          return { primary: 'rgba(224, 82, 82, ', accent: 'rgba(198, 164, 90, ', highlight: 'rgba(16, 185, 129, ' };
        case 'TOOLS':
          return { primary: 'rgba(16, 185, 129, ', accent: 'rgba(117, 150, 200, ', highlight: 'rgba(198, 164, 90, ' };
        default:
          return { primary: 'rgba(117, 150, 200, ', accent: 'rgba(198, 164, 90, ', highlight: 'rgba(0, 210, 255, ' };
      }
    };

    const colors = getStageColors(activeStage);

    // Initialize Particles
    const particles: Particle[] = [];
    for (let i = 0; i < baseParticleCount; i++) {
      const isGold = Math.random() < 0.25;
      const isHighlight = !isGold && Math.random() < 0.2;
      const colPrefix = isGold ? colors.accent : isHighlight ? colors.highlight : colors.primary;
      const baseA = Math.random() * 0.45 + 0.15;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 1.0,
        alpha: baseA,
        baseAlpha: baseA,
        color: colPrefix,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // Dynamic Data Packets (transactions flowing along particle edges)
    const dataPackets: DataPacket[] = [];
    const maxPackets = prefersReducedMotion ? 0 : 8;

    const spawnDataPacket = () => {
      if (particles.length < 2 || dataPackets.length >= maxPackets) return;
      const i1 = Math.floor(Math.random() * particles.length);
      let i2 = Math.floor(Math.random() * particles.length);
      while (i2 === i1) {
        i2 = Math.floor(Math.random() * particles.length);
      }

      const p1 = particles[i1];
      const p2 = particles[i2];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

      // Only spawn between reasonably close particles
      if (dist < 220) {
        dataPackets.push({
          fromX: p1.x,
          fromY: p1.y,
          toX: p2.x,
          toY: p2.y,
          progress: 0,
          speed: 0.008 + Math.random() * 0.012,
          color: Math.random() < 0.4 ? 'rgba(198, 164, 90, ' : 'rgba(0, 210, 255, ',
          size: Math.random() * 1.5 + 2.0
        });
      }
    };

    let tick = 0;
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      tick++;
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Cyber Ambient Radial Vignette
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        width * 0.75
      );
      grad.addColorStop(0, 'rgba(17, 23, 34, 0.4)');
      grad.addColorStop(1, 'rgba(8, 10, 15, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle Coordinate Grid Lines (very low alpha)
      ctx.strokeStyle = 'rgba(117, 150, 200, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      const gridOffset = (tick * 0.1) % gridSize;

      ctx.beginPath();
      for (let x = gridOffset; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gridOffset; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 3. Update & Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around borders
        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        // Pulsing alpha
        p.pulsePhase += p.pulseSpeed;
        const currentAlpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.15;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.05, currentAlpha)})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.hypot(dx, dy);

          const maxDist = 140;
          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(117, 150, 200, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 4. Update & Draw Data Packets
      if (tick % 60 === 0 && Math.random() < 0.6) {
        spawnDataPacket();
      }

      for (let k = dataPackets.length - 1; k >= 0; k--) {
        const dp = dataPackets[k];
        dp.progress += dp.speed;

        if (dp.progress >= 1) {
          dataPackets.splice(k, 1);
          continue;
        }

        const currX = dp.fromX + (dp.toX - dp.fromX) * dp.progress;
        const currY = dp.fromY + (dp.toY - dp.fromY) * dp.progress;

        // Glow head
        ctx.beginPath();
        ctx.arc(currX, currY, dp.size, 0, Math.PI * 2);
        ctx.fillStyle = `${dp.color}0.9)`;
        ctx.shadowColor = dp.color.includes('198') ? '#C6A45A' : '#00D2FF';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // 5. Subtle Stage-Specific Light Flare at Top Header
      const flareGrad = ctx.createLinearGradient(0, 0, width, 0);
      flareGrad.addColorStop(0, 'rgba(8, 10, 15, 0)');
      flareGrad.addColorStop(0.3, `${colors.accent}0.08)`);
      flareGrad.addColorStop(0.7, `${colors.primary}0.06)`);
      flareGrad.addColorStop(1, 'rgba(8, 10, 15, 0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, 0, width, 3);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeStage, activeModule]);

  return (
    <canvas
      ref={canvasRef}
      className="living-cyber-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.95
      }}
      aria-hidden="true"
    />
  );
};
