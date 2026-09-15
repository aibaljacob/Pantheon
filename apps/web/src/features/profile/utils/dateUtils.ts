/**
 * Formats YYYY-MM or ISO date strings into human-readable format like "May 2024"
 */
export function formatDateForDisplay(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  if (trimmed.toLowerCase() === 'present') return 'Present';

  // Match YYYY-MM or YYYY-MM-DD
  const isoMonthMatch = trimmed.match(/^(\d{4})-(0[1-9]|1[0-2])(-\d{2})?$/);
  if (isoMonthMatch) {
    const year = isoMonthMatch[1];
    const monthIndex = parseInt(isoMonthMatch[2], 10) - 1;
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${monthNames[monthIndex]} ${year}`;
  }

  return trimmed;
}

/**
 * Converts various date string formats into YYYY-MM format suitable for HTML <input type="month" />
 */
export function formatDateForMonthInput(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed.toLowerCase() === 'present') return '';

  // Already YYYY-MM
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed)) {
    return trimmed;
  }

  // YYYY-MM-DD
  if (/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(trimmed)) {
    return trimmed.substring(0, 7);
  }

  // YYYY only
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01`;
  }

  // Try JS Date parsing (e.g., "Jan 2022", "January 2022")
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  return '';
}

/**
 * Sorts timeline items (experiences, education) from Present to Oldest (reverse chronological order)
 */
export function sortTimelineItemsDescending<
  T extends { startDate?: string; endDate?: string; isCurrent?: boolean }
>(items: T[] = []): T[] {
  return [...items].sort((a, b) => {
    // 1. Current / Present items come first
    const aIsCurrent = Boolean(a.isCurrent || a.endDate?.toLowerCase() === 'present');
    const bIsCurrent = Boolean(b.isCurrent || b.endDate?.toLowerCase() === 'present');

    if (aIsCurrent && !bIsCurrent) return -1;
    if (!aIsCurrent && bIsCurrent) return 1;

    // 2. Compare end dates if both are ended (newest end date first)
    const endA = (a.endDate || a.startDate || '').trim();
    const endB = (b.endDate || b.startDate || '').trim();

    const endDateCompare = endB.localeCompare(endA);
    if (endDateCompare !== 0) return endDateCompare;

    // 3. Compare start dates (newest start date first)
    const startA = (a.startDate || '').trim();
    const startB = (b.startDate || '').trim();
    return startB.localeCompare(startA);
  });
}
