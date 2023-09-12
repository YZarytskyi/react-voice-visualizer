import { GetDataForCanvasParams } from "../types/types.ts";

export const initialCanvasSetup = ({
  canvas,
  backgroundColor,
}: GetDataForCanvasParams) => {
  const height = canvas.height;
  const width = canvas.width;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.clearRect(0, 0, width, height);

  if (backgroundColor !== "transparent") {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
  }

  return { context, height, width };
};
