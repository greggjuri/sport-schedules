# 🏆 Sports Schedule Dashboard

A real-time sports aggregation dashboard that consolidates upcoming games from NFL, NHL, College Football, MLB, and PGA Tour into one clean, responsive interface.

![Sports Dashboard](https://img.shields.io/badge/PHP-7.4+-777BB4?style=flat&logo=php&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Status](https://img.shields.io/badge/Status-Active-success)

## 🎯 Features

- **Multi-Sport Coverage**: NFL, NHL, College Football (CFB), MLB, and PGA Tour
- **Smart Filtering**: 
  - NFL: Current week games
  - CFB: Top 25 teams + Michigan schools
  - NHL: Next 5 days
  - MLB: Next 3 days
- **Favorite Team Highlighting**: Automatically highlights games featuring your favorite teams
- **Live Stats**: NFL team records and player leaders (passing, rushing, receiving)
- **Direct Links**: Click NFL game cards to view full game details on NFL.com
- **Intelligent Caching**: 2-hour server-side cache for optimal performance
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- PHP 7.4 or higher
- cURL extension enabled
- Web server (Apache, Nginx, or PHP built-in server)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/greggjuri/sports-schedule.git
   cd sports-schedule
   ```

2. **Ensure directory is writable** (for cache file)
   ```bash
   chmod 755 .
   ```

3. **Start the server**
   
   For development:
   ```bash
   php -S localhost:8000
   ```
   
   Then open `http://localhost:8000` in your browser.

4. **Configure favorite teams** (optional)
   
   Edit `index.html` and modify the `FAVORITE_TEAMS` array:
   ```javascript
   const FAVORITE_TEAMS = [
       'Detroit Lions',
       'Tampa Bay Buccaneers',
       'Tampa Bay Lightning',
       'Michigan Wolverines',
       'Detroit Tigers'
       // Add your teams here
   ];
   ```

## 📁 Project Structure

```
sports-schedule/
├── index.html          # Main dashboard interface
├── api.php            # Backend API that fetches and caches sports data
├── test.php           # PHP environment test script
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## 🔧 Configuration

### Cache Settings

Modify cache duration in `api.php`:
```php
$cacheTime = 7200; // 2 hours in seconds
```

### Client-Side Refresh

Adjust auto-refresh interval in `index.html`:
```javascript
setInterval(fetchSportsData, 12 * 60 * 60 * 1000); // 12 hours
```

## 🛠️ Technical Details

### Backend (api.php)

- **Data Source**: ESPN public APIs
- **Caching**: File-based JSON cache with configurable TTL
- **Rate Limiting**: Built-in delays between API calls (300ms)
- **Error Handling**: Graceful fallbacks and error responses
- **CORS**: Enabled for cross-origin requests

### Frontend (index.html)

- **Pure JavaScript**: No framework dependencies
- **Async/Await**: Modern promise-based data fetching
- **Responsive Grid**: CSS Grid for adaptive two-column layout
- **Auto-refresh**: Periodic data updates without page reload

### Data Processing

- **NFL**: Fetches current week with team records and player leaders
- **NHL**: Aggregates 5 days of games from multiple API calls
- **CFB**: Combines Top 25 rankings with Michigan school schedules
- **MLB**: Filters games within 3-day window
- **PGA**: Displays current/upcoming tournament information

## 🎨 Customization

### Styling

All styles are contained in `<style>` tags in `index.html`. Key customization points:

- **Color scheme**: Modify gradient in `body` background
- **Card styling**: Adjust `.game-card` and `.favorite-game` classes
- **Sport logos**: Update `SPORT_LOGOS` object with custom image URLs

### Adding More Sports

1. Add API call in `api.php`:
   ```php
   $data['nba'] = fetchESPN('basketball', 'nba');
   ```

2. Add logo in `index.html`:
   ```javascript
   nba: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png'
   ```

3. Add display section:
   ```javascript
   if (data.nba && data.nba.events) {
       leftColumn += createSportSection('nba', 'NBA', data.nba.events, 'Today');
   }
   ```

## 🧪 Testing

Test your PHP environment:
```bash
php test.php
```

Or visit `http://localhost:8000/test.php` in your browser.

Expected output:
```json
{
    "status": "PHP is working",
    "time": "2025-10-16 12:00:00",
    "curl_available": "Yes",
    "can_write": "Yes"
}
```

## 📝 API Response Structure

The `api.php` returns JSON in this format:
```json
{
    "nfl": { "events": [...] },
    "nhl": { "events": [...] },
    "cfb": { "events": [...] },
    "mlb": { "events": [...] },
    "pga": { "name": "...", "location": "...", "dates": "..." }
}
```

## 🐛 Troubleshooting

### Cache file not updating
- Check directory write permissions
- Verify `sports_cache.json` is not read-only
- Delete cache file manually to force refresh

### No games showing
- Check browser console for errors
- Verify ESPN APIs are accessible
- Test with `test.php` to ensure cURL is working

### Styling issues
- Clear browser cache
- Check for JavaScript errors in console
- Verify all CSS is loading properly

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Sports data provided by [ESPN APIs](https://www.espn.com/)
- Team logos courtesy of ESPN CDN
- Built for sports fans who want a single dashboard for all their games

## 📧 Contact

Juri Gregg - [Juri's GitHub](https://github.com/greggjuri)

Project Link: [https://github.com/greggjuri/sports-schedule](https://github.com/greggjuri/sports-schedule)

---

**Note**: This project uses publicly available ESPN APIs. Please respect their rate limits and terms of service.