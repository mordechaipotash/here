-- Add unique constraint on name column
ALTER TABLE form_types ADD CONSTRAINT form_types_name_key UNIQUE (name);

-- Insert form types with identification rules
INSERT INTO form_types (name, description, identification_rules)
VALUES 
    (
        '8850',
        'Pre-Screening Notice and Certification Request for the Work Opportunity Credit',
        jsonb_build_object(
            'keywords', jsonb_build_array(
                '8850',
                'pre-screening notice',
                'work opportunity credit',
                'certification request',
                'department of the treasury',
                'internal revenue service'
            ),
            'required_fields', jsonb_build_array(
                'employer_name',
                'ein',
                'employee_name',
                'ssn'
            )
        )
    ),
    (
        '9061',
        'Individual Characteristics Form Work Opportunity Tax Credit',
        jsonb_build_object(
            'keywords', jsonb_build_array(
                '9061',
                'individual characteristics form',
                'work opportunity tax credit',
                'wotc',
                'target group',
                'eligibility information'
            ),
            'required_fields', jsonb_build_array(
                'applicant_name',
                'ssn',
                'target_group'
            )
        )
    )
ON CONFLICT (name) 
DO UPDATE SET 
    description = EXCLUDED.description,
    identification_rules = EXCLUDED.identification_rules,
    updated_at = now();

-- Verify the insertions
SELECT 
    name,
    description,
    identification_rules->>'keywords' as keywords,
    identification_rules->>'required_fields' as required_fields,
    created_at,
    updated_at
FROM form_types;
