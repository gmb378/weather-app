// Boom.js
// Grab the input and button elements
const searchInput = document.getElementById('searchCity');
const searchBtn   = document.getElementById('searchBtn');

const apiKey = '87dcd9c5ee1b490da0b23554251504';
const baseUrl = 'https://api.weatherapi.com/v1/forecast.json';

// Simple validation: letters/spaces OR 5-digit zip
function isValidLocation(loc) {
  return /^[a-zA-Z\s]+$/.test(loc) || /^\d{5}$/.test(loc);
}

// Fetch weather data (7-day) for a given location
function fetchWeatherData(location) {
  const url = `${baseUrl}?key=${apiKey}&q=${encodeURIComponent(location)}&days=7&aqi=no&alerts=no`;

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not OK');
      return response.json();
    })
    .then(data => {
      console.log('Weather Data:', data);
      updateCurrentWeather(data);
      updateHourlyForecast(data);
      updateWeeklyForecast(data);
    })
    .catch(err => {
      console.error('Fetch Error:', err);
      alert('Failed to retrieve weather data.');
    });
}

// Populate current conditions panel
function updateCurrentWeather(data) {
  const { location, current, forecast } = data;
  const { temp_f, condition, humidity, wind_mph, feelslike_f, uv } = current;

  document.getElementById('cityName').textContent = location.name;
  document.getElementById('conditionText').innerHTML = `Condition: <span>${condition.text}</span>`;

  // daily chance of rain from forecast data
  const rainChance = forecast.forecastday[0].day.daily_chance_of_rain;
  document.getElementById('chanceOfRain').innerHTML = `Chance of Rain: <span>${rainChance}%</span>`;

  document.getElementById('temperature').textContent = `${Math.round(temp_f)}°F`;

  const iconEl = document.getElementById('currentIcon');
  if (condition.icon) {
    iconEl.src = `https:${condition.icon}`;
    iconEl.style.display = 'block';
  } else {
    iconEl.style.display = 'none';
  }

  document.getElementById('realFeel').textContent = `${Math.round(feelslike_f)}°F`;
  document.getElementById('humidity').textContent = `${humidity}%`;
  document.getElementById('windSpeed').textContent = `${wind_mph} mph`;
  document.getElementById('uvIndex').textContent = uv;
}

// Build the hourly snapshot (6 AM, 9 AM, 12 PM, 3 PM, 6 PM)
function updateHourlyForecast(data) {
  const container = document.getElementById('todayHourly');
  container.innerHTML = '';

  const hours = data.forecast.forecastday[0].hour;
  [6,9,12,15,18].forEach(h => {
    const hData = hours[h];
    if (!hData) return;

    const div = document.createElement('div');
    div.classList.add('hour');

    const time = document.createElement('p');
    const label = h === 0 ? '12 AM'
      : h < 12   ? `${h} AM`
      : h === 12 ? '12 PM'
      : `${h-12} PM`;
    time.textContent = label;

    const img = document.createElement('img');
    img.src = `https:${hData.condition.icon}`;
    img.alt = hData.condition.text;
    img.style.width = '30px';

    const temp = document.createElement('p');
    temp.textContent = `${Math.round(hData.temp_f)}°F`;

    div.append(time, img, temp);
    container.appendChild(div);
  });
}

// Build the seven-day column
function updateWeeklyForecast(data) {
  const list = document.getElementById('forecastList');
  list.innerHTML = '';

  data.forecast.forecastday.forEach(day => {
    const el = document.createElement('div');
    el.classList.add('forecast-day');

    const date = new Date(day.date);
    const weekday = new Intl.DateTimeFormat('en-US', { weekday:'short' }).format(date);

    el.innerHTML = `
      <div>${weekday} (${day.date})</div>
      <div>${day.day.condition.text}</div>
      <div>High: ${Math.round(day.day.maxtemp_f)}°F</div>
      <div>Low:  ${Math.round(day.day.mintemp_f)}°F</div>
      <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" width="32">
    `;
    list.appendChild(el);
  });
}

// When “Search” is clicked: validate → save → fetch
searchBtn.addEventListener('click', () => {
  const city = searchInput.value.trim();
  if (!isValidLocation(city)) {
    alert('Please enter a valid city name or 5-digit ZIP code.');
    return;
  }
  localStorage.setItem('savedLocation', city);
  fetchWeatherData(city);
});

// On load: pull last location from localStorage
window.addEventListener('load', () => {
  const saved = localStorage.getItem('savedLocation');
  if (saved) {
    searchInput.value = saved;
    fetchWeatherData(saved);
  }
});
