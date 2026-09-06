import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.salaryRule.upsert({
    where: { id: 'rule-unpaid-001' },
    update: {
      name: 'Unpaid / Excess Leave Deduction',
      sequence: 70,
      isActive: true,
    },
    create: {
      id: 'rule-unpaid-001',
      salaryStructureId: 'struct-regular-001',
      name: 'Unpaid / Excess Leave Deduction',
      code: 'UNPAID_LEAVE',
      category: 'DEDUCTION',
      sequence: 70,
      calculationType: 'REFERENCE',
      formulaDescription: '(BASIC ÷ EXPECTED_DAYS) × TOTAL_UNPAID_DAYS',
      isActive: true,
    },
  });
  console.log('✅ UNPAID_LEAVE rule upserted:', rule.code, 'seq', rule.sequence);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
