import 'dotenv/config';  // this loads the .env variables automatically

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'rahulrajesh2101@gmail.com',
    password: 'testing123'
  });
  if (error) {
    console.error('Auth error:', error);
  } else {
    console.log('Access token:', data.session.access_token);
  }
})();