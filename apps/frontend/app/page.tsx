'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary-700">📋 Worktree Forms</div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-primary-500 hover:bg-primary-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Professional Form Management Made Simple
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Build, deploy, and manage forms with our intuitive visual builder. 
              Complete with role-based access control, audit logging, and beautiful UI.
            </p>
            
            {/* Features */}
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span>Drag-and-drop form builder</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span>Role-based access control</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span>Comprehensive audit logging</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span>Light & dark mode themes</span>
              </li>
            </ul>

            <div className="flex gap-4">
              <Link href="/signup">
                <Button className="bg-primary-500 hover:bg-primary-700 px-8 py-3 text-lg">
                  Start Building
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="px-8 py-3 text-lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Right - Demo Box */}
          <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-primary-100">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded p-6 mb-4">
              <h3 className="text-xl font-bold mb-2">🚀 Quick Demo</h3>
              <p className="text-sm opacity-90">Try the system with demo credentials</p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="font-semibold text-gray-700">Email:</label>
                <code className="bg-gray-100 px-3 py-1 rounded block mt-1 text-xs">admin@worktreeforms.com</code>
              </div>
              <div>
                <label className="font-semibold text-gray-700">Password:</label>
                <code className="bg-gray-100 px-3 py-1 rounded block mt-1 text-xs">admin123</code>
              </div>
              <div className="pt-4">
                <Link href="/login?demo=true">
                  <Button className="w-full bg-primary-500 hover:bg-primary-700">
                    Try Demo
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t text-xs text-gray-500">
              <p>Demo access available for testing. Admin panel includes:</p>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• User management</li>
                <li>• Role & permission control</li>
                <li>• Audit log viewer</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Choose Worktree Forms?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-gradient-to-br from-primary-50 to-transparent rounded-lg border border-primary-100">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Visual Builder</h3>
              <p className="text-gray-600">
                Create forms without coding using our intuitive drag-and-drop interface.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-transparent rounded-lg border border-blue-100">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Enterprise Security</h3>
              <p className="text-gray-600">
                Role-based access control, audit logging, and industry-standard encryption.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-gradient-to-br from-purple-50 to-transparent rounded-lg border border-purple-100">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Analytics</h3>
              <p className="text-gray-600">
                Track submissions, export data, and get insights with comprehensive reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>© 2025 Worktree Forms. All rights reserved.</div>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="hover:text-primary-300">About</Link>
              <Link href="#" className="hover:text-primary-300">Docs</Link>
              <Link href="#" className="hover:text-primary-300">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
