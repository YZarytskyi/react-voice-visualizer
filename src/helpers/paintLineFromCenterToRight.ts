import { paintLine } from "./paintLine.ts";
import { PaintLineFromCenterToRightParams } from "../types/types.ts";

export function paintLineFromCenterToRight({
  context,
  color,
  rounded,
  width,
  height,
  barWidth,
}: PaintLineFromCenterToRightParams) {
  paintLine({
    context,
    color,
    rounded,
    x: width / 2 + barWidth / 2,
    y: height / 2 - 1,
    h: 2,
    w: width - (width / 2 + barWidth / 2),
  });
}
