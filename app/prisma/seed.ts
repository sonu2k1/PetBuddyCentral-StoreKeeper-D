import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding PetBuddyCentral database...\n')

    // ─── Organization ─────────────────────────────
    const org = await prisma.organization.create({
        data: {
            name: 'P.B.C. Pet Buddy LLP',
            slug: 'petbuddycentral',
            email: 'buddy@petbuddycentral.com',
            phone: '+91 9876543210',
            website: 'www.petbuddycentral.com',
            gstNumber: '09ABEFP2368R1ZF',
            settings: JSON.stringify({
                currency: 'INR',
                loyaltyPointsPerRupee: 0.01,
            }),
        },
    })
    console.log(`✅ Organization: ${org.name}`)

    // ─── Stores ───────────────────────────────────
    const store1 = await prisma.store.create({
        data: {
            orgId: org.id,
            name: 'Kanpur Hub Store',
            code: 'S01',
            address: '214-A, Swarajya Nagar, Panki',
            city: 'Kanpur',
            state: 'Uttar Pradesh',
            pincode: '208020',
            phone: '+91 9876543211',
            gstNumber: '09ABEFP2368R1ZF',
        },
    })

    const store2 = await prisma.store.create({
        data: {
            orgId: org.id,
            name: 'Lucknow Main Store',
            code: 'S02',
            address: '42, Hazratganj, Near GPO',
            city: 'Lucknow',
            state: 'Uttar Pradesh',
            pincode: '226001',
            phone: '+91 9876543212',
        },
    })
    console.log(`✅ Stores: ${store1.name}, ${store2.name}`)

    // ─── Users ────────────────────────────────────
    const adminPassword = await hash('admin123', 12)
    const ownerPassword = await hash('owner123', 12)
    const managerPassword = await hash('manager123', 12)

    const admin = await prisma.user.create({
        data: {
            orgId: org.id,
            name: 'Aarav Sharma',
            email: 'admin@petbuddycentral.com',
            passwordHash: adminPassword,
            role: 'SUPER_ADMIN',
        },
    })

    const owner = await prisma.user.create({
        data: {
            orgId: org.id,
            storeId: store1.id,
            name: 'Vikram Patel',
            email: 'owner@petbuddycentral.com',
            passwordHash: ownerPassword,
            role: 'FRANCHISE_OWNER',
        },
    })

    const manager = await prisma.user.create({
        data: {
            orgId: org.id,
            storeId: store1.id,
            name: 'Rahul Gupta',
            email: 'manager@petbuddycentral.com',
            passwordHash: managerPassword,
            role: 'STORE_MANAGER',
            pin: await hash('1234', 10),
        },
    })
    console.log(`✅ Users: ${admin.name} (Admin), ${owner.name} (Owner), ${manager.name} (Manager)`)

    // ─── Categories ───────────────────────────────
    const categories = await Promise.all([
        prisma.category.create({ data: { orgId: org.id, name: 'Dog Food', icon: '🐕', sortOrder: 1 } }),
        prisma.category.create({ data: { orgId: org.id, name: 'Cat Food', icon: '🐱', sortOrder: 2 } }),
        prisma.category.create({ data: { orgId: org.id, name: 'Bird Food', icon: '🐦', sortOrder: 3 } }),
        prisma.category.create({ data: { orgId: org.id, name: 'Fish Food', icon: '🐠', sortOrder: 4 } }),
        prisma.category.create({ data: { orgId: org.id, name: 'Toys', icon: '🧸', sortOrder: 5 } }),
        prisma.category.create({ data: { orgId: org.id, name: 'Accessories', icon: '🦴', sortOrder: 6 } }),
        prisma.category.create({ data: { orgId: org.id, name: 'Grooming', icon: '✂️', sortOrder: 7 } }),
        prisma.category.create({ data: { orgId: org.id, name: 'Medicine', icon: '💊', sortOrder: 8 } }),
    ])
    console.log(`✅ Categories: ${categories.length} created`)

    // ─── Products ─────────────────────────────────
    const productData = [
        { name: 'Pedigree Adult Chicken 10kg', sku: 'PED-ADC-10', cat: 0, price: 1200, cost: 950, taxRate: 18.00 },
        { name: 'Pedigree Adult Chicken 20kg', sku: 'PED-ADC-20', cat: 0, price: 2100, cost: 1700, taxRate: 18.00 },
        { name: 'Pedigree Puppy 3kg', sku: 'PED-PUP-03', cat: 0, price: 600, cost: 480, taxRate: 18.00 },
        { name: 'Royal Canin Adult 10kg', sku: 'RC-ADL-10', cat: 0, price: 1500, cost: 1200, taxRate: 18.00 },
        { name: 'Royal Canin Puppy 4kg', sku: 'RC-PUP-04', cat: 0, price: 1100, cost: 880, taxRate: 18.00 },
        { name: 'Drools Focus Puppy 3kg', sku: 'DRL-FP-03', cat: 0, price: 600, cost: 470, taxRate: 18.00 },
        { name: 'Drools Adult 10kg', sku: 'DRL-ADL-10', cat: 0, price: 1050, cost: 830, taxRate: 18.00 },
        { name: 'Whiskas Tuna 1.2kg', sku: 'WSK-TUN-12', cat: 1, price: 400, cost: 320, taxRate: 10.00 },
        { name: 'Whiskas Ocean Fish 3kg', sku: 'WSK-OCF-03', cat: 1, price: 900, cost: 710, taxRate: 10.00 },
        { name: 'Royal Canin Cat Indoor 2kg', sku: 'RC-CAT-IN2', cat: 1, price: 1400, cost: 1100, taxRate: 18.00 },
        { name: 'Me-O Tuna 1.2kg', sku: 'MEO-TUN-12', cat: 1, price: 350, cost: 270, taxRate: 18.00 },
        { name: 'Taiyo Bird Food Mix 500g', sku: 'TAI-BF-05', cat: 2, price: 180, cost: 120, taxRate: 18.00 },
        { name: 'Vitapol Budgie Mix 1kg', sku: 'VIT-BDG-01', cat: 2, price: 320, cost: 240, taxRate: 18.00 },
        { name: 'Taiyo Fish Food Pellets 100g', sku: 'TAI-FP-01', cat: 3, price: 120, cost: 80, taxRate: 18.00 },
        { name: 'Optimum Fish Flakes 50g', sku: 'OPT-FF-50', cat: 3, price: 90, cost: 55, taxRate: 18.00 },
        { name: 'Squeaky Bone Toy', sku: 'TOY-SQB-01', cat: 4, price: 250, cost: 150, taxRate: 18.00 },
        { name: 'Rope Tug Toy Large', sku: 'TOY-RTL-01', cat: 4, price: 350, cost: 200, taxRate: 18.00 },
        { name: 'Leather Dog Collar Medium', sku: 'ACC-LDC-MD', cat: 5, price: 450, cost: 280, taxRate: 18.00 },
        { name: 'Anti-tick Grooming Spray 200ml', sku: 'GRM-ATS-02', cat: 6, price: 350, cost: 220, taxRate: 18.00 },
        { name: 'Paws Deworming Tablet', sku: 'MED-DWT-01', cat: 7, price: 85, cost: 45, taxRate: 18.00 },
    ]

    const products = await Promise.all(
        productData.map((p) =>
            prisma.product.create({
                data: {
                    orgId: org.id,
                    categoryId: categories[p.cat].id,
                    sku: p.sku,
                    name: p.name,
                    price: p.price,
                    costPrice: p.cost,
                    unit: 'pcs',
                    taxRate: p.taxRate,
                },
            })
        )
    )
    console.log(`✅ Products: ${products.length} created`)

    // ─── Inventory for Store 1 ────────────────────
    await Promise.all(
        products.map((p, i) =>
            prisma.storeInventory.create({
                data: {
                    storeId: store1.id,
                    productId: p.id,
                    quantity: 20 + Math.floor(Math.random() * 80),
                    lowStockThreshold: 10,
                    reorderPoint: 15,
                },
            })
        )
    )

    // ─── Inventory for Store 2 ────────────────────
    await Promise.all(
        products.map((p, i) =>
            prisma.storeInventory.create({
                data: {
                    storeId: store2.id,
                    productId: p.id,
                    quantity: 15 + Math.floor(Math.random() * 60),
                    lowStockThreshold: 10,
                    reorderPoint: 15,
                },
            })
        )
    )
    console.log(`✅ Inventory: seeded for both stores`)

    // ─── Customers ────────────────────────────────
    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                orgId: org.id,
                name: 'Raj Kumar',
                phone: '+919001234567',
                email: 'raj@example.com',
                loyaltyPoints: 2500,
                loyaltyTier: 'SILVER',
            },
        }),
        prisma.customer.create({
            data: {
                orgId: org.id,
                name: 'Priya Singh',
                phone: '+919001234568',
                email: 'priya@example.com',
                loyaltyPoints: 5200,
                loyaltyTier: 'GOLD',
            },
        }),
        prisma.customer.create({
            data: {
                orgId: org.id,
                name: 'Amit Verma',
                phone: '+919001234569',
                loyaltyPoints: 800,
                loyaltyTier: 'BRONZE',
            },
        }),
        prisma.customer.create({
            data: {
                orgId: org.id,
                name: 'Sita Devi',
                phone: '+919001234570',
                loyaltyPoints: 1200,
                loyaltyTier: 'BRONZE',
            },
        }),
        prisma.customer.create({
            data: {
                orgId: org.id,
                name: 'Mohit Agarwal',
                phone: '+919001234571',
                email: 'mohit@example.com',
                loyaltyPoints: 3100,
                loyaltyTier: 'SILVER',
            },
        }),
    ])
    console.log(`✅ Customers: ${customers.length} created`)

    // ─── Pets ─────────────────────────────────────
    await Promise.all([
        prisma.pet.create({
            data: {
                customerId: customers[0].id,
                name: 'Bruno',
                type: 'dog',
                breed: 'German Shepherd',
                weight: 32.5,
                dietaryNeeds: JSON.stringify(['high-protein', 'grain-free']),
                medicalConditions: JSON.stringify([]),
            },
        }),
        prisma.pet.create({
            data: {
                customerId: customers[0].id,
                name: 'Mochi',
                type: 'cat',
                breed: 'Persian',
                weight: 4.2,
                dietaryNeeds: JSON.stringify(['indoor-formula']),
                medicalConditions: JSON.stringify(['sensitive-stomach']),
            },
        }),
        prisma.pet.create({
            data: {
                customerId: customers[1].id,
                name: 'Simba',
                type: 'dog',
                breed: 'Golden Retriever',
                weight: 28.0,
                dietaryNeeds: JSON.stringify([]),
                medicalConditions: JSON.stringify([]),
            },
        }),
        prisma.pet.create({
            data: {
                customerId: customers[2].id,
                name: 'Tweety',
                type: 'bird',
                breed: 'Budgerigar',
                weight: 0.04,
                dietaryNeeds: JSON.stringify(['seed-mix']),
                medicalConditions: JSON.stringify([]),
            },
        }),
    ])
    console.log(`✅ Pets: 4 created`)

    // ─── Supplier ─────────────────────────────────
    await prisma.supplier.create({
        data: {
            orgId: org.id,
            name: 'PetFoods India Pvt Ltd',
            phone: '+919811111111',
            email: 'sales@petfoodsindia.com',
            address: 'Sector 18, Noida, UP',
            leadTimeDays: 5,
        },
    })
    console.log(`✅ Supplier: 1 created`)

    console.log('\n🎉 Seed complete! Database is ready.')
    console.log('\n📌 Demo accounts:')
    console.log('   Super Admin:      admin@petbuddycentral.com / admin123')
    console.log('   Franchise Owner:  owner@petbuddycentral.com / owner123')
    console.log('   Store Manager:    manager@petbuddycentral.com / manager123')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
