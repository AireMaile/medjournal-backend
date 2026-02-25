import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const medications = [
  { name: 'Sertraline', category: 'SSRI', commonDosages: ['25mg', '50mg', '100mg'] },
  { name: 'Fluoxetine', category: 'SSRI', commonDosages: ['10mg', '20mg', '40mg', '60mg'] },
  { name: 'Escitalopram', category: 'SSRI', commonDosages: ['5mg', '10mg', '20mg'] },
  { name: 'Citalopram', category: 'SSRI', commonDosages: ['10mg', '20mg', '40mg'] },
  { name: 'Paroxetine', category: 'SSRI', commonDosages: ['10mg', '20mg', '30mg', '40mg'] },
  { name: 'Fluvoxamine', category: 'SSRI', commonDosages: ['50mg', '100mg', '150mg'] },
  { name: 'Venlafaxine', category: 'SNRI', commonDosages: ['37.5mg', '75mg', '150mg', '225mg'] },
  { name: 'Duloxetine', category: 'SNRI', commonDosages: ['20mg', '30mg', '60mg'] },
  { name: 'Desvenlafaxine', category: 'SNRI', commonDosages: ['50mg', '100mg'] },
  { name: 'Bupropion', category: 'Atypical', commonDosages: ['75mg', '100mg', '150mg', '300mg'] },
  { name: 'Mirtazapine', category: 'Atypical', commonDosages: ['15mg', '30mg', '45mg'] },
  { name: 'Trazodone', category: 'Atypical', commonDosages: ['50mg', '100mg', '150mg'] },
  { name: 'Amitriptyline', category: 'Tricyclic', commonDosages: ['10mg', '25mg', '50mg', '75mg'] },
  { name: 'Nortriptyline', category: 'Tricyclic', commonDosages: ['10mg', '25mg', '50mg', '75mg'] },
  { name: 'Phenelzine', category: 'MAOI', commonDosages: ['15mg'] },
  { name: 'Tranylcypromine', category: 'MAOI', commonDosages: ['10mg'] },
]

async function main() {
  console.log('Seeding medication master list...')
  for (const med of medications) {
    await prisma.medication.upsert({ where: { name: med.name }, update: {}, create: med })
  }
  console.log(`✅ Seeded ${medications.length} medications`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
