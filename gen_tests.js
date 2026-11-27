const fs = require('fs');
const NL = String.fromCharCode(10);
let content = '';
content += "import { describe, expect, it } from 'vitest';" + NL;
content += "import { eq, and, sql } from 'drizzle-orm';" + NL;
content += "import type { Transaction } from '$lib/db';" + NL;
content += "import type { AppRole, AccountStatus } from '$lib/auth/roles';" + NL;
content += NL;
content += 'import {' + NL;
content += '\tprofiles, profilePupitres, pupitres, events as eventsTable,' + NL;
content += '\teventPupitres, eventResponses, notifications as notificationsTable,' + NL;
content += '\tnotificationReads, documents, articles, media as mediaTable, albums,' + NL;
content += '\tstorageUsage, invitations, invitationPupitres, appSettings,' + NL;
content += '\tbureauPositions, notificationPupitres, notificationProfiles' + NL;
content += "} from '$lib/db/schema';" + NL;
content += NL;
content += "import { getMemberShell } from '$lib/server/member/queries/shell';" + NL;
content += "import { listAgendaEvents } from '$lib/server/member/queries/agenda';" + NL;
content +=
	"import { getEventDetail, getEventForEdit } from '$lib/server/member/queries/events';" + NL;
content += "import { listDirectoryProfiles } from '$lib/server/member/queries/directory';" + NL;
content += "import { getPupitrePage } from '$lib/server/member/queries/pupitre';" + NL;
content += "import { listDocumentsPage } from '$lib/server/member/queries/documents';" + NL;
content += "import { listNotificationsPage } from '$lib/server/member/queries/notifications';" + NL;
content += "import { getProfilePage } from '$lib/server/member/queries/profile';" + NL;
content += "import { getPageContext } from '$lib/server/member/queries/context';" + NL;
content += "import { listArticlesPage } from '$lib/server/member/queries/articles';" + NL;
content += "import { listMediaPage } from '$lib/server/member/queries/media';" + NL;
content += "import { listInvitationsPage } from '$lib/server/member/queries/invitations';" + NL;
content += "import { listAdminMembersPage } from '$lib/server/member/queries/adminMembers';" + NL;
content += "import { getSettingsPage } from '$lib/server/member/queries/settings';" + NL;
content += "import { getAdminOverviewPage } from '$lib/server/member/queries/adminOverview';" + NL;
content += "import { MemberQueryError } from '$lib/server/member/queries/errors';" + NL;

content += NL;
content += "const MEMBER_ID = '11111111-1111-4111-8111-111111111111';" + NL;
content += "const CHEF_ID = '22222222-2222-4222-8222-222222222222';" + NL;
content += "const SECRETAIRE_ID = '33333333-3333-4333-8333-333333333333';" + NL;
content += "const ADMIN_ID = '44444444-4444-4444-8444-444444444444';" + NL;
content += "const OTHER_ID = '55555555-5555-4555-8555-555555555555';" + NL;
content += "const BOMBARDE = 'bombarde';" + NL;
content += "const CORNEMUSE = 'cornemuse';" + NL;
content += "const CAISSE_CLAIRE = 'caisse-claire';" + NL;
content += "const PERCUSSION = 'percussion';" + NL;
content += "const BOMBARDE_UUID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';" + NL;
content += "const CORNEMUSE_UUID = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';" + NL;
content += "const CAISSE_CLAIRE_UUID = 'cccccccc-3333-4333-8333-cccccccccccc';" + NL;
content += "const PERCUSSION_UUID = 'dddddddd-4444-4444-8444-dddddddddddd';" + NL;
content += "const EVENT_INTERNE = '11111111-1111-4111-8111-111111111111';" + NL;
content += "const EVENT_MULTI = '22222222-2222-4222-8222-222222222222';" + NL;
content += "const EVENT_AUTRE = '33333333-3333-4333-8333-333333333333';" + NL;
content += NL;
content += 'type Row = Record<string, unknown>;' + NL;
content +=
	'interface QueryCall { table: string; where?: Array<{ column: string; value: unknown }>; }' + NL;
content += 'interface Fixtures {' + NL;
content += '	profiles: Row[]; profilePupitres: Row[]; pupitres: Row[]; events: Row[];' + NL;
content += '	eventPupitres: Row[]; eventResponses: Row[]; notifications: Row[];' + NL;
content += '	notificationReads: Row[]; documents: Row[]; articles: Row[]; media: Row[];' + NL;
content += '	albums: Row[]; storageUsage: Row[]; invitations: Row[];' + NL;
content += '	invitationPupitres: Row[]; appSettings: Row[]; bureauPositions: Row[];' + NL;
content += '	notificationPupitres: Row[]; notificationProfiles: Row[];' + NL;
content += '}' + NL;
content += 'function emptyFixtures(): Fixtures {' + NL;
content += '	return { profiles: [], profilePupitres: [], pupitres: [], events: [],' + NL;
content += '		eventPupitres: [], eventResponses: [], notifications: [],' + NL;
content += '		notificationReads: [], documents: [], articles: [], media: [],' + NL;
content += '		albums: [], storageUsage: [], invitations: [],' + NL;
content += '		invitationPupitres: [], appSettings: [], bureauPositions: [],' + NL;
content += '		notificationPupitres: [], notificationProfiles: [] };' + NL;
content += '}' + NL;
content += 'interface CallLog { selects: QueryCall[]; executes: unknown[]; }' + NL;

content += NL;
content += 'function createFakeTransaction(fixtures: Fixtures): Transaction {' + NL;
content += '	const log: CallLog = { selects: [], executes: [] };' + NL;
content += '	const rowsOf = (table: unknown): Row[] => {' + NL;
content += '		const map: Map<object, Row[]> = new Map([' + NL;
content += '			[profiles, fixtures.profiles], [profilePupitres, fixtures.profilePupitres],' + NL;
content += '			[pupitres, fixtures.pupitres], [eventsTable, fixtures.events],' + NL;
content +=
	'			[eventPupitres, fixtures.eventPupitres], [eventResponses, fixtures.eventResponses],' + NL;
content +=
	'			[notificationsTable, fixtures.notifications], [notificationReads, fixtures.notificationReads],' +
	NL;
content += '			[documents, fixtures.documents], [articles, fixtures.articles],' + NL;
content += '			[mediaTable, fixtures.media], [albums, fixtures.albums],' + NL;
content += '			[storageUsage, fixtures.storageUsage], [invitations, fixtures.invitations],' + NL;
content += '			[invitationPupitres, fixtures.invitationPupitres],' + NL;
content += '			[appSettings, fixtures.appSettings], [bureauPositions, fixtures.bureauPositions],' + NL;
content += '			[notificationPupitres, fixtures.notificationPupitres],' + NL;
content += '			[notificationProfiles, fixtures.notificationProfiles]' + NL;
content += '		]);' + NL;
content += '		return map.get(table as object) ?? [];' + NL;
content += '	};' + NL;
content += '	const extractEqualities = (condition: unknown): Array<[string, unknown]> => {' + NL;
content += '		const out: Array<[string, unknown]> = [];' + NL;
content += '		const walk = (node: unknown): void => {' + NL;
content += "			if (!node || typeof node !== 'object') return;" + NL;
content += '			const n = node as Record<string, unknown>;' + NL;
content += '			if (Array.isArray(n.queryChunks)) {' + NL;
content += '				const chunks = n.queryChunks as unknown[];' + NL;
content += '				for (let i = 0; i < chunks.length; i += 1) {' + NL;
content += '					const c = chunks[i];' + NL;
content +=
	"					if (c && typeof c === 'object' && typeof (c as Record<string, unknown>).name === 'string') {" +
	NL;
content += '						const op = chunks[i + 1];' + NL;
content += '						const raw = chunks[i + 2];' + NL;
content +=
	"						if (op && typeof op === 'object' && Array.isArray((op as Record<string, unknown>).value)) {" +
	NL;
content += "							const opStr = (op.value as unknown[]).join('').trim();" + NL;
content += "							if (opStr === '=' && raw !== undefined) {" + NL;
content += '								out.push([(c as Record<string, unknown>).name as string, raw]);' + NL;
content += '							}' + NL;
content += '						}' + NL;
content += '						i += 2; continue;' + NL;
content += '					}' + NL;
content += '					walk(c);' + NL;
content += '				}' + NL;
content += '				return;' + NL;
content += '			}' + NL;
content += '			for (const v of Object.values(n)) walk(v);' + NL;
content += '		};' + NL;
content += '		walk(condition);' + NL;
content += '		return out;' + NL;
content += '	};' + NL;
content += '	const applyWhere = (rows: Row[], condition: unknown): Row[] => {' + NL;
content += '		if (!condition) return rows;' + NL;
content += '		const constraints = extractEqualities(condition);' + NL;
content += '		if (constraints.length === 0) return rows;' + NL;
content += '		return rows.filter((row) => constraints.every(([col, val]) => row[col] === val));' + NL;
content += '	};' + NL;
content += '	const fake = {' + NL;
content += '		select: () => ({' + NL;
content += '			from: (table: unknown) => {' + NL;
content += '				const baseRows = rowsOf(table);' + NL;
content += '				let condition: unknown = null;' + NL;
content += '				const builder = {' + NL;
content += '					where: (next: unknown) => { condition = next; return builder; },' + NL;
content += '					orderBy: () => builder,' + NL;
content += '					limit: () => {' + NL;
content += '						const result = applyWhere(baseRows, condition);' + NL;
content += '						log.selects.push({ table: String(table), where: extractEqualities(condition) });' + NL;
content += '						return Promise.resolve(result);' + NL;
content += '					},' + NL;
content += '					then: (onFulfilled: (rows: Row[]) => unknown) => {' + NL;
content += '						const result = applyWhere(baseRows, condition);' + NL;
content += '						log.selects.push({ table: String(table), where: extractEqualities(condition) });' + NL;
content += '						return Promise.resolve(result).then(onFulfilled);' + NL;
content += '					}' + NL;
content += '				};' + NL;
content += '				return builder;' + NL;
content += '			}' + NL;
content += '		}),' + NL;
content += '		execute: (query: unknown) => {' + NL;
content += '			log.executes.push(query);' + NL;
content += "			return Promise.resolve({ rows: [{ cnt: '0' }] });" + NL;
content += '		}' + NL;
content += '	};' + NL;
content +=
	'	return { ...(fake as unknown as Transaction), __testLog: log, __testFixtures: fixtures } as unknown as Transaction;' +
	NL;
content += '}' + NL;
content +=
	'function getLog(tx: Transaction): CallLog { return (tx as unknown as { __testLog: CallLog }).__testLog; }' +
	NL;
content +=
	'function resetLog(tx: Transaction): void { const log = getLog(tx); log.selects = []; log.executes = []; }' +
	NL;

content += NL;
content += 'function baseFixtures(): Fixtures {' + NL;
content += '	const f = emptyFixtures();' + NL;
content += '	f.profiles = [' + NL;
content +=
	"		{ id: MEMBER_ID, role: 'member', account_status: 'active', email: 'membre@test.bzh', first_name: 'Membre', last_name: 'Test', avatar: 1, avatar_url: null, musician_level: 'skolaj', bureau_position_id: null, email_confirmed: true, created_at: new Date('2026-01-01') }," +
	NL;
content +=
	"		{ id: CHEF_ID, role: 'chef_pupitre', account_status: 'active', email: 'chef@test.bzh', first_name: 'Chef', last_name: 'Pupitre', avatar: 2, avatar_url: null, musician_level: 'bagad', bureau_position_id: null, email_confirmed: true, created_at: new Date('2026-01-01') }," +
	NL;
content +=
	"		{ id: SECRETAIRE_ID, role: 'secretaire', account_status: 'active', email: 'secretaire@test.bzh', first_name: 'Sec', last_name: 'Taire', avatar: 3, avatar_url: null, musician_level: null, bureau_position_id: null, email_confirmed: true, created_at: new Date('2026-01-01') }," +
	NL;
content +=
	"		{ id: ADMIN_ID, role: 'admin', account_status: 'active', email: 'admin@test.bzh', first_name: 'Admin', last_name: 'Is', avatar: 4, avatar_url: null, musician_level: null, bureau_position_id: null, email_confirmed: true, created_at: new Date('2026-01-01') }," +
	NL;
content +=
	"		{ id: OTHER_ID, role: 'member', account_status: 'active', email: 'autre@test.bzh', first_name: 'Autre', last_name: 'Membre', avatar: 5, avatar_url: null, musician_level: 'skolaj', bureau_position_id: null, email_confirmed: true, created_at: new Date('2026-01-01') }," +
	NL;
content +=
	"		{ id: 'pending-id', role: 'member', account_status: 'pending', email: 'pending@test.bzh', first_name: 'Pending', last_name: 'User', avatar: 1, avatar_url: null, musician_level: null, bureau_position_id: null, email_confirmed: false, created_at: new Date('2026-01-01') }," +
	NL;
content +=
	"		{ id: 'suspended-id', role: 'member', account_status: 'suspended', email: 'sus@test.bzh', first_name: 'Suspended', last_name: 'User', avatar: 1, avatar_url: null, musician_level: null, bureau_position_id: null, email_confirmed: true, created_at: new Date('2026-01-01') }" +
	NL;
content += '	];' + NL;
content += '	f.profilePupitres = [' + NL;
content += '		{ profile_id: MEMBER_ID, pupitre_id: BOMBARDE_UUID, is_chef: false },' + NL;
content += '		{ profile_id: CHEF_ID, pupitre_id: BOMBARDE_UUID, is_chef: true },' + NL;
content += '		{ profile_id: CHEF_ID, pupitre_id: CORNEMUSE_UUID, is_chef: false },' + NL;
content += '		{ profile_id: SECRETAIRE_ID, pupitre_id: BOMBARDE_UUID, is_chef: false },' + NL;
content += '		{ profile_id: ADMIN_ID, pupitre_id: BOMBARDE_UUID, is_chef: false },' + NL;
content += '		{ profile_id: OTHER_ID, pupitre_id: CORNEMUSE_UUID, is_chef: false }' + NL;
content += '	];' + NL;
content += '	f.pupitres = [' + NL;
content += "		{ id: BOMBARDE_UUID, slug: BOMBARDE, name: 'Bombarde' }," + NL;
content += "		{ id: CORNEMUSE_UUID, slug: CORNEMUSE, name: 'Cornemuse' }," + NL;
content += "		{ id: CAISSE_CLAIRE_UUID, slug: CAISSE_CLAIRE, name: 'Caisse claire' }," + NL;
content += "		{ id: PERCUSSION_UUID, slug: PERCUSSION, name: 'Percussion' }" + NL;
content += '	];' + NL;
content += '	f.events = [' + NL;
content +=
	"		{ id: EVENT_INTERNE, title: 'Repetition bombarde', description: 'Repetition pupitre', event_date: '2026-12-05', event_type: 'repetition', visibility: 'interne', location: 'Salle', is_poll: false, cancelled_at: null, created_by: CHEF_ID }," +
	NL;
content +=
	"		{ id: EVENT_MULTI, title: 'Repetition multi', description: 'Multi pupitre', event_date: '2026-12-10', event_type: 'repetition', visibility: 'interne', location: 'Salle', is_poll: false, cancelled_at: null, created_by: SECRETAIRE_ID }," +
	NL;
content +=
	"		{ id: EVENT_AUTRE, title: 'Repetition autre pupitre', description: 'Autre', event_date: '2026-12-15', event_type: 'repetition', visibility: 'interne', location: 'Salle', is_poll: false, cancelled_at: null, created_by: CHEF_ID }" +
	NL;
content += '	];' + NL;
content += '	f.eventPupitres = [' + NL;
content += '		{ event_id: EVENT_INTERNE, pupitre_id: BOMBARDE_UUID },' + NL;
content += '		{ event_id: EVENT_MULTI, pupitre_id: BOMBARDE_UUID },' + NL;
content += '		{ event_id: EVENT_MULTI, pupitre_id: CORNEMUSE_UUID },' + NL;
content += '		{ event_id: EVENT_AUTRE, pupitre_id: CORNEMUSE_UUID }' + NL;
content += '	];' + NL;
content += '	f.eventResponses = [' + NL;
content +=
	"		{ event_id: EVENT_INTERNE, profile_id: MEMBER_ID, status: 'present', updated_at: new Date('2026-11-20T10:00:00Z') }" +
	NL;
content += '	];' + NL;
content += '	f.notifications = [' + NL;
content +=
	"		{ id: 'n1', title: 'Notif 1', body: 'Corps 1', audience: 'all', sent_by: SECRETAIRE_ID, created_at: new Date('2026-11-25T09:00:00Z') }," +
	NL;
content +=
	"		{ id: 'n2', title: 'Notif 2', body: 'Corps 2', audience: 'pupitre', sent_by: CHEF_ID, created_at: new Date('2026-11-24T09:00:00Z') }" +
	NL;
content += '	];' + NL;
content += "	f.notificationReads = [ { notification_id: 'n1', profile_id: MEMBER_ID } ];" + NL;
content += '	f.documents = [' + NL;
content +=
	"		{ id: 'd1', title: 'Doc 1', description: null, file_name: 'doc1.pdf', mime_type: 'application/pdf', size: 1024, uploaded_by: MEMBER_ID, pupitre_id: BOMBARDE_UUID, created_at: new Date('2026-11-01'), is_active: true }," +
	NL;
content +=
	"		{ id: 'd2', title: 'Doc 2', description: 'Desc', file_name: 'doc2.pdf', mime_type: 'application/pdf', size: 2048, uploaded_by: CHEF_ID, pupitre_id: null, created_at: new Date('2026-11-02'), is_active: true }" +
	NL;
content += '	];' + NL;
content += '	f.articles = [' + NL;
content +=
	"		{ id: 'a1', title: 'Article 1', slug: 'article-1', excerpt: 'Extrait', content: '# Contenu', is_published: true, author_id: SECRETAIRE_ID, published_at: new Date('2026-11-01'), updated_at: new Date('2026-11-01') }," +
	NL;
content +=
	"		{ id: 'a2', title: 'Brouillon', slug: 'brouillon', excerpt: null, content: '# Brouillon', is_published: false, author_id: SECRETAIRE_ID, published_at: null, updated_at: new Date('2026-11-02') }" +
	NL;
content += '	];' + NL;
content += '	f.media = [' + NL;
content +=
	"		{ id: 'm1', album_id: 'alb1', file_key: 'public/albums/alb1/photo1.jpg', public_url: '/api/files/public/albums/alb1/photo1.jpg', alt: 'Photo 1', caption: 'Legende 1', position: 1 }," +
	NL;
content +=
	"		{ id: 'm2', album_id: 'alb1', file_key: 'public/albums/alb1/photo2.jpg', public_url: '/api/files/public/albums/alb1/photo2.jpg', alt: 'Photo 2', caption: null, position: 2 }" +
	NL;
content += '	];' + NL;
content += '	f.albums = [' + NL;
content +=
	"		{ id: 'alb1', title: 'Album 1', description: null, album_date: '2026-11-01', is_published: true }," +
	NL;
content +=
	"		{ id: 'alb2', title: 'Album 2', description: null, album_date: '2026-10-01', is_published: false }" +
	NL;
content += '	];' + NL;
content += '	f.storageUsage = [' + NL;
content +=
	'		{ public_bytes: 1000, private_bytes: 2000, reserved_bytes: 0, quota_bytes: 8000000000, alert_threshold_bytes: 7000000000, block_threshold_bytes: 8000000000, last_sync_at: new Date(), updated_at: new Date() }' +
	NL;
content += '	];' + NL;
content += '	f.invitations = [' + NL;
content +=
	"		{ id: 'inv1', email: 'invite@test.bzh', first_name: 'Invite', last_name: 'Test', expires_at: new Date('2026-12-01T10:00:00Z'), last_sent_at: null, cancelled_at: null, accepted_at: null, created_by: SECRETAIRE_ID, created_at: new Date('2026-11-25') }" +
	NL;
content += '	];' + NL;
content += "	f.invitationPupitres = [ { invitation_id: 'inv1', pupitre_id: BOMBARDE_UUID } ];" + NL;
content += '	f.appSettings = [' + NL;
content +=
	"		{ id: 1, association_name: 'Bagad Penhars', contact_email: 'bagadpenhars@gmail.com', contact_address: '6 Av. des Oiseaux, 29000 Quimper', website: 'https://bagad-penhars.com', notify_on_event_create: true, notify_reminder_days: 1 }" +
	NL;
content += '	];' + NL;
content += "	f.bureauPositions = [ { id: 'bp1', title: 'Tresorier' } ];" + NL;
content +=
	"	f.notificationPupitres = [ { notification_id: 'n2', pupitre_id: BOMBARDE_UUID } ];" + NL;
content += '	f.notificationProfiles = [];' + NL;
content += '	return f;' + NL;
content += '}' + NL;

content += NL;
content +=
	"const FORBIDDEN_KEYS = ['email', 'phone', 'address', 'role', 'accountStatus', 'authUserId', 'isChef'];" +
	NL;
content += 'function assertNoForbiddenKeys(obj: unknown, path: string): void {' + NL;
content += '	const walk = (value: unknown, currentPath: string): void => {' + NL;
content +=
	"		if (Array.isArray(value)) { value.forEach((item, i) => walk(item, currentPath + '[' + i + ']')); return; }" +
	NL;
content += "		if (value && typeof value === 'object') {" + NL;
content += '			const keys = Object.keys(value as Record<string, unknown>);' + NL;
content += '			for (const key of keys) {' + NL;
content += '				if (FORBIDDEN_KEYS.includes(key)) {' + NL;
content += "					throw new Error('Champ interdit ' + key + ' trouve a ' + currentPath);" + NL;
content += '				}' + NL;
content += "				walk((value as Record<string, unknown>)[key], currentPath + '.' + key);" + NL;
content += '			}' + NL;
content += '		}' + NL;
content += '	};' + NL;
content += '	walk(obj, path);' + NL;
content += '}' + NL;

content += NL;
content += "describe('getMemberShell profile test', () => {" + NL;
content += "	it('retourne le profil du membre connecte', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await getMemberShell(tx, MEMBER_ID);' + NL;
content += '		expect(result.profile.id).toBe(MEMBER_ID);' + NL;
content += "		expect(result.profile.role).toBe('member');" + NL;
content += "		expect(result.profile.accountStatus).toBe('active');" + NL;
content += "		expect(result.profile.email).toBe('membre@test.bzh');" + NL;
content += '		expect(result.profile.pupitres).toHaveLength(1);' + NL;
content += '		expect(result.profile.pupitres[0].pupitreId).toBe(BOMBARDE);' + NL;
content += '		expect(result.profile.pupitres[0].isChef).toBe(false);' + NL;
content += "		expect(typeof result.unreadCount).toBe('number');" + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getMemberShell refuse inconnu', () => {" + NL;
content += "	it('refuse un profil introuvable', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content +=
	"		await expect(getMemberShell(tx, 'inconnu')).rejects.toBeInstanceOf(MemberQueryError);" + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getMemberShell refuse pending', () => {" + NL;
content += "	it('refuse un compte pending', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content +=
	"		await expect(getMemberShell(tx, 'pending-id')).rejects.toBeInstanceOf(MemberQueryError);" + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getMemberShell refuse suspended', () => {" + NL;
content += "	it('refuse un compte suspended', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content +=
	"		await expect(getMemberShell(tx, 'suspended-id')).rejects.toBeInstanceOf(MemberQueryError);" + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getMemberShell no forbidden keys', () => {" + NL;
content += "	it('n expose aucun champ interdit', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await getMemberShell(tx, MEMBER_ID);' + NL;
content += "		assertNoForbiddenKeys(result, 'getMemberShell');" + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getMemberShell isChef for chef', () => {" + NL;
content += "	it('expose isChef pour le chef sur son pupitre', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await getMemberShell(tx, CHEF_ID);' + NL;
content += '		const bombarde = result.profile.pupitres.find((p) => p.pupitreId === BOMBARDE);' + NL;
content += '		expect(bombe.isChef).toBe(true);' + NL;
content += '	});' + NL;
content += '});' + NL;

content += NL;
content += "describe('listAgendaEvents visible', () => {" + NL;
content += "	it('retourne les evenements visibles', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await listAgendaEvents(tx, MEMBER_ID);' + NL;
content += '		expect(Array.isArray(result.events)).toBe(true);' + NL;
content += '		expect(result.events.length).toBeGreaterThan(0);' + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('listAgendaEvents no forbidden keys', () => {" + NL;
content += "	it('no forbidden keys', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await listAgendaEvents(tx, MEMBER_ID);' + NL;
content += "		assertNoForbiddenKeys(result, 'listAgendaEvents');" + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getEventDetail visible', () => {" + NL;
content += "	it('retourne le detail d un evenement visible', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await getEventDetail(tx, MEMBER_ID, EVENT_INTERNE);' + NL;
content += '		expect(result).not.toBeNull();' + NL;
content += '		expect(result.event.id).toBe(EVENT_INTERNE);' + NL;
content += "		expect(result.event.myResponse).toBe('present');" + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getEventDetail invisible', () => {" + NL;
content += "	it('retourne null pour un evenement invisible', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += "		const result = await getEventDetail(tx, MEMBER_ID, 'invisible-id');" + NL;
content += '		expect(result).toBeNull();' + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getEventDetail chef multi-pupitre', () => {" + NL;
content += "	it('chef ne voit pas reponses nominatives sur multi-pupitre', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await getEventDetail(tx, CHEF_ID, EVENT_MULTI);' + NL;
content += '		expect(result).not.toBeNull();' + NL;
content += '		expect(result.responses).toEqual([]);' + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getEventForEdit chef own', () => {" + NL;
content += "	it('retourne le formulaire pour un chef sur son evenement', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await getEventForEdit(tx, CHEF_ID, EVENT_INTERNE);' + NL;
content += '		expect(result).not.toBeNull();' + NL;
content += '		expect(result.event.id).toBe(EVENT_INTERNE);' + NL;
content += '		expect(result.canManage).toBe(true);' + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getEventForEdit chef multi refused', () => {" + NL;
content += "	it('refuse un chef sur evenement multi-pupitre', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await getEventForEdit(tx, CHEF_ID, EVENT_MULTI);' + NL;
content += '		expect(result).toBeNull();' + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('getEventForEdit member refused', () => {" + NL;
content += "	it('refuse un membre sur tout evenement', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await getEventForEdit(tx, MEMBER_ID, EVENT_INTERNE);' + NL;
content += '		expect(result).toBeNull();' + NL;
content += '	});' + NL;
content += '});' + NL;
content += "describe('listDirectoryProfiles no forbidden keys', () => {" + NL;
content += "	it('retourne les profils sans champs interdits', async () => {" + NL;
content += '		const fixtures = baseFixtures();' + NL;
content += '		const tx = createFakeTransaction(fixtures);' + NL;
content += '		const result = await listDirectoryProfiles(tx, MEMBER_ID);' + NL;
content += '		expect(Array.isArray(result.profiles)).toBe(true);' + NL;
content += '		result.profiles.forEach((p) => {' + NL;
content += '			expect(p.email).toBeUndefined();' + NL;
content += '			expect(p.role).toBeUndefined();' + NL;
content += '			expect(p.accountStatus).toBeUndefined();' + NL;
content += '			expect(p.isChef).toBeUndefined();' + NL;
content += '		});' + NL;
content += '	});' + NL;
content += '});' + NL;
