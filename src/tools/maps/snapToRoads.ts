import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_snap_to_roads";
const DESCRIPTION = "Snap GPS coordinates to the most likely roads travelled. Essential for real-time vehicle tracking and accurate route visualization.";

const SCHEMA = {
  path: z.array(z.object({
    latitude: z.number().describe("Latitude coordinate"),
    longitude: z.number().describe("Longitude coordinate"),
  })).describe("Array of GPS coordinates to snap to roads"),
  interpolate: z.boolean().optional().describe("Whether to interpolate a path with additional points. Default: false"),
};

export type SnapToRoadsParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);

    // Snap to roads
    const result = await placesSearcher.snapToRoads(
      params.path,
      params.interpolate || false
    );

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to snap to roads" }],
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
      content: [{ type: "text", text: `Error snapping to roads: ${errorMessage}` }],
    };
  }
}

export const SnapToRoads = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
