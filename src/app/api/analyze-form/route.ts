import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const { formText, imageUrl } = await request.json();

    if (!formText && !imageUrl) {
      return NextResponse.json(
        { error: 'Either form text or image URL is required' },
        { status: 400 }
      );
    }

    try {
      console.log('Starting form analysis with params:', { formText, imageUrl });
      
      const formAnalysis = await geminiService.analyzeForm(formText, imageUrl);
      const applicantInfo = await geminiService.extractApplicantInfo(formText, imageUrl);
      const formValidation = await geminiService.validateForm(formAnalysis.formType, formAnalysis.metadata);

      console.log('Successfully processed form. Results:', {
        formAnalysis,
        applicantInfo: { ...applicantInfo, ssn: '[REDACTED]' },
        formValidation
      });

      return NextResponse.json({
        formAnalysis,
        applicantInfo,
        formValidation,
      });
    } catch (serviceError) {
      console.error('Error in gemini service:', serviceError);
      return NextResponse.json(
        { 
          error: 'Failed to analyze form',
          details: serviceError instanceof Error ? serviceError.message : 'Unknown error',
          stack: serviceError instanceof Error ? serviceError.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in analyze-form API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
