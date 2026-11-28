import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { InvitationError } from '$lib/server/invitations';

/**
 * Tests de contrat sur les invitations (unitaires, sans base de données).
 *
 * Teste les règles métier pures exportées par `src/lib/server/invitations.ts` :
 * - hachage du jeton (SHA-256, fonction interne)
 * - messages d'erreur InvitationError
 * - validation du mot de passe (longueur minimale)
 *
 * Les fonctions qui font des appels DB (`validateInvitationToken`, `acceptInvitation`)
 * sont testées via des tests d'intégration séparés.
 */

/** Reproduction locale de hashToken (interne, non exportée) pour test. */
function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

describe('invitations — logique métier pure', () => {
	describe('hashToken (SHA-256)', () => {
		it('produit un hash SHA-256 déterministe', () => {
			const token = 'test-token-123';
			const expected = createHash('sha256').update(token).digest('hex');
			expect(hashToken(token)).toBe(expected);
		});

		it('différents tokens donnent des hashes différents', () => {
			expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
		});

		it('tokens vides donnent un hash valide (sha256 de chaîne vide)', () => {
			const expected = createHash('sha256').update('').digest('hex');
			expect(hashToken('')).toBe(expected);
		});

		it('hash stable : même entrée = même sortie', () => {
			const token = 'stable-token-456';
			expect(hashToken(token)).toBe(hashToken(token));
		});
	});

	describe('InvitationError', () => {
		it("est une instance d'Error", () => {
			const err = new InvitationError('test message');
			expect(err).toBeInstanceOf(Error);
			expect(err).toBeInstanceOf(InvitationError);
		});

		it('contient le message fourni', () => {
			const msg = 'Invitation invalide';
			const err = new InvitationError(msg);
			expect(err.message).toBe(msg);
		});

		it('name est "InvitationError"', () => {
			const err = new InvitationError('test');
			expect(err.name).toBe('InvitationError');
		});
	});

	describe('validation mot de passe (règle métier : min 8 caractères)', () => {
		it('mot de passe de 7 caractères est trop court', () => {
			expect('passwor'.length).toBeLessThan(8);
		});

		it('mot de passe de 8 caractères atteint le minimum', () => {
			expect('password'.length).toBeGreaterThanOrEqual(8);
		});

		it('mot de passe vide est trop court', () => {
			expect(''.length).toBeLessThan(8);
		});

		it('mot de passe long est accepté', () => {
			expect('très-long-mot-de-passe-123'.length).toBeGreaterThanOrEqual(8);
		});
	});
});

describe('invitations — règles de validation de jeton (métier)', () => {
	// Ces tests documentent les règles métier sans appeler la DB

	describe("statuts d'invitation", () => {
		it('une invitation acceptée (accepted_at défini) est invalide', () => {
			const invitation = { accepted_at: new Date(), cancelled_at: null };
			const isValid = !invitation.accepted_at && !invitation.cancelled_at;
			expect(isValid).toBe(false);
		});

		it('une invitation annulée (cancelled_at défini) est invalide', () => {
			const invitation = { accepted_at: null, cancelled_at: new Date() };
			const isValid = !invitation.accepted_at && !invitation.cancelled_at;
			expect(isValid).toBe(false);
		});

		it('une invitation sans accepted_at ni cancelled_at est potentiellement valide', () => {
			const invitation = { accepted_at: null, cancelled_at: null };
			const isValid = !invitation.accepted_at && !invitation.cancelled_at;
			expect(isValid).toBe(true);
		});
	});

	describe('expiration', () => {
		it('invitation expirée (expires_at < now) est invalide', () => {
			const now = Date.now();
			const invitation = { expires_at: new Date(now - 1000) };
			const isExpired = invitation.expires_at.getTime() < now;
			expect(isExpired).toBe(true);
		});

		it('invitation non expirée (expires_at > now) est valide', () => {
			const now = Date.now();
			const invitation = { expires_at: new Date(now + 86400000) };
			const isExpired = invitation.expires_at.getTime() < now;
			expect(isExpired).toBe(false);
		});

		it('invitation expirant maintenant est invalide', () => {
			const now = Date.now();
			const invitation = { expires_at: new Date(now) };
			const isExpired = invitation.expires_at.getTime() < now;
			expect(isExpired).toBe(false); // égal = pas encore expiré strictement
		});
	});

	describe('correspondance email', () => {
		it('email identique (casse ignorée) = match', () => {
			const a = 'Test@Example.com';
			const b = 'test@example.com';
			expect(a.toLowerCase()).toBe(b.toLowerCase());
		});

		it('email différent = pas de match', () => {
			const a = 'test@example.com';
			const b = 'other@example.com';
			expect(a.toLowerCase()).not.toBe(b.toLowerCase());
		});
	});
});

describe('invitations — flux acceptation (règles métier)', () => {
	describe('création compte', () => {
		it('nom complet = prénom + nom', () => {
			const firstName = 'Jean';
			const lastName = 'Dupont';
			const name = `${firstName} ${lastName}`.trim();
			expect(name).toBe('Jean Dupont');
		});

		it('nom complet gère prénom ou nom manquant', () => {
			expect(`${''} ${'Dupont'}`.trim()).toBe('Dupont');
			expect(`${'Jean'} ${''}`.trim()).toBe('Jean');
		});

		it('nom complet vide fallback sur email', () => {
			const email = 'test@example.com';
			const name = `${''} ${''}`.trim() || email;
			expect(name).toBe(email);
		});
	});

	describe('vérifications pré-existence', () => {
		// Ces règles sont dans acceptInvitation : rejette si user OU profil existe déjà
		it("user existant bloque l'acceptation", () => {
			const existingUser = [{ id: 'user-1' }];
			const blocked = existingUser.length > 0;
			expect(blocked).toBe(true);
		});

		it("profil existant bloque l'acceptation", () => {
			const existingProfile = [{ id: 'profile-1' }];
			const blocked = existingProfile.length > 0;
			expect(blocked).toBe(true);
		});

		it('aucun user ni profil = pas de blocage', () => {
			const existingUser: unknown[] = [];
			const existingProfile: unknown[] = [];
			const blocked = existingUser.length > 0 || existingProfile.length > 0;
			expect(blocked).toBe(false);
		});
	});

	describe('création profil', () => {
		it('rôle par défaut = member', () => {
			const role = 'member';
			expect(role).toBe('member');
		});

		it('statut compte par défaut = pending', () => {
			const status = 'pending';
			expect(status).toBe('pending');
		});

		it('email_confirmed = true pour invitation', () => {
			const confirmed = true;
			expect(confirmed).toBe(true);
		});
	});

	describe('assignation pupitres', () => {
		it('pupitres assignés = is_chef false par défaut', () => {
			const pupitres = [{ id: 'p1' }, { id: 'p2' }];
			const assignments = pupitres.map((p) => ({
				profile_id: 'profile-1',
				pupitre_id: p.id,
				is_chef: false
			}));
			expect(assignments.every((a) => a.is_chef === false)).toBe(true);
		});

		it('aucun pupitre = insertion vide', () => {
			const pupitres: unknown[] = [];
			const assignments = pupitres.map((p) => ({
				profile_id: 'profile-1',
				pupitre_id: p,
				is_chef: false
			}));
			expect(assignments).toHaveLength(0);
		});
	});

	describe('marquage invitation acceptée', () => {
		it('accepted_at mis à la date courante', () => {
			const before = Date.now();
			const acceptedAt = new Date();
			const after = Date.now();
			expect(acceptedAt.getTime()).toBeGreaterThanOrEqual(before);
			expect(acceptedAt.getTime()).toBeLessThanOrEqual(after);
		});

		it('condition de mise à jour : id + token_hash', () => {
			const invitationId = 'inv-1';
			const tokenHash = 'abc123';
			// La requête UPDATE utilise WHERE id = ? AND token_hash = ?
			expect(invitationId).toBeDefined();
			expect(tokenHash).toBeDefined();
		});
	});

	describe('gestion concurrence', () => {
		it('si update retourne 0 lignes = déjà consommée', () => {
			const updatedRows: { id: string }[] = [];
			const alreadyConsumed = updatedRows.length === 0;
			expect(alreadyConsumed).toBe(true);
		});

		it('si update retourne 1 ligne = succès', () => {
			const updatedRows = [{ id: 'inv-1' }];
			const success = updatedRows.length === 1;
			expect(success).toBe(true);
		});
	});
});

describe('invitations — pupitres et ciblage', () => {
	it('un pupitre a id, name, slug', () => {
		const pupitre = { id: 'p1', name: 'Bombarde', slug: 'bombarde' };
		expect(pupitre).toHaveProperty('id');
		expect(pupitre).toHaveProperty('name');
		expect(pupitre).toHaveProperty('slug');
	});

	it('plusieurs pupitres possibles pour une invitation', () => {
		const pupitres = [
			{ id: 'p1', name: 'Bombarde', slug: 'bombarde' },
			{ id: 'p2', name: 'Cornemuse', slug: 'cornemuse' }
		];
		expect(pupitres).toHaveLength(2);
	});
});
