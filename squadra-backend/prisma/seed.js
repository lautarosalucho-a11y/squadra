// Seed de ejemplo — datos mínimos para desarrollo.
// Ejecutar: npm run prisma:seed   (requiere client generado y DB migrada)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const DEMO_PASSWORD = 'squadra1234';

async function main() {
  const ws = await prisma.workspace.create({
    data: { name: 'Acme Inc.', slug: 'acme' },
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const ana = await prisma.user.create({
    data: {
      email: 'ana@acme.com',
      fullName: 'Ana Pérez',
      homeWorkspaceId: ws.id,
      passwordHash,
    },
  });

  await prisma.membership.create({
    data: { workspaceId: ws.id, userId: ana.id, role: 'owner' },
  });

  const project = await prisma.project.create({
    data: { workspaceId: ws.id, name: 'Lanzamiento Q3', defaultView: 'board' },
  });

  const [todo, doing] = await Promise.all([
    prisma.section.create({ data: { projectId: project.id, name: 'Por hacer', position: 1 } }),
    prisma.section.create({ data: { projectId: project.id, name: 'En curso', position: 2 } }),
  ]);

  const parent = await prisma.task.create({
    data: {
      workspaceId: ws.id, projectId: project.id, sectionId: todo.id,
      title: 'Definir alcance del MVP', assigneeId: ana.id,
      status: 'todo', position: 1, createdById: ana.id,
    },
  });

  await prisma.task.create({
    data: {
      workspaceId: ws.id, projectId: project.id, parentTaskId: parent.id,
      title: 'Listar módulos core', status: 'todo', position: 1,
    },
  });

  console.log('\n✅ Seed OK\n');
  console.log('  Login:     ana@acme.com / ' + DEMO_PASSWORD);
  console.log('  Workspace: ' + ws.slug + ' (' + ws.id + ')');
  console.log('  Project:   ' + project.name + ' (' + project.id + ')');
  console.log('  URL:       http://localhost:5173  (el login te lleva al proyecto)\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
