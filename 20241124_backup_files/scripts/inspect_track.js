const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspectTrackValues() {
  try {
    const { data, error } = await supabase
      .from('email_view')
      .select('track')
      .not('track', 'is', null);

    if (error) {
      console.error('Error:', error);
      return;
    }

    // Count occurrences of each track value
    const trackCounts = data.reduce((acc, curr) => {
      const track = curr.track;
      acc[track] = (acc[track] || 0) + 1;
      return acc;
    }, {});

    console.log('Track values and their counts:', trackCounts);
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectTrackValues();
