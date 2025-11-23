"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { signInWithGoogle, signOutUser } from "@/lib/authHelpers";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <p className='p-4'>Loading...</p>;

  return (
    <main className='p-6'>
      {!user ? (
        <div className='h-[33vh] flex flex-col justify-center items-center space-y-2'>
          <button
            onClick={signInWithGoogle}
            className='bg-blue-400 hover:bg-blue-300 hover:text-gray-600 active:bg-blue-500 active:text-gray-800 text-gray-200 px-4 py-2 rounded'
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className='flex flex-col justify-center items-center space-y-2'>
          <div className='flex flex-row items-center space-x-3'>
            <p>Signed in as {user.email}</p>
            <Image
              src={user.user_metadata.avatar_url}
              alt='avatar'
              width={35}
              height={35}
              className='rounded-full'
            />
          </div>
          <button
            onClick={signOutUser}
            className='bg-gray-700 text-white px-4 py-2 rounded'
          >
            Sign out
          </button>
          <button
            onClick={() => router.push("/draw")}
            className='bg-blue-600 text-white px-4 py-2 rounded'
          >
            Start Sketching
          </button>
        </div>
      )}
    </main>
  );
}
