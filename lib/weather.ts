export interface WeatherData {
  location: string
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  feelsLike: number
}

const WEATHER_GOV_HEADERS = {
  Accept: 'application/geo+json',
  'User-Agent': '(ultimategolfcommunity.com, support@ultimategolfcommunity.com)'
}

function mapForecastToIcon(description: string) {
  const value = description.toLowerCase()

  if (value.includes('thunder')) return '11d'
  if (value.includes('snow') || value.includes('sleet') || value.includes('ice')) return '13d'
  if (value.includes('rain') || value.includes('drizzle') || value.includes('shower')) return '10d'
  if (value.includes('fog') || value.includes('mist') || value.includes('haze') || value.includes('smoke')) return '50d'
  if (value.includes('few clouds')) return '02d'
  if (value.includes('partly cloudy')) return '03d'
  if (value.includes('mostly cloudy') || value.includes('cloudy') || value.includes('overcast')) return '04d'
  if (value.includes('sunny') || value.includes('clear')) return '01d'

  return '03d'
}

function parseWindSpeed(value?: string | null) {
  if (!value) return 0
  const matches = value.match(/\d+/g)?.map(Number) || []

  if (matches.length === 0) return 0
  if (matches.length === 1) return matches[0]

  return Math.round(matches.reduce((sum, current) => sum + current, 0) / matches.length)
}

async function getCoordinatesFromCity(city: string) {
  const response = await fetch(
    `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(
      city
    )}&benchmark=Public_AR_Current&format=json`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': WEATHER_GOV_HEADERS['User-Agent']
      },
      next: { revalidate: 3600 }
    }
  )

  if (!response.ok) {
    throw new Error(`Census geocoder error: ${response.status}`)
  }

  const data = await response.json()
  const match = data?.result?.addressMatches?.[0]

  if (!match?.coordinates) {
    throw new Error('No coordinates found for the requested location.')
  }

  return {
    latitude: match.coordinates.y,
    longitude: match.coordinates.x,
    matchedAddress: match.matchedAddress as string
  }
}

export async function getWeatherData(city: string): Promise<WeatherData> {
  const { latitude, longitude, matchedAddress } = await getCoordinatesFromCity(city)

  const pointsResponse = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`, {
    headers: WEATHER_GOV_HEADERS,
    next: { revalidate: 1800 }
  })

  if (!pointsResponse.ok) {
    throw new Error(`weather.gov points error: ${pointsResponse.status}`)
  }

  const pointsData = await pointsResponse.json()
  const hourlyUrl = pointsData?.properties?.forecastHourly

  if (!hourlyUrl) {
    throw new Error('weather.gov did not return an hourly forecast endpoint.')
  }

  const hourlyResponse = await fetch(hourlyUrl, {
    headers: WEATHER_GOV_HEADERS,
    next: { revalidate: 1800 }
  })

  if (!hourlyResponse.ok) {
    throw new Error(`weather.gov hourly forecast error: ${hourlyResponse.status}`)
  }

  const hourlyData = await hourlyResponse.json()
  const period = hourlyData?.properties?.periods?.[0]

  if (!period) {
    throw new Error('weather.gov hourly forecast did not include any periods.')
  }

  const relativeLocation = pointsData?.properties?.relativeLocation?.properties
  const location =
    relativeLocation?.city && relativeLocation?.state
      ? `${relativeLocation.city}, ${relativeLocation.state}`
      : matchedAddress

  return {
    location,
    temperature: Math.round(period.temperature ?? 72),
    description: (period.shortForecast || 'Clear').toLowerCase(),
    icon: mapForecastToIcon(period.shortForecast || ''),
    humidity: Math.round(period.relativeHumidity?.value ?? 60),
    windSpeed: parseWindSpeed(period.windSpeed),
    feelsLike: Math.round(period.temperature ?? 72)
  }
}

export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
}
