import type { BackgroundPreset } from './types'

const gradientCSS: Record<string, string> = {
  'warm-dawn':
    'linear-gradient(145deg, #f5e6d3 0%, #e8d5c0 25%, #d4c5b5 55%, #c8bfb8 100%)',
  'bamboo-mist':
    'linear-gradient(155deg, #dce8db 0%, #c8dac4 30%, #b4ccb0 60%, #a8c0a4 100%)',
  'starry-night':
    // Star field via radial-gradient dots on deep night sky
    'radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.9), transparent),' +
    'radial-gradient(1.2px 1.2px at 18% 28%, rgba(220,230,255,0.8), transparent),' +
    'radial-gradient(1px 1px at 25% 8%, rgba(255,255,240,0.6), transparent),' +
    'radial-gradient(1.5px 1.5px at 33% 22%, rgba(255,255,255,0.9), transparent),' +
    'radial-gradient(1px 1px at 42% 35%, rgba(200,210,255,0.7), transparent),' +
    'radial-gradient(1px 1px at 48% 15%, rgba(255,255,255,0.5), transparent),' +
    'radial-gradient(1.3px 1.3px at 55% 30%, rgba(255,255,255,0.8), transparent),' +
    'radial-gradient(1px 1px at 62% 10%, rgba(220,220,255,0.6), transparent),' +
    'radial-gradient(1.4px 1.4px at 70% 25%, rgba(255,255,255,0.9), transparent),' +
    'radial-gradient(1px 1px at 78% 18%, rgba(240,240,255,0.7), transparent),' +
    'radial-gradient(1px 1px at 85% 32%, rgba(255,255,240,0.5), transparent),' +
    'radial-gradient(1.2px 1.2px at 92% 12%, rgba(200,220,255,0.8), transparent),' +
    'radial-gradient(1px 1px at 15% 45%, rgba(255,255,255,0.6), transparent),' +
    'radial-gradient(1.5px 1.5px at 28% 55%, rgba(220,230,255,0.9), transparent),' +
    'radial-gradient(1px 1px at 38% 48%, rgba(255,255,255,0.5), transparent),' +
    'radial-gradient(1px 1px at 52% 52%, rgba(200,210,240,0.7), transparent),' +
    'radial-gradient(1.3px 1.3px at 60% 58%, rgba(255,255,255,0.8), transparent),' +
    'radial-gradient(1px 1px at 72% 42%, rgba(255,255,240,0.6), transparent),' +
    'radial-gradient(1px 1px at 80% 55%, rgba(220,230,255,0.7), transparent),' +
    'radial-gradient(1.4px 1.4px at 88% 48%, rgba(255,255,255,0.9), transparent),' +
    'radial-gradient(1px 1px at 10% 68%, rgba(200,220,255,0.5), transparent),' +
    'radial-gradient(1px 1px at 22% 75%, rgba(255,255,255,0.7), transparent),' +
    'radial-gradient(1.2px 1.2px at 35% 70%, rgba(220,230,255,0.8), transparent),' +
    'radial-gradient(1px 1px at 45% 78%, rgba(255,255,255,0.6), transparent),' +
    'radial-gradient(1px 1px at 56% 68%, rgba(240,240,255,0.7), transparent),' +
    'radial-gradient(1.5px 1.5px at 68% 75%, rgba(255,255,255,0.9), transparent),' +
    'radial-gradient(1px 1px at 75% 62%, rgba(200,210,255,0.5), transparent),' +
    'radial-gradient(1px 1px at 84% 72%, rgba(255,255,255,0.8), transparent),' +
    'radial-gradient(1.3px 1.3px at 93% 68%, rgba(220,230,255,0.7), transparent),' +
    'radial-gradient(1px 1px at 5% 88%, rgba(255,255,255,0.6), transparent),' +
    'radial-gradient(1px 1px at 18% 92%, rgba(200,220,255,0.5), transparent),' +
    'radial-gradient(1.2px 1.2px at 30% 85%, rgba(255,255,255,0.8), transparent),' +
    'radial-gradient(1px 1px at 42% 92%, rgba(220,230,255,0.6), transparent),' +
    'radial-gradient(1.4px 1.4px at 58% 88%, rgba(255,255,255,0.9), transparent),' +
    'radial-gradient(1px 1px at 70% 90%, rgba(240,240,255,0.5), transparent),' +
    'radial-gradient(1px 1px at 82% 85%, rgba(255,255,255,0.7), transparent),' +
    'radial-gradient(1px 1px at 95% 92%, rgba(220,220,255,0.6), transparent),' +
    'linear-gradient(170deg, #060a18 0%, #0b1330 35%, #0e1a3a 65%, #091020 100%)',
  'aurora-night':
    // Aurora borealis: glowing green/teal curtains on dark night sky
    'radial-gradient(ellipse 80% 8% at 25% 35%, rgba(80,200,160,0.35), transparent),' +
    'radial-gradient(ellipse 60% 6% at 50% 42%, rgba(60,180,180,0.30), transparent),' +
    'radial-gradient(ellipse 70% 10% at 70% 38%, rgba(100,210,140,0.25), transparent),' +
    'radial-gradient(ellipse 50% 5% at 40% 55%, rgba(80,160,200,0.20), transparent),' +
    'radial-gradient(ellipse 90% 12% at 30% 28%, rgba(40,140,120,0.15), transparent),' +
    'radial-gradient(ellipse 100% 4% at 60% 48%, rgba(120,220,170,0.20), transparent),' +
    'linear-gradient(175deg, #040e16 0%, #061a22 30%, #051820 55%, #041018 100%)',
}

export function getGradientCSS(presetId: string): string {
  return gradientCSS[presetId] ?? ''
}

export const backgroundPresets: BackgroundPreset[] = [
  {
    id: 'warm-dawn',
    label: '晨光',
    source: { kind: 'gradient', presetId: 'warm-dawn' },
    capabilities: { recommendedTheme: 'light', preferredAccent: '#c4976a' },
  },
  {
    id: 'bamboo-mist',
    label: '竹雾',
    source: { kind: 'gradient', presetId: 'bamboo-mist' },
    capabilities: { recommendedTheme: 'light', preferredAccent: '#6a9a6a' },
  },
  {
    id: 'starry-night',
    label: '星空',
    source: { kind: 'gradient', presetId: 'starry-night' },
    capabilities: { recommendedTheme: 'dark', preferredAccent: '#6a8fbf' },
  },
  {
    id: 'aurora-night',
    label: '极光',
    source: { kind: 'gradient', presetId: 'aurora-night' },
    capabilities: { recommendedTheme: 'dark', preferredAccent: '#5ab8a0' },
  },
]
