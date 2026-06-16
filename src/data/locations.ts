export type CountryLocationOption = {
  name: string
  states: string[]
}

export const NIGERIA_COUNTRY = 'Nigeria'

export const nigeriaStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

export const nigeriaProfileLocationOptions = nigeriaStates.map((state) => `${state}, ${NIGERIA_COUNTRY}`)

export const countryLocationOptions: CountryLocationOption[] = [
  {
    name: NIGERIA_COUNTRY,
    states: nigeriaStates,
  },
]

export const getStatesForCountry = (country: string) =>
  countryLocationOptions.find((option) => option.name === country)?.states ?? []
