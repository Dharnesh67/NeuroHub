const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database state...\n');

    // Check all projects
    const projects = await prisma.project.findMany({
      include: {
        UsertoProject: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            commit: true,
          },
        },
      },
    });

    console.log(`📊 Found ${projects.length} projects:`);
    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. Project: ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   GitHub URL: ${project.githubUrl}`);
      console.log(`   Created: ${project.createdAt}`);
      console.log(`   Deleted: ${project.deletedAt ? 'YES' : 'NO'}`);
      console.log(`   Commits: ${project._count.commit}`);
      console.log(`   Users with access: ${project.UsertoProject.length}`);
      
      project.UsertoProject.forEach((userProject, userIndex) => {
        console.log(`     User ${userIndex + 1}: ${userProject.user.email} (${userProject.user.name})`);
      });
    });

    // Check all users
    const users = await prisma.user.findMany({
      include: {
        UsertoProject: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    console.log(`\n👥 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.name || 'No name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Projects: ${user.UsertoProject.length}`);
      
      user.UsertoProject.forEach((userProject, projectIndex) => {
        const status = userProject.project.deletedAt ? 'DELETED' : 'ACTIVE';
        console.log(`     Project ${projectIndex + 1}: ${userProject.project.name} (${status})`);
      });
    });

    // Check the specific project ID from the error
    const specificProjectId = '80acc6f0-a4f6-4ee6-a1f9-dd915894bc2e';
    const specificProject = await prisma.project.findFirst({
      where: { id: specificProjectId },
      include: {
        UsertoProject: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`\n🎯 Checking specific project ID from error: ${specificProjectId}`);
    if (specificProject) {
      console.log(`   Project exists: ${specificProject.name}`);
      console.log(`   Deleted: ${specificProject.deletedAt ? 'YES' : 'NO'}`);
      console.log(`   Users with access: ${specificProject.UsertoProject.length}`);
      specificProject.UsertoProject.forEach((userProject, index) => {
        console.log(`     User ${index + 1}: ${userProject.user.email} (${userProject.user.name})`);
      });
    } else {
      console.log('   ❌ Project does not exist in database');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 