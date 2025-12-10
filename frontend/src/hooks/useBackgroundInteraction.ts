import { useEffect, useRef, useState, useCallback } from "react";

interface SplashParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export const useBackgroundInteraction = (
  containerRef: React.RefObject<HTMLElement>
) => {
  const [splashParticles, setSplashParticles] = useState<SplashParticle[]>([]);
  const particlesRef = useRef<SplashParticle[]>([]);
  const particleIdRef = useRef(0);
  const lastMouseTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();

  // Create splash effect on mouse move with enhanced particles
  const createSplash = useCallback(
    (x: number, y: number, intensity: number = 1) => {
      const colors = [
        "rgba(59, 130, 246, 0.9)", // bright blue
        "rgba(6, 182, 212, 0.9)", // bright cyan
        "rgba(99, 102, 241, 0.9)", // bright indigo
        "rgba(168, 85, 247, 0.9)", // vibrant purple
        "rgba(34, 197, 94, 0.85)", // bright green
      ];

      // Create particle splash with moderate effect
      const particleCount = Math.floor(8 * intensity); // Reduced to 8
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5);
        const velocity = (1.5 + Math.random() * 3.5) * intensity;

        particlesRef.current.push({
          id: particleIdRef.current++,
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 1,
          life: 1,
          maxLife: 1,
          size: 2 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    },
    []
  );

  // Handle mouse move with minimal throttling for continuous smooth effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMouseTimeRef.current < 16) return; // ~60fps throttle

      lastMouseTimeRef.current = now;

      // Check if hovering over a card
      const target = e.target as HTMLElement;
      const card = target?.closest("[data-card]");

      if (card) {
        createSplash(e.clientX, e.clientY, 1.2);
      } else {
        createSplash(e.clientX, e.clientY, 0.8);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [createSplash]);

  // Animate particles with smooth easing
  useEffect(() => {
    const animate = () => {
      // Update particles in place with smoother physics
      let activeCount = 0;
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // Gentle gravity
        p.vx *= 0.995; // Very smooth air resistance
        p.life -= 0.012; // Smooth fade

        if (p.life > 0) {
          particlesRef.current[activeCount++] = p;
        }
      }
      particlesRef.current.length = activeCount;

      // Always update for smooth animation
      setSplashParticles([...particlesRef.current]);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setSplashParticles([]);
      particlesRef.current = [];
    }
  }, []);

  return { splashParticles };
};
