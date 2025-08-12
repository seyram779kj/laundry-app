
const STATIC_SERVICES = [
  {
    _id: '689806fbe5b87b3d276070a1',
    name: 'Wash & Fold',
    description: 'Regular washing and folding service for everyday clothes',
    category: 'washing',
    basePrice: 15,
    unit: 'kg',
    estimatedTime: '24-48 hours',
    isAvailable: true,
    features: ['Washing', 'Drying', 'Folding'],
    imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=300&h=200&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '689806fbe5b87b3d276070a2',
    name: 'Dry Cleaning',
    description: 'Professional dry cleaning for delicate items and formal wear',
    category: 'dry_cleaning',
    basePrice: 25,
    unit: 'piece',
    estimatedTime: '3-5 days',
    isAvailable: true,
    features: ['Dry Cleaning', 'Pressing', 'Stain Removal'],
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '689806fbe5b87b3d276070a3',
    name: 'Ironing',
    description: 'Professional ironing service for crisp, wrinkle-free clothes',
    category: 'ironing',
    basePrice: 10,
    unit: 'piece',
    estimatedTime: '1-2 days',
    isAvailable: true,
    features: ['Steam Ironing', 'Pressing', 'Hanging'],
    imageUrl: 'https://images.unsplash.com/photo-1582738887449-64b35a96973b?w=300&h=200&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '689806fbe5b87b3d276070a4',
    name: 'Stain Removal',
    description: 'Specialized stain removal treatment for tough stains',
    category: 'specialty',
    basePrice: 20,
    unit: 'piece',
    estimatedTime: '2-3 days',
    isAvailable: true,
    features: ['Pre-treatment', 'Specialized Cleaning', 'Quality Check'],
    imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300&h=200&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '689806fbe5b87b3d276070a5',
    name: 'Express Service',
    description: 'Same-day or next-day service for urgent items',
    category: 'express',
    basePrice: 35,
    unit: 'kg',
    estimatedTime: '4-24 hours',
    isAvailable: true,
    features: ['Priority Processing', 'Express Delivery', 'Quality Guarantee'],
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=300&h=200&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

module.exports = { STATIC_SERVICES };
