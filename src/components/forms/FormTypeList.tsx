'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from "@/components/ui/button";

interface FormType {
  id: string;
  name: string;
  description: string;
  identification_rules: {
    keywords: string[];
    required_fields: string[];
  };
  created_at: string;
  updated_at: string;
}

export function FormTypeList() {
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFormType, setNewFormType] = useState({
    name: '',
    description: '',
    identification_rules: { keywords: [], required_fields: [] }
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadFormTypes();
    checkAdminStatus();
  }, []);

  async function loadFormTypes() {
    try {
      const { data, error } = await supabase
        .from('form_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setFormTypes(data || []);
    } catch (error: any) {
      console.error('Failed to load form types:', error);
      alert('Failed to load form types: ' + error.message);
    }
  }

  async function checkAdminStatus() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (!session) {
        console.log('No active session found');
        setIsAdmin(false);
        return;
      }

      // For now, we'll consider any authenticated user an admin
      // In a production environment, you'd want to check specific roles/permissions
      setIsAdmin(true);
    } catch (error: any) {
      console.error('Failed to check admin status:', error);
      // Don't show alert for auth errors, just set admin to false
      setIsAdmin(false);
    }
  }

  async function handleAddFormType() {
    try {
      if (!newFormType.name || !newFormType.description) {
        alert('Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from('form_types')
        .insert([{
          name: newFormType.name,
          description: newFormType.description,
          identification_rules: {
            keywords: newFormType.identification_rules.keywords,
            required_fields: newFormType.identification_rules.required_fields
          }
        }]);

      if (error) throw error;

      alert('Form type added successfully');
      setIsAddDialogOpen(false);
      loadFormTypes();
    } catch (error: any) {
      console.error('Failed to add form type:', error);
      alert('Failed to add form type: ' + error.message);
    }
  }

  async function handleDeleteFormType(id: string) {
    try {
      if (!confirm('Are you sure you want to delete this form type?')) return;

      const { error } = await supabase
        .from('form_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Form type deleted successfully');
      loadFormTypes();
    } catch (error: any) {
      console.error('Failed to delete form type:', error);
      alert('Failed to delete form type: ' + error.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Form Types</h2>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>Add Form Type</Button>
        )}
      </div>

      {/* Form Type List */}
      <div className="space-y-4">
        {formTypes.map((formType) => (
          <div key={formType.id} className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{formType.name}</h3>
                <p className="text-gray-600">{formType.description}</p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Keywords:</p>
                  <p className="text-sm text-gray-600">
                    {formType.identification_rules.keywords.join(', ')}
                  </p>
                  <p className="text-sm font-medium mt-1">Required Fields:</p>
                  <p className="text-sm text-gray-600">
                    {formType.identification_rules.required_fields.join(', ')}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteFormType(formType.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Form Type Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Form Type</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newFormType.name}
                  onChange={(e) => setNewFormType({ ...newFormType, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newFormType.description}
                  onChange={(e) => setNewFormType({ ...newFormType, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Keywords (comma-separated)</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newFormType.identification_rules.keywords.join(', ')}
                  onChange={(e) => setNewFormType({
                    ...newFormType,
                    identification_rules: {
                      ...newFormType.identification_rules,
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Required Fields (comma-separated)</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newFormType.identification_rules.required_fields.join(', ')}
                  onChange={(e) => setNewFormType({
                    ...newFormType,
                    identification_rules: {
                      ...newFormType.identification_rules,
                      required_fields: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                    }
                  })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddFormType}>Add Form Type</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
