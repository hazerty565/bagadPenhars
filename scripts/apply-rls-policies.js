// Apply RLS policies to all tables
// Run with: node scripts/apply-rls-policies.js
// Requires DATABASE_URL environment variable

const { Pool } = require('pg');

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

async function applyPolicies() {
	const client = await pool.connect();

	try {
		console.log('Application des policies RLS...\n');

		// 1. Profiles
		console.log('--- Profiles ---');
		await client.query(`
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth_user_id = current_setting('app.user_id')::text);
      CREATE POLICY "profiles_admins_all" ON profiles FOR ALL TO admin USING (true);
      CREATE POLICY "profiles_secretaire_all" ON profiles FOR ALL TO secretaire USING (true);
    `);

		// 2. Events
		console.log('--- Events ---');
		await client.query(`
      ALTER TABLE events ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "events_public_select" ON events FOR SELECT USING (visibility = 'public');
      CREATE POLICY "events_member_select" ON events FOR SELECT USING (visibility IN ('interne', 'pupitre') AND created_by = current_setting('app.user_id')::uuid);
      CREATE POLICY "events_chef_select" ON events FOR SELECT USING (visibility = 'pupitre' AND EXISTS (SELECT 1 FROM profile_pupitres WHERE profile_id = current_setting('app.user_id')::uuid AND pupitre_id IN (SELECT pupitre_id FROM event_pupitres WHERE event_id = events.id AND is_chef = true)));
    `);

		// 3. Event responses
		console.log('--- Event Responses ---');
		await client.query(`
      ALTER TABLE event_responses ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "event_responses_select_own" ON event_responses FOR SELECT USING (profile_id = current_setting('app.user_id')::uuid OR EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.created_by = current_setting('app.user_id')::uuid));
      CREATE POLICY "event_responses_insert_own" ON event_responses FOR INSERT WITH CHECK (profile_id = current_setting('app.user_id')::uuid);
    `);

		// 4. Documents
		console.log('--- Documents ---');
		await client.query(`
      ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "documents_select_active" ON documents FOR SELECT USING (is_active = true);
      CREATE POLICY "documents_select_member" ON documents FOR SELECT TO member USING (true);
      CREATE POLICY "documents_uploader_select" ON documents FOR SELECT USING (uploaded_by = current_setting('app.user_id')::uuid);
      CREATE POLICY "documents_insert_chef_secretaire_admin" ON documents FOR INSERT TO chef_pupitre, secretaire, admin WITH CHECK (true);
      CREATE POLICY "documents_update_chef_secretaire_admin" ON documents FOR UPDATE TO chef_pupitre, secretaire, admin USING (true);
    `);

		// 5. Articles
		console.log('--- Articles ---');
		await client.query(`
      ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "articles_select_published" ON articles FOR SELECT USING (is_published = true);
      CREATE POLICY "articles_select_author" ON articles FOR SELECT USING (author_id = current_setting('app.user_id')::uuid);
      CREATE POLICY "articles_insert_secretaire_admin" ON articles FOR INSERT TO secretaire, admin WITH CHECK (true);
      CREATE POLICY "articles_update_secretaire_admin" ON articles FOR UPDATE TO secretaire, admin USING (true);
      CREATE POLICY "articles_delete_secretaire_admin" ON articles FOR DELETE TO secretaire, admin USING (true);
    `);

		// 6. Albums
		console.log('--- Albums ---');
		await client.query(`
      ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "albums_select_published" ON albums FOR SELECT USING (is_published = true);
      CREATE POLICY "albums_insert_secretaire_admin" ON albums FOR INSERT TO secretaire, admin WITH CHECK (true);
      CREATE POLICY "albums_update_secretaire_admin" ON albums FOR UPDATE TO secretaire, admin USING (true);
      CREATE POLICY "albums_delete_secretaire_admin" ON albums FOR DELETE TO secretaire, admin USING (true);
    `);

		// 7. Media
		console.log('--- Media ---');
		await client.query(`
      ALTER TABLE media ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "media_select_public" ON media FOR SELECT USING (true);
      CREATE POLICY "media_select_by_album" ON media FOR SELECT USING (album_id IS NOT NULL);
      CREATE POLICY "media_insert_secretaire_admin" ON media FOR INSERT TO secretaire, admin WITH CHECK (true);
      CREATE POLICY "media_update_secretaire_admin" ON media FOR UPDATE TO secretaire, admin USING (true);
    `);

		// 8. Notification Preferences
		console.log('--- Notification Preferences ---');
		await client.query(`
      ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "notification_preferences_select_own" ON notification_preferences FOR SELECT USING (profile_id = current_setting('app.user_id')::uuid);
      CREATE POLICY "notification_preferences_update_own" ON notification_preferences FOR UPDATE USING (profile_id = current_setting('app.user_id')::uuid);
    `);

		// 9. Notification Log
		console.log('--- Notification Log ---');
		await client.query(`
      ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "notification_log_select" ON notification_log FOR SELECT USING (recipient_profile_id = current_setting('app.user_id')::uuid OR current_setting('app.user_role')::text = 'admin');
      CREATE POLICY "notification_log_insert" ON notification_log FOR INSERT WITH CHECK (true);
    `);

		// 10. Activity Log
		console.log('--- Activity Log ---');
		await client.query(`
      ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "activity_log_select" ON activity_log FOR SELECT USING (true);
      CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT WITH CHECK (true);
    `);

		// 11. Account Deletion Requests
		console.log('--- Account Deletion Requests ---');
		await client.query(`
      ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "account_deletion_select_own" ON account_deletion_requests FOR SELECT USING (profile_id = current_setting('app.user_id')::uuid);
      CREATE POLICY "account_deletion_select_secretaire_admin" ON account_deletion_requests FOR SELECT TO secretaire, admin USING (true);
      CREATE POLICY "account_deletion_update_secretaire_admin" ON account_deletion_requests FOR UPDATE TO secretaire, admin USING (true);
    `);

		// 12. Member Loans
		console.log('--- Member Loans ---');
		await client.query(`
      ALTER TABLE member_loans ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "member_loans_select_own" ON member_loans FOR SELECT USING (profile_id = current_setting('app.user_id')::uuid);
      CREATE POLICY "member_loans_insert_own" ON member_loans FOR INSERT WITH CHECK (profile_id = current_setting('app.user_id')::uuid);
      CREATE POLICY "member_loans_update_own" ON member_loans FOR UPDATE USING (profile_id = current_setting('app.user_id')::uuid);
    `);

		// 13. Storage Usage
		console.log('--- Storage Usage ---');
		await client.query(`
      ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;
      -- Policy for admin only since this is admin-only data
      CREATE POLICY "storage_usage_select_admin" ON storage_usage FOR SELECT TO admin USING (true);
    `);

		console.log('\n✅ Toutes les policies RLS ont été appliquées avec succès !');
		console.log(
			'⚠️  Rappelez-vous de reloader votre application pour que les policies prennent effet.'
		);
	} catch (error) {
		console.error('❌ Erreur lors de lapplication des policies RLS :', error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

applyPolicies();
