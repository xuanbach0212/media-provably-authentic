'use client';

import { useCallback, useMemo } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';

/**
 * Subtle floating particles background with Sui colors
 * Level 3 Premium UI component
 */
export default function ParticlesBackground() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const options = useMemo(() => ({
    background: {
      color: {
        value: 'transparent',
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: ['bubble', 'connect'],
        },
        resize: true,
      },
      modes: {
        bubble: {
          distance: 150,
          duration: 2,
          opacity: 1,
          size: 8,
        },
        connect: {
          distance: 100,
          links: {
            opacity: 0.3,
          },
        },
      },
    },
    particles: {
      color: {
        value: ['#4DA2FF', '#6FBCFF', '#06B6D4', '#22D3EE', '#14B8A6', '#10B981', '#8B5CF6'],
      },
      links: {
        enable: false,
      },
      move: {
        enable: true,
        speed: { min: 0.3, max: 1.5 },
        direction: 'none',
        random: true,
        straight: false,
        outModes: {
          default: 'out',
        },
        attract: {
          enable: true,
          rotate: {
            x: 600,
            y: 1200,
          },
        },
      },
      number: {
        value: 150,
        density: {
          enable: true,
          area: 800,
        },
      },
      opacity: {
        value: { min: 0.2, max: 0.8 },
        random: true,
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0.1,
          sync: false,
        },
      },
      shape: {
        type: ['circle', 'triangle', 'square'],
      },
      size: {
        value: { min: 1, max: 5 },
        random: true,
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 0.5,
          sync: false,
        },
      },
      stroke: {
        width: 0,
      },
      twinkle: {
        particles: {
          enable: true,
          frequency: 0.05,
          opacity: 1,
        },
      },
    },
    detectRetina: true,
    fullScreen: {
      enable: true,
      zIndex: 0,
    },
  }), []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={options as any}
        className="w-full h-full"
      />
    </div>
  );
}

