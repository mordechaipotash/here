import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
export async function GET(request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const emailId = request.nextUrl.searchParams.get('emailId');
        if (!emailId) {
            return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
        }
        const { data: applicants, error } = await supabase
            .from('applicants')
            .select('*')
            .eq('email_id', emailId);
        if (error) {
            console.error('Error fetching applicants:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(applicants);
    }
    catch (error) {
        console.error('Error in GET /api/emails/applicants:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { emailId, applicants } = await request.json();
        if (!emailId || !applicants) {
            return NextResponse.json({ error: 'Email ID and applicants are required' }, { status: 400 });
        }
        // First delete existing applicants for this email
        const { error: deleteError } = await supabase
            .from('applicants')
            .delete()
            .eq('email_id', emailId);
        if (deleteError) {
            console.error('Error deleting existing applicants:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }
        // Then insert new applicants
        const { data: insertedApplicants, error: insertError } = await supabase
            .from('applicants')
            .insert(applicants.map((applicant) => ({
            email_id: emailId,
            first_name: applicant.first_name,
            last_name: applicant.last_name,
            forms: applicant.forms || {}
        })))
            .select();
        if (insertError) {
            console.error('Error inserting applicants:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        return NextResponse.json(insertedApplicants);
    }
    catch (error) {
        console.error('Error in POST /api/emails/applicants:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
