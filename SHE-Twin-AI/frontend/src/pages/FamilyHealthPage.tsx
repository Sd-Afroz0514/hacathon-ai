import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { useLanguage } from '../context/LanguageContext';
import { FamilyMember } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const FamilyHealthPage: React.FC = () => {
  const { familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useHealth();
  const { t } = useLanguage();

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(familyMembers[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<any>('Mother');
  const [age, setAge] = useState('52');
  const [gender, setGender] = useState<any>('Female');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [lastCheckup, setLastCheckup] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setRelationship('Mother');
    setAge('30');
    setGender('Female');
    setBloodGroup('O+');
    setAllergiesText('');
    setConditionsText('');
    setLastCheckup(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (member: FamilyMember) => {
    setName(member.name);
    setRelationship(member.relationship);
    setAge(member.age.toString());
    setGender(member.gender);
    setBloodGroup(member.bloodGroup);
    setAllergiesText(member.allergies.join(', '));
    setConditionsText(member.chronicConditions.join(', '));
    setLastCheckup(member.lastCheckupDate || '');
    setNotes(member.notes || '');
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await addFamilyMember({
      name,
      relationship,
      age: parseInt(age) || 30,
      gender,
      bloodGroup,
      allergies: allergiesText.split(',').map((s) => s.trim()).filter(Boolean),
      chronicConditions: conditionsText.split(',').map((s) => s.trim()).filter(Boolean),
      lastCheckupDate: lastCheckup,
      notes,
    });

    setIsSubmitting(false);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsSubmitting(true);

    await updateFamilyMember(selectedMember.id, {
      name,
      relationship,
      age: parseInt(age) || selectedMember.age,
      gender,
      bloodGroup,
      allergies: allergiesText.split(',').map((s) => s.trim()).filter(Boolean),
      chronicConditions: conditionsText.split(',').map((s) => s.trim()).filter(Boolean),
      lastCheckupDate: lastCheckup,
      notes,
    });

    setIsSubmitting(false);
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-950 tracking-tight">
            {t('page.family.title', 'Family Health Hub')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('page.family.subtitle', 'Maintain organized, distinct health records and emergency profiles for your loved ones.')}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t('family.addMember', 'Add Family Member')}
        </Button>
      </div>

      {/* 2. Family Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {familyMembers.map((member) => {
          const isSelected = selectedMember?.id === member.id;
          return (
            <Card
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className={`cursor-pointer transition-all duration-150 p-5 ${
                isSelected
                  ? 'border-teal-500 shadow-card bg-teal-50/20'
                  : 'hover:border-slate-300 hover:shadow-soft'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl ${member.avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0`}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{member.name}</h3>
                    <p className="text-xs text-slate-500">{member.relationship} • {member.age} yrs</p>
                    <span className="inline-block text-[11px] font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded mt-1">
                      Blood: {member.bloodGroup}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMember(member);
                      handleOpenEdit(member);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Edit profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(member.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {member.chronicConditions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Conditions Under Care
                  </span>
                  <p className="text-xs text-slate-700 font-medium truncate">
                    {member.chronicConditions.join(', ')}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* 3. Detailed Profile of Selected Family Member */}
      {selectedMember && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${selectedMember.avatarColor} text-white flex items-center justify-center font-bold text-base shadow-sm`}>
                {selectedMember.name.charAt(0)}
              </div>
              <div>
                <CardTitle>{selectedMember.name} — Detailed Health Overview</CardTitle>
                <CardDescription>
                  {selectedMember.relationship} • {selectedMember.age} Years • {selectedMember.gender} • Blood Group: {selectedMember.bloodGroup}
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(selectedMember)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Update Details
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Chronic Conditions */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Chronic Diagnoses & Care
                </span>
                {selectedMember.chronicConditions.length > 0 ? (
                  <ul className="space-y-1 text-slate-700">
                    {selectedMember.chronicConditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-teal-600 font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400">No chronic conditions recorded.</p>
                )}
              </div>

              {/* Known Allergies */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Known Allergies
                </span>
                {selectedMember.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMember.allergies.map((a, i) => (
                      <Badge key={i} variant="danger" size="sm">{a}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No known drug or food allergies.</p>
                )}
              </div>

              {/* Checkup & Notes */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Routine Checkup Info
                </span>
                <p className="text-slate-600">
                  Last Doctor Visit: <span className="font-semibold text-slate-800">{selectedMember.lastCheckupDate || 'Not specified'}</span>
                </p>
                {selectedMember.notes && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600 italic leading-snug">
                    "{selectedMember.notes}"
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Add Member */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Family Member Profile"
        description="Create a separate medical summary card for a family member."
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunita Sharma"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as any)}
                className="w-full bg-white rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                {['Mother', 'Father', 'Daughter', 'Son', 'Sister', 'Brother', 'Spouse', 'Grandmother', 'Grandfather', 'Other'].map((rel) => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>

            <Input
              label="Age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-white rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-white rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Known Chronic Conditions (comma separated)"
            value={conditionsText}
            onChange={(e) => setConditionsText(e.target.value)}
            placeholder="e.g. Hypertension, Diabetes"
          />

          <Input
            label="Known Allergies (comma separated)"
            value={allergiesText}
            onChange={(e) => setAllergiesText(e.target.value)}
            placeholder="e.g. Sulfa drugs, Peanuts"
          />

          <Input
            label="Personal Notes & Medication Schedule"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Walks daily 30m, takes morning medication."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Member */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Family Member Details"
        description="Edit medical notes and conditions for this profile."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as any)}
                className="w-full bg-white rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900"
              >
                {['Mother', 'Father', 'Daughter', 'Son', 'Sister', 'Brother', 'Spouse', 'Grandmother', 'Grandfather', 'Other'].map((rel) => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>

            <Input
              label="Age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>

          <Input
            label="Known Chronic Conditions"
            value={conditionsText}
            onChange={(e) => setConditionsText(e.target.value)}
          />

          <Input
            label="Known Allergies"
            value={allergiesText}
            onChange={(e) => setAllergiesText(e.target.value)}
          />

          <Input
            label="Personal Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Update Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteFamilyMember(deleteTargetId);
            setDeleteTargetId(null);
            setSelectedMember(familyMembers.find((m) => m.id !== deleteTargetId) || null);
          }
        }}
        title="Remove Family Profile"
        message="Are you sure you want to remove this family member's health record?"
        confirmText="Remove Member"
      />
    </div>
  );
};
