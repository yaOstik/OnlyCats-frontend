import PasswordResetFlow from './PasswordResetFlow';

export default function PasswordResetModal({
  isOpen,
  baseUrl,
  defaultEmail,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1450] flex items-center justify-center bg-gray-900/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-fuchsia-100 bg-white p-6 shadow-2xl">
        <div className="mb-3 flex justify-end">
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
        <PasswordResetFlow
          baseUrl={baseUrl}
          defaultEmail={defaultEmail}
          title="Forgot Password"
          onDone={(message) => {
            alert(message);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
