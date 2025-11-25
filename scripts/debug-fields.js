const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log("Testing query...");
  const { data, error } = await supabase
    .from('fields')
    .select('*, sports(sport_name, sport_type), field_images(url_image)')
    .order('field_name', { ascending: true });

  if (error) {
    console.error('Error fetching fields:', error);
  } else {
    console.log('Successfully fetched fields. Count:', data.length);
    if (data.length > 0) {
      console.log('First item:', JSON.stringify(data[0], null, 2));
    }
  }
}

testQuery();
