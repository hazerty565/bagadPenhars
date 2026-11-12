/**
 * Date de référence de la démonstration.
 *
 * Elle est figée pour que les événements à venir, les réponses verrouillées et
 * les rappels ne « pourrissent » pas avec le temps. Tous les calculs de date
 * utilisent cette constante et le fuseau `Europe/Paris`.
 */
export const DEMO_TODAY = '2026-11-11';

export const DEMO_TIME_ZONE = 'Europe/Paris';

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
export function formatDemoDate(date: string, options: { withYear?: boolean } = {}): string {
	const [year, month, day] = date.split('-').map(Number);
	if (!year || !month || !day) return date;
	const label = `${day} ${MONTHS[month - 1] ?? ''}`.trim();
	return options.withYear === false ? label : `${label} ${year}`;
}

export function formatDemoDateShort(date: string): string {
	const [year, month, day] = date.split('-').map(Number);
	if (!year || !month || !day) return date;
	return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

/** Convertit `YYYY-MM-DD` en `Date` UTC à midi pour éviter tout décalage. */
export function demoDateToUtc(date: string): Date {
	return new Date(`${date}T12:00:00.000Z`);
}

/** Nombre de jours entre la date de démonstration et une date civile. */
export function daysFromToday(date: string): number {
	const today = new Date(`${DEMO_TODAY}T12:00:00.000Z`).getTime();
	const target = new Date(`${date}T12:00:00.000Z`).getTime();
	return Math.round((target - today) / 86_400_000);
}

/** Une date est passée si elle est antérieure à la date de démonstration. */
export function isPast(date: string): boolean {
	return date < DEMO_TODAY;
}

/** Une réponse est verrouillée à partir du lendemain de l’événement. */
export function isLocked(date: string): boolean {
	return date < DEMO_TODAY;
}

export function formatDateTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'long',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: DEMO_TIME_ZONE
	}).format(date);
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}
