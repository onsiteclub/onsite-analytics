// Hourglass chart color palettes
// Entrada (cool tones) for input/analysis pages
export const ENTRADA_COLORS = ['#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6', '#10b981'];

// Saida (warm tones) for output/intelligence pages
export const SAIDA_COLORS = ['#f59e0b', '#f97316', '#ef4444', '#d97706', '#10b981'];

// Gargalo (balanced) for overview/neutral pages
export const GARGALO_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export function getChartColors(theme: 'entrada' | 'saida' | 'gargalo'): string[] {
  switch (theme) {
    case 'entrada': return ENTRADA_COLORS;
    case 'saida': return SAIDA_COLORS;
    case 'gargalo': return GARGALO_COLORS;
  }
}
