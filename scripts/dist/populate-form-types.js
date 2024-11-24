"use strict";
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const initialFormTypes = [
    {
        name: '8850',
        description: 'Pre-Screening Notice and Certification Request for the Work Opportunity Credit',
        keywords: [
            '8850',
            'pre-screening notice',
            'work opportunity credit',
            'certification request',
            'department of the treasury',
            'internal revenue service'
        ]
    },
    {
        name: '9061',
        description: 'Individual Characteristics Form Work Opportunity Tax Credit',
        keywords: [
            '9061',
            'individual characteristics form',
            'work opportunity tax credit',
            'wotc',
            'target group',
            'eligibility information'
        ]
    }
    // Add more form types as needed
];
async function populateFormTypes() {
    try {
        // First, check if form types already exist
        const { data: existingTypes, error: checkError } = await supabase
            .from('form_types')
            .select('name');
        if (checkError)
            throw checkError;
        // Filter out form types that already exist
        const existingNames = new Set(existingTypes?.map(type => type.name));
        const newFormTypes = initialFormTypes.filter(type => !existingNames.has(type.name));
        if (newFormTypes.length === 0) {
            console.log('All form types already exist.');
            return;
        }
        // Insert new form types
        const { data, error } = await supabase
            .from('form_types')
            .insert(newFormTypes)
            .select();
        if (error)
            throw error;
        console.log(`Successfully added ${data.length} form types:`, data);
    }
    catch (error) {
        console.error('Error populating form types:', error);
    }
}
populateFormTypes();
