import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_weather";
const DESCRIPTION = "Get current weather conditions and forecast for a specific location using Google Weather API";

const SCHEMA = {
  location: z.object({
    latitude: z.number().describe("Latitude coordinate"),
    longitude: z.number().describe("Longitude coordinate"),
  }).describe("Location to get weather data for"),
  units: z.enum(["metric", "imperial"]).optional().describe("Temperature units (metric=Celsius, imperial=Fahrenheit). Default: metric"),
};

export type WeatherParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);

    // Get weather data
    const result = await placesSearcher.getWeather(
      params.location,
      params.units || "metric"
    );

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to get weather data" }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2),
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error getting weather data: ${errorMessage}` }],
    };
  }
}

export const Weather = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
