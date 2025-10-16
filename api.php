<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Cache settings
$cacheFile = __DIR__ . '/sports_cache.json';
$cacheTime = 7200; // 2 hours

// Check cache
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTime)) {
    echo file_get_contents($cacheFile);
    exit;
}

// Fetch from ESPN
function fetchESPN($sport, $league) {
    $url = "https://site.api.espn.com/apis/site/v2/sports/{$sport}/{$league}/scoreboard";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ($httpCode == 200 && $response) ? json_decode($response, true) : null;
}

// Fetch NHL for 5 days
function fetchNHL5Days() {
    $allEvents = [];
    for ($i = 0; $i < 5; $i++) {
        usleep(300000);
        $date = date('Ymd', strtotime("+{$i} days"));
        $url = "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates={$date}";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
        $response = curl_exec($ch);
        curl_close($ch);
        if ($response) {
            $data = json_decode($response, true);
            if (isset($data['events'])) {
                $allEvents = array_merge($allEvents, $data['events']);
            }
        }
    }
    return ['events' => $allEvents];
}

// Fetch CFB with Michigan schools
function fetchCFB() {
    $mainData = fetchESPN('football', 'college-football');
    $allEvents = isset($mainData['events']) ? $mainData['events'] : [];
    
    // Add Michigan and Michigan State schedules
    foreach (['130', '127'] as $teamId) {
        usleep(300000);
        $url = "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/{$teamId}/schedule";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
        $response = curl_exec($ch);
        curl_close($ch);
        if ($response) {
            $data = json_decode($response, true);
            if (isset($data['events'])) {
                $allEvents = array_merge($allEvents, $data['events']);
            }
        }
    }
    
    // Remove duplicates
    $unique = [];
    $ids = [];
    foreach ($allEvents as $event) {
        $id = $event['id'] ?? uniqid();
        if (!in_array($id, $ids)) {
            $unique[] = $event;
            $ids[] = $id;
        }
    }
    
    return ['events' => $unique];
}

// Filter next 3 days
function filterNext3Days($events) {
    if (!$events) return [];
    $now = time();
    $end = $now + (3 * 24 * 60 * 60);
    return array_values(array_filter($events, function($e) use ($now, $end) {
        $t = strtotime($e['date']);
        return $t >= $now && $t <= $end;
    }));
}

// Filter next 7 days
function filterNext7Days($events) {
    if (!$events) return [];
    $now = time();
    $end = $now + (7 * 24 * 60 * 60);
    return array_values(array_filter($events, function($e) use ($now, $end) {
        $t = strtotime($e['date']);
        return $t >= $now && $t <= $end;
    }));
}

// Filter CFB Top 25
function filterCFBTop20($events) {
    if (!$events) return [];
    
    $filtered = array_filter($events, function($event) {
        // Skip if no competitions
        if (!isset($event['competitions'][0])) return false;
        
        $comp = $event['competitions'][0];
        
        // Skip if no competitors
        if (!isset($comp['competitors']) || !is_array($comp['competitors'])) return false;
        
        foreach ($comp['competitors'] as $competitor) {
            $teamId = isset($competitor['team']['id']) ? $competitor['team']['id'] : '';
            $rank = isset($competitor['curatedRank']['current']) ? $competitor['curatedRank']['current'] : 999;
            
            // Include if Top 20 OR Michigan/Michigan State
            if ($rank <= 25 || $teamId == '127' || $teamId == '130') {
                return true;
            }
        }
        return false;
    });
    
    return array_values($filtered);
}

// Get PGA info
function getPGA() {
    $data = fetchESPN('golf', 'pga');
    if ($data && isset($data['events'][0])) {
        $event = $data['events'][0];
        $start = new DateTime($event['date']);
        $dates = $start->format('M j');
        if (isset($event['endDate'])) {
            $end = new DateTime($event['endDate']);
            $dates .= ' - ' . $end->format('M j, Y');
        } else {
            $dates .= ', ' . $start->format('Y');
        }
        return [
            'name' => $event['name'] ?? 'PGA Tournament',
            'location' => $event['competitions'][0]['venue']['fullName'] ?? 'TBD',
            'dates' => $dates
        ];
    }
    return null;
}

try {
    // Fetch everything
    $data = [];
    
    $data['nfl'] = fetchESPN('football', 'nfl');
    usleep(300000);
    
    $data['nhl'] = fetchNHL5Days();
    usleep(300000);
    
    $cfbData = fetchCFB();
    $cfbFiltered = filterNext7Days($cfbData['events'] ?? []);
    $data['cfb'] = ['events' => filterCFBTop20($cfbFiltered)];
    usleep(300000);
    
    $mlbData = fetchESPN('baseball', 'mlb');
    $data['mlb'] = ['events' => filterNext3Days($mlbData['events'] ?? [])];
    usleep(300000);
    
    $data['pga'] = getPGA();
    
    // Save cache
    $json = json_encode($data, JSON_PRETTY_PRINT);
    file_put_contents($cacheFile, $json);
    echo $json;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>