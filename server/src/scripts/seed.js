require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');
const Category = require('../models/Category');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/rentall');
  console.log('Connected.');

  console.log('Clearing old data...');
  await Promise.all([
    User.deleteMany(),
    Category.deleteMany(),
    Listing.deleteMany(),
    Booking.deleteMany(),
    Payment.deleteMany(),
    Review.deleteMany(),
    Conversation.deleteMany(),
    Message.deleteMany(),
    Wishlist.deleteMany(),
    Notification.deleteMany()
  ]);
  console.log('Data cleared.');

  console.log('Seeding Categories...');
  const categoriesData = [
    { name: 'Vehicles', slug: 'vehicles', iconName: 'Car', description: 'Cars, bikes, and other vehicles' },
    { name: 'Electronics', slug: 'electronics', iconName: 'Laptop', description: 'Gadgets, laptops, cameras' },
    { name: 'Party Supplies', slug: 'party-supplies', iconName: 'Music', description: 'Speakers, lights, tents' },
    { name: 'Tools', slug: 'tools', iconName: 'Wrench', description: 'Power tools, gardening, construction' },
    { name: 'Sports & Fitness', slug: 'sports-fitness', iconName: 'Dumbbell', description: 'Gym equipment, bikes, outdoor gear' },
    { name: 'Photography', slug: 'photography', iconName: 'Camera', description: 'Cameras, lenses, lighting, drones' },
    { name: 'Gaming', slug: 'gaming', iconName: 'Gamepad', description: 'Consoles, VR headsets, gaming PCs' },
    { name: 'Musical Instruments', slug: 'musical-instruments', iconName: 'Music', description: 'Guitars, keyboards, drums, DJ equipment' },
    { name: 'Camping & Outdoor', slug: 'camping-outdoor', iconName: 'Tent', description: 'Tents, sleeping bags, hiking gear' },
    { name: 'Home & Garden', slug: 'home-garden', iconName: 'Home', description: 'Furniture, appliances, lawn equipment' },
    { name: 'Baby & Kids', slug: 'baby-kids', iconName: 'Baby', description: 'Strollers, car seats, toys, cribs' },
    { name: 'Fashion & Accessories', slug: 'fashion-accessories', iconName: 'Shirt', description: 'Designer wear, jewelry, bags' }
  ];
  
  const createdCategories = await Category.insertMany(categoriesData);

  // Subcategories
  const vehicleId = createdCategories.find(c => c.slug === 'vehicles')._id;
  const electronicsId = createdCategories.find(c => c.slug === 'electronics')._id;
  const photographyId = createdCategories.find(c => c.slug === 'photography')._id;
  const sportsId = createdCategories.find(c => c.slug === 'sports-fitness')._id;

  const subCategoriesData = [
    { name: 'Cars', slug: 'cars', iconName: 'Car', description: 'Sedans, SUVs, luxury cars', parentId: vehicleId },
    { name: 'Bikes', slug: 'bikes', iconName: 'Bike', description: 'Motorcycles, bicycles', parentId: vehicleId },
    { name: 'Scooters', slug: 'scooters', iconName: 'Bike', description: 'Electric and petrol scooters', parentId: vehicleId },
    { name: 'Cameras', slug: 'cameras', iconName: 'Camera', description: 'DSLRs, mirrorless, action cameras', parentId: photographyId },
    { name: 'Lenses', slug: 'lenses', iconName: 'Camera', description: 'Prime, zoom, telephoto lenses', parentId: photographyId },
    { name: 'Drones', slug: 'drones', iconName: 'Plane', description: 'Aerial photography drones', parentId: photographyId },
    { name: 'Laptops', slug: 'laptops', iconName: 'Laptop', description: 'MacBooks, gaming laptops, workstations', parentId: electronicsId },
    { name: 'Tablets', slug: 'tablets', iconName: 'Tablet', description: 'iPads, Android tablets', parentId: electronicsId },
    { name: 'Gym Equipment', slug: 'gym-equipment', iconName: 'Dumbbell', description: 'Weights, treadmills, benches', parentId: sportsId },
    { name: 'Bicycles', slug: 'bicycles', iconName: 'Bike', description: 'Mountain bikes, road bikes, e-bikes', parentId: sportsId }
  ];

  await Category.insertMany(subCategoriesData);

  const allCategories = await Category.find();
  const carsCategory = allCategories.find(c => c.slug === 'cars')._id;
  const camerasCategory = allCategories.find(c => c.slug === 'cameras')._id;

  console.log('Seeding Users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const john = await User.create({
    email: 'john.host@example.com',
    passwordHash,
    fullName: 'John Hostman',
    phone: '9876543210',
    role: 'BOTH',
    city: 'Mumbai',
    state: 'MH',
    country: 'India',
    isVerified: true
  });

  const alice = await User.create({
    email: 'alice.renter@example.com',
    passwordHash,
    fullName: 'Alice Rents',
    phone: '1234567890',
    role: 'RENTER',
    city: 'Delhi',
    state: 'DL',
    country: 'India',
    isVerified: true
  });

  console.log('Seeding Listings...');
  const listing1 = await Listing.create({
    title: 'Sony A7III Mirrorless Camera with 28-70mm Lens',
    description: 'Perfect for weddings and short films. Comes with 2 batteries and a 64GB SD card.',
    categoryId: camerasCategory,
    hostId: john._id,
    pricePerDay: 1500,
    pricePerWeek: 9000,
    depositAmount: 5000,
    status: 'ACTIVE',
    instantBook: true,
    city: 'Mumbai',
    state: 'MH',
    country: 'India',
    latitude: 19.0760,
    longitude: 72.8777,
    address: 'Bandra West, Mumbai',
    rules: 'No physical damage. Return batteries fully charged.',
    cancellationPolicy: 'MODERATE',
    images: [{
      url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
      publicId: 'seed_cam1',
      isPrimary: true,
      order: 1
    }]
  });

  const listing2 = await Listing.create({
    title: 'Mahindra Thar 4x4 (2022)',
    description: 'Explore the outdoors with this beast. Self-drive only.',
    categoryId: carsCategory,
    hostId: john._id,
    pricePerDay: 3500,
    pricePerWeek: 20000,
    depositAmount: 10000,
    status: 'ACTIVE',
    instantBook: false,
    city: 'Mumbai',
    state: 'MH',
    country: 'India',
    latitude: 19.1136,
    longitude: 72.8697,
    address: 'Andheri East, Mumbai',
    rules: 'Fuel to be returned at same level. Valid Driving License required.',
    cancellationPolicy: 'STRICT',
    images: [{
      url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000',
      publicId: 'seed_thar1',
      isPrimary: true,
      order: 1
    }]
  });

  console.log('Seeding Completed successfully.');
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
