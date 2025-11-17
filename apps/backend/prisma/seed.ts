import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: '株式会社テスト',
      domain: 'test.example.com',
      plan: 'enterprise',
      maxUsers: 1000,
      settings: {},
    },
  });
  console.log('Created tenant:', tenant.name);

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      tenantId: tenant.id,
      name: 'admin',
      displayName: 'システム管理者',
      permissions: ['*'],
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      tenantId: tenant.id,
      name: 'manager',
      displayName: 'マネージャー',
      permissions: [
        'goals:read',
        'goals:approve',
        'evaluations:read',
        'evaluations:write',
        'users:read',
      ],
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { id: '00000000-0000-0000-0000-000000000103' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000103',
      tenantId: tenant.id,
      name: 'employee',
      displayName: '一般社員',
      permissions: ['goals:read', 'goals:write', 'evaluations:self', 'courses:enroll'],
    },
  });

  console.log('Created roles:', adminRole.name, managerRole.name, employeeRole.name);

  // Create department
  const department = await prisma.department.upsert({
    where: { id: '00000000-0000-0000-0000-000000000201' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      tenantId: tenant.id,
      name: '営業部',
      code: 'SALES',
    },
  });
  console.log('Created department:', department.name);

  // Create position
  const position = await prisma.position.upsert({
    where: { id: '00000000-0000-0000-0000-000000000301' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000301',
      tenantId: tenant.id,
      name: '課長',
      level: 5,
    },
  });
  console.log('Created position:', position.name);

  // Create password hash
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000001001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000001001',
      tenantId: tenant.id,
      email: 'admin@test.example.com',
      passwordHash,
      employeeId: 'EMP001',
      firstName: '太郎',
      lastName: '管理',
      departmentId: department.id,
      positionId: position.id,
      hireDate: new Date('2020-04-01'),
      status: 'active',
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });
  console.log('Created admin user:', adminUser.email);

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000001002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000001002',
      tenantId: tenant.id,
      email: 'manager@test.example.com',
      passwordHash,
      employeeId: 'EMP002',
      firstName: '花子',
      lastName: '部長',
      departmentId: department.id,
      positionId: position.id,
      hireDate: new Date('2018-04-01'),
      status: 'active',
      userRoles: {
        create: {
          roleId: managerRole.id,
        },
      },
    },
  });
  console.log('Created manager user:', managerUser.email);

  // Create employee user
  const employeeUser = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000001003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000001003',
      tenantId: tenant.id,
      email: 'employee@test.example.com',
      passwordHash,
      employeeId: 'EMP003',
      firstName: '次郎',
      lastName: '田中',
      departmentId: department.id,
      positionId: position.id,
      hireDate: new Date('2022-04-01'),
      status: 'active',
      managerId: managerUser.id,
      userRoles: {
        create: {
          roleId: employeeRole.id,
        },
      },
    },
  });
  console.log('Created employee user:', employeeUser.email);

  // Create evaluation cycle
  const currentYear = new Date().getFullYear();
  const evaluationCycle = await prisma.evaluationCycle.upsert({
    where: { id: '00000000-0000-0000-0000-000000002001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000002001',
      tenantId: tenant.id,
      name: `${currentYear}年度 上期評価`,
      startDate: new Date(`${currentYear}-04-01`),
      endDate: new Date(`${currentYear}-09-30`),
      selfEvaluationStart: new Date(`${currentYear}-09-15`),
      selfEvaluationEnd: new Date(`${currentYear}-09-30`),
      managerEvaluationStart: new Date(`${currentYear}-10-01`),
      managerEvaluationEnd: new Date(`${currentYear}-10-15`),
      status: 'active',
    },
  });
  console.log('Created evaluation cycle:', evaluationCycle.name);

  // Create goals for employee
  const goal1 = await prisma.goal.upsert({
    where: { id: '00000000-0000-0000-0000-000000003001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000003001',
      tenantId: tenant.id,
      userId: employeeUser.id,
      cycleId: evaluationCycle.id,
      title: '新規顧客獲得',
      description: '今期中に新規顧客を10社獲得する',
      category: 'performance',
      weight: 40,
      targetValue: 10,
      currentValue: 6,
      progressPercentage: 60,
      status: 'in_progress',
      startDate: new Date(`${currentYear}-04-01`),
      endDate: new Date(`${currentYear}-09-30`),
    },
  });

  const goal2 = await prisma.goal.upsert({
    where: { id: '00000000-0000-0000-0000-000000003002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000003002',
      tenantId: tenant.id,
      userId: employeeUser.id,
      cycleId: evaluationCycle.id,
      title: 'プレゼンテーションスキル向上',
      description: '社内プレゼン研修を完了し、提案力を強化する',
      category: 'skill',
      weight: 30,
      progressPercentage: 80,
      status: 'in_progress',
      startDate: new Date(`${currentYear}-04-01`),
      endDate: new Date(`${currentYear}-09-30`),
    },
  });

  const goal3 = await prisma.goal.upsert({
    where: { id: '00000000-0000-0000-0000-000000003003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000003003',
      tenantId: tenant.id,
      userId: employeeUser.id,
      cycleId: evaluationCycle.id,
      title: 'チーム協力の促進',
      description: '週次ミーティングを主催し、チーム内の情報共有を改善する',
      category: 'behavior',
      weight: 30,
      progressPercentage: 50,
      status: 'in_progress',
      startDate: new Date(`${currentYear}-04-01`),
      endDate: new Date(`${currentYear}-09-30`),
    },
  });
  console.log('Created goals:', goal1.title, goal2.title, goal3.title);

  // Create courses
  const course1 = await prisma.course.upsert({
    where: { id: '00000000-0000-0000-0000-000000004001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000004001',
      tenantId: tenant.id,
      title: 'リーダーシップ基礎講座',
      description: 'チームを効果的にリードするための基本的なスキルと考え方を学びます',
      category: 'leadership',
      level: 'beginner',
      estimatedDuration: 120,
      instructorId: managerUser.id,
      isPublished: true,
      lessons: {
        create: [
          {
            title: 'リーダーシップとは',
            description: 'リーダーシップの定義と重要性',
            type: 'video',
            orderIndex: 1,
            duration: 30,
            contentUrl: 'https://example.com/video1.mp4',
          },
          {
            title: 'チームビルディング',
            description: '効果的なチームを作る方法',
            type: 'video',
            orderIndex: 2,
            duration: 45,
            contentUrl: 'https://example.com/video2.mp4',
          },
          {
            title: '最終テスト',
            description: '学習内容の理解度確認',
            type: 'quiz',
            orderIndex: 3,
            duration: 20,
          },
        ],
      },
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: '00000000-0000-0000-0000-000000004002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000004002',
      tenantId: tenant.id,
      title: 'プロジェクト管理入門',
      description: 'プロジェクトを成功に導くための計画立案と進捗管理を学びます',
      category: 'management',
      level: 'intermediate',
      estimatedDuration: 180,
      instructorId: managerUser.id,
      isPublished: true,
      lessons: {
        create: [
          {
            title: 'プロジェクト計画の立て方',
            description: 'WBS作成とスケジューリング',
            type: 'video',
            orderIndex: 1,
            duration: 60,
            contentUrl: 'https://example.com/pm1.mp4',
          },
          {
            title: 'リスク管理',
            description: 'プロジェクトリスクの特定と対策',
            type: 'document',
            orderIndex: 2,
            duration: 40,
            contentUrl: 'https://example.com/risk.pdf',
          },
        ],
      },
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: '00000000-0000-0000-0000-000000004003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000004003',
      tenantId: tenant.id,
      title: 'ビジネスコミュニケーション',
      description: '効果的なビジネスコミュニケーションスキルを身につけます',
      category: 'communication',
      level: 'beginner',
      estimatedDuration: 90,
      instructorId: managerUser.id,
      isPublished: true,
      lessons: {
        create: [
          {
            title: 'ビジネスメールの書き方',
            description: '効果的なメールコミュニケーション',
            type: 'document',
            orderIndex: 1,
            duration: 30,
          },
          {
            title: 'プレゼンテーション技法',
            description: '聴衆を惹きつけるプレゼンの作り方',
            type: 'video',
            orderIndex: 2,
            duration: 45,
          },
        ],
      },
    },
  });

  console.log('Created courses:', course1.title, course2.title, course3.title);

  // Create enrollment for employee
  const enrollment = await prisma.enrollment.upsert({
    where: { id: '00000000-0000-0000-0000-000000005001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000005001',
      userId: employeeUser.id,
      courseId: course1.id,
      status: 'in_progress',
      progressPercentage: 45,
      startedAt: new Date(`${currentYear}-05-01`),
    },
  });
  console.log('Created enrollment for:', employeeUser.email);

  console.log('Seeding finished.');
  console.log('\nTest users:');
  console.log('- Admin: admin@test.example.com / password123');
  console.log('- Manager: manager@test.example.com / password123');
  console.log('- Employee: employee@test.example.com / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
