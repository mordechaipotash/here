require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yawnfaxeamfxketynfdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd25mYXhlYW1meGtldHluZmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDY3NjI4NSwiZXhwIjoyMDQ2MjUyMjg1fQ.J4clFE9uMlMab5_8U8117m4qN23GXgF-Y0INDnoJSGk'
);

const formTypes = [
  {
    name: '8850',
    description: 'IRS Form 8850 Pre-screening Notice'
  },
  {
    name: '9061',
    description: 'ETA Form 9061 Individual Characteristics Form'
  },
  {
    name: 'NYYF',
    description: 'New York Youth Form'
  }
];

async function updateFormTypes() {
  for (const formType of formTypes) {
    try {
      // First try to get existing form type
      const { data: existingFormType } = await supabase
        .from('form_types')
        .select('*')
        .eq('name', formType.name)
        .single();

      if (existingFormType) {
        // Update existing form type
        const { error } = await supabase
          .from('form_types')
          .update({
            description: formType.description,
            updated_at: new Date().toISOString()
          })
          .eq('name', formType.name);

        if (error) throw error;
        console.log(`Updated form type ${formType.name}`);
      } else {
        // Insert new form type
        const { error } = await supabase
          .from('form_types')
          .insert({
            ...formType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        console.log(`Inserted form type ${formType.name}`);
      }
    } catch (error) {
      console.error(`Error updating form type ${formType.name}:`, error);
    }
  }
}

updateFormTypes();
