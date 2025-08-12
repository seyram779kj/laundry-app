
const STATIC_SERVICES = [
  {
    _id: "service_wash_fold",
    name: "Wash & Fold",
    description: "Regular washing and folding service for everyday clothes",
    category: "wash-fold",
    basePrice: 15.0,
    estimatedTime: "24-48 hours",
    requirements: "Standard laundry items only",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  {
    _id: "service_dry_cleaning",
    name: "Dry Cleaning",
    description: "Professional dry cleaning for delicate and formal items",
    category: "dry-cleaning",
    basePrice: 25.0,
    estimatedTime: "3-5 days",
    requirements: "Dry clean only items",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },
  {
    _id: "service_ironing",
    name: "Ironing",
    description: "Professional ironing service for crisp, wrinkle-free clothes",
    category: "ironing",
    basePrice: 10.0,
    estimatedTime: "1-2 days",
    requirements: "Pre-washed items preferred",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/ironing.webp"
  },
  {
    _id: "service_stain_removal",
    name: "Stain Removal",
    description: "Specialized treatment for tough stains and spots",
    category: "stain-removal",
    basePrice: 20.0,
    estimatedTime: "2-3 days",
    requirements: "Specify stain type and age",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/stain removal.jpg"
  }
];

module.exports = { STATIC_SERVICES };
