export function formatToInlineStyleValue(
  value: string | number,
): string | number {
  if (typeof value === "string") {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return `${Math.trunc(numericValue / 2) * 2}px`;
    }
  }

  return value;
}
