const currentYear = new Date().getFullYear();

export const YEARS = Array.from({ length: 30 }, (_, index) => String(currentYear - index));

export const MAKES = [
  'Acura',
  'Audi',
  'BMW',
  'Chevrolet',
  'Dodge',
  'Ford',
  'GMC',
  'Honda',
  'Hyundai',
  'Jeep',
  'Kia',
  'Lexus',
  'Mazda',
  'Mercedes-Benz',
  'Nissan',
  'Ram',
  'Subaru',
  'Tesla',
  'Toyota',
  'Volkswagen',
] as const;

export const MODELS_BY_MAKE: Record<string, string[]> = {
  Acura: ['Integra', 'MDX', 'RDX', 'TLX'],
  Audi: ['A3', 'A4', 'Q5', 'Q7'],
  BMW: ['3 Series', '5 Series', 'X3', 'X5'],
  Chevrolet: ['Bolt EV', 'Equinox', 'Malibu', 'Silverado'],
  Dodge: ['Charger', 'Durango', 'Grand Caravan', 'Hornet'],
  Ford: ['Escape', 'Explorer', 'F-150', 'Mustang Mach-E'],
  GMC: ['Acadia', 'Sierra', 'Terrain', 'Yukon'],
  Honda: ['Accord', 'CR-V', 'Civic', 'Pilot'],
  Hyundai: ['Elantra', 'Ioniq 5', 'Santa Fe', 'Tucson'],
  Jeep: ['Cherokee', 'Compass', 'Grand Cherokee', 'Wrangler'],
  Kia: ['Forte', 'Niro', 'Sorento', 'Sportage'],
  Lexus: ['ES', 'NX', 'RX', 'UX'],
  Mazda: ['CX-30', 'CX-5', 'Mazda3', 'Mazda6'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE'],
  Nissan: ['Altima', 'Leaf', 'Rogue', 'Sentra'],
  Ram: ['1500', '2500', 'ProMaster', 'ProMaster City'],
  Subaru: ['Crosstrek', 'Forester', 'Impreza', 'Outback'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y'],
  Toyota: ['Camry', 'Corolla', 'Prius', 'RAV4'],
  Volkswagen: ['Atlas', 'Golf', 'Jetta', 'Tiguan'],
};

function matchesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

export function searchMakes(q: string): string[] {
  const query = q.trim();
  if (!query) return [...MAKES];
  return MAKES.filter((make) => matchesQuery(make, query));
}

export function searchModels(make: string, q: string): string[] {
  const models = MODELS_BY_MAKE[make] ?? [];
  const query = q.trim();
  if (!query) return [...models];
  return models.filter((model) => matchesQuery(model, query));
}
