#!/usr/bin/env node
import {
  Logger
} from "./chunk-MODRFN3K.js";

// src/cli.ts
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// src/tools/maps/searchNearby.ts
import { z } from "zod";

// src/services/toolclass.ts
import { Client, Language } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";
dotenv.config();
function extractErrorMessage(error) {
  const apiError = error?.response?.data?.error_message;
  const statusCode = error?.response?.status;
  if (apiError) {
    return `${apiError} (HTTP ${statusCode})`;
  }
  return error instanceof Error ? error.message : String(error);
}
var GoogleMapsTools = class {
  constructor(apiKey) {
    this.defaultLanguage = Language.en;
    this.client = new Client({});
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("Google Maps API Key is required");
    }
  }
  async searchNearbyPlaces(params) {
    const searchParams = {
      location: params.location,
      radius: params.radius || 1e3,
      keyword: params.keyword,
      opennow: params.openNow,
      language: this.defaultLanguage,
      key: this.apiKey
    };
    try {
      const response = await this.client.placesNearby({
        params: searchParams
      });
      let results = response.data.results;
      if (params.minRating) {
        results = results.filter((place) => (place.rating || 0) >= (params.minRating || 0));
      }
      return results;
    } catch (error) {
      Logger.error("Error in searchNearbyPlaces:", error);
      throw new Error(`Failed to search nearby places: ${extractErrorMessage(error)}`);
    }
  }
  async getPlaceDetails(placeId) {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: ["name", "rating", "formatted_address", "opening_hours", "reviews", "geometry", "formatted_phone_number", "website", "price_level", "photos"],
          language: this.defaultLanguage,
          key: this.apiKey
        }
      });
      return response.data.result;
    } catch (error) {
      Logger.error("Error in getPlaceDetails:", error);
      throw new Error(`Failed to get place details for ${placeId}: ${extractErrorMessage(error)}`);
    }
  }
  async geocodeAddress(address) {
    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: this.apiKey,
          language: this.defaultLanguage
        }
      });
      if (response.data.results.length === 0) {
        throw new Error(`No location found for address: "${address}"`);
      }
      const result = response.data.results[0];
      const location = result.geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address,
        place_id: result.place_id
      };
    } catch (error) {
      Logger.error("Error in geocodeAddress:", error);
      throw new Error(`Failed to geocode address "${address}": ${extractErrorMessage(error)}`);
    }
  }
  parseCoordinates(coordString) {
    const coords = coordString.split(",").map((c) => parseFloat(c.trim()));
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
      throw new Error(`Invalid coordinate format: "${coordString}". Please use "latitude,longitude" format (e.g., "25.033,121.564"`);
    }
    return { lat: coords[0], lng: coords[1] };
  }
  async getLocation(center) {
    if (center.isCoordinates) {
      return this.parseCoordinates(center.value);
    }
    return this.geocodeAddress(center.value);
  }
  async geocode(address) {
    try {
      const result = await this.geocodeAddress(address);
      return {
        location: { lat: result.lat, lng: result.lng },
        formatted_address: result.formatted_address || "",
        place_id: result.place_id || ""
      };
    } catch (error) {
      Logger.error("Error in geocode:", error);
      throw new Error(`Failed to geocode address "${address}": ${extractErrorMessage(error)}`);
    }
  }
  async reverseGeocode(latitude, longitude) {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat: latitude, lng: longitude },
          language: this.defaultLanguage,
          key: this.apiKey
        }
      });
      if (response.data.results.length === 0) {
        throw new Error(`No address found for coordinates: (${latitude}, ${longitude})`);
      }
      const result = response.data.results[0];
      return {
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        address_components: result.address_components
      };
    } catch (error) {
      Logger.error("Error in reverseGeocode:", error);
      throw new Error(`Failed to reverse geocode coordinates (${latitude}, ${longitude}): ${extractErrorMessage(error)}`);
    }
  }
  async calculateDistanceMatrix(origins, destinations, mode = "driving") {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins,
          destinations,
          mode,
          language: this.defaultLanguage,
          key: this.apiKey
        }
      });
      const result = response.data;
      if (result.status !== "OK") {
        throw new Error(`Distance matrix calculation failed with status: ${result.status}`);
      }
      const distances = [];
      const durations = [];
      result.rows.forEach((row) => {
        const distanceRow = [];
        const durationRow = [];
        row.elements.forEach((element) => {
          if (element.status === "OK") {
            distanceRow.push({
              value: element.distance.value,
              text: element.distance.text
            });
            durationRow.push({
              value: element.duration.value,
              text: element.duration.text
            });
          } else {
            distanceRow.push(null);
            durationRow.push(null);
          }
        });
        distances.push(distanceRow);
        durations.push(durationRow);
      });
      return {
        distances,
        durations,
        origin_addresses: result.origin_addresses,
        destination_addresses: result.destination_addresses
      };
    } catch (error) {
      Logger.error("Error in calculateDistanceMatrix:", error);
      throw new Error(`Failed to calculate distance matrix: ${extractErrorMessage(error)}`);
    }
  }
  async getDirections(origin, destination, mode = "driving", departure_time, arrival_time) {
    try {
      let apiArrivalTime = void 0;
      if (arrival_time) {
        apiArrivalTime = Math.floor(arrival_time.getTime() / 1e3);
      }
      let apiDepartureTime = void 0;
      if (!apiArrivalTime) {
        if (departure_time instanceof Date) {
          apiDepartureTime = Math.floor(departure_time.getTime() / 1e3);
        } else if (departure_time) {
          apiDepartureTime = departure_time;
        } else {
          apiDepartureTime = "now";
        }
      }
      const response = await this.client.directions({
        params: {
          origin,
          destination,
          mode,
          language: this.defaultLanguage,
          key: this.apiKey,
          arrival_time: apiArrivalTime,
          departure_time: apiDepartureTime
        }
      });
      const result = response.data;
      if (result.status !== "OK") {
        throw new Error(`Failed to get directions with status: ${result.status} (arrival_time: ${apiArrivalTime}, departure_time: ${apiDepartureTime}`);
      }
      if (result.routes.length === 0) {
        throw new Error(`No route found from "${origin}" to "${destination}" with mode: ${mode}`);
      }
      const route = result.routes[0];
      const legs = route.legs[0];
      const formatTime = (timeInfo) => {
        if (!timeInfo || typeof timeInfo.value !== "number") return "";
        const date = new Date(timeInfo.value * 1e3);
        const options = {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        };
        if (timeInfo.time_zone && typeof timeInfo.time_zone === "string") {
          options.timeZone = timeInfo.time_zone;
        }
        return date.toLocaleString(this.defaultLanguage.toString(), options);
      };
      return {
        routes: result.routes,
        summary: route.summary,
        total_distance: {
          value: legs.distance.value,
          text: legs.distance.text
        },
        total_duration: {
          value: legs.duration.value,
          text: legs.duration.text
        },
        arrival_time: formatTime(legs.arrival_time),
        departure_time: formatTime(legs.departure_time)
      };
    } catch (error) {
      Logger.error("Error in getDirections:", error);
      throw new Error(`Failed to get directions from "${origin}" to "${destination}": ${extractErrorMessage(error)}`);
    }
  }
  async getElevation(locations) {
    try {
      const formattedLocations = locations.map((loc) => ({
        lat: loc.latitude,
        lng: loc.longitude
      }));
      const response = await this.client.elevation({
        params: {
          locations: formattedLocations,
          key: this.apiKey
        }
      });
      const result = response.data;
      if (result.status !== "OK") {
        throw new Error(`Failed to get elevation data with status: ${result.status}`);
      }
      return result.results.map((item, index) => ({
        elevation: item.elevation,
        location: formattedLocations[index]
      }));
    } catch (error) {
      Logger.error("Error in getElevation:", error);
      throw new Error(`Failed to get elevation data for ${locations.length} location(s): ${extractErrorMessage(error)}`);
    }
  }
};

// src/services/PlacesSearcher.ts
var PlacesSearcher = class {
  constructor(apiKey) {
    this.mapsTools = new GoogleMapsTools(apiKey);
  }
  async searchNearby(params) {
    try {
      const location = await this.mapsTools.getLocation(params.center);
      const places = await this.mapsTools.searchNearbyPlaces({
        location,
        keyword: params.keyword,
        radius: params.radius,
        openNow: params.openNow,
        minRating: params.minRating
      });
      return {
        location,
        success: true,
        data: places.map((place) => ({
          name: place.name,
          place_id: place.place_id,
          address: place.formatted_address,
          location: place.geometry.location,
          rating: place.rating,
          total_ratings: place.user_ratings_total,
          open_now: place.opening_hours?.open_now
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred during search"
      };
    }
  }
  async getPlaceDetails(placeId) {
    try {
      const details = await this.mapsTools.getPlaceDetails(placeId);
      return {
        success: true,
        data: {
          name: details.name,
          address: details.formatted_address,
          location: details.geometry?.location,
          rating: details.rating,
          total_ratings: details.user_ratings_total,
          open_now: details.opening_hours?.open_now,
          phone: details.formatted_phone_number,
          website: details.website,
          price_level: details.price_level,
          reviews: details.reviews?.map((review) => ({
            rating: review.rating,
            text: review.text,
            time: review.time,
            author_name: review.author_name
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while getting place details"
      };
    }
  }
  async geocode(address) {
    try {
      const result = await this.mapsTools.geocode(address);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while geocoding address"
      };
    }
  }
  async reverseGeocode(latitude, longitude) {
    try {
      const result = await this.mapsTools.reverseGeocode(latitude, longitude);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred during reverse geocoding"
      };
    }
  }
  async calculateDistanceMatrix(origins, destinations, mode = "driving") {
    try {
      const result = await this.mapsTools.calculateDistanceMatrix(origins, destinations, mode);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while calculating distance matrix"
      };
    }
  }
  async getDirections(origin, destination, mode = "driving", departure_time, arrival_time) {
    try {
      const departureTime = departure_time ? new Date(departure_time) : /* @__PURE__ */ new Date();
      const arrivalTime = arrival_time ? new Date(arrival_time) : void 0;
      const result = await this.mapsTools.getDirections(origin, destination, mode, departureTime, arrivalTime);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while getting directions"
      };
    }
  }
  async getElevation(locations) {
    try {
      const result = await this.mapsTools.getElevation(locations);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while getting elevation data"
      };
    }
  }
};

// src/utils/requestContext.ts
import { AsyncLocalStorage } from "async_hooks";
var requestContextStorage = new AsyncLocalStorage();
function getCurrentApiKey() {
  const context = requestContextStorage.getStore();
  return context?.apiKey || process.env.GOOGLE_MAPS_API_KEY;
}
function runWithContext(context, fn) {
  return requestContextStorage.run(context, fn);
}

// src/tools/maps/searchNearby.ts
var NAME = "search_nearby";
var DESCRIPTION = "Search for nearby places based on location, with optional filtering by keywords, distance, rating, and operating hours";
var SCHEMA = {
  center: z.object({
    value: z.string().describe("Address, landmark name, or coordinates (coordinate format: lat,lng)"),
    isCoordinates: z.boolean().default(false).describe("Whether the value is coordinates")
  }).describe("Search center point"),
  keyword: z.string().optional().describe("Search keyword (e.g., restaurant, cafe, hotel)"),
  radius: z.number().default(1e3).describe("Search radius in meters"),
  openNow: z.boolean().default(false).describe("Only show places that are currently open"),
  minRating: z.number().min(0).max(5).optional().describe("Minimum rating requirement (0-5)")
};
async function ACTION(params) {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.searchNearby(params);
    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Search failed" }],
        isError: true
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `location: ${JSON.stringify(result.location, null, 2)}
` + JSON.stringify(result.data, null, 2)
        }
      ],
      isError: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error searching nearby places: ${errorMessage}` }]
    };
  }
}
var SearchNearby = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION
};

// src/tools/maps/placeDetails.ts
import { z as z2 } from "zod";
var NAME2 = "get_place_details";
var DESCRIPTION2 = "Get detailed information about a specific place including contact details, reviews, ratings, and operating hours";
var SCHEMA2 = {
  placeId: z2.string().describe("Google Maps place ID")
};
async function ACTION2(params) {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getPlaceDetails(params.placeId);
    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to get place details" }],
        isError: true
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2)
        }
      ],
      isError: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error getting place details: ${errorMessage}` }]
    };
  }
}
var PlaceDetails = {
  NAME: NAME2,
  DESCRIPTION: DESCRIPTION2,
  SCHEMA: SCHEMA2,
  ACTION: ACTION2
};

// src/tools/maps/geocode.ts
import { z as z3 } from "zod";
var NAME3 = "maps_geocode";
var DESCRIPTION3 = "Convert addresses or place names to geographic coordinates (latitude and longitude)";
var SCHEMA3 = {
  address: z3.string().describe("Address or place name to convert to coordinates")
};
async function ACTION3(params) {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.geocode(params.address);
    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to geocode address" }],
        isError: true
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2)
        }
      ],
      isError: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error geocoding address: ${errorMessage}` }]
    };
  }
}
var Geocode = {
  NAME: NAME3,
  DESCRIPTION: DESCRIPTION3,
  SCHEMA: SCHEMA3,
  ACTION: ACTION3
};

// src/tools/maps/reverseGeocode.ts
import { z as z4 } from "zod";
var NAME4 = "maps_reverse_geocode";
var DESCRIPTION4 = "Convert geographic coordinates (latitude and longitude) to a human-readable address";
var SCHEMA4 = {
  latitude: z4.number().describe("Latitude coordinate"),
  longitude: z4.number().describe("Longitude coordinate")
};
async function ACTION4(params) {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.reverseGeocode(params.latitude, params.longitude);
    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to reverse geocode coordinates" }],
        isError: true
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2)
        }
      ],
      isError: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error reverse geocoding: ${errorMessage}` }]
    };
  }
}
var ReverseGeocode = {
  NAME: NAME4,
  DESCRIPTION: DESCRIPTION4,
  SCHEMA: SCHEMA4,
  ACTION: ACTION4
};

// src/tools/maps/distanceMatrix.ts
import { z as z5 } from "zod";
var NAME5 = "maps_distance_matrix";
var DESCRIPTION5 = "Calculate travel distances and durations between multiple origins and destinations for different travel modes";
var SCHEMA5 = {
  origins: z5.array(z5.string()).describe("List of origin addresses or coordinates"),
  destinations: z5.array(z5.string()).describe("List of destination addresses or coordinates"),
  mode: z5.enum(["driving", "walking", "bicycling", "transit"]).default("driving").describe("Travel mode for calculation")
};
async function ACTION5(params) {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.calculateDistanceMatrix(params.origins, params.destinations, params.mode);
    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to calculate distance matrix" }],
        isError: true
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2)
        }
      ],
      isError: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error calculating distance matrix: ${errorMessage}` }]
    };
  }
}
var DistanceMatrix = {
  NAME: NAME5,
  DESCRIPTION: DESCRIPTION5,
  SCHEMA: SCHEMA5,
  ACTION: ACTION5
};

// src/tools/maps/directions.ts
import { z as z6 } from "zod";
var NAME6 = "maps_directions";
var DESCRIPTION6 = "Get detailed turn-by-turn navigation directions between two locations with route information";
var SCHEMA6 = {
  origin: z6.string().describe("Starting point address or coordinates"),
  destination: z6.string().describe("Destination address or coordinates"),
  mode: z6.enum(["driving", "walking", "bicycling", "transit"]).default("driving").describe("Travel mode for directions"),
  departure_time: z6.string().optional().describe("Departure time (ISO string format)"),
  arrival_time: z6.string().optional().describe("Arrival time (ISO string format)")
};
async function ACTION6(params) {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getDirections(
      params.origin,
      params.destination,
      params.mode,
      params.departure_time,
      params.arrival_time
    );
    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to get directions" }],
        isError: true
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2)
        }
      ],
      isError: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error getting directions: ${errorMessage}` }]
    };
  }
}
var Directions = {
  NAME: NAME6,
  DESCRIPTION: DESCRIPTION6,
  SCHEMA: SCHEMA6,
  ACTION: ACTION6
};

// src/tools/maps/elevation.ts
import { z as z7 } from "zod";
var NAME7 = "maps_elevation";
var DESCRIPTION7 = "Get elevation data (height above sea level) for specific geographic locations";
var SCHEMA7 = {
  locations: z7.array(z7.object({
    latitude: z7.number().describe("Latitude coordinate"),
    longitude: z7.number().describe("Longitude coordinate")
  })).describe("List of locations to get elevation data for")
};
async function ACTION7(params) {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getElevation(params.locations);
    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to get elevation data" }],
        isError: true
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2)
        }
      ],
      isError: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error getting elevation data: ${errorMessage}` }]
    };
  }
}
var Elevation = {
  NAME: NAME7,
  DESCRIPTION: DESCRIPTION7,
  SCHEMA: SCHEMA7,
  ACTION: ACTION7
};

// src/config.ts
var serverConfigs = [
  {
    name: "MCP-Server",
    portEnvVar: "MCP_SERVER_PORT",
    tools: [
      {
        name: SearchNearby.NAME,
        description: SearchNearby.DESCRIPTION,
        schema: SearchNearby.SCHEMA,
        action: (params) => SearchNearby.ACTION(params)
      },
      {
        name: PlaceDetails.NAME,
        description: PlaceDetails.DESCRIPTION,
        schema: PlaceDetails.SCHEMA,
        action: (params) => PlaceDetails.ACTION(params)
      },
      {
        name: Geocode.NAME,
        description: Geocode.DESCRIPTION,
        schema: Geocode.SCHEMA,
        action: (params) => Geocode.ACTION(params)
      },
      {
        name: ReverseGeocode.NAME,
        description: ReverseGeocode.DESCRIPTION,
        schema: ReverseGeocode.SCHEMA,
        action: (params) => ReverseGeocode.ACTION(params)
      },
      {
        name: DistanceMatrix.NAME,
        description: DistanceMatrix.DESCRIPTION,
        schema: DistanceMatrix.SCHEMA,
        action: (params) => DistanceMatrix.ACTION(params)
      },
      {
        name: Directions.NAME,
        description: Directions.DESCRIPTION,
        schema: Directions.SCHEMA,
        action: (params) => Directions.ACTION(params)
      },
      {
        name: Elevation.NAME,
        description: Elevation.DESCRIPTION,
        schema: Elevation.SCHEMA,
        action: (params) => Elevation.ACTION(params)
      }
    ]
  }
];
var config_default = serverConfigs;

// src/core/BaseMcpServer.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { randomUUID } from "crypto";

// src/utils/apiKeyManager.ts
var ApiKeyManager = class _ApiKeyManager {
  constructor() {
    this.defaultApiKey = process.env.GOOGLE_MAPS_API_KEY;
  }
  static getInstance() {
    if (!_ApiKeyManager.instance) {
      _ApiKeyManager.instance = new _ApiKeyManager();
    }
    return _ApiKeyManager.instance;
  }
  /**
   * Set the default API key (from command line or environment)
   */
  setDefaultApiKey(key) {
    this.defaultApiKey = key;
    process.env.GOOGLE_MAPS_API_KEY = key;
  }
  /**
   * Get API key with priority:
   * 1. HTTP Header (X-Google-Maps-API-Key or Authorization: Bearer)
   * 2. Session-specific API key
   * 3. Default API key (command line or environment)
   */
  getApiKey(req, sessionApiKey) {
    if (req) {
      const headerApiKey = req.headers["x-google-maps-api-key"];
      if (headerApiKey) {
        return headerApiKey;
      }
      const authHeader = req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7);
      }
    }
    if (sessionApiKey) {
      return sessionApiKey;
    }
    return this.defaultApiKey;
  }
  /**
   * Check if any API key is available
   */
  hasApiKey(req, sessionApiKey) {
    return !!this.getApiKey(req, sessionApiKey);
  }
  /**
   * Validate API key format (basic validation)
   */
  isValidApiKeyFormat(key) {
    return /^[A-Za-z0-9_-]{20,50}$/.test(key);
  }
};

// src/core/BaseMcpServer.ts
var VERSION = "0.0.1";
var BaseMcpServer = class {
  constructor(name, tools) {
    this.sessions = {};
    this.httpServer = null;
    this.serverName = name;
    this.server = new McpServer(
      {
        name: this.serverName,
        version: VERSION
      },
      {
        capabilities: {
          logging: {},
          tools: {}
        }
      }
    );
    this.registerTools(tools);
  }
  registerTools(tools) {
    tools.forEach((tool) => {
      this.server.tool(tool.name, tool.description, tool.schema, async (params) => tool.action(params));
    });
  }
  async connect(transport) {
    await this.server.connect(transport);
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk, encoding, callback) => {
      if (typeof chunk === "string" && !chunk.startsWith("{")) {
        return true;
      }
      return originalStdoutWrite(chunk, encoding, callback);
    };
    Logger.log(`${this.serverName} connected and ready to process requests`);
  }
  async startHttpServer(port) {
    const app = express();
    app.use(express.json());
    app.post("/mcp", async (req, res) => {
      const sessionId = req.headers["mcp-session-id"];
      let context;
      const apiKeyManager = ApiKeyManager.getInstance();
      const requestApiKey = apiKeyManager.getApiKey(req);
      Logger.log(`${this.serverName} Get API KEY: ${requestApiKey}`);
      if (sessionId && this.sessions[sessionId]) {
        context = this.sessions[sessionId];
        if (requestApiKey) {
          context.apiKey = requestApiKey;
        }
      } else if (!sessionId && isInitializeRequest(req.body)) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId2) => {
            this.sessions[sessionId2] = context;
            Logger.log(`[${this.serverName}] New session initialized: ${sessionId2}`);
          }
          // DNS rebinding protection is disabled by default for backwards compatibility
          // For production use, enable this:
          // enableDnsRebindingProtection: true,
          // allowedHosts: ['127.0.0.1'],
        });
        context = {
          transport,
          apiKey: requestApiKey
        };
        transport.onclose = () => {
          if (transport.sessionId) {
            delete this.sessions[transport.sessionId];
            Logger.log(`[${this.serverName}] Session closed: ${transport.sessionId}`);
          }
        };
        await this.server.connect(transport);
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32e3,
            message: "Bad Request: No valid session ID provided"
          },
          id: null
        });
        return;
      }
      await runWithContext(
        { apiKey: context.apiKey, sessionId },
        async () => {
          await context.transport.handleRequest(req, res, req.body);
        }
      );
    });
    const handleSessionRequest = async (req, res) => {
      const sessionId = req.headers["mcp-session-id"];
      if (!sessionId || !this.sessions[sessionId]) {
        res.status(400).send("Invalid or missing session ID");
        return;
      }
      const context = this.sessions[sessionId];
      const apiKeyManager = ApiKeyManager.getInstance();
      const requestApiKey = apiKeyManager.getApiKey(req);
      if (requestApiKey) {
        context.apiKey = requestApiKey;
      }
      await runWithContext(
        { apiKey: context.apiKey, sessionId },
        async () => {
          await context.transport.handleRequest(req, res);
        }
      );
    };
    app.get("/mcp", handleSessionRequest);
    app.delete("/mcp", handleSessionRequest);
    this.httpServer = app.listen(port, () => {
      Logger.log(`[${this.serverName}] HTTP server listening on port ${port}`);
      Logger.log(`[${this.serverName}] MCP endpoint available at http://localhost:${port}/mcp`);
    });
  }
  async stopHttpServer() {
    if (!this.httpServer) {
      Logger.error(`[${this.serverName}] HTTP server is not running or already stopped.`);
      return;
    }
    return new Promise((resolve2, reject) => {
      this.httpServer.close((err) => {
        if (err) {
          Logger.error(`[${this.serverName}] Error stopping HTTP server:`, err);
          reject(err);
          return;
        }
        Logger.log(`[${this.serverName}] HTTP server stopped.`);
        this.httpServer = null;
        const closingSessions = Object.values(this.sessions).map((context) => {
          if (context.transport.sessionId) {
            delete this.sessions[context.transport.sessionId];
          }
          return Promise.resolve();
        });
        Promise.all(closingSessions).then(() => {
          Logger.log(`[${this.serverName}] All transports closed.`);
          resolve2();
        }).catch((transportCloseErr) => {
          Logger.error(`[${this.serverName}] Error during bulk transport closing:`, transportCloseErr);
          reject(transportCloseErr);
        });
      });
    });
  }
};

// src/cli.ts
import { fileURLToPath } from "url";
import { dirname } from "path";
import { readFileSync } from "fs";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
dotenvConfig({ path: resolve(process.cwd(), ".env") });
dotenvConfig({ path: resolve(__dirname, "../.env") });
async function startServer(port, apiKey) {
  if (port) {
    process.env.MCP_SERVER_PORT = port.toString();
  }
  if (apiKey) {
    process.env.GOOGLE_MAPS_API_KEY = apiKey;
  }
  Logger.log("\u{1F680} Starting Google Maps MCP Server...");
  Logger.log("\u{1F4CD} Available tools: search_nearby, get_place_details, maps_geocode, maps_reverse_geocode, maps_distance_matrix, maps_directions, maps_elevation, echo");
  Logger.log("");
  const startPromises = config_default.map(async (config) => {
    const portString = process.env[config.portEnvVar];
    if (!portString) {
      Logger.error(
        `\u26A0\uFE0F  [${config.name}] Port environment variable ${config.portEnvVar} not set.`
      );
      Logger.log(`\u{1F4A1} Please set ${config.portEnvVar} in your .env file or use --port parameter.`);
      Logger.log(`   Example: ${config.portEnvVar}=3000 or --port 3000`);
      return;
    }
    const serverPort = Number(portString);
    if (isNaN(serverPort) || serverPort <= 0) {
      Logger.error(
        `\u274C [${config.name}] Invalid port number "${portString}" defined in ${config.portEnvVar}.`
      );
      return;
    }
    try {
      const server = new BaseMcpServer(config.name, config.tools);
      Logger.log(
        `\u{1F527} [${config.name}] Initializing MCP Server in HTTP mode on port ${serverPort}...`
      );
      await server.startHttpServer(serverPort);
      Logger.log(
        `\u2705 [${config.name}] MCP Server started successfully!`
      );
      Logger.log(`   \u{1F310} Endpoint: http://localhost:${serverPort}/mcp`);
      Logger.log(`   \u{1F4DA} Tools: ${config.tools.length} available`);
    } catch (error) {
      Logger.error(
        `\u274C [${config.name}] Failed to start MCP Server on port ${serverPort}:`,
        error
      );
    }
  });
  await Promise.allSettled(startPromises);
  Logger.log("");
  Logger.log("\u{1F389} Server initialization completed!");
  Logger.log("\u{1F4A1} Need help? Check the README.md for configuration details.");
}
var isRunDirectly = process.argv[1] && (process.argv[1].endsWith("cli.ts") || process.argv[1].endsWith("cli.js") || process.argv[1].endsWith("mcp-google-map") || process.argv[1].includes("mcp-google-map"));
var isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isRunDirectly || isMainModule) {
  let packageVersion = "0.0.0";
  try {
    const packageJsonPath = resolve(__dirname, "../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    packageVersion = packageJson.version;
  } catch (e) {
    packageVersion = "0.0.0";
  }
  const argv = yargs(hideBin(process.argv)).option("port", {
    alias: "p",
    type: "number",
    description: "Port to run the MCP server on",
    default: process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : 3e3
  }).option("apikey", {
    alias: "k",
    type: "string",
    description: "Google Maps API key",
    default: process.env.GOOGLE_MAPS_API_KEY
  }).option("help", {
    alias: "h",
    type: "boolean",
    description: "Show help"
  }).version(packageVersion).alias("version", "v").example([
    ["$0", "Start server with default settings"],
    ['$0 --port 3000 --apikey "your_api_key"', "Start server with custom port and API key"],
    ['$0 -p 3001 -k "your_api_key"', "Start server with short options"]
  ]).help().parseSync();
  Logger.log("\u{1F5FA}\uFE0F  Google Maps MCP Server");
  Logger.log("   A Model Context Protocol server for Google Maps services");
  Logger.log("");
  if (!argv.apikey) {
    Logger.log("\u26A0\uFE0F  Google Maps API Key not found!");
    Logger.log("   Please provide --apikey parameter or set GOOGLE_MAPS_API_KEY in your .env file");
    Logger.log("   Example: mcp-google-map --apikey your_api_key_here");
    Logger.log("   Or: GOOGLE_MAPS_API_KEY=your_api_key_here");
    Logger.log("");
  }
  startServer(argv.port, argv.apikey).catch((error) => {
    Logger.error("\u274C Failed to start server:", error);
    process.exit(1);
  });
}
export {
  startServer
};
