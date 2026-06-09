// Run: node services/api/scripts/seed-tatkal.js
// Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
// Run AFTER 002_tatkal.sql has been applied

const supabase = require('../src/db/supabase-client');

async function main() {
  console.log('[SEED] Starting Tatkal demo seeding...');
  
  try {
    // 1. Fetch test users from users table
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id, name')
      .limit(2);

    if (userErr) {
      throw new Error(`Failed to fetch users: ${userErr.message}`);
    }

    // TODO: Replace placeholders with real user UUIDs if needed
    let user1Id = '00000000-0000-0000-0000-000000000001';
    let user2Id = '00000000-0000-0000-0000-000000000002';
    let user1Name = 'Raj Kumar';

    if (users && users.length >= 2) {
      user1Id = users[0].id;
      user2Id = users[1].id;
      user1Name = users[0].name;
      console.log(`[SEED] Using database users: ${users[0].name} (${user1Id}) and ${users[1].name} (${user2Id})`);

      // Update test users with IRCTC profile credentials
      await supabase.from('users').update({
        irctc_id: 'raj_kumar',
        dob: '1998-05-15',
        gender: 'M',
        email: 'raj@gmail.com',
        address: '123 NDLS Road, Delhi',
        pin_code: '110001',
        state: 'Delhi',
        city: 'New Delhi'
      }).eq('id', user1Id);

      await supabase.from('users').update({
        irctc_id: 'suresh_kumar',
        dob: '1980-08-20',
        gender: 'M',
        email: 'suresh@gmail.com',
        address: '456 CSMT Lane, Mumbai',
        pin_code: '400001',
        state: 'Maharashtra',
        city: 'Mumbai'
      }).eq('id', user2Id);
    } else {
      console.warn('[SEED] Warning: Less than 2 users found in database. Inserting with placeholder UUIDs.');
    }

    // Clear existing data to prevent unique constraints or duplication conflicts
    console.log('[SEED] Cleaning existing requests and surrenders...');
    await supabase.from('tatkal_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tatkal_surrenders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Generate dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowAt10 = new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString();

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    const prevDay = new Date();
    prevDay.setDate(prevDay.getDate() - 2);
    const prevDayStr = prevDay.toISOString().split('T')[0];

    // 2. Prepare tatkal_requests (10 records)
    const requests = [
      // 3 with status PENDING, scheduled_fire_time = tomorrow at 10:00 AM, urgency_score >= 7
      {
        user_id: user1Id,
        from_station: 'NDLS', to_station: 'MMCT', travel_date: dayAfterStr, class: '3A',
        passengers: [{ irctc_id: 'raj_kumar', name: user1Name, age: 28, gender: 'M', berth_preference: 'LB', verified: true }],
        is_urgent: true, urgency_reason: 'official', urgency_score: 7.5,
        scheduled_fire_time: tomorrowAt10, status: 'PENDING', booking_date: new Date()
      },
      {
        user_id: user2Id,
        from_station: 'CSMT', to_station: 'PUNE', travel_date: dayAfterStr, class: '2A',
        passengers: [{ irctc_id: 'suresh_kumar', name: 'Suresh Kumar', age: 45, gender: 'M', verified: true }],
        is_urgent: true, urgency_reason: 'bereavement', urgency_score: 8.0,
        scheduled_fire_time: tomorrowAt10, status: 'PENDING', booking_date: new Date()
      },
      {
        user_id: user1Id,
        from_station: 'BLR', to_station: 'HYD', travel_date: dayAfterStr, class: '3A',
        passengers: [{ irctc_id: 'raj_kumar', name: user1Name, age: 28, gender: 'M', verified: true }],
        is_urgent: true, urgency_reason: 'medical', urgency_score: 9.0,
        scheduled_fire_time: tomorrowAt10, status: 'PENDING', booking_date: new Date()
      },
      // 2 with status CONFIRMED and fake PNRs
      {
        user_id: user1Id,
        from_station: 'NDLS', to_station: 'MMCT', travel_date: prevDayStr, class: '3A',
        passengers: [{ irctc_id: 'raj_kumar', name: user1Name, age: 28, gender: 'M', verified: true }],
        scheduled_fire_time: new Date().toISOString(), status: 'CONFIRMED',
        simulated_pnr: 'DEMO847291', booking_date: prevDayStr
      },
      {
        user_id: user2Id,
        from_station: 'HWH', to_station: 'NDLS', travel_date: prevDayStr, class: 'SL',
        passengers: [{ irctc_id: 'suresh_kumar', name: 'Suresh Kumar', age: 45, gender: 'M', verified: true }],
        scheduled_fire_time: new Date().toISOString(), status: 'CONFIRMED',
        simulated_pnr: 'DEMO102934', booking_date: prevDayStr
      },
      // 2 with status CANCELLED
      {
        user_id: user1Id,
        from_station: 'CSMT', to_station: 'PUNE', travel_date: dayAfterStr, class: '3A',
        passengers: [{ irctc_id: 'raj_kumar', name: user1Name, age: 28, gender: 'M', verified: true }],
        scheduled_fire_time: tomorrowAt10, status: 'CANCELLED', booking_date: new Date()
      },
      {
        user_id: user2Id,
        from_station: 'BLR', to_station: 'HYD', travel_date: dayAfterStr, class: 'SL',
        passengers: [{ irctc_id: 'suresh_kumar', name: 'Suresh Kumar', age: 45, gender: 'M', verified: true }],
        scheduled_fire_time: tomorrowAt10, status: 'CANCELLED', booking_date: new Date()
      },
      // 2 with status FAILED
      {
        user_id: user1Id,
        from_station: 'HWH', to_station: 'NDLS', travel_date: tomorrowStr, class: '3A',
        passengers: [{ irctc_id: 'raj_kumar', name: user1Name, age: 28, gender: 'M', verified: true }],
        scheduled_fire_time: new Date().toISOString(), status: 'FAILED', booking_date: prevDayStr
      },
      {
        user_id: user2Id,
        from_station: 'NDLS', to_station: 'MMCT', travel_date: tomorrowStr, class: 'SL',
        passengers: [{ irctc_id: 'suresh_kumar', name: 'Suresh Kumar', age: 45, gender: 'M', verified: true }],
        scheduled_fire_time: new Date().toISOString(), status: 'FAILED', booking_date: prevDayStr
      },
      // 1 with status PENDING, is_urgent = true, urgency_reason = 'medical', urgency_score = 9.5 (demo day flow)
      {
        user_id: user1Id,
        from_station: 'NDLS', to_station: 'MMCT', travel_date: dayAfterStr, class: '3A',
        passengers: [{ irctc_id: 'raj_kumar', name: user1Name, age: 28, gender: 'M', verified: true }],
        is_urgent: true, urgency_reason: 'medical', urgency_score: 9.5,
        scheduled_fire_time: tomorrowAt10, status: 'PENDING', booking_date: new Date()
      }
    ];

    // 3. Prepare tatkal_surrenders (5 records)
    const surrenders = [
      {
        owner_user_id: user1Id, pnr: '4810239481', from_station: 'NDLS', to_station: 'MMCT',
        travel_date: dayAfterStr, class: '3A', status: 'LISTED', train_number: '12951'
      },
      {
        owner_user_id: user2Id, pnr: '3829472918', from_station: 'CSMT', to_station: 'PUNE',
        travel_date: dayAfterStr, class: 'SL', status: 'LISTED', train_number: '12127'
      },
      {
        owner_user_id: user1Id, pnr: '8372910392', from_station: 'HWH', to_station: 'NDLS',
        travel_date: dayAfterStr, class: '2A', status: 'LISTED', train_number: '12301'
      },
      {
        owner_user_id: user2Id, pnr: '9182736450', from_station: 'BLR', to_station: 'HYD',
        travel_date: dayAfterStr, class: '3A', status: 'LISTED', train_number: '12786'
      },
      {
        owner_user_id: user1Id, pnr: '7281930291', from_station: 'NDLS', to_station: 'MMCT',
        travel_date: tomorrowStr, class: 'SL', status: 'LISTED', train_number: '12953'
      }
    ];

    const { data: reqInsert, error: reqErr } = await supabase.from('tatkal_requests').insert(requests).select();
    if (reqErr) throw reqErr;

    const { data: surrInsert, error: surrErr } = await supabase.from('tatkal_surrenders').insert(surrenders).select();
    if (surrErr) throw surrErr;

    console.log(`[SEED] Success! Seeded ${reqInsert.length} requests and ${surrInsert.length} surrenders.`);
  } catch (error) {
    console.error('[SEED] Seeding failed:', error.message || error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
