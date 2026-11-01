# Schema: bagadpenhars
Database: pgsql
Tables: 17
Columns are NOT NULL unless marked nullable.

## pupitres
id: uuid PK default:UUID()
name: text unique
slug: text unique
created_at: timestamptz default:CURRENT_TIMESTAMP

## profiles
id: uuid PK
first_name: text
last_name: text
phone: text nullable
role: int default:pending
created_at: timestamptz default:CURRENT_TIMESTAMP
updated_at: timestamptz default:CURRENT_TIMESTAMP
nickname: text nullable
birthdate: date nullable
musician_level: int default:skolaj
costume_complete: boolean

## profile_pupitres
profile_id: uuid PK FK
pupitre_id: uuid PK FK
created_at: timestamptz default:CURRENT_TIMESTAMP

## bureau_positions
id: uuid PK default:UUID()
profile_id: uuid FK
title: text
start_date: date default:CURRENT_DATE
end_date: date nullable
created_at: timestamptz default:CURRENT_TIMESTAMP

## invitations
id: uuid PK default:UUID()
email: text
first_name: text
last_name: text
author_id: uuid FK nullable
created_at: timestamptz default:CURRENT_TIMESTAMP
used_at: timestamptz nullable

## invitation_pupitres
invitation_id: uuid PK FK
pupitre_id: uuid PK FK

## events
id: uuid PK default:UUID()
title: text
description: text nullable
location: text nullable
start_at: timestamptz
end_at: timestamptz
visibility: int default:interne
is_poll: boolean
author_id: uuid FK nullable
created_at: timestamptz default:CURRENT_TIMESTAMP
updated_at: timestamptz default:CURRENT_TIMESTAMP

## event_pupitres
event_id: uuid PK FK
pupitre_id: uuid PK FK

## documents
id: uuid PK default:UUID()
title: text
storage_path: text
pupitre_id: uuid FK
author_id: uuid FK nullable
created_at: timestamptz default:CURRENT_TIMESTAMP

## articles
id: uuid PK default:UUID()
title: text
slug: text unique
content: text
published: boolean
published_at: timestamptz nullable
author_id: uuid FK nullable
created_at: timestamptz default:CURRENT_TIMESTAMP
updated_at: timestamptz default:CURRENT_TIMESTAMP
summary: text nullable
image_url: text nullable

## albums
id: uuid PK default:UUID()
title: text
description: text nullable
is_public: boolean
author_id: uuid FK nullable
created_at: timestamptz default:CURRENT_TIMESTAMP

## media
id: uuid PK default:UUID()
album_id: uuid FK
storage_path: text
caption: text nullable
sort_order: int
created_at: timestamptz default:CURRENT_TIMESTAMP

## notification_preferences
profile_id: uuid PK FK
enabled: boolean default:TRUE
event_notifications: boolean default:TRUE
poll_reminders: boolean default:TRUE
updated_at: timestamptz default:CURRENT_TIMESTAMP

## notification_log
id: uuid PK default:UUID()
sender_id: uuid FK nullable
title: text
body: text
audience: jsonb default:'DEFAULT CAST(''''ARRAY[]'''' AS JSONB)'
sent_at: timestamptz default:CURRENT_TIMESTAMP

## audit_log
id: uuid PK default:UUID()
actor_id: uuid FK nullable
action: text
target_table: text nullable
target_id: uuid nullable
details: jsonb nullable
created_at: timestamptz default:CURRENT_TIMESTAMP

## account_deletion_requests
id: uuid PK default:UUID()
profile_id: uuid FK nullable
status: enum default:pending
requested_at: timestamptz default:CURRENT_TIMESTAMP
processed_by: uuid FK nullable
processed_at: timestamptz nullable
notes: text nullable
snapshot_email: text nullable
snapshot_name: text nullable

## member_loans
id: uuid PK default:UUID()
profile_id: uuid FK indexed
item_type: enum indexed
item_name: text
details: text nullable
loaned_at: date default:CURRENT_DATE
returned_at: date nullable
notes: text nullable
created_at: timestamptz default:CURRENT_TIMESTAMP
updated_at: timestamptz default:CURRENT_TIMESTAMP

## Relationships
profile_pupitres.profile_id → profiles.id (many-to-one)
profile_pupitres.pupitre_id → pupitres.id (many-to-one)
bureau_positions.profile_id → profiles.id (many-to-one)
invitations.author_id → profiles.id (many-to-one)
invitation_pupitres.invitation_id → invitations.id (many-to-one)
invitation_pupitres.pupitre_id → pupitres.id (many-to-one)
events.author_id → profiles.id (many-to-one)
event_pupitres.event_id → events.id (many-to-one)
event_pupitres.pupitre_id → pupitres.id (many-to-one)
documents.pupitre_id → pupitres.id (many-to-one)
documents.author_id → profiles.id (many-to-one)
articles.author_id → profiles.id (many-to-one)
albums.author_id → profiles.id (many-to-one)
media.album_id → albums.id (many-to-one)
notification_preferences.profile_id → profiles.id (many-to-one)
notification_log.sender_id → profiles.id (many-to-one)
audit_log.actor_id → profiles.id (many-to-one)
account_deletion_requests.profile_id → profiles.id (many-to-one)
account_deletion_requests.processed_by → profiles.id (many-to-one)
member_loans.profile_id → profiles.id (many-to-one)

## Enums
account_deletion_requests.status: pending, processing, completed, rejected
member_loans.item_type: materiel, costume

## Indexes
invitations.invitations_email_active_unique (unique): email, used_at
articles.idx_articles_published_at (index): published, published_at
account_deletion_requests.idx_account_deletion_requests_status (index): status, requested_at

---
If you suggest changes to this schema, ALSO return them as a DrawSQL patch: one fenced ```json code block, so I can apply them to my diagram. If you are only answering a question, skip the patch.

Patch rules:
- One JSON object with "strategy": "merge"; combine every change into that single patch.
- Reference tables and columns by name. Only include what changes — omit unchanged columns and unused optional fields.
- Column: {"name","type","length","is_primary_key","is_auto_increment","is_nullable","is_unique_key","is_index","is_unsigned","default","enum_values"} — use exact type names for pgsql as shown in the schema above.
- Relationship: {"type":"one-to-many","source_table":"users","source_column":"id","target_table":"posts","target_column":"user_id"} — for "one-to-many" the source is the "one" side; for "many-to-one" the source is the "many" (foreign-key) side. Prefer "one-to-many".
- Add "default_type" ("string" | "function" | "number" | "boolean") when a default could be misread — a literal string "CURRENT_TIMESTAMP" or "0" needs "default_type":"string".
- SET columns (MySQL) list their members in "set_values", not "enum_values".
- Index: {"indexes":[{"name":"idx_posts_user_created","type":"index","columns":["user_id","created_at"]}]} on its table — "type" is "index" or "unique"; delete via "deletions".
- Group: {"name":"Billing"}. A group never lists its members — put "parent_name":"Billing" on each table that belongs to it.
- Sticky note: {"sticky_notes":[{"content":"..."}]}.
- Delete via "deletions"; rename via "old_name". Do not include left/top coordinates.

Examples:
Add table: `{"strategy":"merge","tables":[{"name":"posts","comment":"Blog posts","columns":[{"name":"id","type":"bigint","is_primary_key":true,"is_auto_increment":true},{"name":"user_id","type":"bigint","is_index":true},{"name":"title","type":"varchar","length":255},{"name":"body","type":"text","is_nullable":true},{"name":"created_at","type":"timestamp","is_nullable":true},{"name":"updated_at","type":"timestamp","is_nullable":true}]}]}`
Rename table and column (use old_name only when renaming): `{"strategy":"merge","tables":[{"name":"articles","old_name":"posts","columns":[{"name":"content","old_name":"body"}]}]}`
Delete: `{"strategy":"merge","deletions":{"tables":["tmp"],"columns":[{"table":"users","columns":["legacy"]}],"relationships":[{"source_table":"users","source_column":"id","target_table":"posts","target_column":"user_id"}]}}`
Multiple groups with nested tables (every table sets parent_name): `{"strategy":"merge","groups":[{"name":"Auth"},{"name":"Content"}],"tables":[{"name":"users","parent_name":"Auth","columns":[{"name":"id","type":"bigint","is_primary_key":true,"is_auto_increment":true}]},{"name":"roles","parent_name":"Auth","columns":[{"name":"id","type":"bigint","is_primary_key":true,"is_auto_increment":true}]},{"name":"posts","parent_name":"Content","columns":[{"name":"id","type":"bigint","is_primary_key":true,"is_auto_increment":true}]}]}`
