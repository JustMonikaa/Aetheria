import { PathInfo, PathType } from '../types/game';

export const PATHS: Record<PathType, PathInfo> = {
  Erudition: {
    id: 'Erudition',
    name: 'The Erudition',
    title: 'The Great Cogitation',
    color: '#3b82f6', // electric blue
    accent: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.45)',
    bgDark: '#081329',
    description: 'Calculates all cosmic variables to absolute precision. Rejects guesswork and chaotic approximations.',
    motto: '"The universe is an open equation. Every mystery yields to the calculating mind."',
    epilogue:
      'Your calculations cut through the chaotic fog of the Labyrinth. You deciphered the physical constants of space and fluid without a single wasted erg. The Nous of Wisdom records your intellect among the cosmic chronicles.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/><path d="M12 6v12"/></svg>`,
  },
  Destruction: {
    id: 'Destruction',
    name: 'The Destruction',
    title: 'The Entropic Reaver',
    color: '#ef4444', // crimson
    accent: '#f97316', // magma amber
    glow: 'rgba(239, 68, 68, 0.45)',
    bgDark: '#260909',
    description: 'Thrives on high-risk gambles, volatile energy overloads, and burning through resources to shatter obstacles.',
    motto: '"From the ashes of broken equilibrium, absolute power is forged."',
    epilogue:
      'You treated the Labyrinth not as a classroom, but as a crucible. Overclocking pressure conduits and courting catastrophic vacuum breaches, you conquered every physical obstacle through sheer fiery resolve.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  },
  Abundance: {
    id: 'Abundance',
    name: 'The Abundance',
    title: 'The Life-Weaver',
    color: '#10b981', // emerald
    accent: '#34d399',
    glow: 'rgba(16, 185, 129, 0.45)',
    bgDark: '#062016',
    description: 'Focuses on preservation, restorative life support, nourishing systems, and maintaining vitality.',
    motto: '"Where there is warmth and breath, eternity flourishes."',
    epilogue:
      'You refused to let the cold vacuum claim you. Balancing pressure, restoring oxygen valves, and nurturing the dormant bio-gardens within the maze, your journey was one of persistent, radiant survival.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  Hunt: {
    id: 'Hunt',
    name: 'The Hunt',
    title: 'The Star-Piercer',
    color: '#eab308', // gold cyan
    accent: '#06b6d4',
    glow: 'rgba(234, 179, 8, 0.45)',
    bgDark: '#201804',
    description: 'Relentless speed, singular focus on the objective, rapid decision-making with zero hesitation.',
    motto: '"An arrow loosed in darkness does not debate the night; it pierces straight to the quarry."',
    epilogue:
      'No labyrinth could detain you. With swift strides, instinctual precision, and uncompromising speed, you moved from sector to sector like a tachyon beam across the stellar void.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 8-8 8"/><path d="m16 8v6"/><path d="m16 8h-6"/></svg>`,
  },
  Remembrance: {
    id: 'Remembrance',
    name: 'The Remembrance',
    title: 'The Archive Keeper',
    color: '#38bdf8', // crystal cyan
    accent: '#c084fc', // violet
    glow: 'rgba(56, 189, 248, 0.45)',
    bgDark: '#081926',
    description: 'Delves into the apparatus details, archives terminal logs, and reveres the recorded memories of the ancients.',
    motto: '"All things fade into entropy, save for that which is remembered."',
    epilogue:
      'Every inscription, every caliper tick, and every atmospheric measurement was indelibly preserved in your memory tablet. In your wake, the history of this cosmic facility will never be lost.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  },
  Elation: {
    id: 'Elation',
    name: 'The Elation',
    title: 'The Cosmic Jester',
    color: '#d946ef', // fuchsia magenta
    accent: '#f59e0b', // amber
    glow: 'rgba(217, 70, 239, 0.45)',
    bgDark: '#240a24',
    description: 'Embraces whimsical physics, unorthodox solutions, playful irony, and joy in cosmic absurdity.',
    motto: '"The universe is too absurd to be taken solemnly—dance upon the event horizon!"',
    epilogue:
      'While the laws of gravitation and hydrostatic pressure bound others in dread, you found the cosmic joke hidden between the decimal points. Your journey was a radiant masquerade of joyful inquiry.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M7 8c1-1 3-1 4 0"/><path d="M13 8c1-1 3-1 4 0"/></svg>`,
  },
  Nihility: {
    id: 'Nihility',
    name: 'The Nihility',
    title: 'The Shadow of IX',
    color: '#6366f1', // indigo twilight
    accent: '#64748b', // slate
    glow: 'rgba(99, 102, 241, 0.45)',
    bgDark: '#0e111d',
    description: 'Accepts the inevitability of decay, operates with cold minimalism, and endures the silent dark void.',
    motto: '"All forces sum to zero in the end. Yet the void continues to breathe."',
    epilogue:
      'In the quiet chill of the deep chambers, you moved without vanity or panic. Recognizing that all energy gradients dissipate into the dark, your calm detachment carried you unscathed through the abyss.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
  },
  Equilibrium: {
    id: 'Equilibrium',
    name: 'The Equilibrium',
    title: 'The Great Arbiter',
    color: '#f59e0b', // solar balance gold
    accent: '#e2e8f0', // platinum white
    glow: 'rgba(245, 158, 11, 0.45)',
    bgDark: '#1e1b10',
    description: 'Harmonizes opposing forces, weighs every action, and maintains the sacred symmetry of the cosmos.',
    motto: '"For every action, an equal and opposite reaction. The scales must never tilt."',
    epilogue:
      'Equal input, equal output. You calibrated hydraulic pressures, balanced gravitational wells, and conserved life support with absolute symmetry. HooH the Arbiter smiles upon your harmony.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
};
