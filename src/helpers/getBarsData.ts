import { BarsData, GetBarsDataParams } from "../types/types.ts";

export const getBarsData = ({
  bufferData,
  height,
  width,
  barWidth,
  gap,
}: GetBarsDataParams): BarsData[] => {
  const units = width / (barWidth + gap * barWidth);
  const step = Math.floor(bufferData.length / units);
  const halfHeight = height / 2;

  let barsData: BarsData[] = [];
  let maxDataPoint = 0;

  for (let i = 0; i < units; i++) {
    const maximums: number[] = [];
    let maxCount = 0;

    for (let j = 0; j < step && i * step + j < bufferData.length; j++) {
      const result = bufferData[i * step + j];
      if (result > 0) {
        maximums.push(result);
        maxCount++;
      }
    }
    const maxAvg = maximums.reduce((a, c) => a + c, 0) / maxCount;

    if (maxAvg > maxDataPoint) {
      maxDataPoint = maxAvg;
    }

    barsData.push({ max: maxAvg });
  }

  if (halfHeight * 0.95 > maxDataPoint * halfHeight) {
    const adjustmentFactor = (halfHeight * 0.95) / maxDataPoint;
    barsData = barsData.map((bar) => ({
      max: bar.max > 0.01 ? bar.max * adjustmentFactor : 1,
    }));
  }

  return barsData;
};
