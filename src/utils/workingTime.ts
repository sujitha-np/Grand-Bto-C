/**
 * Utility to parse HH:mm:ss or HH:mm string to seconds from start of day
 */
export const parseTimeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parts[2] ? parseInt(parts[2], 10) || 0 : 0;
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Checks if the current time (or given date) falls within the working hours.
 * Handles both daytime (e.g., 07:00:00 to 22:00:00) and overnight shifts (e.g., 20:00:00 to 04:00:00).
 */
export const isStoreOpen = (
  workingTimeStart?: string,
  workingTimeEnd?: string,
  date: Date = new Date(),
): boolean => {
  if (!workingTimeStart || !workingTimeEnd) {
    return true;
  }

  const currentSeconds =
    date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

  const startSeconds = parseTimeToSeconds(workingTimeStart);
  const endSeconds = parseTimeToSeconds(workingTimeEnd);

  if (startSeconds <= endSeconds) {
    return currentSeconds >= startSeconds && currentSeconds <= endSeconds;
  } else {
    // Overnight window (e.g. 20:00:00 to 04:00:00)
    return currentSeconds >= startSeconds || currentSeconds <= endSeconds;
  }
};
