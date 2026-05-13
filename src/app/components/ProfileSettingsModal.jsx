import { useState } from 'react';
import PasswordResetFlow from './PasswordResetFlow';
import ThemeSwitcher from './ThemeSwitcher';

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  basicForm,
  onChangeBasic,
  onSaveBasic,
  isSavingBasic,
  baseUrl,
  defaultEmail,
  onDeleteAccount,
  themeMode,
  onChangeThemeMode,
  isDarkTheme = false,
}) {
  const [tab, setTab] = useState('basic');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!deletePassword.trim()) {
      alert('Enter your password first.');
      return;
    }
    if (
      !window.confirm(
        'This will permanently delete your account, posts, comments, likes, and reports. Continue?',
      )
    ) {
      return;
    }

    setDeleteLoading(true);
    try {
      await onDeleteAccount(deletePassword);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-gray-900/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[30px] border border-fuchsia-100 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-black text-gray-900">Settings</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-fuchsia-50 hover:text-[#d946ef]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 inline-flex rounded-2xl border border-fuchsia-100 bg-fuchsia-50 p-1">
          <button
            type="button"
            onClick={() => setTab('basic')}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider ${
              tab === 'basic' ? 'bg-[#d946ef] text-white' : 'text-gray-500 hover:text-[#d946ef]'
            }`}
          >
            Basic
          </button>
          <button
            type="button"
            onClick={() => setTab('privacy')}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider ${
              tab === 'privacy' ? 'bg-[#d946ef] text-white' : 'text-gray-500 hover:text-[#d946ef]'
            }`}
          >
            Privacy
          </button>
        </div>

        <div className="mb-6 md:hidden rounded-2xl border border-fuchsia-100 bg-fuchsia-50/40 p-3.5">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Theme</p>
          <ThemeSwitcher
            value={themeMode}
            onChange={onChangeThemeMode}
            isDarkTheme={isDarkTheme}
            className="w-full justify-between"
          />
        </div>

        {tab === 'basic' ? (
          <form onSubmit={onSaveBasic} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-500">
                Username
              </label>
              <input
                type="text"
                required
                maxLength={50}
                value={basicForm.username}
                onChange={(event) => onChangeBasic('username', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-[#d946ef] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-500">
                Bio
              </label>
              <textarea
                rows={4}
                maxLength={100}
                value={basicForm.bio}
                onChange={(event) => onChangeBasic('bio', event.target.value)}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-[#d946ef] focus:bg-white"
              />
              <p className="mt-1 text-right text-xs font-bold text-gray-400">
                {basicForm.bio.length}/100
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingBasic}
              className="w-full rounded-2xl bg-[#d946ef] py-3.5 text-sm font-black uppercase tracking-wider text-white hover:bg-[#c026d3] disabled:opacity-60"
            >
              {isSavingBasic ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <PasswordResetFlow
              baseUrl={baseUrl}
              defaultEmail={defaultEmail}
              title="Change Password"
              onDone={(message) => {
                alert(message);
              }}
            />

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-red-600">Delete account</h4>
              <p className="mt-1 text-sm font-semibold text-red-500 leading-relaxed">
                This action is permanent. Your profile, comments, posts, likes, and reports will be erased forever.
              </p>

              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="Enter password to confirm"
                className="mt-3 w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-red-400"
              />

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="mt-3 w-full rounded-xl bg-red-500 py-2.5 text-sm font-black uppercase tracking-wider text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting...' : 'Delete account forever'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
