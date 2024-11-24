'use client';

import { useState, useEffect } from 'react';
import { FormType } from '@/types/form';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FormTypeManagerProps {
  onUpdate?: (formType: FormType) => void;
}

export const FormTypeManager = ({ onUpdate }: FormTypeManagerProps) => {
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [selectedType, setSelectedType] = useState<FormType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadFormTypes();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .rpc('is_admin', { user_id: user.id });

    if (error) {
      console.error('Error checking admin status:', error);
      return;
    }

    setIsAdmin(data || false);
  };

  const loadFormTypes = async () => {
    const { data, error } = await supabase
      .from('form_types')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading form types:', error);
      return;
    }

    setFormTypes(data || []);
  };

  const handleSave = async (formType: FormType) => {
    const { data, error } = await supabase
      .from('form_types')
      .upsert({
        id: formType.id,
        name: formType.name,
        description: formType.description,
        identification_rules: formType.identification_rules,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving form type:', error);
      return;
    }

    setFormTypes(prev => 
      prev.map(ft => ft.id === data.id ? data : ft)
    );
    setSelectedType(null);
    setIsEditing(false);
    onUpdate?.(data);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('form_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting form type:', error);
      return;
    }

    setFormTypes(prev => prev.filter(ft => ft.id !== id));
    setSelectedType(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Form Types</h2>
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedType({
                id: '',
                name: '',
                identification_rules: {
                  keywords: [],
                  patterns: [],
                  required_fields: [],
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              setIsEditing(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add New
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formTypes.map(formType => (
          <div
            key={formType.id}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold">{formType.name}</h3>
            {formType.description && (
              <p className="text-gray-600 text-sm mt-1">{formType.description}</p>
            )}
            {isAdmin && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedType(formType);
                    setIsEditing(true);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(formType.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && selectedType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">
              {selectedType.id ? 'Edit Form Type' : 'New Form Type'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(selectedType);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={selectedType.name}
                  onChange={(e) =>
                    setSelectedType({ ...selectedType, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={selectedType.description || ''}
                  onChange={(e) =>
                    setSelectedType({
                      ...selectedType,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Keywords</label>
                <input
                  type="text"
                  value={selectedType.identification_rules.keywords.join(', ')}
                  onChange={(e) =>
                    setSelectedType({
                      ...selectedType,
                      identification_rules: {
                        ...selectedType.identification_rules,
                        keywords: e.target.value.split(',').map((k) => k.trim()),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter keywords separated by commas"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType(null);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
