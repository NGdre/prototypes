/**
 * Get a random date between two dates
 * @param start - Start date (defaults to 1970-01-01 if not provided)
 * @param end - End date (defaults to current date if not provided)
 * @returns Random date between start and end (inclusive)
 */
export function getRandomDate(start?: Date, end?: Date): Date {
	const startDate = start?.getTime() || new Date(1970, 0, 1).getTime();
	const endDate = end?.getTime() || Date.now();

	const randomTimestamp =
		Math.floor(Math.random() * (endDate - startDate + 1)) + startDate;

	return new Date(randomTimestamp);
}
