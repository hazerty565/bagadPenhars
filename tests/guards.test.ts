import { describe, expect, it } from 'vitest';
import {
	eventPupitres,
	events,
	profilePupitres,
	profiles,
	pupitres
} from '$lib/db/schema';
import type { Transaction } from '$lib/db';
import { MemberCommandError, runMemberCommand } from '$lib/server/member/commands';

/**
 * Garde d'autorisation des événements — étape 36.
 *
 * La règle validée est : « un chef de pupitre ne crée ou ne modifie un
 * événement qu'avec `visibility = 'pupitre'` et un seul pupitre qu'il dirige ;
 * la secrétaire et l'administrateur conservent `public` / `interne` / `pupitre`
 * et le multi-pupitres. `event.update` ne peut ni élargir la visibilité ni
 * sortir du périmètre du chef. »
 *
 * Ces tests exécutent la **vraie commande serveur** `runMemberCommand` — celle
 * appelée par `POST /api/member/action`, seule surface de mutation de l'espace
 * adhérents — sur une transaction factice : aucune base Neon n'est nécessaire
 * et aucun service n'est mocké. Ce sont donc les contrôles de
 * `src/lib/server/member/commands.ts`, et pas une copie de la règle, qui
 * décident du 403.
 *
 * La transaction factice évalue réellement les clauses `where` simples
 * (`eq` et `and` de drizzle-orm) : les lignes renvoyées dépendent du profil et
 * de l'événement demandés, comme en base. Sans cela, un test pourrait passer
 * pour de mauvaises raisons (toujours le même acteur).
 *
 * La fonction pure `canCreateEvent` / `canManageEvent`
 * (`src/lib/member/permissions.ts`) reste le premier filtre du service client ;
 * elle ne connaît pas `visibility`, et l'ajout de ce paramètre appartient à la
 * phase frontend. Le serveur, lui, refuse déjà tout élargissement.
 */

const BOMBARDE = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const CORNEMUSE = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';

const CHEF = 'cccccccc-3333-4333-8333-cccccccccccc';
const SECRETAIRE = 'dddddddd-4444-4444-8444-dddddddddddd';
const ADMIN = 'eeeeeeee-5555-4555-8555-eeeeeeeeeeee';

const EVENT_PUPITRE = '11111111-1111-4111-8111-111111111111';
const EVENT_PUBLIC = '22222222-2222-4222-8222-222222222222';
const NEW_EVENT = '33333333-3333-4333-8333-333333333333';

type Row = Record<string, unknown>;

interface Fixtures {
	profiles: Row[];
	profilePupitres: Row[];
	pupitres: Row[];
	events: Row[];
	eventPupitres: Row[];
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

interface SelectBuilder {
	where(condition: unknown): SelectBuilder;
	orderBy(...columns: unknown[]): SelectBuilder;
	limit(count?: number): Promise<Row[]>;
	then<T>(
		onFulfilled: (rows: Row[]) => T,
		onRejected?: (reason: unknown) => T
	): Promise<T>;
}

interface ValuesBuilder {
	returning(): Promise<Row[]>;
	then<T>(
		onFulfilled: (rows: Row[]) => T,
		onRejected?: (reason: unknown) => T
	): Promise<T>;
}

interface InsertBuilder {
	values(rows: unknown): ValuesBuilder;
}

interface WriteBuilder {
	set(values: unknown): { where(condition: unknown): Promise<Row[]> };
	where(condition: unknown): Promise<Row[]>;
}

function createFakeTransaction(fixtures: Fixtures): Transaction {
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

	const writeBuilder: WriteBuilder = {
		set: () => ({ where: () => Promise.resolve([]) }),
		where: () => Promise.resolve([])
	};

	const fake = {
		select: () => ({ from: (table: unknown) => selectBuilder(table) }),
		insert: (table: unknown) => insertBuilder(table),
		update: () => writeBuilder,
		delete: () => writeBuilder
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
			{ id: ADMIN, role: 'admin', account_status: 'active' }
		],
		profilePupitres: [
			{ profile_id: CHEF, pupitre_id: BOMBARDE, is_chef: true },
			{ profile_id: SECRETAIRE, pupitre_id: BOMBARDE, is_chef: false },
			{ profile_id: ADMIN, pupitre_id: BOMBARDE, is_chef: false }
		],
		pupitres: [
			{ id: BOMBARDE, slug: 'bombarde' },
			{ id: CORNEMUSE, slug: 'cornemuse' }
		],
		events: [
			{
				id: EVENT_PUPITRE,
				title: 'Répétition du pupitre',
				description: '',
				event_date: '2026-12-05',
				event_type: 'repetition',
				visibility: 'pupitre',
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
			}
		],
		eventPupitres: [{ event_id: EVENT_PUPITRE, pupitre_id: BOMBARDE }]
	};
}

function input(overrides: Row = {}): Row {
	return {
		title: 'Répétition du pupitre',
		description: '',
		date: '2026-12-05',
		type: 'repetition',
		visibility: 'pupitre',
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
	fixtures: Fixtures = baseFixtures()
): Promise<unknown> {
	return runMemberCommand(
		createFakeTransaction(fixtures),
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
/* event.create                                                               */
/* -------------------------------------------------------------------------- */

describe('event.create — portée du chef de pupitre', () => {
	it("refuse un chef qui crée un événement `public` (403 forbidden)", async () => {
		const error = await refusal(CHEF, 'event.create', {
			input: input({ visibility: 'public' })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse un chef qui crée un événement `interne` (403 forbidden)", async () => {
		const error = await refusal(CHEF, 'event.create', {
			input: input({ visibility: 'interne' })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse un chef qui cible un pupitre qu'il ne dirige pas (403)", async () => {
		const error = await refusal(CHEF, 'event.create', {
			input: input({ pupitreIds: ['cornemuse'] })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("accepte un chef avec `visibility: 'pupitre'` et son propre pupitre", async () => {
		const result = await run(CHEF, 'event.create', { input: input() });
		expect(result).toEqual({ id: NEW_EVENT });
	});

	it('accepte la secrétaire avec `visibility: public` (multi-pupitres conservé)', async () => {
		const result = await run(SECRETAIRE, 'event.create', {
			input: input({ visibility: 'public', pupitreIds: [] })
		});
		expect(result).toEqual({ id: NEW_EVENT });
	});

	it('accepte l’administrateur avec `visibility: interne`', async () => {
		const result = await run(ADMIN, 'event.create', {
			input: input({ visibility: 'interne', pupitreIds: [] })
		});
		expect(result).toEqual({ id: NEW_EVENT });
	});

	it('accepte la secrétaire avec un événement multi-pupitres', async () => {
		const result = await run(SECRETAIRE, 'event.create', {
			input: input({ pupitreIds: ['bombarde', 'cornemuse'] })
		});
		expect(result).toEqual({ id: NEW_EVENT });
	});
});

/* -------------------------------------------------------------------------- */
/* event.update                                                               */
/* -------------------------------------------------------------------------- */

describe('event.update — ni élargissement, ni sortie de périmètre', () => {
	it("refuse qu'un chef élargisse la visibilité vers `public` (403)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_PUPITRE,
			input: input({ visibility: 'public' })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse qu'un chef élargisse la visibilité vers `interne` (403)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_PUPITRE,
			input: input({ visibility: 'interne' })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse qu'un chef déplace l'événement vers un autre pupitre (403)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_PUPITRE,
			input: input({ pupitreIds: ['cornemuse'] })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse qu'un chef rende l'événement multi-pupitres (403)", async () => {
		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_PUPITRE,
			input: input({ pupitreIds: ['bombarde', 'cornemuse'] })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("refuse qu'un chef gère un événement global, même porté par son pupitre (403)", async () => {
		const fixtures = baseFixtures();
		// Événement `public` portant malgré tout le pupitre du chef : la
		// visibilité seule doit le sortir du périmètre du chef.
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

	it("refuse qu'un chef modifie l'événement d'un pupitre qu'il ne dirige pas (403)", async () => {
		const fixtures = baseFixtures();
		fixtures.eventPupitres = [{ event_id: EVENT_PUBLIC, pupitre_id: CORNEMUSE }];
		fixtures.events = fixtures.events.map((event) =>
			event.id === EVENT_PUBLIC ? { ...event, visibility: 'pupitre' } : event
		);

		const error = await refusal(CHEF, 'event.update', {
			eventId: EVENT_PUBLIC,
			input: input({ pupitreIds: ['cornemuse'] })
		});
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
	});

	it("autorise un chef à modifier l'événement de son pupitre en restant en `pupitre`", async () => {
		const result = await run(CHEF, 'event.update', {
			eventId: EVENT_PUPITRE,
			input: input({ title: 'Répétition décalée' })
		});
		expect(result).toEqual({ id: EVENT_PUPITRE });
	});

	it('autorise la secrétaire à passer un événement de pupitre en `public`', async () => {
		const result = await run(SECRETAIRE, 'event.update', {
			eventId: EVENT_PUPITRE,
			input: input({ visibility: 'public' })
		});
		expect(result).toEqual({ id: EVENT_PUPITRE });
	});

	it("autorise l’administrateur à modifier un événement d'un autre pupitre", async () => {
		const result = await run(ADMIN, 'event.update', {
			eventId: EVENT_PUBLIC,
			input: input({ visibility: 'interne', pupitreIds: [] })
		});
		expect(result).toEqual({ id: EVENT_PUBLIC });
	});
});
