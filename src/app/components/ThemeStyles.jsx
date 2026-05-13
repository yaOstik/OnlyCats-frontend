export default function ThemeStyles() {
  return (
    <style>
      {`
        :root {
          --oc-bg: #f3f4f6;
          --oc-bg-gradient: linear-gradient(180deg, #f3f4f6 0%, #eef1f7 100%);
          --oc-surface: #ffffff;
          --oc-surface-soft: #f8fafc;
          --oc-surface-soft-2: #f1f5f9;
          --oc-border: #e5e7eb;
          --oc-text: #111827;
          --oc-text-soft: #4b5563;
          --oc-text-muted: #9ca3af;
          --oc-accent: #d946ef;
          --oc-accent-soft: #fdf4ff;
        }

        :root[data-theme='dark'] {
          color-scheme: dark;
          --oc-bg: #0f1523;
          --oc-bg-gradient: radial-gradient(1100px 640px at 12% -15%, #2b3450 0%, #171d2f 45%, #0f1523 100%);
          --oc-surface: #1a2234;
          --oc-surface-soft: #232d43;
          --oc-surface-soft-2: #2a3550;
          --oc-border: #34405f;
          --oc-text: #eef2ff;
          --oc-text-soft: #c3cdea;
          --oc-text-muted: #9ca6c7;
          --oc-accent: #c987f5;
          --oc-accent-soft: rgba(112, 78, 173, 0.26);
        }

        body {
          background: var(--oc-bg);
          color: var(--oc-text);
        }

        :root[data-theme='dark'] body {
          background: var(--oc-bg-gradient);
        }

        :root[data-theme='dark'] .onlycats-app {
          background: transparent !important;
          color: var(--oc-text) !important;
        }

        :root[data-theme='dark'] .bg-white,
        :root[data-theme='dark'] .bg-white\\/90 {
          background-color: rgba(26, 34, 52, 0.92) !important;
          border-color: var(--oc-border) !important;
          box-shadow: 0 12px 30px rgba(4, 8, 18, 0.34) !important;
        }

        :root[data-theme='dark'] .bg-gray-50 {
          background-color: rgba(35, 45, 67, 0.78) !important;
        }

        :root[data-theme='dark'] .bg-gray-100 {
          background-color: rgba(42, 53, 80, 0.85) !important;
        }

        :root[data-theme='dark'] .bg-fuchsia-50,
        :root[data-theme='dark'] .bg-fuchsia-50\\/40,
        :root[data-theme='dark'] .bg-fuchsia-50\\/50,
        :root[data-theme='dark'] .bg-purple-50,
        :root[data-theme='dark'] .bg-\\[\\#fdf4ff\\] {
          background-color: var(--oc-accent-soft) !important;
        }

        :root[data-theme='dark'] .bg-white\\/75 {
          background-color: rgba(24, 32, 50, 0.8) !important;
        }

        :root[data-theme='dark'] .from-fuchsia-50,
        :root[data-theme='dark'] .from-fuchsia-100,
        :root[data-theme='dark'] .from-purple-50,
        :root[data-theme='dark'] .from-\\[\\#fdf4ff\\],
        :root[data-theme='dark'] .from-white {
          --tw-gradient-from: rgba(75, 90, 130, 0.34) var(--tw-gradient-from-position) !important;
          --tw-gradient-to: rgba(75, 90, 130, 0) var(--tw-gradient-to-position) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }

        :root[data-theme='dark'] .via-white {
          --tw-gradient-stops:
            var(--tw-gradient-from),
            rgba(54, 66, 98, 0.42) var(--tw-gradient-via-position),
            var(--tw-gradient-to) !important;
        }

        :root[data-theme='dark'] .to-fuchsia-50,
        :root[data-theme='dark'] .to-fuchsia-100,
        :root[data-theme='dark'] .to-purple-50,
        :root[data-theme='dark'] .to-\\[\\#fdf4ff\\],
        :root[data-theme='dark'] .to-white {
          --tw-gradient-to: rgba(36, 47, 74, 0.86) var(--tw-gradient-to-position) !important;
        }

        :root[data-theme='dark'] .text-gray-900,
        :root[data-theme='dark'] .text-gray-800 {
          color: var(--oc-text) !important;
        }

        :root[data-theme='dark'] .text-gray-700,
        :root[data-theme='dark'] .text-gray-600 {
          color: var(--oc-text-soft) !important;
        }

        :root[data-theme='dark'] .text-gray-500,
        :root[data-theme='dark'] .text-gray-400,
        :root[data-theme='dark'] .text-gray-300 {
          color: var(--oc-text-muted) !important;
        }

        :root[data-theme='dark'] .text-\\[\\#0f172a\\] {
          color: #f4f7ff !important;
        }

        :root[data-theme='dark'] .text-\\[\\#d946ef\\] {
          color: var(--oc-accent) !important;
        }

        :root[data-theme='dark'] .text-fuchsia-800,
        :root[data-theme='dark'] .text-fuchsia-700,
        :root[data-theme='dark'] .text-fuchsia-600 {
          color: #d4b2fa !important;
        }

        :root[data-theme='dark'] .border-gray-50,
        :root[data-theme='dark'] .border-gray-100,
        :root[data-theme='dark'] .border-gray-200,
        :root[data-theme='dark'] .border-fuchsia-50,
        :root[data-theme='dark'] .border-fuchsia-100,
        :root[data-theme='dark'] .border-purple-50 {
          border-color: var(--oc-border) !important;
        }

        :root[data-theme='dark'] input,
        :root[data-theme='dark'] textarea {
          background-color: rgba(32, 41, 62, 0.9) !important;
          color: var(--oc-text) !important;
          border-color: rgba(76, 92, 133, 0.9) !important;
        }

        :root[data-theme='dark'] input::placeholder,
        :root[data-theme='dark'] textarea::placeholder {
          color: #8f9dc0 !important;
        }

        :root[data-theme='dark'] .shadow-lg,
        :root[data-theme='dark'] .shadow-xl,
        :root[data-theme='dark'] .shadow-2xl {
          box-shadow: 0 16px 42px rgba(2, 6, 18, 0.45) !important;
        }

        :root[data-theme='dark'] .shadow-\\[0_4px_20px_rgba\\(0\\,0\\,0\\,0\\.03\\)\\] {
          box-shadow: 0 10px 26px rgba(2, 6, 18, 0.32) !important;
        }

        :root[data-theme='dark'] .shadow-\\[0_10px_40px_rgba\\(0\\,0\\,0\\,0\\.08\\)\\] {
          box-shadow: 0 12px 34px rgba(2, 6, 18, 0.46) !important;
        }

        :root[data-theme='dark'] .shadow-\\[0_4px_16px_rgba\\(217\\,70\\,239\\,0\\.35\\)\\],
        :root[data-theme='dark'] .shadow-\\[0_4px_15px_rgba\\(217\\,70\\,239\\,0\\.3\\)\\] {
          box-shadow: 0 8px 20px rgba(110, 56, 148, 0.32) !important;
        }

        :root[data-theme='dark'] .ring-offset-2 {
          --tw-ring-offset-color: #1a2234 !important;
        }

        :root[data-theme='dark'] .ring-white {
          --tw-ring-color: rgba(36, 49, 77, 0.95) !important;
        }

        :root[data-theme='dark'] .oc-bonus-quests-panel {
          background: linear-gradient(140deg, rgba(32, 42, 66, 0.95), rgba(27, 36, 58, 0.95)) !important;
          border-color: rgba(66, 82, 122, 0.88) !important;
          box-shadow: 0 14px 32px rgba(2, 6, 18, 0.38) !important;
        }

        :root[data-theme='dark'] .oc-bonus-title {
          color: #d8b9fb !important;
        }

        :root[data-theme='dark'] .oc-earned-pill {
          background: #202b44 !important;
          color: #d4b2fa !important;
          border: 1px solid #3a4970 !important;
          box-shadow: none !important;
        }

        :root[data-theme='dark'] .oc-rating-hero {
          background: linear-gradient(145deg, rgba(31, 41, 64, 0.94), rgba(24, 32, 52, 0.94)) !important;
          border-color: rgba(68, 84, 125, 0.84) !important;
          box-shadow: 0 18px 36px rgba(2, 6, 18, 0.42) !important;
        }

        :root[data-theme='dark'] .oc-rating-week-pill {
          background: #28334e !important;
          color: #d9b6fc !important;
          border: 1px solid #3b4a73 !important;
          box-shadow: none !important;
        }

        :root[data-theme='dark'] .oc-fluffy-widget {
          background: linear-gradient(150deg, rgba(26, 35, 56, 0.96), rgba(22, 30, 49, 0.96)) !important;
          border-color: rgba(66, 82, 122, 0.8) !important;
        }

        :root[data-theme='dark'] .oc-fluffy-widget-glow {
          background: radial-gradient(circle at center, rgba(179, 150, 240, 0.28), rgba(179, 150, 240, 0) 70%) !important;
          opacity: 0.35 !important;
          filter: blur(28px) !important;
        }

        :root[data-theme='dark'] .oc-leaderboard-cta {
          background: linear-gradient(90deg, rgba(39, 51, 80, 0.95), rgba(44, 58, 90, 0.95)) !important;
          color: #dbbdfe !important;
          border-color: #3b4a71 !important;
          box-shadow: none !important;
        }

        :root[data-theme='dark'] .oc-addcat-panel {
          background: linear-gradient(160deg, rgba(23, 32, 52, 0.96), rgba(18, 26, 44, 0.96)) !important;
          border-color: rgba(62, 78, 117, 0.9) !important;
          box-shadow: 0 18px 38px rgba(2, 6, 18, 0.44) !important;
        }

        :root[data-theme='dark'] .oc-addcat-upload {
          background: rgba(46, 55, 79, 0.74) !important;
          border-color: rgba(214, 219, 235, 0.75) !important;
        }

        :root[data-theme='dark'] .oc-addcat-file-row {
          border-color: #364261 !important;
          background: #202a43 !important;
        }

        :root[data-theme='dark'] .oc-addcat-file-btn {
          color: #d7b3fa !important;
          background: #e4dbf1 !important;
        }

        :root[data-theme='dark'] .oc-addcat-file-btn:hover {
          background: #d9cdeb !important;
        }

        :root[data-theme='dark'] .oc-addcat-file-name {
          color: #9fb2df !important;
        }

        :root[data-theme='dark'] .oc-addcat-selected {
          color: #d7b7fb !important;
        }

        :root[data-theme='dark'] .oc-addcat-age-panel {
          background: rgba(57, 52, 103, 0.52) !important;
          border-color: rgba(97, 104, 171, 0.9) !important;
        }
      `}
    </style>
  );
}
