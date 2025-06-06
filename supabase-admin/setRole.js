import 'dotenv/config'; // This loads .env
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Example: set custom role
const setRole = async () => {
  const { data, error } = await supabase.auth.admin.updateUserById(
    '61d1dac4-e388-479c-8518-faa014c0b79f', // user id
    {
      user_metadata: {
        role: 'manager'
      }
    }
  );

  if (error) {
    console.error('Error setting role:', error.message);
  } else {
    console.log('Role updated:', data);
  }
};

setRole();
