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
          mode: 'bubble',
        },
        resize: true,
      },
      modes: {
        bubble: {
          distance: 100,
          duration: 2,
          opacity: 0.8,
          size: 6,
        },
        repulse: {
          distance: 100,
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: ['#4DA2FF', '#6FBCFF', '#06B6D4', '#22D3EE', '#14B8A6'],
      },
      links: {
        enable: false,
      },
      move: {
        enable: true,
        speed: 0.5,
        direction: 'none',
        random: true,
        straight: false,
        outModes: {
          default: 'out',
        },
      },
      number: {
        value: 50,
        density: {
          enable: true,
          area: 800,
        },
      },
      opacity: {
        value: 0.4,
        random: true,
        animation: {
          enable: true,
          speed: 0.5,
          minimumValue: 0.1,
          sync: false,
        },
      },
      shape: {
        type: 'circle',
      },
      size: {
        value: { min: 1, max: 3 },
        random: true,
      },
    },
    detectRetina: true,
    fullScreen: {
      enable: false,
      zIndex: -1,
    },
  }), []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={options as any}
      />
    </div>
  );
}

