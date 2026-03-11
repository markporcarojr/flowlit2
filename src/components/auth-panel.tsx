'use client'

import { useAuth } from '@clerk/nextjs'
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

export default function AuthPanel() {
  const { isSignedIn } = useAuth()

  return (
    <div className="mt-auto pt-4 border-t border-slate-200">
      {!isSignedIn ? (
        <div className="flex flex-col gap-2">
          <SignInButton mode="modal">
            <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="w-full py-2 px-4 border-2 border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wide hover:border-blue-400 hover:bg-blue-50 transition-all">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <UserButton />
          <span className="text-xs text-slate-500 font-medium">My Account</span>
        </div>
      )}
    </div>
  )
}