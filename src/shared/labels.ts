export const leadLabel = (minutes: number): string =>
  minutes === 0
    ? 'At the event time'
    : minutes === 30
      ? '30 minutes before'
      : minutes === 60
        ? '1 hour before'
        : minutes === 1440
          ? '1 day before'
          : '2 days before'
