const { requestJson } = require('./http');

const PLACES_FIELD_MASK = [
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.primaryType',
  'places.websiteUri',
  'places.regularOpeningHours',
  'places.editorialSummary',
  'places.photos',
  'places.location',
  'places.priceLevel',
  'places.paymentOptions',
  'places.parkingOptions',
  'places.accessibilityOptions',
  'places.goodForChildren',
  'places.goodForGroups',
  'places.reservable',
  'places.businessStatus',
  'places.nationalPhoneNumber',
  'places.shortFormattedAddress',
].join(',');

function kgKey() {
  const k = process.env.GOOGLE_KG_API_KEY;
  if (!k) throw new Error('GOOGLE_KG_API_KEY missing from environment');
  return k;
}

function placesKey() {
  const k = process.env.GOOGLE_PLACES_API_KEY;
  if (!k) throw new Error('GOOGLE_PLACES_API_KEY missing from environment');
  return k;
}

async function kgSearch(query, { limit = 1, timeoutMs = 15000 } = {}) {
  const qs = new URLSearchParams({ query, limit: String(limit), key: kgKey() }).toString();
  return requestJson({
    method: 'GET',
    url: 'https://kgsearch.googleapis.com/v1/entities:search?' + qs,
    timeoutMs,
  });
}

async function placesTextSearch(textQuery, { fieldMask = PLACES_FIELD_MASK, timeoutMs = 20000 } = {}) {
  return requestJson({
    method: 'POST',
    url: 'https://places.googleapis.com/v1/places:searchText',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': placesKey(),
      'X-Goog-FieldMask': fieldMask,
    },
    body: { textQuery },
    timeoutMs,
  });
}

async function geocode(address, { timeoutMs = 10000 } = {}) {
  const qs = new URLSearchParams({ address, key: kgKey() }).toString();
  return requestJson({
    method: 'GET',
    url: 'https://maps.googleapis.com/maps/api/geocode/json?' + qs,
    timeoutMs,
  });
}

module.exports = { kgSearch, placesTextSearch, geocode, PLACES_FIELD_MASK };
