import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-full flex flex-col items-center justify-center max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
          <h1 className="mb-6 text-center text-3xl font-bold text-white">
            Create your account
          </h1>
          <p className="mb-8 text-center text-neutral-400">
            Sign up to get started with NeuroHub
          </p>
          <SignUp />
         
        </div>
      </div>
    </>
  );
}
