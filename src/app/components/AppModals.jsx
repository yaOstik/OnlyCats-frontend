import PawIcon from './PawIcon';

export default function AppModals({
  showAuthModal,
  showOutOfLikesModal,
  showWelcomeModal,
  welcomeTitle,
  welcomeDesc,
  onCloseAuthModal,
  onOpenAuthTab,
  onCloseOutOfLikesModal,
  onGoToTasksFromLikesModal,
  onCloseWelcomeModal,
}) {
  return (
    <>
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={onCloseAuthModal}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-20 h-20 bg-[#d946ef] rounded-[20px] flex items-center justify-center mb-5 text-white shadow-sm">
                <PawIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Authentication Required</h3>
              <p className="text-gray-500 mb-8 text-[15px] font-medium leading-relaxed">
                To like, comment, and post, please sign in.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => onOpenAuthTab('register')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl text-[15px] transition-colors"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => onOpenAuthTab('login')}
                  className="flex-1 bg-[#d946ef] hover:bg-[#c026d3] text-white font-bold py-3.5 rounded-xl text-[15px] shadow-sm transition-colors"
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOutOfLikesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative text-center border-4 border-yellow-400">
            <span className="text-6xl block mb-4 drop-shadow-md">🙀</span>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Out of Stars</h3>
            <p className="text-gray-500 mb-6 text-[15px] font-medium leading-relaxed">
              You used all free stars for today. Complete tasks to earn more.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onGoToTasksFromLikesModal}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black py-4 rounded-xl text-[15px] shadow-sm transition-transform active:scale-95"
              >
                Go to Tasks
              </button>
              <button
                onClick={onCloseOutOfLikesModal}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl text-sm transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {showWelcomeModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-10 max-w-md w-full text-center shadow-xl">
            <div className="w-20 h-20 bg-[#d946ef] rounded-[20px] text-white mx-auto mb-5 flex items-center justify-center shadow-sm">
              <PawIcon className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black mb-3 tracking-tight text-gray-900">{welcomeTitle}</h2>
            <p className="text-gray-500 mb-8 text-[15px] font-medium leading-relaxed">{welcomeDesc}</p>
            <button
              onClick={onCloseWelcomeModal}
              className="w-full bg-[#d946ef] text-white font-black py-4 rounded-[18px] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg tracking-wide"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
}

