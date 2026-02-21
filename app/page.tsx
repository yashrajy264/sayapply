import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white text-center">
          <h1 className="text-4xl font-bold mb-2">Say Apply</h1>
          <p className="text-blue-100 text-lg">AI-Powered LinkedIn Job Application Assistant</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This is a <strong>Chrome Extension</strong> project. It cannot run directly in this web preview.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">How to Install</h2>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">1</div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Download the Code</h3>
                  <p className="text-gray-600">Download the <code>extension</code> folder from this project.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">2</div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Build the Extension</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mt-2 font-mono text-sm overflow-x-auto">
                    <p>cd extension</p>
                    <p>npm install</p>
                    <p>npm run build</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">3</div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Load into Chrome</h3>
                  <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                    <li>Open Chrome and go to <code>chrome://extensions</code></li>
                    <li>Enable <strong>Developer mode</strong> (top right)</li>
                    <li>Click <strong>Load unpacked</strong></li>
                    <li>Select the <code>extension/dist</code> folder</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">🤖 Gemini AI Powered</h3>
                <p className="text-sm text-gray-600 mt-1">Intelligently fills form fields based on your profile.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">🧠 Smart Question Bank</h3>
                <p className="text-sm text-gray-600 mt-1">Remembers your answers so you don't have to type them again.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">📄 Resume Injection</h3>
                <p className="text-sm text-gray-600 mt-1">Automatically uploads your PDF resume to job applications.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">🖥️ Side Panel UI</h3>
                <p className="text-sm text-gray-600 mt-1">Convenient side panel interface that stays open while you browse.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
