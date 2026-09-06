export type MobileWeatherData = {
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

function mapWeatherCode(code?: number | null) {
  if (code === 0) return 'clear sky'
  if (code === 1 || code === 2) return 'partly cloudy'
  if (code === 3) return 'overcast'
  if ([45, 48].includes(code || -1)) return 'foggy'
  if ([51, 53, 55, 56, 57].includes(code || -1)) return 'drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code || -1)) return 'rain'
  if ([71, 73, 75, 77, 85, 86].includes(code || -1)) return 'snow'
  if ([95, 96, 99].includes(code || -1)) return 'thunderstorms'
  return 'current conditions'
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
      }
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
    latitude: match.coordinates.y as number,
    longitude: match.coordinates.x as number,
    matchedAddress: match.matchedAddress as string
  }
}

export async function getMobileWeatherAtCoordinates(
  latitude: number,
  longitude: number,
  fallbackLocation = 'Current location'
): Promise<MobileWeatherData> {
  const currentResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
  )

  if (currentResponse.ok) {
    const current = (await currentResponse.json())?.current

    if (typeof current?.temperature_2m === 'number') {
      const description = mapWeatherCode(current.weather_code)
      return {
        location: fallbackLocation,
        temperature: Math.round(current.temperature_2m),
        description,
        icon: mapForecastToIcon(description),
        humidity: Math.round(current.relative_humidity_2m ?? 0),
        windSpeed: Math.round(current.wind_speed_10m ?? 0),
        feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m)
      }
    }
  }

  // Open-Meteo provides observed current conditions. weather.gov remains a
  // real-data fallback in case that request is temporarily unavailable.
  const pointsResponse = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`, {
    headers: WEATHER_GOV_HEADERS
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
    headers: WEATHER_GOV_HEADERS
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
      : fallbackLocation

  return {
    location,
    temperature: Math.round(period.temperature ?? 72),
    description: (period.shortForecast || 'Clear').toLowerCase(),
    icon: mapForecastToIcon(period.shortForecast || ''),
    humidity: Math.round(period.relativeHumidity?.value ?? 60),
    windSpeed: parseWindSpeed(period.windSpeed),
    feelsLike: Math.round(period.temperature ?? 72)
  } satisfies MobileWeatherData
}

export async function getMobileWeather(city: string): Promise<MobileWeatherData> {
  const { latitude, longitude, matchedAddress } = await getCoordinatesFromCity(city)
  return getMobileWeatherAtCoordinates(latitude, longitude, matchedAddress)
}
