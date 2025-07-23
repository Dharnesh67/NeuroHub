import { SignIn } from '@clerk/nextjs'
import React from 'react'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full flex flex-col items-center justify-center max-w-md p-8 rounded-2xl shadow-xl bg-neutral-900 border border-neutral-800">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">Welcome Back</h1>
        <p className="text-center text-neutral-400 mb-8">
          Sign in to your account to continue
        </p>
        <SignIn
         
        />
        <div className="mt-6 text-center text-sm text-neutral-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="text-white hover:underline font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}