import sharp from 'sharp';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { createHash } from 'crypto';

const cache = new Map<string, string>();
// Re-encode the exact decoded payload; never invent receiver/amount fields.
export async function clearMomoQr(input: Buffer): Promise<string> {
  const key = createHash('sha256').update(input).digest('hex');
  if (cache.has(key)) return cache.get(key)!;
  const { data, info } = await sharp(input, {
    limitInputPixels: 16000000,
    animated: false,
  })
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height, {
    inversionAttempts: 'attemptBoth',
  });
  if (!decoded?.data || decoded.data.length > 8000)
    throw Error('QR unreadable');
  const result = await QRCode.toDataURL(decoded.data, {
    width: 900,
    margin: 4,
    errorCorrectionLevel: 'M',
  });
  if (cache.size >= 8) cache.delete(cache.keys().next().value!);
  cache.set(key, result);
  return result;
}
export async function clearStoredMomoQr(value: string) {
  if (!value?.startsWith('data:image/png;base64,')) return value;
  try {
    return await clearMomoQr(Buffer.from(value.split(',')[1], 'base64'));
  } catch {
    return value;
  } // Historical orders must remain accessible even with a poor original image.
}
