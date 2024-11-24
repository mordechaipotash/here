'use client';

import { Email, Applicant, PDFPage } from '../../types/email';
import { useState } from 'react';
import { FormComparison } from './FormComparison';

interface PDFWorkspaceProps {
  email: Email;
  onClose: () => void;
  onUpdateApplicants: (applicants: Applicant[]) => void;
}

export const PDFWorkspace = ({ email, onClose, onUpdateApplicants }: PDFWorkspaceProps) => {
  const [applicants, setApplicants] = useState<Applicant[]>(
    email.applicants || [{ id: '1', firstName: '', lastName: '', forms: {} }]
  );
  const [draggingForm, setDraggingForm] = useState<PDFPage | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [saving, setSaving] = useState(false);

  // Group pages by PDF file and organize thumbnails
  const getThumbnails = (): PDFPage[] => {
    if (!email.pdf_pages) return [];
    return email.pdf_pages.filter(page => page.image_url);
  };

  const thumbnails = getThumbnails();

  const addNewApplicant = () => {
    setApplicants(prev => {
      const newApplicants = [
        ...prev,
        {
          id: (prev.length + 1).toString(),
          firstName: '',
          lastName: '',
          forms: {}
        }
      ];
      onUpdateApplicants(newApplicants);
      return newApplicants;
    });
  };

  const updateApplicantName = (
    applicantId: string,
    field: 'firstName' | 'lastName',
    value: string
  ) => {
    setApplicants(prev => {
      const newApplicants = prev.map(applicant =>
        applicant.id === applicantId
          ? { ...applicant, [field]: value }
          : applicant
      );
      onUpdateApplicants(newApplicants);
      return newApplicants;
    });
  };

  const updateApplicantStatus = (applicantId: string, status: Applicant['status']) => {
    setApplicants(prev => {
      const newApplicants = prev.map(applicant =>
        applicant.id === applicantId
          ? { ...applicant, status }
          : applicant
      );
      onUpdateApplicants(newApplicants);
      return newApplicants;
    });
  };

  const handleDrop = async (e: React.DragEvent, applicantId: string) => {
    e.preventDefault();
    if (!draggingForm) return;

    const formType = getFormType(draggingForm.pdf_filename);
    if (!formType) return;

    setApplicants(prev => prev.map(applicant => {
      if (applicant.id === applicantId) {
        return {
          ...applicant,
          forms: {
            ...applicant.forms,
            [formType]: {
              pdf_filename: draggingForm.pdf_filename,
              page_number: draggingForm.page_number,
              image_url: draggingForm.image_url
            }
          }
        };
      }
      return applicant;
    }));
  };

  const removeForm = (applicantId: string, formType: string) => {
    setApplicants(prev => prev.map(applicant => {
      if (applicant.id === applicantId) {
        const { [formType]: removed, ...remainingForms } = applicant.forms;
        return {
          ...applicant,
          forms: remainingForms
        };
      }
      return applicant;
    }));
  };

  const getFormType = (filename: string): string | null => {
    const formPatterns = {
      '8850': /8850|work.*opportunity/i,
      '9061': /9061|target.*group/i,
      'NYYF': /nyyf|youth.*program/i
    };

    for (const [type, pattern] of Object.entries(formPatterns)) {
      if (pattern.test(filename)) {
        return type;
      }
    }
    return null;
  };

  const isApplicantComplete = (applicant: Applicant) => {
    return applicant.forms['8850'] && 
           applicant.forms['9061'] && 
           applicant.forms['NYYF'];
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/emails/applicants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId: email.email_id,
          applicants
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save applicants');
      }

      // Update parent component
      onUpdateApplicants(applicants);

      // Process the email if not already processed
      if (!email.processed) {
        await fetch('/api/emails/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emailId: email.email_id }),
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving applicants:', error);
      alert('Failed to save applicants. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
      {selectedApplicant ? (
        <FormComparison
          applicant={selectedApplicant}
          onUpdateStatus={(status) => {
            updateApplicantStatus(selectedApplicant.id, status);
            setSelectedApplicant(null);
          }}
        />
      ) : (
        <div className="bg-white w-full max-w-7xl h-[90vh] rounded-lg flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              PDF Workspace - {email.subject}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left side: Thumbnails */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-lg font-medium mb-4">Available Forms</h3>
              <div className="grid grid-cols-2 gap-4">
                {thumbnails.map((page) => (
                  <div
                    key={page.page_id}
                    className={`relative aspect-[3/4] border rounded-lg overflow-hidden cursor-move hover:border-blue-500 ${
                      draggingForm === page ? 'opacity-50' : ''
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', page.page_id);
                      setDraggingForm(page);
                    }}
                    onDragEnd={() => setDraggingForm(null)}
                  >
                    <img
                      src={page.image_url}
                      alt={`Page ${page.page_number} of ${page.pdf_filename}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                      Page {page.page_number}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Applicants */}
            <div className="w-1/3 p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Applicants</h3>
                <button
                  onClick={addNewApplicant}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  + Add Applicant
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4">
                {applicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="bg-white p-4 rounded-lg shadow"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, applicant.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={applicant.firstName}
                          onChange={(e) => updateApplicantName(applicant.id, 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={applicant.lastName}
                          onChange={(e) => updateApplicantName(applicant.id, 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <button
                        onClick={() => removeApplicant(applicant.id)}
                        className="ml-4 p-2 text-red-600 hover:text-red-800"
                      >
                        <span className="sr-only">Remove applicant</span>
                        ×
                      </button>
                    </div>

                    {/* Assigned forms */}
                    <div className="space-y-2">
                      {Object.entries(applicant.forms).map(([formType, form]) => (
                        <div
                          key={formType}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center">
                            <span className="font-medium mr-2">{formType}:</span>
                            <span className="text-sm text-gray-600">
                              Page {form.page_number} of {form.pdf_filename}
                            </span>
                          </div>
                          <button
                            onClick={() => removeForm(applicant.id, formType)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <span className="sr-only">Remove form</span>
                            ×
                          </button>
                        </div>
                      ))}
                      {Object.keys(applicant.forms).length === 0 && (
                        <div className="text-sm text-gray-500 italic">
                          Drag and drop forms here
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md
                  ${saving
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {saving ? 'Saving...' : 'Save & Process'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
