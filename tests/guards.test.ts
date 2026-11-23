import { describe, expect, it } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { eventPupitres, events, profilePupitres, profiles, pupitres } from '$lib/db/schema';
import type { Transaction } from '$lib/db';
import { MemberCommandError, runMemberCommand } from '$lib/server/member/commands';

/**
 * Garde d'autorisation des événements — étapes 36 et 55.
 *
 * Règle validée (Q-A1, Q-A2, Q-A4) et désormais appliquée **en base** par
 * `0006_rls_hardening` puis `0007_events_delete_policy_fix` :
 *
 * - un chef de pupitre crée uniquement des événements `interne` ciblant
 *   exactement un pupitre qu'il dirige (`app.create_event`) ;
 * - il gère (modifie, annule, supprime) uniquement les événements mono-pupitre
 *   d'un pupitre qu'il dirige — jamais un multi-pupitres, jamais un événement
 *   global, et jamais au titre de créateur (`app.can_manage_event`) ;
 * - le ciblage et le caractère sondage d'un événement géré par un chef ne sont
 *   pas modifiables par lui ; la visibilité ne peut pas être élargie ;
 * - la secrétaire et l'administrateur conservent `public` / `interne` /
 *   `pupitre`, le multi-pupitres, l'événement global et toutes les suppressions.
 *
 * Ces tests exécutent la **vraie commande serveur** `runMemberCommand` — celle
 * appelée par `POST /api/member/action`, seule surface de mutation de l'espace
 * adhérents — sur une transaction factice : aucune base Neon n'est nécessaire.
 * Ce sont donc les contrôles de `src/lib/server/member/commands.ts`, et pas une
 * copie de la règle, qui décident du 403.
 *
 * La transaction factice évalue réellement les clauses `where` simples (`eq` et
 * `and` de drizzle-orm), enregistre les écritures (`insert`, `update`, `delete`)
 * et capture la requête SQL de `app.create_event` : l'ordre des arguments imposé
 * par la fonction PostgreSQL est donc vérifié, pas seulement supposé.
 */

const BOMBARDE = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const CORNEMUSE = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';

const CHEF = 'cccccccc-3333-4333-8333-cccccccccccc';
const SECRETAIRE = 'dddddddd-4444-4444-8444-dddddddddddd';
const ADMIN = 'eeeeeeee-5555-4555-8555-eeeeeeeeeeee';
const MEMBRE = '99999999-0000-4000-8000-999999999999';
/** Rôle ramené à `member` : `is_chef` reste vrai sur `profile_pupitres`. */
const RETROGRADE = '88888888-0000-4000-8000-888888888888';

/** Événement `interne` mono-pupitre (bombarde), créé par le chef. */
const EVENT_INTERNE = '11111111-1111-4111-8111-111111111111';
/** Événement `public` global, créé par la secrétaire. */
const EVENT_PUBLIC = '22222222-2222-4222-8222-222222222222';
/** Événement `interne` multi-pupitres (bombarde + cornemuse). */
const EVENT_MULTI = '44444444-4444-4444-8444-444444444444';
/** Événement `interne` mono-pupitre (cornemuse) : hors périmètre du chef. */
const EVENT_AUTRE = '55555555-5555-4555-8555-555555555555';
/** Événement hérité en visibilité `pupitre`, mono-pupitre (bombarde). */
const EVENT_PUPITRE = '66666666-6666-4666-8666-666666666666';
const NEW_EVENT = '33333333-3333-4333-8333-333333333333';

type Row = Record<string, unknown>;

interface Fixtures {
	profiles: Row[];
	profilePupitres: Row[];
	pupitres: Row[];
	events: Row[];
	eventPupitres: Row[];
}

/** Journal des écritures demandées par une commande. */
interface Writes {
	inserts: unknown[];
	sets: { table: unknown; values: unknown }[];
	deletes: unknown[];
	executes: unknown[];
}

function emptyWrites(): Writes {
	return { inserts: [], sets: [], deletes: [], executes: [] };
}

/* -------------------------------------------------------------------------- */
/* Transaction factice                                                        */
/* -------------------------------------------------------------------------- */

/** Élément d'une clause SQL drizzle (`queryChunks`). */
interface SqlChunk {
	name?: unknown;
	table?: unknown;
	value?: unknown;
	queryChunks?: unknown[];
	constructor?: { name?: string };
}

function isColumn(chunk: unknown): chunk is SqlChunk {
	if (typeof chunk !== 'object' || chunk === null) return false;
	const candidate = chunk as SqlChunk;
	return typeof candidate.name === 'string' && typeof candidate.table === 'object';
}

function isStringChunk(chunk: unknown): chunk is SqlChunk {
	if (typeof chunk !== 'object' || chunk === null) return false;
	return chunk.constructor?.name === 'StringChunk';
}

function isSqlNode(chunk: unknown): chunk is SqlChunk {
	if (typeof chunk !== 'object' || chunk === null) return false;
	return Array.isArray((chunk as SqlChunk).queryChunks);
}

/** Extrait la valeur liée d'un `Param` drizzle, ou le littéral tel quel. */
function unwrapValue(chunk: unknown): unknown {
	if (typeof chunk === 'object' && chunk !== null && !isSqlNode(chunk)) {
		const candidate = chunk as SqlChunk;
		if (candidate.constructor?.name === 'Param' || 'value' in candidate) {
			return candidate.value;
		}
	}
	return chunk;
}

/**
 * Ne conserve que les contraintes d'égalité `colonne = valeur`, seules formes
 * utilisées par les commandes pour cibler un profil ou un événement.
 */
function collectEqualities(node: unknown, out: Array<[string, unknown]>): void {
	if (!isSqlNode(node)) return;
	const chunks = node.queryChunks as unknown[];

	for (let index = 0; index < chunks.length; index += 1) {
		const chunk = chunks[index];

		if (isColumn(chunk)) {
			const operator = chunks[index + 1];
			const rawValue = chunks[index + 2];
			if (
				isStringChunk(operator) &&
				Array.isArray(operator.value) &&
				(operator.value as string[]).join('').trim() === '=' &&
				rawValue !== undefined
			) {
				out.push([chunk.name as string, unwrapValue(rawValue)]);
			}
			continue;
		}

		collectEqualities(chunk, out);
	}
}

function applyWhere(rows: Row[], condition: unknown): Row[] {
	if (condition === undefined || condition === null) return rows;

	const constraints: Array<[string, unknown]> = [];
	collectEqualities(condition, constraints);
	if (constraints.length === 0) return rows;

	return rows.filter((row) =>
		constraints.every(([column, value]) => Object.is(row[column], value))
	);
}

/**
 * Reconstitue le texte SQL et les paramètres liés tels que le pilote les
 * recevrait : c'est ce qui prouve l'ordre des arguments de `app.create_event`.
 *
 * On passe par le dialecte drizzle (`PgDialect`) plutôt que par une inspection
 * des `queryChunks` : dans cette version, une interpolation `${valeur}` est
 * stockée telle quelle et seul `sql.param()` produit un `Param`. Le dialecte est
 * donc la seule source fiable, et c'est exactement ce que le pilote envoie.
 */
const dialect = new PgDialect();

function describeQuery(query: unknown): { text: string; values: unknown[] } {
	const rendered = dialect.sqlToQuery(query as Parameters<typeof dialect.sqlToQuery>[0]);
	return {
		text: rendered.sql.replace(/\s+/g, ' ').trim(),
		values: rendered.params as unknown[]
	};
}

interface SelectBuilder {
	where(condition: unknown): SelectBuilder;
	orderBy(...columns: unknown[]): SelectBuilder;
	limit(count?: number): Promise<Row[]>;
	then<T>(onFulfilled: (rows: Row[]) => T, onRejected?: (reason: unknown) => T): Promise<T>;
}

interface ValuesBuilder {
	returning(): Promise<Row[]>;
	then<T>(onFulfilled: (rows: Row[]) => T, onRejected?: (reason: unknown) => T): Promise<T>;
}

interface InsertBuilder {
	values(rows: unknown): ValuesBuilder;
}

function createFakeTransaction(fixtures: Fixtures, writes: Writes = emptyWrites()): Transaction {
	const data = new Map<unknown, Row[]>([
		[profiles, fixtures.profiles],
		[profilePupitres, fixtures.profilePupitres],
		[pupitres, fixtures.pupitres],
		[events, fixtures.events],
		[eventPupitres, fixtures.eventPupitres]
	]);

	const rowsOf = (table: unknown): Row[] => data.get(table) ?? [];

	function selectBuilder(table: unknown): SelectBuilder {
		let condition: unknown = null;

		const execute = (): Promise<Row[]> => Promise.resolve(applyWhere(rowsOf(table), condition));

		const builder: SelectBuilder = {
			where(next) {
				condition = next;
				return builder;
			},
			orderBy() {
				return builder;
			},
			limit() {
				return execute();
			},
			then(onFulfilled, onRejected) {
				return execute().then(onFulfilled, onRejected);
			}
		};

		return builder;
	}

	function insertBuilder(table: unknown): InsertBuilder {
		const execute = (): Promise<Row[]> =>
			Promise.resolve(table === events ? [{ id: NEW_EVENT }] : []);

		const values: ValuesBuilder = {
			returning: execute,
			then: (onFulfilled, onRejected) => execute().then(onFulfilled, onRejected)
		};

		return { values: () => values };
	}

	const fake = {
		select: () => ({ from: (table: unknown) => selectBuilder(table) }),
		insert: (table: unknown) => {
			writes.inserts.push(table);
			return insertBuilder(table);
		},
		update: (table: unknown) => ({
			set: (values: unknown) => {
				writes.sets.push({ table, values });
				return { where: () => Promise.resolve([]) };
			}
		}),
		delete: (table: unknown) => {
			writes.deletes.push(table);
			return {
				set: () => ({ where: () => Promise.resolve([]) }),
				where: () => Promise.resolve([])
			};
		},
		execute: (query: unknown) => {
			writes.executes.push(query);
			return Promise.resolve({ rows: [{ id: NEW_EVENT }] });
		}
	};

	return fake as unknown as Transaction;
}

/* -------------------------------------------------------------------------- */
/* Jeux de données                                                            */
/* -------------------------------------------------------------------------- */

function baseFixtures(): Fixtures {
	return {
		profiles: [
			{ id: CHEF, role: 'chef_pupitre', account_status: 'active' },
			{ id: SECRETAIRE, role: 'secretaire', account_status: 'active' },
			{ id: ADMIN, role: 'admin', account_status: 'active' },
			{ id: MEMBRE, role: 'member', account_status: 'active' },
			{ id: RETROGRADE, role: 'member', account_status: 'active' }
		],
		profilePupitres: [
			{ profile_id: CHEF, pupitre_id: BOMBARDE, is_chef: true },
			{ profile_id: SECRETAIRE, pupitre_id: BOMBARDE, is_chef: false },
			{ profile_id: ADMIN, pupitre_id: BOMBARDE, is_chef: false },
			{ profile_id: MEMBRE, pupitre_id: BOMBARDE, is_chef: false },
			// Rôle rétrogradé : la ligne `is_chef` subsiste, le droit non.
			{ profile_id: RETROGRADE, pupitre_id: BOMBARDE, is_chef: true }
		],
		pupitres: [
			{ id: BOMBARDE, slug: 'bombarde' },
			{ id: CORNEMUSE, slug: 'cornemuse' }
		],
		events: [
			{
				id: EVENT_INTERNE,
				title: 'Répétition du pupitre',
				description: '',
				event_date: '2026-12-05',
				event_type: 'repetition',
				visibility: 'interne',
				location: 'Salle du bagad',
				is_poll: false,
				cancelled_at: null,
				created_by: CHEF
			},
			{
				id: EVENT_PUBLIC,
				title: 'Concert public',
				description: '',
				event_date: '2026-12-12',
				event_type: 'concert',
				visibility: 'public',
				location: 'Place du centre',
				is_poll: false,
				cancelled_at: null,
				created_by: SECRETAIRE
			},
			{
				id: EVENT_MULTI,
				title: 'Répétition bombarde et cornemuse',
				description: '',
				event_date: '2026-12-19',
				event_type: 'repetition',
				visibility: 'interne',
				location: 'Salle du bagad',
				is_poll: false,
				cancelled_at: null,
				created_by: SECRETAIRE
			},
			{
				id: EVENT_AUTRE,
				title: 'Répétition cornemuse',
				description: '',
				event_date: '2026-12-20',
				event_type: 'repetition',
				visibility: 'interne',
				location: 'Salle du bagad',
				is_poll: false,
				cancelled_at: null,
				created_by: SECRETAIRE
			},
			{
				id: EVENT_PUPITRE,
				title: 'Répétition héritée du pupitre',
				description: '',
				event_date: '2026-12-21',
				event_type: 'repetition',
				visibility: 'pupitre',
				location: 'Salle du bagad',
				is_poll: false,
				cancelled_at: null,
				created_by: CHEF
			}
		],
		eventPupitres: [
			{ event_id: EVENT_INTERNE, pupitre_id: BOMBARDE },
			{ event_id: EVENT_MULTI, pupitre_id: BOMBARDE },
			{ event_id: EVENT_MULTI, pupitre_id: CORNEMUSE },
			{ event_id: EVENT_AUTRE, pupitre_id: CORNEMUSE },
			{ event_id: EVENT_PUPITRE, pupitre_id: BOMBARDE }
		]
	};
}

/** Charge utile d'un chef par défaut : `interne` + son propre pupitre. */
function input(overrides: Row = {}): Row {
	return {
		title: 'Répétition du pupitre',
		description: '',
		date: '2026-12-05',
		type: 'repetition',
		visibility: 'interne',
		isPoll: false,
		pupitreIds: ['bombarde'],
		location: 'Salle du bagad',
		...overrides
	};
}

async function run(
	profileId: string,
	action: string,
	payload: Row,
	fixtures: Fixtures = baseFixtures(),
	writes: Writes = emptyWrites()
): Promise<unknown> {
	return runMemberCommand(
		createFakeTransaction(fixtures, writes),
		{ profileId, origin: 'https://bagad-penhars.test' },
		action,
		payload
	);
}

/** Exécute la commande et renvoie l'erreur métier attendue (jamais silencieuse). */
async function refusal(
	profileId: string,
	action: string,
	payload: Row,
	fixtures: Fixtures = baseFixtures()
): Promise<MemberCommandError> {
	try {
		await run(profileId, action, payload, fixtures);
	} catch (error) {
		if (error instanceof MemberCommandError) return error;
		throw error;
	}
	throw new Error('La commande aurait dû être refusée.');
}

/* -------------------------------------------------------------------------- */
/* event.create — Q-A1 / Q-A2                                                 */
/* -------------------------------------------------------------------------- */

describe('event.create — chef : `interne` et un seul pupitre dirigé', () => {
	it('accepte un chef avec `interne` et son propre pupitre, en une seule requête atomique', async () => {
		const writes = emptyWrites();
		const result = await run(CHEF, 'event.create', { input: input() }, baseFixtures(), writes);

		expect(result).toEqual({ id: NEW_EVENT });
		// Aucun `INSERT` direct : la création passe uniquement par la fonction SQL.
		expect(writes.inserts).toEqual([]);
		expect(writes.executes).toHaveLength(1);
	});

	it("transmet les arguments de `app.create_event` dans l'ordre imposé par la base", async () => {
		const writes = emptyWrites();
		await run(
			CHEF,
			'event.create',
			{ input: input({ title: 'Répétition décalée', description: 'Note du chef' }) },
			baseFixtures(),
			writes
		);

		const query = describeQuery(writes.executes[0]);

		// p_title, p_description, p_event_date, p_event_type, p_is_poll,
		// p_visibility, p_location, p_pupitre_ids — `is_poll` AVANT `visibility`,
		// et `location` obligatoire juste avant la collection.
		expect(query.values).toEqual([
			'Répétition décalée',
			'Note du chef',
			'2026-12-05',
			'repetition',
			false,
			'interne',
			'Salle du bagad',
			[BOMBARDE]
		]);
		expect(query.text).toContain('select app.create_event(');
		// La séquence des types castés atteste l'ordre p_title, p_description,
		// p_event_date, p_event_type, p_is_poll, p_visibility, p_location,
		// p_pupitre_ids (numéros de paramètres neutralisés).
		expect(query.text.replace(/\$\d+/g, '$')).toContain(
			'$::date, $::public.event_type, $::boolean, $::public.event_visibility, $::text, $::uuid[]'
		);
	});

	it('refuse un chef qui crée un événement `public` (403 forbidden)', async () => {
		const error = await refusal(CHEF, 'event.create', { input: input({ visibility: 'public' }) });
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
		expect(error.message).toContain('interne');
	});

	it('refuse un chef qui crée un événement `pupitre` (403 forbidden)', async () => {
		const error = await refusal(CHEF, 'event.create', { input: input({ visibility: 'pupitre' }) });
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it('refuse un chef sans pupitre, même en `interne` (403 forbidden)', async () => {
		const error = await refusal(CHEF, 'event.create', { input: input({ pupitreIds: [] }) });
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it('refuse un chef qui cible deux pupitres (403 forbidden)', async () => {
		const error = await refusal(CHEF, 'event.create', {
			input: input({ pupitreIds: ['bombarde', 'cornemuse'] })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse un chef qui cible un pupitre qu'il ne dirige pas (403 forbidden)", async () => {
		const error = await refusal(CHEF, 'event.create', {
			input: input({ pupitreIds: ['cornemuse'] })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it('refuse un membre (403 forbidden)', async () => {
		const error = await refusal(MEMBRE, 'event.create', { input: input() });
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it('refuse un profil rétrogradé qui porte encore `is_chef` (403 forbidden)', async () => {
		const error = await refusal(RETROGRADE, 'event.create', { input: input() });
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});
});

describe('event.create — secrétaire et administrateur', () => {
	it('accepte la secrétaire avec `public` et aucun pupitre (événement global)', async () => {
		const writes = emptyWrites();
		const result = await run(
			SECRETAIRE,
			'event.create',
			{ input: input({ visibility: 'public', pupitreIds: [] }) },
			baseFixtures(),
			writes
		);

		expect(result).toEqual({ id: NEW_EVENT });
		expect(describeQuery(writes.executes[0]).values[7]).toEqual([]);
	});

	it('accepte la secrétaire avec un événement multi-pupitres en `pupitre`', async () => {
		const result = await run(SECRETAIRE, 'event.create', {
			input: input({ visibility: 'pupitre', pupitreIds: ['bombarde', 'cornemuse'] })
		});
		expect(result).toEqual({ id: NEW_EVENT });
	});

	it("accepte l'administrateur avec `interne` et son pupitre", async () => {
		const result = await run(ADMIN, 'event.create', { input: input() });
		expect(result).toEqual({ id: NEW_EVENT });
	});

	it('refuse un événement `pupitre` sans aucun pupitre (400 invalid_payload)', async () => {
		const error = await refusal(SECRETAIRE, 'event.create', {
			input: input({ visibility: 'pupitre', pupitreIds: [] })
		});
		expect(error.status).toBe(400);
		expect(error.code).toBe('invalid_payload');
	});
});

/* -------------------------------------------------------------------------- */
/* event.update — Q-A1 / Q-A4                                                 */
/* -------------------------------------------------------------------------- */

describe('event.update — visibilité et ciblage figés pour un chef', () => {
	it("refuse qu'un chef élargisse la visibilité vers `public` (403)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_INTERNE,
			input: input({ visibility: 'public' })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse qu'un chef passe la visibilité à `pupitre` (403)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_INTERNE,
			input: input({ visibility: 'pupitre' })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse qu'un chef déplace le ciblage vers un autre pupitre (403, ciblage immuable)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_INTERNE,
			input: input({ pupitreIds: ['cornemuse'] })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
		expect(error.message).toContain('immuable');
	});

	it("refuse qu'un chef rende l'événement multi-pupitres (403, ciblage immuable)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_INTERNE,
			input: input({ pupitreIds: ['bombarde', 'cornemuse'] })
		});
		expect(error.status).toBe(403);
		expect(error.message).toContain('immuable');
	});

	it("refuse qu'un chef retire le ciblage, ce qui rendrait l'événement global (403)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_INTERNE,
			input: input({ pupitreIds: [] })
		});
		expect(error.status).toBe(403);
		expect(error.message).toContain('immuable');
	});

	it("refuse qu'un chef bascule le caractère sondage (403)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_INTERNE,
			input: input({ isPoll: true })
		});
		expect(error.status).toBe(403);
		expect(error.message).toContain('sondage');
	});

	it('autorise un chef à modifier son événement sans toucher au ciblage (200, aucune réécriture)', async () => {
		const writes = emptyWrites();
		const result = await run(
			CHEF,
			'event.update',
			{ eventId: EVENT_INTERNE, input: input({ title: 'Répétition décalée' }) },
			baseFixtures(),
			writes
		);

		expect(result).toEqual({ id: EVENT_INTERNE });
		// `event_pupitres` n'est ni supprimé ni réinséré (policies réservées).
		expect(writes.deletes).toEqual([]);
		expect(writes.inserts).toEqual([]);
	});

	it("refuse qu'un chef gère un événement global, même porté par son pupitre (403)", async () => {
		const fixtures = baseFixtures();
		fixtures.eventPupitres = [
			...fixtures.eventPupitres,
			{ event_id: EVENT_PUBLIC, pupitre_id: BOMBARDE }
		];

		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_PUBLIC,
			input: input()
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse qu'un chef gère un événement multi-pupitres dont son pupitre fait partie (403)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_MULTI,
			input: input({ pupitreIds: ['bombarde', 'cornemuse'] })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse qu'un chef gère un événement mono-pupitre d'un autre pupitre (403)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_AUTRE,
			input: input({ pupitreIds: ['cornemuse'] })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it('refuse un événement en visibilité `pupitre` héritée (la base ne le permet plus)', async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_PUPITRE,
			input: input({ visibility: 'pupitre' })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it('refuse un profil rétrogradé sur son ancien événement (403)', async () => {
		const error = await refusal(RETROGRADE, 'event.update', {
			eventId: EVENT_INTERNE,
			input: input()
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});
});

describe('event.update — secrétaire et administrateur', () => {
	it('autorise la secrétaire à élargir la visibilité en `public`', async () => {
		const result = await run(SECRETAIRE, 'event.update', {
			eventId: EVENT_INTERNE,
			input: input({ visibility: 'public' })
		});
		expect(result).toEqual({ id: EVENT_INTERNE });
	});

	it('autorise la secrétaire à réécrire le ciblage', async () => {
		const writes = emptyWrites();
		const result = await run(
			SECRETAIRE,
			'event.update',
			{ eventId: EVENT_INTERNE, input: input({ pupitreIds: ['cornemuse'] }) },
			baseFixtures(),
			writes
		);

		expect(result).toEqual({ id: EVENT_INTERNE });
		// Le ciblage est bien remplacé par la secrétaire (policies autorisées).
		expect(writes.deletes).toContain(eventPupitres);
		expect(writes.inserts).toContain(eventPupitres);
	});

	it("autorise l'administrateur à modifier un événement d'un autre pupitre", async () => {
		const result = await run(ADMIN, 'event.update', {
			eventId: EVENT_AUTRE,
			input: input({ pupitreIds: ['cornemuse'] })
		});
		expect(result).toEqual({ id: EVENT_AUTRE });
	});
});

/* -------------------------------------------------------------------------- */
/* event.delete — Q-A4                                                        */
/* -------------------------------------------------------------------------- */

describe('event.delete — mono-pupitre du chef seulement', () => {
	it('accepte un chef sur son événement mono-pupitre (200)', async () => {
		const writes = emptyWrites();
		const result = await run(
			CHEF,
			'event.delete',
			{ eventId: EVENT_INTERNE },
			baseFixtures(),
			writes
		);

		expect(result).toEqual({ id: EVENT_INTERNE });
		expect(writes.deletes).toContain(events);
	});

	it('refuse un chef sur un événement multi-pupitres (403)', async () => {
		const error = await refusal(CHEF, 'event.delete', { eventId: EVENT_MULTI });
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it('refuse un chef sur un événement global (403)', async () => {
		const error = await refusal(CHEF, 'event.delete', { eventId: EVENT_PUBLIC });
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse un chef sur le mono-pupitre d'un autre pupitre (403)", async () => {
		const error = await refusal(CHEF, 'event.delete', { eventId: EVENT_AUTRE });
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it('refuse un membre (403)', async () => {
		const error = await refusal(MEMBRE, 'event.delete', { eventId: EVENT_INTERNE });
		expect(error.status).toBe(403);
	});

	it('refuse un profil rétrogradé sur son ancien événement (403)', async () => {
		const error = await refusal(RETROGRADE, 'event.delete', { eventId: EVENT_INTERNE });
		expect(error.status).toBe(403);
	});

	it('accepte la secrétaire sur un multi-pupitres', async () => {
		const result = await run(SECRETAIRE, 'event.delete', { eventId: EVENT_MULTI });
		expect(result).toEqual({ id: EVENT_MULTI });
	});

	it("accepte l'administrateur sur un événement global", async () => {
		const result = await run(ADMIN, 'event.delete', { eventId: EVENT_PUBLIC });
		expect(result).toEqual({ id: EVENT_PUBLIC });
	});

	it('renvoie 404 pour un événement inexistant', async () => {
		const error = await refusal(SECRETAIRE, 'event.delete', {
			eventId: '77777777-7777-4777-8777-777777777777'
		});
		expect(error.status).toBe(404);
		expect(error.code).toBe('not_found');
	});
});

/* -------------------------------------------------------------------------- */
/* event.cancel / event.reactivate — colonnes sensibles préservées            */
/* -------------------------------------------------------------------------- */

describe('event.cancel / event.reactivate', () => {
	it("n'écrit que les colonnes d'annulation pour un chef", async () => {
		const writes = emptyWrites();
		const result = await run(
			CHEF,
			'event.cancel',
			{ eventId: EVENT_INTERNE },
			baseFixtures(),
			writes
		);

		expect(result).toEqual({ id: EVENT_INTERNE });
		expect(writes.sets).toHaveLength(1);
		const values = writes.sets[0].values as Record<string, unknown>;
		// Ni `visibility`, ni `created_by`, ni `is_poll` : le trigger
		// `events_guard_update_bounds` (0006 §4) les refuse hors secrétaire.
		expect(Object.keys(values).sort()).toEqual(['cancelled_at', 'cancelled_by', 'updated_at']);
		expect(values.cancelled_by).toBe(CHEF);
	});

	it('réactive sans réattribuer l’annulation', async () => {
		const writes = emptyWrites();
		const fixtures = baseFixtures();
		fixtures.events = fixtures.events.map((event) =>
			event.id === EVENT_INTERNE
				? { ...event, cancelled_at: new Date('2026-11-01T10:00:00Z') }
				: event
		);

		const result = await run(
			CHEF,
			'event.reactivate',
			{ eventId: EVENT_INTERNE },
			fixtures,
			writes
		);

		expect(result).toEqual({ id: EVENT_INTERNE });
		const values = writes.sets[0].values as Record<string, unknown>;
		expect(Object.keys(values).sort()).toEqual(['cancelled_at', 'cancelled_by', 'updated_at']);
		expect(values.cancelled_by).toBeNull();
	});

	it("refuse qu'un chef annule un événement `pupitre` hérité (403)", async () => {
		const error = await refusal(CHEF, 'event.cancel', { eventId: EVENT_PUPITRE });
		expect(error.status).toBe(403);
	});
});
