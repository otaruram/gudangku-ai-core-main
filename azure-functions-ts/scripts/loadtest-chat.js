import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://func-geosupplyguard-ts.azurewebsites.net';
const TOKEN = __ENV.SUPABASE_JWT || '';
const QUESTION = __ENV.QUESTION || 'What is EOQ and how should I use it for small warehouse decisions?';

if (!TOKEN) {
  throw new Error('SUPABASE_JWT is required');
}

export const options = {
  scenarios: {
    warmup: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '30s', target: 10 },
      ],
      gracefulRampDown: '10s',
    },
    sustained: {
      executor: 'constant-vus',
      vus: 25,
      duration: '2m',
      startTime: '1m',
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '20s', target: 50 },
        { duration: '20s', target: 100 },
        { duration: '20s', target: 20 },
      ],
      startTime: '3m10s',
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.03'],
    http_req_duration: ['p(95)<3000', 'p(99)<6000'],
  },
};

export default function () {
  const payload = JSON.stringify({ question: QUESTION });
  const res = http.post(`${BASE_URL}/api/chat`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    timeout: '30s',
  });

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'response has body': (r) => !!r.body,
  });

  sleep(1);
}
