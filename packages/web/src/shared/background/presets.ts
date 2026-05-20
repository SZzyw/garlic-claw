import type { BackgroundPreset } from './types'

const gradientCSS: Record<string, string> = {
  'mist-morning':
    'linear-gradient(155deg, #1e293b 0%, #2d3a4f 20%, #314458 40%, #263545 65%, #1a2332 100%)',
  'deep-sea':
    'linear-gradient(160deg, #061218 0%, #0a1f2b 20%, #0c2a3a 45%, #081d28 70%, #051016 100%)',
  'forest-mist':
    'linear-gradient(150deg, #141f16 0%, #1a2a1d 25%, #1d3020 55%, #152218 100%)',
  'aurora-deep':
    'linear-gradient(135deg, #0c1520 0%, #142040 30%, #0f2840 55%, #0c1525 100%)',
}

export function getGradientCSS(presetId: string): string {
  return gradientCSS[presetId] ?? ''
}

export const backgroundPresets: BackgroundPreset[] = [
  {
    id: 'mist-morning',
    label: '晨雾',
    source: { kind: 'gradient', presetId: 'mist-morning' },
    capabilities: { recommendedTheme: 'light', preferredAccent: '#5b7fa5' },
  },
  {
    id: 'deep-sea',
    label: '深海',
    source: { kind: 'gradient', presetId: 'deep-sea' },
    capabilities: { recommendedTheme: 'dark', preferredAccent: '#4a90b8' },
  },
  {
    id: 'forest-mist',
    label: '林雾',
    source: { kind: 'gradient', presetId: 'forest-mist' },
    capabilities: { recommendedTheme: 'dark', preferredAccent: '#5a8a6a' },
  },
  {
    id: 'aurora-deep',
    label: '极光',
    source: { kind: 'gradient', presetId: 'aurora-deep' },
    capabilities: { recommendedTheme: 'dark', preferredAccent: '#6a7fbf' },
  },
]
