
const STATIC_SERVICES = [
  // Basic Laundry Services
  {
    _id: "service_wash_fold_basic",
    name: "Basic Wash & Fold",
    description: "Standard washing and folding service for everyday clothes",
    category: "wash-fold",
    basePrice: 12.0,
    estimatedTime: "24-48 hours",
    requirements: "Standard laundry items only",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  {
    _id: "service_wash_fold_premium",
    name: "Premium Wash & Fold",
    description: "Premium washing with fabric softener and careful folding",
    category: "wash-fold",
    basePrice: 18.0,
    estimatedTime: "24-48 hours",
    requirements: "Quality fabrics and delicate items",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  
  // Dry Cleaning Services
  {
    _id: "service_dry_cleaning_regular",
    name: "Regular Dry Cleaning",
    description: "Professional dry cleaning for suits, dresses, and formal wear",
    category: "dry-cleaning",
    basePrice: 25.0,
    estimatedTime: "3-5 days",
    requirements: "Dry clean only items",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },
  {
    _id: "service_dry_cleaning_express",
    name: "Express Dry Cleaning",
    description: "Same-day dry cleaning for urgent formal wear needs",
    category: "dry-cleaning",
    basePrice: 45.0,
    estimatedTime: "Same day",
    requirements: "Drop off before 10 AM",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },
  {
    _id: "service_dry_cleaning_luxury",
    name: "Luxury Dry Cleaning",
    description: "Premium dry cleaning for designer and luxury garments",
    category: "dry-cleaning",
    basePrice: 55.0,
    estimatedTime: "5-7 days",
    requirements: "High-end fabrics and designer items",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },

  // Ironing & Pressing Services
  {
    _id: "service_ironing_basic",
    name: "Basic Ironing",
    description: "Standard ironing service for everyday clothes",
    category: "ironing",
    basePrice: 8.0,
    estimatedTime: "1-2 days",
    requirements: "Clean, dry clothes only",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/ironing.webp"
  },
  {
    _id: "service_ironing_professional",
    name: "Professional Pressing",
    description: "Professional pressing for business attire and formal wear",
    category: "ironing",
    basePrice: 15.0,
    estimatedTime: "1-2 days",
    requirements: "Business and formal attire",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/ironing.webp"
  },
  {
    _id: "service_steam_pressing",
    name: "Steam Pressing",
    description: "Gentle steam pressing for delicate fabrics",
    category: "ironing",
    basePrice: 20.0,
    estimatedTime: "2-3 days",
    requirements: "Delicate and sensitive fabrics",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/ironing.webp"
  },

  // Stain Removal Services
  {
    _id: "service_stain_removal_basic",
    name: "Basic Stain Removal",
    description: "Treatment for common stains like food, drinks, and dirt",
    category: "stain-removal",
    basePrice: 15.0,
    estimatedTime: "2-3 days",
    requirements: "Fresh stains work best",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/stain removal.jpg"
  },
  {
    _id: "service_stain_removal_advanced",
    name: "Advanced Stain Treatment",
    description: "Specialized treatment for tough stains like oil, blood, and ink",
    category: "stain-removal",
    basePrice: 25.0,
    estimatedTime: "3-5 days",
    requirements: "Specify stain type and how old it is",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/stain removal.jpg"
  },
  {
    _id: "service_stain_removal_restoration",
    name: "Garment Restoration",
    description: "Professional restoration for vintage or damaged garments",
    category: "stain-removal",
    basePrice: 50.0,
    estimatedTime: "1-2 weeks",
    requirements: "Assessment required before treatment",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/stain removal.jpg"
  },

  // Specialty Services
  {
    _id: "service_leather_cleaning",
    name: "Leather Cleaning",
    description: "Professional cleaning and conditioning for leather items",
    category: "specialty",
    basePrice: 35.0,
    estimatedTime: "5-7 days",
    requirements: "Leather jackets, bags, and accessories",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },
  {
    _id: "service_shoe_cleaning",
    name: "Shoe Cleaning & Polish",
    description: "Professional shoe cleaning, polishing, and conditioning",
    category: "specialty",
    basePrice: 20.0,
    estimatedTime: "2-3 days",
    requirements: "All types of shoes except athletic",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  {
    _id: "service_wedding_dress",
    name: "Wedding Dress Cleaning",
    description: "Specialized cleaning and preservation for wedding dresses",
    category: "specialty",
    basePrice: 150.0,
    estimatedTime: "2-3 weeks",
    requirements: "Delicate handling required",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },
  {
    _id: "service_curtain_cleaning",
    name: "Curtain & Drape Cleaning",
    description: "Professional cleaning for curtains, drapes, and window treatments",
    category: "specialty",
    basePrice: 30.0,
    estimatedTime: "3-5 days",
    requirements: "Measure and note fabric type",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  {
    _id: "service_comforter_cleaning",
    name: "Comforter & Bedding",
    description: "Deep cleaning for comforters, quilts, and bulky bedding",
    category: "specialty",
    basePrice: 40.0,
    estimatedTime: "3-5 days",
    requirements: "Check care labels first",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },

  // Express Services
  {
    _id: "service_express_wash",
    name: "Express Wash & Fold",
    description: "Same-day wash and fold service for urgent needs",
    category: "express",
    basePrice: 25.0,
    estimatedTime: "Same day",
    requirements: "Drop off before 10 AM",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  {
    _id: "service_express_ironing",
    name: "Express Ironing",
    description: "Same-day ironing service for business needs",
    category: "express",
    basePrice: 20.0,
    estimatedTime: "4-6 hours",
    requirements: "Maximum 5 items",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/ironing.webp"
  },

  // Eco-Friendly Services
  {
    _id: "service_eco_wash",
    name: "Eco-Friendly Wash",
    description: "Environmentally friendly washing with biodegradable detergents",
    category: "eco-friendly",
    basePrice: 16.0,
    estimatedTime: "24-48 hours",
    requirements: "Standard laundry items",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  {
    _id: "service_organic_dry_clean",
    name: "Organic Dry Cleaning",
    description: "Chemical-free dry cleaning using organic solvents",
    category: "eco-friendly",
    basePrice: 35.0,
    estimatedTime: "3-5 days",
    requirements: "Suitable for sensitive skin",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },

  // Bulk Services
  {
    _id: "service_bulk_laundry",
    name: "Bulk Laundry Service",
    description: "Cost-effective service for large quantities of laundry",
    category: "bulk",
    basePrice: 2.5,
    estimatedTime: "2-3 days",
    requirements: "Minimum 20 lbs",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  {
    _id: "service_commercial_laundry",
    name: "Commercial Laundry",
    description: "Business laundry service for restaurants, hotels, and offices",
    category: "bulk",
    basePrice: 3.0,
    estimatedTime: "24-48 hours",
    requirements: "Business account required",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  }
];

module.exports = { STATIC_SERVICES };
