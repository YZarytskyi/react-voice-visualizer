export function formatToInlineStyleValue(
  value: string | number,
): string | number {
  if (typeof value === "string") {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return `${numericValue}px`;
    }
  }

  return value;
}
