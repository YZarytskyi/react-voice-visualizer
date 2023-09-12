export const getFileExtensionFromMimeType = (
  mimeType: string | undefined,
): string => {
  if (!mimeType) return "";

  const matches = mimeType.match(/audio\/([^;]+)/);
  if (matches && matches.length >= 2) {
    return `.${matches[1]}`;
  }
  return "";
};
