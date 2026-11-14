/**
 * Dates et formats de l'espace adhérents.
 *
 * La date du jour est calculée dans le fuseau `Europe/Paris`, comme le fait
 * PostgreSQL (`now() AT TIME ZONE 'Europe/Paris'`). Les dates d'événement sont
 * des dates civiles `YYYY-MM-DD`, sans heure.
 */

export const TIME_ZONE = 'Europe/Paris';

function parisToday(): string {
	// `en-CA` produit directement le format ISO `YYYY-MM-DD`.
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}

export const TODAY = parisToday();

const MONTHS = [
	'janvier',
	'février',
	'mars',
	'avril',
	'mai',
	'juin',
	'juillet',
	'août',
	'septembre',
	'octobre',
	'novembre',
	'décembre'
];

/** Formate une date civile `YYYY-MM-DD` en français, sans décalage horaire. */
export function formatDate(date: string, options: { withYear?: boolean } = {}): string {
	const [year, month, day] = date.split('-').map(Number);
	if (!year || !month || !day) return date;
	const label = `${day} ${MONTHS[month - 1] ?? ''}`.trim();
	return options.withYear === false ? label : `${label} ${year}`;
}

export function formatDateShort(date: string): string {
	const [year, month, day] = date.split('-').map(Number);
	if (!year || !month || !day) return date;
	return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

/** Formate un horodatage ISO en date et heure françaises. */
export function formatDateTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'long',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: TIME_ZONE
	}).format(date);
}

/** Convertit `YYYY-MM-DD` en `Date` UTC à midi pour éviter tout décalage. */
export function dateToUtc(date: string): Date {
	return new Date(`${date}T12:00:00.000Z`);
}

/** Ajoute des jours à une date civile `YYYY-MM-DD`. */
export function addDays(date: string, days: number): string {
	const value = dateToUtc(date);
	value.setUTCDate(value.getUTCDate() + days);
	return value.toISOString().slice(0, 10);
}

/** Nombre de jours entre aujourd'hui et une date civile. */
export function daysFromToday(date: string): number {
	const today = new Date(`${TODAY}T12:00:00.000Z`).getTime();
	const target = new Date(`${date}T12:00:00.000Z`).getTime();
	return Math.round((target - today) / 86_400_000);
}

/** Une date est passée si elle est antérieure à la date du jour. */
export function isPast(date: string): boolean {
	return date < TODAY;
}

/** Une réponse est verrouillée à partir du lendemain de l'événement. */
export function isLocked(date: string): boolean {
	return date < TODAY;
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}
