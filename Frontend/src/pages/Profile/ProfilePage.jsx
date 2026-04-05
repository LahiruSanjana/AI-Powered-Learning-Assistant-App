import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import Spinner from '../../components/Spinner';
import {
  useChangePasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} from '@/services';

const ProfilePage = () => {
  const { data, isLoading, isError } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    if (data?.data) {
      setProfileForm({
        name: data.data.name || '',
        email: data.data.email || '',
      });
    }
  }, [data]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }

    try {
      await updateProfile(profileForm).unwrap();
      toast.success('Profile updated successfully.');
    } catch {
      toast.error('Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!passwordForm.currentPassword.trim() || !passwordForm.newPassword.trim()) {
      toast.error('Current and new password are required.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    try {
      await changePassword(passwordForm).unwrap();
      toast.success('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch {
      toast.error('Failed to change password.');
    }
  };

  if (isLoading) {
    return <Spinner label="Loading profile..." />;
  }

  if (isError) {
    return <p className="text-sm text-red-600">Failed to load profile.</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="mt-1 text-sm text-slate-600">Update your personal info and password.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Profile Details</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <div>
            <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              id="profile-name"
              value={profileForm.name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="profile-email"
              type="email"
              value={profileForm.email}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <Button type="submit" className="bg-slate-800 text-white hover:bg-slate-700" disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
            <input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
            <input
              id="new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <Button type="submit" className="bg-slate-800 text-white hover:bg-slate-700" disabled={isChangingPassword}>
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </section>
    </div>
  );
};

export default ProfilePage;