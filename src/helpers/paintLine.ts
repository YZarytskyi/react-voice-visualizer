import { PaintLineParams } from "../types/types.ts";

export const paintLine = ({
  context,
  color,
  rounded,
  x,
  y,
  w,
  h,
}: PaintLineParams) => {
  context.fillStyle = color;
  context.beginPath();

  if (context.roundRect) {
    // ensuring roundRect is supported by the browser
    context.roundRect(x, y, w, h, rounded);
    context.fill();
  } else {
    // Fallback for browsers that do not support roundRect
    context.fillRect(x, y, w, h);
  }
};
