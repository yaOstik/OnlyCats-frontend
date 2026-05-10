export default function AuthPageCard({
  authMode,
  authForm,
  onChangeMode,
  onFieldChange,
  onSubmit,
}) {
  return (
    <div className="bg-white mx-3 sm:mx-0 p-8 rounded-[32px] shadow-sm border border-gray-100 w-auto mt-4">
      <h2 className="text-2xl font-black text-center text-gray-900 mb-6">
        {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
      </h2>

      <form className="space-y-4" onSubmit={onSubmit}>
        {authMode === 'register' && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={authForm.name}
              onChange={(event) => onFieldChange('name', event.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#d946ef]"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={authForm.email}
            onChange={(event) => onFieldChange('email', event.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#d946ef]"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={authForm.password}
            onChange={(event) => onFieldChange('password', event.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#d946ef]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#d946ef] text-white font-bold py-3.5 rounded-xl mt-2 shadow-sm hover:-translate-y-0.5 transition-all"
        >
          {authMode === 'login' ? 'Log In' : 'Sign Up'}
        </button>

        <p className="text-center text-sm text-gray-500 font-medium pt-2">
          {authMode === 'login' ? (
            <>
              No account yet?{' '}
              <button type="button" onClick={() => onChangeMode('register')} className="text-[#d946ef]">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => onChangeMode('login')} className="text-[#d946ef]">
                Log in
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

