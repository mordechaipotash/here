require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yawnfaxeamfxketynfdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd25mYXhlYW1meGtldHluZmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDY3NjI4NSwiZXhwIjoyMDQ2MjUyMjg1fQ.J4clFE9uMlMab5_8U8117m4qN23GXgF-Y0INDnoJSGk'
);

const formRules = [
  {
    form_type_name: '8850',
    keywords: [
      'pre-screening notice',
      'work opportunity credit',
      '8850',
      'department of the treasury',
      'internal revenue service',
      'welfare recipient',
      'veteran',
      'vocational rehabilitation',
      'empowerment zone',
      'summer youth'
    ],
    required_fields: [
      'name',
      'social security number',
      'street address',
      'county',
      'telephone number',
      'starting wage',
      'position'
    ],
    filename_patterns: [
      '8850',
      'work_opportunity',
      'prescreening',
      'pre-screening'
    ]
  },
  {
    form_type_name: '9061',
    keywords: [
      'individual characteristics form',
      '9061',
      'target group',
      'employment and training administration',
      'eta',
      'department of labor',
      'dol',
      'applicant information',
      'target groups',
      'conditional certification'
    ],
    required_fields: [
      'applicant name',
      'social security number',
      'address',
      'telephone',
      'education level',
      'target group'
    ],
    filename_patterns: [
      '9061',
      'individual_char',
      'target_group',
      'characteristics'
    ]
  },
  {
    form_type_name: 'NYYF',
    keywords: [
      'youth program',
      'new york',
      'nyyf',
      'youth employment',
      'summer youth',
      'youth opportunity',
      'youth training',
      'youth development'
    ],
    required_fields: [
      'participant name',
      'date of birth',
      'address',
      'parent/guardian',
      'school',
      'grade'
    ],
    filename_patterns: [
      'nyyf',
      'youth',
      'ny_youth',
      'newyork'
    ]
  }
];

async function updateFormRules() {
  for (const rule of formRules) {
    try {
      // First get the form type ID
      const { data: formType, error: formTypeError } = await supabase
        .from('form_types')
        .select('id')
        .eq('name', rule.form_type_name)
        .single();

      if (formTypeError) throw formTypeError;
      if (!formType) throw new Error(`Form type ${rule.form_type_name} not found`);

      // Check if rules already exist for this form type
      const { data: existingRules } = await supabase
        .from('form_classification_rules')
        .select('*')
        .eq('form_type_id', formType.id)
        .single();

      if (existingRules) {
        // Update existing rules
        const { error } = await supabase
          .from('form_classification_rules')
          .update({
            keywords: rule.keywords,
            required_fields: rule.required_fields,
            filename_patterns: rule.filename_patterns,
            updated_at: new Date().toISOString()
          })
          .eq('form_type_id', formType.id);

        if (error) throw error;
        console.log(`Updated rules for form type ${rule.form_type_name}`);
      } else {
        // Insert new rules
        const { error } = await supabase
          .from('form_classification_rules')
          .insert({
            form_type_id: formType.id,
            keywords: rule.keywords,
            required_fields: rule.required_fields,
            filename_patterns: rule.filename_patterns,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        console.log(`Inserted rules for form type ${rule.form_type_name}`);
      }
    } catch (error) {
      console.error(`Error updating rules for form type ${rule.form_type_name}:`, error);
    }
  }
}

updateFormRules();
