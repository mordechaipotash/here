'use client';

import { Applicant, GeminiField } from '../../types/email';
import { useState } from 'react';

interface FormComparisonProps {
  applicant: Applicant;
  onUpdateStatus: (status: Applicant['status']) => void;
}

interface FieldComparison {
  fieldName: string;
  label: string;
  form8850Value?: string;
  form8QFValue?: string;
  status: 'match' | 'mismatch' | 'missing';
}

export const FormComparison = ({ applicant, onUpdateStatus }: FormComparisonProps) => {
  const [eligible, setEligible] = useState<'yes' | 'no' | 'flag' | undefined>(
    applicant.status?.eligible
  );
  const [signed, setSigned] = useState<boolean>(
    applicant.status?.signed || false
  );
  const [dateSigned, setDateSigned] = useState<string>(
    applicant.status?.dateSigned || ''
  );

  const getFieldFromGemini = (fields: GeminiField[] | undefined, fieldType: string): string | undefined => {
    const field = fields?.find(f => f.field_type === fieldType);
    return field?.text;
  };

  const compareFields = (): FieldComparison[] => {
    const fields = [
      { fieldName: 'first_name', label: 'First Name' },
      { fieldName: 'last_name', label: 'Last Name' },
      { fieldName: 'dob', label: 'Date of Birth' },
      { fieldName: 'ssn', label: 'SSN' },
      { fieldName: 'street1', label: 'Street Address 1' },
      { fieldName: 'street2', label: 'Street Address 2' },
      { fieldName: 'city', label: 'City' },
      { fieldName: 'state', label: 'State' },
      { fieldName: 'zipcode', label: 'ZIP Code' },
    ];

    return fields.map(field => {
      const form8850Value = getFieldFromGemini(applicant.forms['8850']?.gemini_fields, field.fieldName);
      const form8QFValue = getFieldFromGemini(applicant.forms['8QF']?.gemini_fields, field.fieldName);

      let status: 'match' | 'mismatch' | 'missing';
      if (!form8850Value || !form8QFValue) {
        status = 'missing';
      } else if (form8850Value === form8QFValue) {
        status = 'match';
      } else {
        status = 'mismatch';
      }

      return {
        ...field,
        form8850Value,
        form8QFValue,
        status,
      };
    });
  };

  const handleStatusUpdate = () => {
    const newStatus = {
      eligible,
      signed,
      dateSigned: dateSigned || undefined,
    };
    onUpdateStatus(newStatus);
  };

  const fields = compareFields();

  return (
    <div className="h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
        {/* Form Images */}
        <div className="grid grid-cols-2 gap-4 p-6 border-b">
          <div>
            <h3 className="text-lg font-medium mb-2">Form 8850</h3>
            {applicant.forms['8850'] && (
              <img
                src={`https://pbuqlylgktjdhjqkvwnv.supabase.co/storage/v1/object/public/jpgs/${applicant.forms['8850'].jpg_filename}`}
                alt="Form 8850"
                className="w-full object-contain border rounded-lg"
                style={{ height: '60vh' }}
              />
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">8 Question Form</h3>
            {applicant.forms['8QF'] && (
              <img
                src={`https://pbuqlylgktjdhjqkvwnv.supabase.co/storage/v1/object/public/jpgs/${applicant.forms['8QF'].jpg_filename}`}
                alt="8 Question Form"
                className="w-full object-contain border rounded-lg"
                style={{ height: '60vh' }}
              />
            )}
          </div>
        </div>

        {/* Field Comparisons */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Field Comparison</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {fields.map((field) => (
              <div
                key={field.fieldName}
                className={`p-4 rounded-lg border ${
                  field.status === 'match'
                    ? 'bg-green-50 border-green-200'
                    : field.status === 'mismatch'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="font-medium text-gray-700 mb-2">{field.label}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">8850</div>
                    <div className="font-mono">{field.form8850Value || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">8QF</div>
                    <div className="font-mono">{field.form8QFValue || '—'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Controls */}
        <div className="p-6 bg-gray-50 rounded-b-lg flex items-center justify-between">
          <div className="space-x-4">
            <span className="font-medium">Eligible:</span>
            <select
              value={eligible || ''}
              onChange={(e) => setEligible((e.target.value || undefined) as typeof eligible)}
              className="rounded border-gray-300"
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="flag">Flag</option>
            </select>
          </div>

          <div className="space-x-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={signed}
                onChange={(e) => setSigned(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="ml-2">Signed</span>
            </label>

            <input
              type="date"
              value={dateSigned}
              onChange={(e) => setDateSigned(e.target.value)}
              className="rounded border-gray-300"
              disabled={!signed}
            />
          </div>

          <button
            onClick={handleStatusUpdate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};
