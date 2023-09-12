export const formatRecordedAudioTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const milliseconds = Math.floor(
    (remainingSeconds - Math.floor(remainingSeconds)) * 1000,
  );

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(Math.floor(remainingSeconds)).padStart(2, "0")}:${String(
      milliseconds,
    ).charAt(0)}`;
  } else if (minutes > 0) {
    return `${String(minutes).padStart(2, "0")}:${String(
      Math.floor(remainingSeconds),
    ).padStart(2, "0")}:${String(milliseconds).charAt(0)}`;
  } else {
    return `${String(Math.floor(remainingSeconds)).padStart(2, "0")}:${String(
      milliseconds,
    ).charAt(0)}`;
  }
};
