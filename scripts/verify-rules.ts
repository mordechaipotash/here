require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yawnfaxeamfxketynfdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd25mYXhlYW1meGtldHluZmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDY3NjI4NSwiZXhwIjoyMDQ2MjUyMjg1fQ.J4clFE9uMlMab5_8U8117m4qN23GXgF-Y0INDnoJSGk'
);

async function verifyRules() {
  try {
    // Get all form types with their rules
    const { data: formTypes, error: formTypesError } = await supabase
      .from('form_types')
      .select(`
        id,
        name,
        description,
        form_classification_rules (
          keywords,
          required_fields,
          filename_patterns
        )
      `);

    if (formTypesError) throw formTypesError;

    console.log('Form types and rules:');
    formTypes.forEach(formType => {
      console.log('\nForm Type:', formType.name);
      console.log('Description:', formType.description);
      if (formType.form_classification_rules && formType.form_classification_rules.length > 0) {
        const rules = formType.form_classification_rules[0];
        console.log('Keywords:', rules.keywords);
        console.log('Required Fields:', rules.required_fields);
        console.log('Filename Patterns:', rules.filename_patterns);
      } else {
        console.log('No rules found');
      }
    });

  } catch (error) {
    console.error('Error verifying rules:', error);
  }
}

verifyRules();
