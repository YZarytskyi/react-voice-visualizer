import { initialCanvasSetup } from "./initialCanvasSetup.ts";
import { paintLine } from "./paintLine.ts";

import { DrawByBlob } from "../types/types.ts";

export const drawByBlob = ({
  barsData,
  canvas,
  barWidth,
  gap,
  backgroundColor,
  mainBarColor,
  secondaryBarColor,
  currentAudioTime = 0,
  rounded,
  duration,
}: DrawByBlob): void => {
  const canvasData = initialCanvasSetup({ canvas, backgroundColor });
  if (!canvasData) return;

  const { context, height } = canvasData;

  const playedPercent = currentAudioTime / duration;

  barsData.forEach((barData, i) => {
    const mappingPercent = i / barsData.length;
    const played = playedPercent > mappingPercent;

    paintLine({
      context,
      color: played ? secondaryBarColor : mainBarColor,
      rounded,
      x: i * (barWidth + gap * barWidth),
      y: height / 2 - barData.max,
      h: barData.max * 2,
      w: barWidth,
    });
  });
};
