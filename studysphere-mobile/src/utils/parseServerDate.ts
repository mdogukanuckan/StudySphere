
export const parseServerDate = (value: string | Date): Date => {
  if (value instanceof Date) return value;

  const trimmed = value.trim();
  const hasTimezoneDesignator = /Z$|[+-]\d{2}:?\d{2}$/.test(trimmed);
  if (hasTimezoneDesignator) {
    return new Date(trimmed);
  }

  const normalized = trimmed.replace(' ', 'T');
  return new Date(`${normalized}Z`);
};
