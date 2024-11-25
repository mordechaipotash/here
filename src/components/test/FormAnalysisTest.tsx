'use client';

import { useState } from 'react';
import { useToastActions } from '@/hooks/useToast';

interface TestResult {
  formAnalysis?: {
    formType: string;
    confidence: number;
    metadata: Record<string, any>;
  };
  applicantInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    ssn?: string;
    address?: string;
    metadata: Record<string, any>;
  };
  formValidation?: {
    isComplete: boolean;
    missingFields: string[];
    suggestions: string[];
  };
  error?: string;
}

export const FormAnalysisTest = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<TestResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToastActions();

  // Sample form images - replace these with actual form images from your system
  const sampleImages = [
    {
      label: '8850 Form',
      url: 'https://yawnfaxeamfxketynfdt.supabase.co/storage/v1/object/public/forms/sample-8850.jpg'
    },
    {
      label: '9061 Form',
      url: 'https://yawnfaxeamfxketynfdt.supabase.co/storage/v1/object/public/forms/sample-9061.jpg'
    },
    {
      label: 'NYYF Form',
      url: 'https://yawnfaxeamfxketynfdt.supabase.co/storage/v1/object/public/forms/sample-nyyf.jpg'
    }
  ];

  const runTest = async (imageUrl: string) => {
    setAnalyzing(true);
    setResults(null);
    setError(null);
    
    try {
      console.log('Starting form analysis test with image:', imageUrl);
      
      const response = await fetch('/api/analyze-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        data
      });

      if (!response.ok) {
        const errorMessage = data.details || data.error || `HTTP error! status: ${response.status}`;
        console.error('API Error:', {
          status: response.status,
          error: errorMessage,
          details: data.details,
          stack: data.stack
        });
        throw new Error(errorMessage);
      }

      if (!data.formAnalysis || !data.applicantInfo || !data.formValidation) {
        console.error('Incomplete API response:', data);
        throw new Error('API returned incomplete data');
      }

      setResults(data);
      success('Success', 'Form analysis completed successfully');
    } catch (err) {
      console.error('Test failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      showError('Error', `Form analysis failed: ${errorMessage}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customImageUrl) {
      setSelectedImage(customImageUrl);
      runTest(customImageUrl);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Form Analysis Test</h2>
        
        {/* Sample Images */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Sample Forms:</h3>
          <div className="flex gap-4">
            {sampleImages.map((image) => (
              <button
                key={image.url}
                onClick={() => {
                  setSelectedImage(image.url);
                  runTest(image.url);
                }}
                disabled={analyzing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                Test {image.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom URL Input */}
        <form onSubmit={handleCustomUrlSubmit} className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Test Custom Image URL:</h3>
          <div className="flex gap-2">
            <input
              type="url"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="Enter form image URL"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              type="submit"
              disabled={analyzing || !customImageUrl}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
            >
              Test Custom URL
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Status */}
      {analyzing && (
        <div className="mb-4 flex items-center gap-2 text-blue-600">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Analyzing form...</span>
        </div>
      )}

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Selected Image:</h3>
          <img 
            src={selectedImage} 
            alt="Selected form"
            className="max-w-md border rounded shadow-sm"
          />
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Results:</h3>
          
          {results.error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded">
              <h4 className="font-medium mb-2">Error:</h4>
              <pre className="whitespace-pre-wrap">{results.error}</pre>
            </div>
          ) : (
            <>
              {/* Form Analysis Results */}
              {results.formAnalysis && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Form Analysis:</h4>
                  <pre className="whitespace-pre-wrap bg-white p-2 rounded border">
                    {JSON.stringify(results.formAnalysis, null, 2)}
                  </pre>
                </div>
              )}

              {/* Applicant Info Results */}
              {results.applicantInfo && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Applicant Information:</h4>
                  <pre className="whitespace-pre-wrap bg-white p-2 rounded border">
                    {JSON.stringify(results.applicantInfo, null, 2)}
                  </pre>
                </div>
              )}

              {/* Form Validation Results */}
              {results.formValidation && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Form Validation:</h4>
                  <pre className="whitespace-pre-wrap bg-white p-2 rounded border">
                    {JSON.stringify(results.formValidation, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded">
          <h4 className="font-medium mb-2">Error:</h4>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}
    </div>
  );
};
