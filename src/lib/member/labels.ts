import type { AppRole } from '$lib/auth/roles';
import type {
	MemberArticleStatus,
	MemberEventStatus,
	MemberEventType,
	MemberEventVisibility,
	MemberLevel,
	MemberNotificationAudience
} from './types';

export const ROLE_LABELS: Record<AppRole, string> = {
	member: 'Membre',
	chef_pupitre: 'Chef de pupitre',
	secretaire: 'Secrétaire',
	admin: 'Administrateur'
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
	member: 'Consulte l’agenda, répond aux événements et accède au trombinoscope.',
	chef_pupitre: 'Gère les événements, documents et notifications de ses pupitres.',
	secretaire: 'Gère tous les pupitres, les contenus, les invitations et les comptes.',
	admin: 'Dispose en plus des rôles, des réglages globaux et des suppressions.'
};

export const LEVEL_LABELS: Record<MemberLevel, string> = {
	skolaj: 'Skolaj',
	bagadig: 'Bagadig',
	bagad: 'Bagad'
};

export const EVENT_TYPE_LABELS: Record<MemberEventType, string> = {
	sortie: 'Sortie',
	concert: 'Concert',
	'fest-noz': 'Fest-noz',
	festival: 'Festival',
	concours: 'Concours',
	gala: 'Gala',
	repetition: 'Répétition',
	reunion: 'Réunion',
	repas: 'Repas'
};

export const VISIBILITY_LABELS: Record<MemberEventVisibility, string> = {
	public: 'Public',
	interne: 'Interne',
	pupitre: 'Pupitre'
};

export const EVENT_STATUS_LABELS: Record<MemberEventStatus, string> = {
	active: 'Actif',
	cancelled: 'Annulé'
};

export const ARTICLE_STATUS_LABELS: Record<MemberArticleStatus, string> = {
	draft: 'Brouillon',
	published: 'Publié'
};

export const AUDIENCE_LABELS: Record<MemberNotificationAudience, string> = {
	all: 'Tout le bagad',
	pupitre: 'Pupitres',
	profiles: 'Membres choisis'
};

/**
 * Titres des écrans de l'espace adhérents, pour `<title>`.
 *
 * Les routes dynamiques (détail d'événement, édition d'article) sont traitées
 * par expression régulière ; les autres par correspondance exacte.
 */
const DASHBOARD_TITLES: Record<string, string> = {
	'/dashboard': 'Accueil',
	'/dashboard/agenda': 'Agenda',
	'/dashboard/agenda/nouveau': 'Nouvel événement',
	'/dashboard/membres': 'Trombinoscope',
	'/dashboard/documents': 'Documents',
	'/dashboard/notifications': 'Notifications',
	'/dashboard/profil': 'Mon profil',
	'/dashboard/securite': 'Sécurité et session',
	'/dashboard/pupitre': 'Espace pupitre',
	'/dashboard/pupitre/membres': 'Membres de mes pupitres',
	'/dashboard/pupitre/documents': 'Documents de mes pupitres',
	'/dashboard/pupitre/notifications': 'Notifications de mes pupitres',
	'/dashboard/admin': 'Administration',
	'/dashboard/admin/agenda': 'Gestion des événements',
	'/dashboard/admin/agenda/new': 'Nouvel événement',
	'/dashboard/admin/articles': 'Articles',
	'/dashboard/admin/articles/new': 'Nouvel article',
	'/dashboard/admin/invitations': 'Invitations',
	'/dashboard/admin/media': 'Médias',
	'/dashboard/admin/membres': 'Gestion des membres',
	'/dashboard/admin/notifications': 'Envoi de notifications',
	'/dashboard/admin/permissions': 'Permissions',
	'/dashboard/admin/settings': 'Réglages'
};

export function dashboardPageTitle(pathname: string): string {
	const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
	const exact = DASHBOARD_TITLES[clean];
	if (exact) return exact;
	if (/^\/dashboard\/agenda\/[^/]+\/modifier$/.test(clean)) return 'Modifier l’événement';
	if (/^\/dashboard\/agenda\/[^/]+$/.test(clean)) return 'Détail de l’événement';
	if (/^\/dashboard\/admin\/articles\/[^/]+\/edit$/.test(clean)) return 'Modifier un article';
	return 'Espace adhérents';
}
