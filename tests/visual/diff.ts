import sharp from "sharp";

/**
 * Percentage of pixels differing by more than 30/255 (mean over R,G,B) between
 * a Figma export and a live render.
 *
 * **The channel handling is load-bearing.** Figma's PNG exports are RGBA and
 * Playwright's screenshots are RGB. Indexing both as 3-channel silently
 * compares misaligned bytes and reports ~36% — which reads exactly like a real
 * regression. Always take the channel count from the decoded image.
 */

export type Band = {
  /** First row of the frame to compare. */
  frameTop: number;
  /** Row of the render that lines up with `frameTop`. */
  renderTop: number;
  /** Number of rows to compare. */
  height: number;
};

type Decoded = { data: Buffer; ch: number; width: number; height: number };

async function decode(file: string, crop?: { top: number; height: number }): Promise<Decoded> {
  let pipeline = sharp(file);
  if (crop) {
    const meta = await sharp(file).metadata();
    pipeline = sharp(file).extract({
      left: 0,
      top: crop.top,
      width: meta.width!,
      height: crop.height,
    });
  }
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  return { data, ch: info.channels, width: info.width, height: info.height };
}

export async function diffPct(
  framePath: string,
  renderPath: string,
  opts: {
    /** Ignore everything left of this design-px column (the 250px sidebar). */
    contentFromX?: number;
    /** Compare offset bands instead of whole images (the auth screens). */
    band?: Band;
  } = {}
): Promise<{ pct: number; width: number; height: number }> {
  const frame = await decode(
    framePath,
    opts.band ? { top: opts.band.frameTop, height: opts.band.height } : undefined
  );
  const render = await decode(
    renderPath,
    opts.band ? { top: opts.band.renderTop, height: opts.band.height } : undefined
  );

  const width = Math.min(frame.width, render.width);
  const height = Math.min(frame.height, render.height);
  // Exports are 2x a 1440-wide design, so a design column is two device px.
  const minX = opts.contentFromX ? opts.contentFromX * 2 : 0;

  let differing = 0;
  let counted = 0;
  for (let y = 0; y < height; y++) {
    for (let x = minX; x < width; x++) {
      const fi = (y * frame.width + x) * frame.ch;
      const ri = (y * render.width + x) * render.ch;
      const delta =
        (Math.abs(frame.data[fi] - render.data[ri]) +
          Math.abs(frame.data[fi + 1] - render.data[ri + 1]) +
          Math.abs(frame.data[fi + 2] - render.data[ri + 2])) /
        3;
      counted++;
      if (delta > 30) differing++;
    }
  }

  return { pct: (differing / counted) * 100, width, height };
}
