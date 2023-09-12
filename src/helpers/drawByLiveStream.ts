import { initialCanvasSetup } from "./initialCanvasSetup.ts";
import { paintLine } from "./paintLine.ts";
import { paintLineFromCenterToRight } from "./paintLineFromCenterToRight.ts";

import { DrawByLiveStreamParams, BarItem } from "../types/types.ts";

export const drawByLiveStream = ({
  audioData,
  unit,
  index,
  index2,
  canvas,
  isRecordingInProgress,
  picks,
  backgroundColor,
  barWidth,
  mainBarColor,
  secondaryBarColor,
  rounded,
  animateCurrentPick,
  fullscreen,
}: DrawByLiveStreamParams) => {
  const canvasData = initialCanvasSetup({ canvas, backgroundColor });
  if (!canvasData) return;

  const { context, height, width } = canvasData;

  if (audioData?.length && isRecordingInProgress) {
    const maxPick = Math.max(...audioData);

    if (index2.current >= barWidth) {
      index2.current = 0;
      const newStartY = height - (maxPick / 258) * height;
      const newHeight = -height + (maxPick / 258) * height * 2;

      const newPick: BarItem | null =
        index.current === barWidth
          ? {
              startY: newStartY > height / 2 - 1 ? height / 2 - 1 : newStartY,
              height: newHeight < 2 ? 2 : newHeight,
            }
          : null;

      if (index.current >= unit) {
        index.current = barWidth;
      } else {
        index.current += barWidth;
      }

      // quantity of picks enough for visualisation
      if (picks.length > (fullscreen ? width : width / 2) / barWidth) {
        picks.pop();
      }
      picks.unshift(newPick);
    }

    index2.current += 1;

    !fullscreen && paintInitialLine();

    // animate current pick
    if (animateCurrentPick) {
      paintLine({
        context,
        rounded,
        color: mainBarColor,
        x: fullscreen ? width : width / 2,
        y: height - (maxPick / 258) * height,
        h: -height + (maxPick / 258) * height * 2,
        w: barWidth,
      });
    }

    // picks visualisation
    let x = (fullscreen ? width : width / 2) - index2.current;
    picks.forEach((pick) => {
      if (pick) {
        paintLine({
          context,
          color: mainBarColor,
          rounded,
          x,
          y: pick.startY,
          h: pick.height,
          w: barWidth,
        });
      }
      x -= barWidth;
    });
  } else {
    picks.length = 0;
  }

  function paintInitialLine() {
    paintLineFromCenterToRight({
      context,
      color: secondaryBarColor,
      rounded,
      width,
      height,
      barWidth,
    });
  }
};
