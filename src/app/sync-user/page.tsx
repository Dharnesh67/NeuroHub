import React from 'react'
import { auth,clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
const SyncUser = async () => {
    const { userId } = await auth();
    if (!userId) {
        return <div>User not found</div>;
    }
    const client = await clerkClient();
    const User = await client.users.getUser(userId);
    if (!User) {
        return <div>User not found</div>;
    }
    await db.user.upsert({
        where: {
            email: User.emailAddresses[0]?.emailAddress || '',
        },
        update: {
            name: User.fullName,
            imageUrl: User.imageUrl,
            firstName: User.firstName,
            lastName: User.lastName,
        },
        create: {
            id: User.id,
            email: User.emailAddresses[0]?.emailAddress || '',
            name: User.fullName,
            imageUrl: User.imageUrl,
            firstName: User.firstName,
            lastName: User.lastName,
        },
    });
    return redirect('/dashboard');
}


export default SyncUser;    