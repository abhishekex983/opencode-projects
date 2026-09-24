#!/usr/bin/env python3
"""
Distance Calculator for Job Listings (Fast Version)
Calculates distance from 137 Eglinton Ave West, Toronto to each job location.
Uses known area coordinates as primary method, geocoding as fallback.
"""
import json
import math
import re
from pathlib import Path

# Paths
TMP_DIR = Path(r'F:\Opencode Projects\Resume 2026\.tmp')
INPUT_FILE = TMP_DIR / 'all_jobs_toronto.json'
OUTPUT_FILE = TMP_DIR / 'jobs_with_distance.json'

# Reference point: 137 Eglinton Ave West, Toronto
REFERENCE_LAT = 43.6841
REFERENCE_LNG = -79.3983

# Known Toronto area coordinates (pre-computed, no geocoding needed)
AREA_COORDS = {
    # Toronto neighborhoods
    'midtown': (43.6880, -79.3980),
    'downtown': (43.6532, -79.3832),
    'north york': (43.7615, -79.4111),
    'scarborough': (43.7732, -79.2578),
    'etobicoke': (43.6493, -79.5867),
    'york': (43.6890, -79.4700),
    'east york': (43.6900, -79.3200),
    'the beaches': (43.6764, -79.2940),
    'leslieville': (43.6690, -79.3180),
    'riverside': (43.6680, -79.3300),
    'liberty village': (43.6370, -79.4250),
    'king west': (43.6420, -79.4000),
    'queen west': (43.6440, -79.3950),
    'kensington market': (43.6530, -79.4000),
    'chinatown': (43.6530, -79.4000),
    'little italy': (43.6560, -79.4150),
    'greektown': (43.6760, -79.2840),
    'yonge': (43.6880, -79.3980),
    'eglinton': (43.6841, -79.3983),
    'lawrence park': (43.7180, -79.3940),
    'forest hill': (43.6920, -79.4120),
    'deer park': (43.6870, -79.3950),
    'moore park': (43.6920, -79.3850),
    'summerhill': (43.6850, -79.3900),
    'rosedale': (43.6820, -79.3720),
    'cabbagetown': (43.6650, -79.3700),
    'regent park': (43.6590, -79.3650),
    'st. james town': (43.6620, -79.3700),
    'church village': (43.6680, -79.3820),
    'harbourfront': (43.6380, -79.3820),
    'cityplace': (43.6420, -79.3920),
    'distillery district': (43.6500, -79.3600),
    'corktown': (43.6530, -79.3600),
    'playground estate': (43.6560, -79.3550),
    'st. james town': (43.6620, -79.3700),
    
    # Greater Toronto Area
    'mississauga': (43.5890, -79.6441),
    'brampton': (43.6834, -79.7590),
    'markham': (43.8561, -79.3370),
    'vaughan': (43.8361, -79.5086),
    'richmond hill': (43.8733, -79.4378),
    'oakville': (43.4675, -79.6877),
    'burlington': (43.3256, -79.7990),
    'hamilton': (43.2557, -79.8711),
    'ajax': (43.8509, -79.0204),
    'pickering': (43.8392, -79.0964),
    'whitby': (43.8975, -78.9429),
    'oshawa': (43.8971, -78.8658),
    'newmarket': (44.0592, -79.4613),
    'aurora': (44.0002, -79.4506),
    'king city': (43.9563, -79.5253),
    'woodbridge': (43.7789, -79.5344),
    'thornhill': (43.8163, -79.4353),
    'vaughan': (43.8361, -79.5086),
    'conc': (43.8163, -79.4353),
    
    # Ontario cities
    'kitchener': (43.4516, -80.4925),
    'waterloo': (43.4643, -80.5204),
    'cambridge': (43.3616, -80.3144),
    'guelph': (43.5448, -80.2482),
    'barrie': (44.3894, -79.6903),
    'peterborough': (44.3091, -78.3197),
    'belleville': (44.1628, -77.3832),
    'kingston': (44.2312, -76.4860),
    'london': (42.9849, -81.2453),
    'ottawa': (45.4215, -75.6972),
    'thunder bay': (48.3809, -89.2477),
    'sudbury': (46.4917, -81.0080),
    'windsor': (42.3149, -83.0364),
    'niagara falls': (43.0896, -79.0849),
    'st. catharines': (43.1594, -79.2469),
    'brantford': (43.1394, -80.2644),
    'woodstock': (43.1306, -80.7567),
    'stratford': (43.3700, -80.9822),
    'goderich': (43.7428, -81.7139),
    'sarnia': (42.9745, -82.4066),
    'chatham': (42.4048, -82.1910),
    'cornwall': (45.0182, -74.7282),
    'brockville': (44.5895, -75.6843),
    'milton': (43.5183, -79.8774),
    'halton hills': (43.6300, -79.9500),
    'caledon': (43.8333, -79.8500),
    'east gwillimbury': (44.1000, -79.4333),
    'georgina': (44.3833, -79.4333),
    'uxbridge': (44.1000, -79.1167),
    'scugog': (44.1500, -78.9500),
    'clarington': (43.9350, -78.6086),
    'cobourg': (43.9593, -78.1677),
    'port hope': (43.9443, -78.2984),
    'lindsay': (44.3500, -78.7500),
    'kawartha lakes': (44.3500, -78.7500),
    'collingwood': (44.5000, -80.2167),
    'wasaga beach': (44.5092, -80.0141),
    'orangeville': (43.9167, -80.1000),
    'shelburne': (44.0833, -80.2000),
    'alliston': (44.1500, -79.8667),
    'bradford': (44.1167, -79.5667),
    'innisfil': (44.3167, -79.5833),
    'midland': (44.7500, -79.8833),
    'penetanguishene': (44.7667, -79.9333),
    'orillia': (44.6000, -79.4167),
    'gravenhurst': (44.9167, -79.3667),
    'bracebridge': (45.0333, -79.3000),
    'huntsville': (45.3333, -79.2167),
    'parry sound': (45.3333, -80.0333),
    'north bay': (46.3091, -79.4608),
    'muskoka': (45.0000, -79.5000),
    
    # Remote
    'remote': (0, 0),
    'work from home': (0, 0),
    'wfh': (0, 0),
}

# Postal code prefixes to approximate areas
POSTAL_PREFIXES = {
    'M2N': 'north york',
    'M2M': 'north york',
    'M2J': 'north york',
    'M2K': 'north york',
    'M2P': 'north york',
    'M2R': 'north york',
    'M2S': 'north york',
    'M2T': 'north york',
    'M2V': 'north york',
    'M2W': 'north york',
    'M2X': 'north york',
    'M2Y': 'north york',
    'M2Z': 'north york',
    'M3A': 'north york',
    'M3B': 'north york',
    'M3C': 'north york',
    'M3H': 'north york',
    'M3J': 'north york',
    'M3K': 'north york',
    'M3L': 'north york',
    'M3M': 'north york',
    'M3N': 'north york',
    'M4B': 'east york',
    'M4C': 'east york',
    'M4E': 'the beaches',
    'M4G': 'east york',
    'M4H': 'east york',
    'M4J': 'east york',
    'M4K': 'leslieville',
    'M4L': 'leslieville',
    'M4M': 'leslieville',
    'M4N': 'lawrence park',
    'M4P': 'midtown',
    'M4R': 'midtown',
    'M4S': 'midtown',
    'M4T': 'midtown',
    'M4V': 'midtown',
    'M4W': 'rosedale',
    'M4X': 'cabbagetown',
    'M4Y': 'church village',
    'M5A': 'distillery district',
    'M5B': 'downtown',
    'M5C': 'downtown',
    'M5E': 'harbourfront',
    'M5G': 'downtown',
    'M5H': 'downtown',
    'M5J': 'harbourfront',
    'M5K': 'downtown',
    'M5L': 'downtown',
    'M5M': 'forest hill',
    'M5N': 'forest hill',
    'M5P': 'forest hill',
    'M5R': 'little italy',
    'M5S': 'kensington market',
    'M5T': 'chinatown',
    'M5V': 'cityplace',
    'M5W': 'harbourfront',
    'M5X': 'downtown',
    'M6A': 'north york',
    'M6B': 'north york',
    'M6C': 'forest hill',
    'M6D': 'the junction',
    'M6E': 'crawford-jones',
    'M6G': 'little italy',
    'M6H': 'dufferin grove',
    'M6J': 'liberty village',
    'M6K': 'liberty village',
    'M6L': 'north york',
    'M6M': 'kensington market',
    'M6N': 'the junction',
    'M6P': 'the junction',
    'M6R': 'parkdale',
    'M6S': 'high park',
    'M7A': 'downtown',
    'M7R': 'mississauga',
    'M7V': 'mississauga',
    'M7W': 'mississauga',
    'M8V': 'etobicoke',
    'M8W': 'etobicoke',
    'M8X': 'etobicoke',
    'M8Y': 'etobicoke',
    'M8Z': 'etobicoke',
    'M9A': 'etobicoke',
    'M9B': 'etobicoke',
    'M9C': 'etobicoke',
    'M9L': 'north york',
    'M9M': 'north york',
    'M9N': 'north york',
    'M9P': 'etobicoke',
    'M9R': 'etobicoke',
    'M9V': 'etobicoke',
    'M9W': 'etobicoke',
    'L0J': 'vaughan',
    'L0K': 'ontario',
    'L0L': 'ontario',
    'L0M': 'ontario',
    'L0N': 'ontario',
    'L0P': 'ontario',
    'L0R': 'ontario',
    'L0S': 'ontario',
    'L0T': 'ontario',
    'L0V': 'ontario',
    'L0W': 'ontario',
    'L0X': 'ontario',
    'L1A': 'ontario',
    'L1B': 'ontario',
    'L1C': 'ontario',
    'L1E': 'ontario',
    'L1G': 'ontario',
    'L1H': 'ontario',
    'L1J': 'ontario',
    'L1K': 'ontario',
    'L1L': 'ontario',
    'L1M': 'ontario',
    'L1N': 'ontario',
    'L1P': 'ontario',
    'L1R': 'ontario',
    'L1S': 'ontario',
    'L1T': 'ontario',
    'L1V': 'ontario',
    'L1W': 'ontario',
    'L1X': 'ontario',
    'L1Y': 'ontario',
    'L1Z': 'ontario',
    'L2A': 'ontario',
    'L2B': 'ontario',
    'L2C': 'ontario',
    'L2E': 'ontario',
    'L2H': 'ontario',
    'L2J': 'ontario',
    'L2K': 'ontario',
    'L2L': 'ontario',
    'L2M': 'ontario',
    'L2N': 'ontario',
    'L2P': 'ontario',
    'L2R': 'ontario',
    'L2S': 'ontario',
    'L2T': 'ontario',
    'L2V': 'ontario',
    'L2W': 'ontario',
    'L3A': 'ontario',
    'L3B': 'ontario',
    'L3C': 'ontario',
    'L3P': 'ontario',
    'L3R': 'ontario',
    'L3S': 'ontario',
    'L3T': 'ontario',
    'L3V': 'ontario',
    'L3W': 'ontario',
    'L3X': 'ontario',
    'L3Y': 'ontario',
    'L3Z': 'ontario',
    'L4A': 'ontario',
    'L4B': 'ontario',
    'L4C': 'ontario',
    'L4E': 'ontario',
    'L4H': 'ontario',
    'L4J': 'ontario',
    'L4K': 'ontario',
    'L4L': 'ontario',
    'L4M': 'ontario',
    'L4N': 'ontario',
    'L4P': 'ontario',
    'L4R': 'ontario',
    'L4S': 'ontario',
    'L4T': 'ontario',
    'L4V': 'ontario',
    'L4W': 'ontario',
    'L4X': 'ontario',
    'L4Y': 'ontario',
    'L4Z': 'ontario',
    'L5A': 'mississauga',
    'L5B': 'mississauga',
    'L5C': 'mississauga',
    'L5E': 'mississauga',
    'L5G': 'mississauga',
    'L5H': 'mississauga',
    'L5J': 'mississauga',
    'L5K': 'mississauga',
    'L5L': 'mississauga',
    'L5M': 'mississauga',
    'L5N': 'mississauga',
    'L5R': 'mississauga',
    'L5S': 'mississauga',
    'L5T': 'mississauga',
    'L5V': 'mississauga',
    'L5W': 'mississauga',
    'L6A': 'ontario',
    'L6B': 'ontario',
    'L6C': 'ontario',
    'L6E': 'ontario',
    'L6G': 'ontario',
    'L6H': 'ontario',
    'L6J': 'ontario',
    'L6K': 'ontario',
    'L6L': 'ontario',
    'L6M': 'ontario',
    'L6P': 'ontario',
    'L6R': 'ontario',
    'L6S': 'ontario',
    'L6T': 'ontario',
    'L6V': 'ontario',
    'L6W': 'ontario',
    'L6X': 'ontario',
    'L6Y': 'ontario',
    'L6Z': 'ontario',
    'L7A': 'ontario',
    'L7C': 'ontario',
    'L7E': 'ontario',
    'L7G': 'ontario',
    'L7J': 'ontario',
    'L7K': 'ontario',
    'L7L': 'ontario',
    'L7M': 'ontario',
    'L7N': 'ontario',
    'L7P': 'ontario',
    'L7R': 'ontario',
    'L7S': 'ontario',
    'L7T': 'ontario',
    'L7V': 'ontario',
    'L7W': 'ontario',
    'L7X': 'ontario',
    'L7Y': 'ontario',
    'L7Z': 'ontario',
    'L8A': 'ontario',
    'L8B': 'ontario',
    'L8E': 'ontario',
    'L8H': 'ontario',
    'L8J': 'ontario',
    'L8K': 'ontario',
    'L8L': 'ontario',
    'L8M': 'ontario',
    'L8N': 'ontario',
    'L8P': 'ontario',
    'L8R': 'ontario',
    'L8S': 'ontario',
    'L8T': 'ontario',
    'L8V': 'ontario',
    'L8W': 'ontario',
    'L9A': 'ontario',
    'L9C': 'ontario',
    'L9H': 'ontario',
    'L9K': 'ontario',
    'L9L': 'ontario',
    'L9M': 'ontario',
    'L9N': 'ontario',
    'L9P': 'ontario',
    'L9R': 'ontario',
    'L9S': 'ontario',
    'L9T': 'ontario',
    'L9V': 'ontario',
    'L9W': 'ontario',
    'L9X': 'ontario',
    'L9Y': 'ontario',
    'L9Z': 'ontario',
}


def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def is_remote(job):
    """Check if job is remote."""
    loc = job.get('location', '').lower()
    desc = job.get('description', '').lower()
    return 'remote' in loc or 'work from home' in desc or 'wfh' in desc


def is_hybrid(job):
    """Check if job is hybrid."""
    loc = job.get('location', '').lower()
    desc = job.get('description', '').lower()
    return 'hybrid' in loc or 'hybrid' in desc


def extract_postal_code(location):
    """Extract Canadian postal code from location string."""
    match = re.search(r'[MmLl]\d[A-Za-z]\s?\d[A-Za-z]\d', location)
    if match:
        return match.group(0).replace(' ', '').upper()
    return None


def get_area_from_postal(postal_code):
    """Get area name from postal code prefix."""
    prefix = postal_code[:3]
    return POSTAL_PREFIXES.get(prefix, None)


def get_area_from_text(location):
    """Extract area name from location text."""
    loc = location.lower()
    for area in AREA_COORDS:
        if area in loc:
            return area
    return None


def calculate_distance(job):
    """Calculate distance from reference point to job location."""
    # Remote jobs = 0 distance
    if is_remote(job):
        return 0, 'Remote (WFH)'
    
    location = job.get('location', '')
    
    # Try postal code first (most accurate)
    postal = extract_postal_code(location)
    if postal:
        area = get_area_from_postal(postal)
        if area and area in AREA_COORDS:
            lat, lng = AREA_COORDS[area]
            dist = haversine(REFERENCE_LAT, REFERENCE_LNG, lat, lng)
            return round(dist, 1), f'{area.title()} ({postal})'
    
    # Try area name from text
    area = get_area_from_text(location)
    if area and area in AREA_COORDS:
        lat, lng = AREA_COORDS[area]
        dist = haversine(REFERENCE_LAT, REFERENCE_LNG, lat, lng)
        return round(dist, 1), area.title()
    
    # Generic Toronto
    if 'toronto' in location.lower():
        return 10.0, 'Toronto (generic)'
    
    return None, 'Unknown'


def estimate_commute(distance_km, hybrid):
    """Estimate commute time based on distance."""
    if distance_km == 0:
        return 'N/A (Remote)'
    
    driving_speed = 30  # km/h city average
    transit_speed = 20  # km/h TTC average
    
    driving_min = int((distance_km / driving_speed) * 60)
    transit_min = int((distance_km / transit_speed) * 60)
    
    if hybrid:
        return f'~{driving_min}min drive / ~{transit_min}min transit (2-3 days/wk)'
    else:
        return f'~{driving_min}min drive / ~{transit_min}min transit'


def main():
    # Load jobs
    if not INPUT_FILE.exists():
        print(f'ERROR: {INPUT_FILE} not found. Run scrape_toronto_focused.py first.')
        return
    
    data = json.loads(INPUT_FILE.read_text(encoding='utf-8'))
    jobs = data.get('jobs', [])
    print(f'Loaded {len(jobs)} jobs')
    
    # Calculate distances
    print('\n=== Calculating distances from 137 Eglinton Ave West ===')
    for i, job in enumerate(jobs):
        distance, method = calculate_distance(job)
        job['distance_km'] = distance
        job['distance_method'] = method
        
        hybrid = is_hybrid(job)
        job['commute_estimate'] = estimate_commute(distance if distance else 0, hybrid)
        job['work_type'] = 'Remote' if is_remote(job) else ('Hybrid' if hybrid else 'Onsite')
        
        print(f'  [{i+1}/{len(jobs)}] {job["title"][:40]:40s} | {distance} km | {method}')
    
    # Sort by distance (None last)
    jobs.sort(key=lambda x: (x['distance_km'] is None, x['distance_km'] or 999))
    
    # Save
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({'total': len(jobs), 'jobs': jobs}, f, indent=2, ensure_ascii=False)
    
    print(f'\nSaved {len(jobs)} jobs with distance to {OUTPUT_FILE}')
    
    # Summary
    remote = [j for j in jobs if j['work_type'] == 'Remote']
    close = [j for j in jobs if j['distance_km'] is not None and 0 < j['distance_km'] <= 10]
    medium = [j for j in jobs if j['distance_km'] is not None and 10 < j['distance_km'] <= 25]
    far = [j for j in jobs if j['distance_km'] is not None and j['distance_km'] > 25]
    unknown = [j for j in jobs if j['distance_km'] is None]
    
    print(f'\n=== Summary ===')
    print(f'Remote (WFH): {len(remote)}')
    print(f'Close (0-10 km): {len(close)}')
    print(f'Medium (10-25 km): {len(medium)}')
    print(f'Far (>25 km): {len(far)}')
    print(f'Unknown: {len(unknown)}')


if __name__ == '__main__':
    main()
