const supabase = require('../db/supabase-client');

const seedSurrenders = async () => {
  console.log('[SEED] Starting surrender marketplace seeding...');
  try {
    // 1. Fetch some users from the database to list tickets
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id, name')
      .limit(3);

    if (userErr) {
      throw new Error(`Failed to fetch test users: ${userErr.message}`);
    }

    if (!users || users.length < 2) {
      console.log('[SEED] Not enough users in database to list/request. Please ensure at least 2 users exist.');
      return;
    }

    const userA = users[0];
    const userB = users[1];

    console.log(`[SEED] Using User A: ${userA.name} (${userA.id}) to list surrenders.`);
    console.log(`[SEED] Using User B: ${userB.name} (${userB.id}) as potential requester.`);

    // 2. Clear existing listings for a clean slate
    await supabase.from('tatkal_surrenders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Create dummy listings
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dummyListings = [
      {
        owner_user_id: userA.id,
        pnr: '9876543210',
        from_station: 'NDLS',
        to_station: 'MMCT',
        travel_date: tomorrow,
        train_number: '12951',
        class: '3A',
        status: 'LISTED',
        listed_at: new Date()
      },
      {
        owner_user_id: userA.id,
        pnr: '4567890123',
        from_station: 'NDLS',
        to_station: 'MMCT',
        travel_date: nextWeek,
        train_number: '12953',
        class: '2A',
        status: 'LISTED',
        listed_at: new Date()
      },
      {
        owner_user_id: userB.id,
        pnr: '1234567890',
        from_station: 'HWH',
        to_station: 'NDLS',
        travel_date: tomorrow,
        train_number: '12301',
        class: 'SL',
        status: 'LISTED',
        listed_at: new Date()
      }
    ];

    const { data: created, error: insertErr } = await supabase
      .from('tatkal_surrenders')
      .insert(dummyListings)
      .select();

    if (insertErr) {
      throw new Error(`Failed to insert dummy listings: ${insertErr.message}`);
    }

    console.log(`[SEED] Successfully seeded ${created.length} ticket surrenders in database.`);
  } catch (error) {
    console.error('[SEED] Error during seeding:', error.message);
  }
};

// If run directly from terminal
if (require.main === module) {
  seedSurrenders().then(() => process.exit(0));
}

module.exports = seedSurrenders;
