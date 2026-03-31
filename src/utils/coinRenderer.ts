import Matter from 'matter-js';

export interface CoinMeta {
  fill: string;
  accent: string;
  symbol: string;
}

export const COIN_DATA: CoinMeta[] = [
  { fill: '#CFF0E9', accent: '#8dcfc2', symbol: '🎁' },
  { fill: '#D5F7F3', accent: '#96d9d0', symbol: '🍔' },
  { fill: '#FFE2D8', accent: '#e0b5a5', symbol: '✈️' },
  { fill: '#FFE3EE', accent: '#dda8c0', symbol: '🎧' },
  { fill: '#F4D7D7', accent: '#d4a8a8', symbol: '💎' },
  { fill: '#FFF4C3', accent: '#d4c878', symbol: '👑' },
  { fill: '#DAD7F4', accent: '#a8a3d4', symbol: '🎁' },
  { fill: '#DDD0C7', accent: '#b5a89c', symbol: '✈️' },
  { fill: '#CFF0E9', accent: '#8dcfc2', symbol: '🎧' },
  { fill: '#FFE3EE', accent: '#dda8c0', symbol: '💎' },
  { fill: '#FFE2D8', accent: '#e0b5a5', symbol: '🍔' },
  { fill: '#FFF4C3', accent: '#d4c878', symbol: '🎁' },
  { fill: '#DAD7F4', accent: '#a8a3d4', symbol: '👑' },
  { fill: '#D5F7F3', accent: '#96d9d0', symbol: '💎' },
  { fill: '#F4D7D7', accent: '#d4a8a8', symbol: '✈️' },
  { fill: '#DDD0C7', accent: '#b5a89c', symbol: '🎧' },
];

export function drawCoin(
  ctx: CanvasRenderingContext2D,
  body: Matter.Body,
  meta: CoinMeta,
  dpr: number
) {
  const { x, y } = body.position;
  const angle = body.angle;
  const r = (body.circleRadius || 50) * dpr;

  ctx.save();
  ctx.translate(x * dpr, y * dpr);
  ctx.rotate(angle);

  // Offset shadow
  ctx.beginPath();
  ctx.arc(-3 * dpr, 4 * dpr, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fill();

  // Base fill
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = meta.fill;
  ctx.fill();

  // Thick outer border
  ctx.strokeStyle = meta.accent;
  ctx.lineWidth = 4 * dpr;
  ctx.stroke();

  // Notched edge
  const notches = 28;
  for (let i = 0; i < notches; i++) {
    const a = (i / notches) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(
      Math.cos(a) * (r - 1.5 * dpr),
      Math.sin(a) * (r - 1.5 * dpr),
      1.5 * dpr,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = meta.accent;
    ctx.fill();
  }

  // Inner circle
  const innerR = r * 0.65;
  ctx.beginPath();
  ctx.arc(0, 0, innerR, 0, Math.PI * 2);
  ctx.strokeStyle = meta.accent;
  ctx.lineWidth = 2.5 * dpr;
  ctx.stroke();

  // Central emoji
  const emojiSize = r * 0.7;
  ctx.font = `${emojiSize}px -apple-system, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(meta.symbol, 0, 3 * dpr);

  // Shine arc
  ctx.beginPath();
  ctx.arc(0, -r * 0.15, r * 0.6, Math.PI * 1.15, Math.PI * 1.85);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3 * dpr;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.restore();
}
