export const formatUtcString = (isoString) => {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC'  // Important: don't shift timezone
    }).format(date);
  } catch (err) {
    return isoString;
  }
};
