import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin User ──────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flourishhigh.com' },
    update: {},
    create: {
      name: 'FHI Admin',
      email: 'admin@flourishhigh.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ─── Product Lines ───────────────────────────────────────────────
  const productLines = [
    { name: 'Textiles', code: 'TXT' },
    { name: 'Handicrafts & Home Decor', code: 'HND' },
    { name: 'Carpets & Rugs', code: 'CAR' },
    { name: 'Stationery', code: 'STA' },
    { name: 'Spices', code: 'SPC' },
    { name: 'Cotton Bags', code: 'CTB' },
  ];

  for (const line of productLines) {
    await prisma.productLine.upsert({
      where: { code: line.code },
      update: {},
      create: line,
    });
  }
  console.log(`✅ ${productLines.length} product lines seeded`);

  // ─── Sample Product Categories ───────────────────────────────────
  const txtLine = await prisma.productLine.findUnique({ where: { code: 'TXT' } });
  if (txtLine) {
    const categories = [
      { name: 'Towels', code: 'TWL', productLineId: txtLine.id },
      { name: 'Bed Linen', code: 'BDL', productLineId: txtLine.id },
      { name: 'Kitchen Linen', code: 'KTL', productLineId: txtLine.id },
    ];
    for (const cat of categories) {
      const existing = await prisma.productCategory.findFirst({
        where: { code: cat.code, productLineId: cat.productLineId },
      });
      if (!existing) {
        const created = await prisma.productCategory.create({ data: cat });
        // Add product types for Towels
        if (cat.code === 'TWL') {
          const types = [
            { name: 'Bath Towel', code: 'BTH', categoryId: created.id },
            { name: 'Hand Towel', code: 'HND', categoryId: created.id },
            { name: 'Face Towel', code: 'FCE', categoryId: created.id },
            { name: 'Bath Sheet', code: 'BST', categoryId: created.id },
          ];
          await prisma.productType.createMany({ data: types });
        }
      }
    }
  }
  console.log('✅ Sample product categories and types seeded');

  // ─── Currency Rates ───────────────────────────────────────────────
  const rates = [
    { fromCurrency: 'INR' as const, toCurrency: 'AUD' as const, rate: 0.018 },
    { fromCurrency: 'INR' as const, toCurrency: 'USD' as const, rate: 0.012 },
    { fromCurrency: 'INR' as const, toCurrency: 'NZD' as const, rate: 0.020 },
    { fromCurrency: 'INR' as const, toCurrency: 'JPY' as const, rate: 1.83 },
    { fromCurrency: 'INR' as const, toCurrency: 'EUR' as const, rate: 0.011 },
  ];
  await prisma.currencyRate.createMany({ data: rates, skipDuplicates: true });
  console.log('✅ Currency rates seeded');

  // ─── Port Charge Templates ────────────────────────────────────────
  const portCharges = [
    {
      portName: 'Nhava Sheva (JNPT)',
      chaCharges: 15000,
      portCharges: 8000,
      handlingCharges: 5000,
      documentCharges: 3000,
    },
    {
      portName: 'Chennai Port',
      chaCharges: 14000,
      portCharges: 7500,
      handlingCharges: 4500,
      documentCharges: 2500,
    },
  ];
  for (const port of portCharges) {
    await prisma.portChargeTemplate.upsert({
      where: { portName: port.portName },
      update: {},
      create: port,
    });
  }
  console.log('✅ Port charge templates seeded');

  // ─── Freight Templates ────────────────────────────────────────────
  const freightTemplates = [
    {
      name: 'JNPT → Melbourne (Sea Freight)',
      originPort: 'Nhava Sheva (JNPT)',
      destinationPort: 'Port of Melbourne',
      destinationCountry: 'Australia',
      freightCost20ft: 95000,
      freightCost40ft: 150000,
      transitDays: 18,
      validFrom: new Date('2025-01-01'),
    },
    {
      name: 'JNPT → Sydney (Sea Freight)',
      originPort: 'Nhava Sheva (JNPT)',
      destinationPort: 'Port of Sydney',
      destinationCountry: 'Australia',
      freightCost20ft: 100000,
      freightCost40ft: 158000,
      transitDays: 20,
      validFrom: new Date('2025-01-01'),
    },
    {
      name: 'JNPT → Auckland (Sea Freight)',
      originPort: 'Nhava Sheva (JNPT)',
      destinationPort: 'Port of Auckland',
      destinationCountry: 'New Zealand',
      freightCost20ft: 110000,
      freightCost40ft: 175000,
      transitDays: 22,
      validFrom: new Date('2025-01-01'),
    },
    {
      name: 'JNPT → Yokohama (Sea Freight)',
      originPort: 'Nhava Sheva (JNPT)',
      destinationPort: 'Port of Yokohama',
      destinationCountry: 'Japan',
      freightCost20ft: 85000,
      freightCost40ft: 135000,
      transitDays: 14,
      validFrom: new Date('2025-01-01'),
    },
  ];
  await prisma.freightTemplate.createMany({ data: freightTemplates, skipDuplicates: true });
  console.log('✅ Freight templates seeded');

  console.log('\n🎉 Database seeding complete!');
  console.log('📧 Admin login: admin@flourishhigh.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
