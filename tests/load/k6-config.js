/**
 * k6 Load Testing Configuration
 *
 * Recording Studio Manager - Multi-Region Load Tests
 *
 * Install k6:
 *   brew install k6
 *   # or: https://k6.io/docs/getting-started/installation/
 *
 * Run tests:
 *   k6 run tests/load/k6-config.js
 *   k6 run --vus 50 --duration 5m tests/load/k6-config.js
 *   k6 run --out json=results.json tests/load/k6-config.js
 *
 * Environment variables:
 *   K6_BASE_URL - API base URL (default: http://localhost:3001)
 *   K6_AUTH_TOKEN - JWT token for authenticated requests
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// =============================================================================
// Configuration
// =============================================================================

const BASE_URL = __ENV.K6_BASE_URL || "http://localhost:3001";
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN || "";

// Custom metrics
const errorRate = new Rate("errors");
const requestDuration = new Trend("request_duration");
const healthCheckDuration = new Trend("health_check_duration");
const authDuration = new Trend("auth_duration");
const crudDuration = new Trend("crud_duration");

// Test scenarios
export const options = {
  scenarios: {
    // Smoke test: Verify basic functionality
    smoke: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
      tags: { test_type: "smoke" },
      exec: "smokeTest",
    },

    // Load test: Normal expected load
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 20 }, // Ramp up to 20 users
        { duration: "5m", target: 20 }, // Stay at 20 users
        { duration: "2m", target: 50 }, // Ramp up to 50 users
        { duration: "5m", target: 50 }, // Stay at 50 users
        { duration: "2m", target: 0 },  // Ramp down
      ],
      tags: { test_type: "load" },
      exec: "loadTest",
      startTime: "35s", // Start after smoke test
    },

    // Stress test: Beyond normal capacity
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 50 },
        { duration: "3m", target: 100 },
        { duration: "3m", target: 150 },
        { duration: "5m", target: 200 },
        { duration: "2m", target: 0 },
      ],
      tags: { test_type: "stress" },
      exec: "stressTest",
      startTime: "17m", // Start after load test
    },

    // Spike test: Sudden traffic surge
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "30s", target: 200 }, // Spike!
        { duration: "1m", target: 200 },
        { duration: "30s", target: 10 },
        { duration: "30s", target: 0 },
      ],
      tags: { test_type: "spike" },
      exec: "spikeTest",
      startTime: "32m", // Start after stress test
    },

    // Soak test: Extended duration (run separately)
    // soak: {
    //   executor: "constant-vus",
    //   vus: 30,
    //   duration: "4h",
    //   tags: { test_type: "soak" },
    //   exec: "soakTest",
    // },
  },

  thresholds: {
    // HTTP errors should be less than 1%
    http_req_failed: ["rate<0.01"],
    // 95% of requests should be below 500ms
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    // Custom metrics thresholds
    errors: ["rate<0.05"],
    health_check_duration: ["p(95)<100"],
    auth_duration: ["p(95)<300"],
    crud_duration: ["p(95)<400"],
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

function getHeaders(authenticated = false) {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  if (authenticated && AUTH_TOKEN) {
    headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;
  }

  return headers;
}

function tRPCCall(procedure, input = null, authenticated = false) {
  const url = `${BASE_URL}/api/trpc/${procedure}`;
  const params = { headers: getHeaders(authenticated) };

  let response;
  if (input !== null) {
    // Mutation (POST)
    response = http.post(url, JSON.stringify(input), params);
  } else {
    // Query (GET)
    response = http.get(url, params);
  }

  return response;
}

function checkResponse(response, name) {
  const success = check(response, {
    [`${name} - status is 200`]: (r) => r.status === 200,
    [`${name} - response time < 500ms`]: (r) => r.timings.duration < 500,
    [`${name} - has body`]: (r) => r.body && r.body.length > 0,
  });

  errorRate.add(!success);
  requestDuration.add(response.timings.duration);

  return success;
}

// =============================================================================
// Test Scenarios
// =============================================================================

export function smokeTest() {
  group("Smoke Test - Health Checks", () => {
    // Health endpoint
    const healthRes = http.get(`${BASE_URL}/health`);
    const healthSuccess = check(healthRes, {
      "health check status 200": (r) => r.status === 200,
    });
    healthCheckDuration.add(healthRes.timings.duration);
    errorRate.add(!healthSuccess);

    sleep(1);

    // Monitoring ping
    const pingRes = tRPCCall("monitoring.ping");
    checkResponse(pingRes, "monitoring.ping");

    sleep(1);

    // Region info
    const regionRes = tRPCCall("region.getCurrent");
    checkResponse(regionRes, "region.getCurrent");
  });

  sleep(2);
}

export function loadTest() {
  group("Load Test - Mixed Workload", () => {
    // 40% - Read operations (queries)
    if (Math.random() < 0.4) {
      group("Read Operations", () => {
        const regionRes = tRPCCall("region.getAll");
        checkResponse(regionRes, "region.getAll");

        const currencyRes = tRPCCall("currency.getSupportedCurrencies");
        checkResponse(currencyRes, "currency.getSupportedCurrencies");

        crudDuration.add(regionRes.timings.duration);
      });
    }

    // 30% - Health/Monitoring checks
    if (Math.random() < 0.3) {
      group("Health Monitoring", () => {
        const healthRes = http.get(`${BASE_URL}/health`);
        checkResponse(healthRes, "health");
        healthCheckDuration.add(healthRes.timings.duration);

        const metricsRes = tRPCCall("monitoring.health");
        checkResponse(metricsRes, "monitoring.health");
      });
    }

    // 20% - Auth operations (if token available)
    if (Math.random() < 0.2 && AUTH_TOKEN) {
      group("Authenticated Operations", () => {
        const meRes = tRPCCall("auth.me", null, true);
        const success = check(meRes, {
          "auth.me status 200 or 401": (r) => r.status === 200 || r.status === 401,
        });
        authDuration.add(meRes.timings.duration);
        errorRate.add(!success);
      });
    }

    // 10% - Region routing
    if (Math.random() < 0.1) {
      group("Geo Routing", () => {
        const optimalRes = tRPCCall("region.getOptimal?input=%7B%22countryCode%22%3A%22US%22%7D");
        checkResponse(optimalRes, "region.getOptimal");

        const countryRes = tRPCCall("region.getForCountry?input=%7B%22countryCode%22%3A%22FR%22%7D");
        checkResponse(countryRes, "region.getForCountry");
      });
    }
  });

  sleep(Math.random() * 3 + 1); // 1-4 seconds between iterations
}

export function stressTest() {
  group("Stress Test - High Load", () => {
    // Rapid fire health checks
    for (let i = 0; i < 3; i++) {
      const healthRes = http.get(`${BASE_URL}/health`);
      checkResponse(healthRes, `health-${i}`);
      healthCheckDuration.add(healthRes.timings.duration);
    }

    // Multiple concurrent API calls
    const responses = http.batch([
      ["GET", `${BASE_URL}/api/trpc/region.getCurrent`, null, { headers: getHeaders() }],
      ["GET", `${BASE_URL}/api/trpc/region.getAll`, null, { headers: getHeaders() }],
      ["GET", `${BASE_URL}/api/trpc/monitoring.ping`, null, { headers: getHeaders() }],
    ]);

    responses.forEach((res, idx) => {
      checkResponse(res, `batch-${idx}`);
    });
  });

  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

export function spikeTest() {
  group("Spike Test - Burst Traffic", () => {
    // Simulate burst of requests
    const responses = http.batch([
      ["GET", `${BASE_URL}/health`, null, {}],
      ["GET", `${BASE_URL}/api/trpc/monitoring.ping`, null, { headers: getHeaders() }],
      ["GET", `${BASE_URL}/api/trpc/region.getCurrent`, null, { headers: getHeaders() }],
      ["GET", `${BASE_URL}/api/trpc/region.getAll`, null, { headers: getHeaders() }],
      ["GET", `${BASE_URL}/api/trpc/currency.getSupportedCurrencies`, null, { headers: getHeaders() }],
    ]);

    let allSuccess = true;
    responses.forEach((res, idx) => {
      const success = check(res, {
        [`spike-${idx} status ok`]: (r) => r.status === 200,
      });
      if (!success) allSuccess = false;
      requestDuration.add(res.timings.duration);
    });

    errorRate.add(!allSuccess);
  });

  sleep(Math.random() + 0.5); // 0.5-1.5 seconds
}

export function soakTest() {
  // Similar to load test but for extended duration
  loadTest();
}

// =============================================================================
// Lifecycle Hooks
// =============================================================================

export function setup() {
  console.log(`Starting load tests against: ${BASE_URL}`);
  console.log(`Auth token: ${AUTH_TOKEN ? "provided" : "not provided"}`);

  // Verify server is reachable
  const response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`Server not reachable: ${response.status}`);
  }

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load tests completed in ${duration.toFixed(2)} seconds`);
}

// =============================================================================
// Default function (for simple runs)
// =============================================================================

export default function () {
  loadTest();
}
