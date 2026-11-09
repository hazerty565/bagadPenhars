````markdown
# Système de Gestion d'Événements avec RSVP

> Les règles de présence de ce guide sont validées. Les exemples SQL et
> d'implémentation ci-dessous sont conceptuels et ne remplacent pas le modèle
> courant `events` / `event_responses` défini dans `docs/database.md`. Lors
> d'une suppression de compte, appliquer l'anonymisation des réponses décidée
> dans `docs/questions.md`.

## Contexte

Mise en place d'un système de réponse présent/absent pour les événements d'un site web. Les membres peuvent répondre à un événement et modifier leur réponse jusqu'au jour J (clôture à minuit).

## Règles Métier

### Gestion des réponses

- ✅ Les membres peuvent répondre "Présent" ou "Absent" via des boutons radio
- ✅ Les membres peuvent **changer d'avis autant de fois qu'ils veulent** jusqu'à la clôture
- ✅ Pas d'historique des modifications (seul le dernier état est conservé)
- ✅ Pas de limite de capacité ni d'accompagnateurs
- ✅ Pas d'invités externes (uniquement les membres du site)

### Clôture automatique

- ✅ L'événement est **clos à minuit (00h00) le jour suivant** la date de l'événement
- ✅ Exemple : Événement le 7 novembre → Clos à partir du 8 novembre 00h00
- ✅ Pas de gestion d'heures dans les événements (dates uniquement)

### États d'un événement

1. **Actif** : Ouvert aux réponses (date pas encore passée)
2. **Annulé** : L'admin a annulé manuellement l'événement
3. **Clos** : Calculé automatiquement quand `date_evenement` est antérieure
   au jour courant de `Europe/Paris`

### Comportements spéciaux

- ✅ Si l'événement est **annulé** : Les réponses sont conservées mais en lecture seule
- ✅ Si l'admin **modifie la date** : Les réponses existantes ne changent pas
- ✅ Les réponses ne sont pas supprimées lors de l'annulation ou de la clôture
- ✅ Lors d'une suppression de compte, les réponses conservées à des fins
  historiques sont anonymisées conformément à `docs/questions.md`

## Structure Base de Données (PostgreSQL)

### Types personnalisés

```sql
-- Statut de l'événement
CREATE TYPE statut_evenement AS ENUM ('actif', 'annule');

-- Réponses des utilisateurs
CREATE TYPE statut_reponse AS ENUM ('present', 'absent');
```
````

### Table des événements

```sql
CREATE TABLE agenda (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    date_evenement DATE NOT NULL, -- DATE uniquement, pas de TIMESTAMP
    statut statut_evenement DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agenda_date ON agenda(date_evenement);
```

### Table des présences

```sql
CREATE TABLE agenda_presence (
    id SERIAL PRIMARY KEY,
    agenda_id INT NOT NULL REFERENCES agenda(id) ON DELETE CASCADE,
    user_id INT NOT NULL, -- Relié à la table users
    statut statut_reponse NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Un utilisateur ne peut avoir qu'une seule réponse par événement
    CONSTRAINT unique_user_agenda UNIQUE (agenda_id, user_id)
);

CREATE INDEX idx_presence_agenda_user ON agenda_presence(agenda_id, user_id);
```

### Table optionnelle pour les notifications

```sql
CREATE TABLE notification_rappel (
    id SERIAL PRIMARY KEY,
    agenda_id INT REFERENCES agenda(id),
    user_id INT,
    type_notification VARCHAR(50), -- 'email' ou 'push'
    envoye_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_notification UNIQUE (agenda_id, user_id, type_notification)
);
```

## Logique de Clôture

### Règle simple

L'événement est clos dès que `date_evenement` est antérieure à la date courante
en `Europe/Paris`. Avec PostgreSQL, le jour courant métier peut être calculé ainsi :

```sql
(now() AT TIME ZONE 'Europe/Paris')::date
```

### Exemples

| Date événement  | Date actuelle   | État      |
| --------------- | --------------- | --------- |
| 7 novembre 2026 | 7 novembre 2026 | ✅ OUVERT |
| 7 novembre 2026 | 8 novembre 2026 | 🔒 CLOS   |
| 7 novembre 2026 | 9 novembre 2026 | 🔒 CLOS   |

## Requêtes SQL Utiles

### Vérifier l'état d'un événement

```sql
SELECT
    id,
    titre,
    date_evenement,
    statut,
    CASE
        WHEN statut = 'annule' THEN 'annule'
        WHEN date_evenement < (now() AT TIME ZONE 'Europe/Paris')::date THEN 'clos'
        ELSE 'actif'
    END as etat_reel,
    CASE
        WHEN statut = 'annule' THEN false
        WHEN date_evenement < (now() AT TIME ZONE 'Europe/Paris')::date THEN false
        ELSE true
    END as modifiable
FROM agenda
WHERE id = $1;
```

### Enregistrer ou modifier une réponse (UPSERT)

```sql
INSERT INTO agenda_presence (agenda_id, user_id, statut, updated_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (agenda_id, user_id)
DO UPDATE SET
    statut = EXCLUDED.statut,
    updated_at = NOW();
```

### Compter les présents/absents

```sql
SELECT
    a.id,
    a.titre,
    a.date_evenement,
    COUNT(CASE WHEN ap.statut = 'present' THEN 1 END) as nb_present,
    COUNT(CASE WHEN ap.statut = 'absent' THEN 1 END) as nb_absent,
    COUNT(ap.id) as total_reponses
FROM agenda a
LEFT JOIN agenda_presence ap ON a.id = ap.agenda_id
WHERE a.id = $1
GROUP BY a.id, a.titre, a.date_evenement;
```

### Lister les présents

```sql
SELECT u.nom, u.email, ap.statut, ap.updated_at
FROM agenda_presence ap
JOIN users u ON ap.user_id = u.id
WHERE ap.agenda_id = $1
  AND ap.statut = 'present'
ORDER BY u.nom;
```

### Annuler un événement

```sql
UPDATE agenda
SET statut = 'annule', updated_at = NOW()
WHERE id = $1;
```

### Trouver les utilisateurs sans réponse (pour rappels)

```sql
SELECT a.id, a.titre, u.id as user_id, u.email
FROM agenda a
CROSS JOIN users u
LEFT JOIN agenda_presence ap ON a.id = ap.agenda_id AND u.id = ap.user_id
WHERE a.statut = 'actif'
  AND a.date_evenement BETWEEN
      (now() AT TIME ZONE 'Europe/Paris')::date
      AND (now() AT TIME ZONE 'Europe/Paris')::date + 3
  AND ap.id IS NULL;
```

## Code Backend (Exemple Node.js)

### Fonction pour enregistrer une réponse

```javascript
async function enregistrerReponse(agendaId, userId, statut) {
	// 1. Récupérer l'événement avec son état
	const result = await db.query(
		`SELECT 
            id, 
            titre, 
            date_evenement,
            statut,
            CASE 
                WHEN statut = 'annule' THEN 'annule'
                WHEN date_evenement < (now() AT TIME ZONE 'Europe/Paris')::date THEN 'clos'
                ELSE 'actif'
            END as etat_reel
         FROM agenda 
         WHERE id = $1`,
		[agendaId]
	);

	if (result.rows.length === 0) {
		throw new Error('Événement introuvable');
	}

	const event = result.rows[0];

	// 2. Vérifier l'état
	if (event.etat_reel === 'annule') {
		throw new Error('Cet événement est annulé');
	}

	if (event.etat_reel === 'clos') {
		throw new Error('Les réponses sont closes pour cet événement');
	}

	// 3. Enregistrer la réponse (INSERT ou UPDATE automatique)
	await db.query(
		`INSERT INTO agenda_presence (agenda_id, user_id, statut, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (agenda_id, user_id) 
         DO UPDATE SET 
            statut = EXCLUDED.statut,
            updated_at = NOW()`,
		[agendaId, userId, statut]
	);

	return { success: true, message: 'Réponse enregistrée' };
}
```

## Code Frontend (Exemple JavaScript)

### Déterminer l'état à afficher

```javascript
function getEtatEvenement(event) {
	if (event.etat_reel === 'annule') {
		return {
			label: 'ANNULÉ - Cet événement est annulé, les réponses sont closes',
			modifiable: false,
			cssClass: 'event-annule'
		};
	}

	if (event.etat_reel === 'clos') {
		return {
			label: 'CLOS - Cet événement est terminé, les réponses sont closes',
			modifiable: false,
			cssClass: 'event-clos'
		};
	}

	return {
		label: "Ouvert - Vous pouvez modifier votre réponse jusqu'au " + event.date_evenement,
		modifiable: true,
		cssClass: 'event-ouvert'
	};
}
```

## Points Importants

### Sécurité

- ✅ Toujours vérifier côté backend si l'événement est modifiable (pas seulement côté frontend)
- ✅ Utiliser des transactions pour les opérations critiques
- ✅ Valider les données entrantes (statut doit être 'present' ou 'absent')

### Performance

- ✅ Les index sur `date_evenement` et `(agenda_id, user_id)` accélèrent les requêtes
- ✅ Le calcul de l'état est fait en SQL (pas besoin de cron job)
- ✅ L'UPSERT (`ON CONFLICT`) évite les doublons et gère automatiquement les modifications

### Notifications

- ✅ Prévoir un cron job quotidien pour envoyer les rappels
- ✅ Utiliser la table `notification_rappel` pour éviter les doublons
- ✅ Envoyer les rappels 3 jours avant l'événement aux utilisateurs sans réponse

## Résumé des Décisions

| Question                       | Réponse                                       |
| ------------------------------ | --------------------------------------------- |
| Clôture horaire ?              | Non, clôture à minuit (00h00) le jour suivant |
| Capacité limitée ?             | Non                                           |
| Historique des modifications ? | Non                                           |
| Événement annulable ?          | Oui, réponses conservées                      |
| Modification de date ?         | Oui, sans impact sur les réponses             |
| Invités externes ?             | Non                                           |
| Notifications ?                | Oui (push)                                    |

---

**Date de création** : 6 novembre 2026  
**Dernière mise à jour** : 6 novembre 2026

```

Voilà le fichier `event.md` complet ! Il récapitule toute la logique, la structure SQL, les requêtes utiles, et les exemples de code. Ton agent pourra l'utiliser comme référence pour implémenter le système.
```
