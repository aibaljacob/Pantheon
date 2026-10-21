import React, { useEffect, useRef, useMemo } from 'react';
import { Sparkles, RefreshCw, Camera, Compass } from 'lucide-react';
import type { ColorSwatch } from '../../types';

interface ProceduralEnvironmentPreviewProps {
  seed: number;
  palette: ColorSwatch[];
  artStyle?: string;
  atmosphere?: string;
  lighting?: string;
  cameraPerspective?: string;
  projectName: string;
  genre?: string;
  motifs?: string[];
  onRegenerate?: () => void;
}

// Pseudo-Random Number Generator (Mulberry32)
function createPrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

type SceneTheme = 'GOTHIC_DARK_FANTASY' | 'SCIFI_INDUSTRIAL' | 'MYSTIC_ADVENTURE' | 'CINEMATIC_NOIR';

function detectTheme(
  projectName: string,
  genre?: string,
  artStyle?: string,
  atmosphere?: string,
  lighting?: string,
  motifs?: string[],
): SceneTheme {
  const combined = `${projectName} ${genre || ''} ${artStyle || ''} ${atmosphere || ''} ${lighting || ''} ${(motifs || []).join(' ')}`.toLowerCase();

  if (
    combined.includes('ashen') ||
    combined.includes('oath') ||
    combined.includes('gothic') ||
    combined.includes('dark fantasy') ||
    combined.includes('souls') ||
    combined.includes('fortress') ||
    combined.includes('ruin') ||
    combined.includes('castle') ||
    combined.includes('citadel') ||
    combined.includes('cathedral') ||
    combined.includes('ember') ||
    combined.includes('ash') ||
    combined.includes('blood') ||
    combined.includes('medieval')
  ) {
    return 'GOTHIC_DARK_FANTASY';
  }

  if (
    combined.includes('sci-fi') ||
    combined.includes('scifi') ||
    combined.includes('cyber') ||
    combined.includes('industrial') ||
    combined.includes('mech') ||
    combined.includes('space') ||
    combined.includes('dieselpunk') ||
    combined.includes('station') ||
    combined.includes('ship') ||
    combined.includes('neon')
  ) {
    return 'SCIFI_INDUSTRIAL';
  }

  if (
    combined.includes('fantasy') ||
    combined.includes('magic') ||
    combined.includes('forest') ||
    combined.includes('island') ||
    combined.includes('adventure') ||
    combined.includes('celestial') ||
    combined.includes('nature')
  ) {
    return 'MYSTIC_ADVENTURE';
  }

  return 'CINEMATIC_NOIR';
}

export const ProceduralEnvironmentPreview: React.FC<ProceduralEnvironmentPreviewProps> = ({
  seed,
  palette,
  artStyle,
  atmosphere,
  lighting,
  cameraPerspective,
  projectName,
  genre,
  motifs,
  onRegenerate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Extract color roles with fallback defaults
  const dominant = palette.find((p) => p.role === 'DOMINANT')?.hex || '#141312';
  const shadow = palette.find((p) => p.role === 'SHADOW')?.hex || '#0b0a09';
  const secondary = palette.find((p) => p.role === 'SECONDARY')?.hex || '#201f1e';
  const accent = palette.find((p) => p.role === 'ACCENT')?.hex || '#d97706';
  const highlight = palette.find((p) => p.role === 'HIGHLIGHT')?.hex || '#e6e2df';

  const theme = useMemo(
    () => detectTheme(projectName, genre, artStyle, atmosphere, lighting, motifs),
    [projectName, genre, artStyle, atmosphere, lighting, motifs],
  );

  // Derive deterministic parameters for the SVG scene based on seed and project identity
  const sceneParams = useMemo(() => {
    const baseHash = hashString(`${projectName}-${genre || ''}-${artStyle || ''}`);
    const rand = createPrng(baseHash + seed * 997);

    // Sun / Moon / Celestial light center
    const celestialX = 650 + Math.round(rand() * 300);
    const celestialY = 280 + Math.round(rand() * 100);
    const celestialRadius = 90 + Math.round(rand() * 45);

    // Mountain ridges
    const ridge1 = `M 0,540 Q 300,${420 + rand() * 80} 600,${470 + rand() * 60} T 1200,${410 + rand() * 80} T 1600,530 L 1600,900 L 0,900 Z`;
    const ridge2 = `M 0,590 Q 400,${480 + rand() * 60} 800,${510 + rand() * 50} T 1600,570 L 1600,900 L 0,900 Z`;

    // Gothic Keep Spire specifications
    const keepCenterX = 700 + Math.round(rand() * 200);
    const keepSpireY = 160 + Math.round(rand() * 80);
    const keepWidth = 140 + Math.round(rand() * 40);

    // Flanking Spires
    const leftTowerX = keepCenterX - 180 - Math.round(rand() * 60);
    const leftTowerY = keepSpireY + 80 + Math.round(rand() * 70);
    const rightTowerX = keepCenterX + 180 + Math.round(rand() * 60);
    const rightTowerY = keepSpireY + 90 + Math.round(rand() * 70);

    // Great Arch location
    const archSide = rand() > 0.5 ? 'LEFT' : 'RIGHT';
    const archX = archSide === 'LEFT' ? 220 + Math.round(rand() * 100) : 1240 + Math.round(rand() * 100);

    // Light beam angles
    const lightShafts = Array.from({ length: 6 }, (_, i) => {
      const angleOffset = (i - 2.5) * 140 + rand() * 50;
      return {
        x1: celestialX + angleOffset * 0.4,
        x2: celestialX + angleOffset * 2.2,
        opacity: 0.04 + rand() * 0.07,
      };
    });

    return {
      celestialX,
      celestialY,
      celestialRadius,
      ridge1,
      ridge2,
      keepCenterX,
      keepSpireY,
      keepWidth,
      leftTowerX,
      leftTowerY,
      rightTowerX,
      rightTowerY,
      archSide,
      archX,
      lightShafts,
    };
  }, [projectName, genre, artStyle, seed]);

  // Particle System (Ashfall & Floating Embers)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isRunning = true;

    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = 1600;
    const height = 900;
    canvas.width = width;
    canvas.height = height;

    // Deterministic particle generation
    const rand = createPrng(seed * 313 + 42);

    // 24 Ash flakes (fall gently with wind)
    const ashFlakes = Array.from({ length: 26 }, () => ({
      x: rand() * width,
      y: rand() * height,
      size: 1.2 + rand() * 2.2,
      speedY: 0.4 + rand() * 0.7,
      speedX: -0.5 + rand() * 0.3,
      swayOffset: rand() * Math.PI * 2,
      swaySpeed: 0.02 + rand() * 0.03,
      opacity: 0.25 + rand() * 0.35,
    }));

    // 16 Glowing embers (rise from bottom with warm flicker)
    const embers = Array.from({ length: 18 }, () => ({
      x: rand() * width,
      y: rand() * height,
      size: 1.4 + rand() * 2.4,
      speedY: -(0.6 + rand() * 1.1),
      speedX: -0.3 + rand() * 0.6,
      flickerOffset: rand() * Math.PI * 2,
      opacity: 0.4 + rand() * 0.5,
    }));

    let frame = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Ash Flakes
      ctx.fillStyle = highlight;
      for (const p of ashFlakes) {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (!prefersReducedMotion) {
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(frame * p.swaySpeed + p.swayOffset) * 0.4;
          if (p.y > height) {
            p.y = -10;
            p.x = rand() * width;
          }
          if (p.x < -10) p.x = width + 10;
        }
      }

      // Draw Glowing Embers
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 6;
      for (const e of embers) {
        const flicker = 0.5 + 0.5 * Math.sin(frame * 0.05 + e.flickerOffset);
        ctx.globalAlpha = Math.min(1, e.opacity * flicker + 0.2);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();

        if (!prefersReducedMotion) {
          e.y += e.speedY;
          e.x += e.speedX + Math.cos(frame * 0.04 + e.flickerOffset) * 0.3;
          if (e.y < -10) {
            e.y = height + 10;
            e.x = rand() * width;
          }
        }
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      frame++;
      if (isRunning && !prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    // Pause animation when tab is inactive to preserve battery and CPU
    const handleVisibility = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animId);
      } else {
        if (!isRunning && !prefersReducedMotion) {
          isRunning = true;
          animId = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [seed, accent, highlight]);

  const themeLabel = useMemo(() => {
    switch (theme) {
      case 'GOTHIC_DARK_FANTASY':
        return 'Gothic Dark Fantasy • Ruined Citadel';
      case 'SCIFI_INDUSTRIAL':
        return 'Industrial Sci-Fi • Megastructure';
      case 'MYSTIC_ADVENTURE':
        return 'Mythic Fantasy • Ancient Sanctuary';
      default:
        return 'Filmic Noir • Monolithic Chiaroscuro';
    }
  }, [theme]);

  const {
    celestialX,
    celestialY,
    celestialRadius,
    ridge1,
    ridge2,
    keepCenterX,
    keepSpireY,
    keepWidth,
    leftTowerX,
    leftTowerY,
    rightTowerX,
    rightTowerY,
    archX,
    lightShafts,
  } = sceneParams;

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-xl border border-[#363433] bg-[#0c0b0a] shadow-2xl select-none"
    >
      {/* SVG Procedural Vector Scene */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          {/* Sky Gradient */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={shadow} />
            <stop offset="60%" stopColor={dominant} />
            <stop offset="85%" stopColor={secondary} />
            <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
          </linearGradient>

          {/* Celestial Glow Gradient */}
          <radialGradient id="celestialGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={highlight} stopOpacity="0.9" />
            <stop offset="35%" stopColor={accent} stopOpacity="0.6" />
            <stop offset="70%" stopColor={accent} stopOpacity="0.15" />
            <stop offset="100%" stopColor={dominant} stopOpacity="0" />
          </radialGradient>

          {/* Mountain Haze Gradient */}
          <linearGradient id="mountainFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={secondary} stopOpacity="0.85" />
            <stop offset="100%" stopColor={dominant} stopOpacity="0.98" />
          </linearGradient>

          {/* Fortress Architecture Gradient */}
          <linearGradient id="fortressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={secondary} />
            <stop offset="70%" stopColor={dominant} />
            <stop offset="100%" stopColor={shadow} />
          </linearGradient>

          {/* Volumetric Fog Gradient */}
          <linearGradient id="fogGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="50%" stopColor={dominant} stopOpacity="0.5" />
            <stop offset="100%" stopColor={shadow} stopOpacity="0.8" />
          </linearGradient>

          {/* Glow filter for windows and light cores */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. SKY BACKDROP */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#skyGrad)" />

        {/* 2. CELESTIAL ECLIPSE / AMBER SOURCE */}
        <circle
          cx={celestialX}
          cy={celestialY}
          r={celestialRadius * 2.2}
          fill="url(#celestialGlow)"
        />
        {/* Dark Occluded Celestial Body with Fiery Rim */}
        <circle
          cx={celestialX}
          cy={celestialY}
          r={celestialRadius}
          fill={shadow}
          stroke={accent}
          strokeWidth="3.5"
          filter="url(#softGlow)"
        />

        {/* 3. VOLUMETRIC LIGHT SHAFTS (God Rays) */}
        {lightShafts.map((shaft, idx) => (
          <polygon
            key={idx}
            points={`${celestialX},${celestialY} ${shaft.x1},900 ${shaft.x2},900`}
            fill={accent}
            opacity={shaft.opacity}
          />
        ))}

        {/* 4. FAR HORIZON MOUNTAIN RIDGES */}
        <path d={ridge1} fill="url(#mountainFade)" opacity="0.65" />
        <path d={ridge2} fill={dominant} opacity="0.85" />

        {/* 5. GOTHIC FORTRESS / RUINED ARCHITECTURE SILHOUETTE (Midground) */}
        {theme === 'GOTHIC_DARK_FANTASY' && (
          <g>
            {/* Flying Buttresses & Outer Ramparts */}
            <path
              d={`M ${keepCenterX - keepWidth},620 Q ${leftTowerX + 40},520 ${leftTowerX},540 L ${leftTowerX},750 L ${keepCenterX - keepWidth},750 Z`}
              fill="url(#fortressGrad)"
            />
            <path
              d={`M ${keepCenterX + keepWidth},620 Q ${rightTowerX - 40},520 ${rightTowerX},540 L ${rightTowerX},750 L ${keepCenterX + keepWidth},750 Z`}
              fill="url(#fortressGrad)"
            />

            {/* Left Flanking Spire */}
            <polygon
              points={`${leftTowerX},${leftTowerY} ${leftTowerX - 35},${leftTowerY + 220} ${leftTowerX + 35},${leftTowerY + 220}`}
              fill="url(#fortressGrad)"
            />
            <rect
              x={leftTowerX - 32}
              y={leftTowerY + 220}
              width="64"
              height="280"
              fill="url(#fortressGrad)"
            />

            {/* Right Flanking Spire */}
            <polygon
              points={`${rightTowerX},${rightTowerY} ${rightTowerX - 35},${rightTowerY + 220} ${rightTowerX + 35},${rightTowerY + 220}`}
              fill="url(#fortressGrad)"
            />
            <rect
              x={rightTowerX - 32}
              y={rightTowerY + 220}
              width="64"
              height="280"
              fill="url(#fortressGrad)"
            />

            {/* Central High Gothic Keep Spire */}
            <polygon
              points={`${keepCenterX},${keepSpireY} ${keepCenterX - keepWidth * 0.5},${keepSpireY + 260} ${keepCenterX + keepWidth * 0.5},${keepSpireY + 260}`}
              fill="url(#fortressGrad)"
            />
            <rect
              x={keepCenterX - keepWidth * 0.45}
              y={keepSpireY + 260}
              width={keepWidth * 0.9}
              height="350"
              fill="url(#fortressGrad)"
            />

            {/* Battlements & Parapet Teeth along the Keep */}
            {Array.from({ length: 9 }).map((_, idx) => (
              <rect
                key={idx}
                x={keepCenterX - keepWidth * 0.45 + idx * (keepWidth * 0.1)}
                y={keepSpireY + 248}
                width={keepWidth * 0.06}
                height="14"
                fill={secondary}
              />
            ))}

            {/* Glowing Lancet Arched Windows in the Keep */}
            <path
              d={`M ${keepCenterX - 12},${keepSpireY + 310} q 12,-18 24,0 l 0,55 l -24,0 z`}
              fill={accent}
              filter="url(#softGlow)"
              opacity="0.9"
            />
            <path
              d={`M ${keepCenterX - 34},${keepSpireY + 330} q 8,-14 16,0 l 0,40 l -16,0 z`}
              fill={accent}
              filter="url(#softGlow)"
              opacity="0.75"
            />
            <path
              d={`M ${keepCenterX + 18},${keepSpireY + 330} q 8,-14 16,0 l 0,40 l -16,0 z`}
              fill={accent}
              filter="url(#softGlow)"
              opacity="0.75"
            />

            {/* Monumental Ruined Arch Viaduct */}
            <g transform={`translate(${archX}, 380)`}>
              {/* Grand Arch Outer Curve */}
              <path
                d="M -90,260 Q -80,40 0,0 Q 80,40 90,260 L 60,260 Q 50,60 0,35 Q -50,60 -60,260 Z"
                fill="url(#fortressGrad)"
              />
              {/* Dangling Iron Chains */}
              <line x1="-15" y1="35" x2="-15" y2="140" stroke={secondary} strokeWidth="2.5" strokeDasharray="3,3" />
              <line x1="20" y1="42" x2="20" y2="120" stroke={secondary} strokeWidth="2.5" strokeDasharray="3,3" />
            </g>
          </g>
        )}

        {/* Alternative Theme: SCI-FI INDUSTRIAL */}
        {theme === 'SCIFI_INDUSTRIAL' && (
          <g>
            {/* Sprawling Megastructure Towers */}
            <rect x="580" y="240" width="180" height="500" fill="url(#fortressGrad)" />
            <rect x="800" y="320" width="140" height="420" fill="url(#fortressGrad)" />
            <polygon points="560,740 670,420 720,740" fill={secondary} opacity="0.6" />
            {/* Communication Gantries & Cranes */}
            <line x1="670" y1="240" x2="670" y2="140" stroke={accent} strokeWidth="4" />
            <line x1="670" y1="160" x2="780" y2="160" stroke={secondary} strokeWidth="3" />
            {/* Amber Warning Lights */}
            <circle cx="670" cy="140" r="6" fill={accent} filter="url(#softGlow)" />
            <circle cx="780" cy="160" r="4" fill={accent} filter="url(#softGlow)" />
            <circle cx="870" cy="320" r="5" fill={accent} filter="url(#softGlow)" />
          </g>
        )}

        {/* Alternative Theme: MYSTIC ADVENTURE / NATURE */}
        {theme === 'MYSTIC_ADVENTURE' && (
          <g>
            {/* Floating Sky Monoliths */}
            <polygon points="420,380 480,240 540,380 480,440" fill="url(#fortressGrad)" />
            <polygon points="1080,320 1140,210 1200,320 1140,390" fill="url(#fortressGrad)" />
            {/* Ancient Monumental Sanctuary Arch */}
            <path d="M 700,680 Q 800,280 900,680 L 860,680 Q 800,340 740,680 Z" fill="url(#fortressGrad)" />
          </g>
        )}

        {/* Default Theme: CINEMATIC NOIR / MONOLITHIC */}
        {theme === 'CINEMATIC_NOIR' && (
          <g>
            <polygon points="760,180 840,180 880,750 720,750" fill="url(#fortressGrad)" />
            <polygon points="520,340 580,340 610,750 490,750" fill="url(#fortressGrad)" />
            <polygon points="1020,380 1080,380 1110,750 990,750" fill="url(#fortressGrad)" />
          </g>
        )}

        {/* 6. VOLUMETRIC FOG & ATMOSPHERIC HAZE BAND */}
        <rect x="0" y="580" width="1600" height="200" fill="url(#fogGrad)" opacity="0.75" />

        {/* 7. FOREGROUND CRAGS & HERO PROMONTORY (Depth = Extreme Close) */}
        <path
          d="M 0,900 L 0,660 Q 160,680 320,740 L 460,820 Q 560,860 680,900 Z"
          fill={shadow}
        />
        <path
          d="M 1600,900 L 1600,690 Q 1440,710 1280,780 L 1120,860 Q 1020,880 920,900 Z"
          fill={shadow}
        />

        {/* Ruined Foreground Column & Cornice */}
        <rect x="1340" y="580" width="45" height="180" fill={shadow} />
        <rect x="1330" y="565" width="65" height="15" fill={shadow} />

        {/* Solitary Cloaked Watcher / Wanderer Silhouette on Promontory */}
        <g transform="translate(290, 715)">
          {/* Head & Hood */}
          <circle cx="0" cy="-38" r="6" fill={shadow} />
          {/* Windswept Cloak Body */}
          <path d="M -6,-32 Q 0,-34 6,-32 L 10,0 L -14,0 Z" fill={shadow} />
          {/* Staff / Greatsword anchored to rock */}
          <line x1="8" y1="-44" x2="10" y2="0" stroke={shadow} strokeWidth="3" />
        </g>

        {/* 8. CINEMATIC VIGNETTE OVERLAY */}
        <radialGradient id="lensVignette" cx="50%" cy="50%" r="55%">
          <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
        </radialGradient>
        <rect x="0" y="0" width="1600" height="900" fill="url(#lensVignette)" />
      </svg>

      {/* HTML5 Canvas Particle Overlay: Ashfall & Embers */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Top Overlay HUD: Camera & Composition Specs */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono tracking-wider">
        <div className="flex items-center gap-1.5 rounded-md border border-[#363433]/80 bg-[#141312]/85 px-2.5 py-1 text-[#cac6bc] backdrop-blur-md">
          <Camera className="h-3 w-3 text-amber-400" />
          <span className="font-semibold text-white">16:9 CINEMATIC</span>
          <span className="text-[#8c887e]">•</span>
          <span className="text-amber-300">{cameraPerspective || 'Third-Person'}</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-md border border-[#363433]/80 bg-[#141312]/85 px-2.5 py-1 text-[#cac6bc] backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span className="text-[#8c887e]">VARIATION</span>
          <span className="font-bold text-white">#{seed + 1}</span>
        </div>
      </div>

      {/* Bottom Overlay HUD: Live Theme Name & Action Control */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2 rounded-md border border-[#363433]/80 bg-[#141312]/85 px-2.5 py-1 text-[#cac6bc] backdrop-blur-md">
          <Compass className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-medium text-[#e6e2df]">{themeLabel}</span>
        </div>

        {onRegenerate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
            className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-[11px] font-mono font-medium text-amber-300 backdrop-blur-md hover:bg-amber-900/60 transition-all shadow-md active:scale-95"
            title="Generate a different deterministic procedural scene"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Cycle Scene</span>
          </button>
        )}
      </div>
    </div>
  );
};
