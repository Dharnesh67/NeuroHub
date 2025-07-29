const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProjectAccess() {
  try {
    console.log('🔧 Fixing project access issues...\n');

    // Get all users
    const users = await prisma.user.findMany();
    
    console.log(`Found ${users.length} users in database`);
    
    // For each user, check their project access
    for (const user of users) {
      console.log(`\n👤 Checking user: ${user.email} (${user.name || 'No name'})`);
      
      // Get projects this user has access to
      const userProjects = await prisma.usertoProject.findMany({
        where: { userId: user.id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              deletedAt: true,
            },
          },
        },
      });
      
      console.log(`   Has access to ${userProjects.length} projects:`);
      
      const validProjects = [];
      const invalidProjects = [];
      
      userProjects.forEach((userProject) => {
        if (userProject.project.deletedAt) {
          invalidProjects.push(userProject.project);
          console.log(`     ❌ ${userProject.project.name} (DELETED)`);
        } else {
          validProjects.push(userProject.project);
          console.log(`     ✅ ${userProject.project.name} (ACTIVE)`);
        }
      });
      
      if (validProjects.length === 0) {
        console.log(`   ⚠️  User has no valid projects!`);
      } else {
        console.log(`   ✅ User has ${validProjects.length} valid projects`);
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('1. The error occurs because the app is trying to access a project that either:');
    console.log('   - Does not exist in the database');
    console.log('   - Has been soft-deleted');
    console.log('   - The current user does not have access to');
    console.log('\n2. The fix I implemented will:');
    console.log('   - Validate the stored projectId against available projects');
    console.log('   - Clear invalid projectIds from localStorage');
    console.log('   - Auto-select the first available project');
    console.log('\n3. To test the fix:');
    console.log('   - Clear your browser localStorage for this domain');
    console.log('   - Or manually delete the "projectId" key from localStorage');
    console.log('   - Restart the application');
    
  } catch (error) {
    console.error('❌ Error fixing project access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProjectAccess(); 