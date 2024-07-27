export const getTimeZone = () => {
    const timeOffset = new Date().getTimezoneOffset();
    let sign = timeOffset > 0 ? '-' : '+';
    return `UTC${sign}${Math.abs(timeOffset / 60)}`;
  }
