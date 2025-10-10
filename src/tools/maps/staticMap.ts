import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_static_map";
const DESCRIPTION = "Generate a static map image URL for a specific location and area. Useful for textures in 3D visualization.";

const SCHEMA = {
  center: z.object({
    latitude: z.number().describe("Center latitude coordinate"),
    longitude: z.number().describe("Center longitude coordinate"),
  }).describe("Center point of the map"),
  zoom: z.number().min(0).max(21).describe("Zoom level (0-21, where 21 is maximum detail)"),
  size: z.object({
    width: z.number().min(1).max(2048).describe("Image width in pixels"),
    height: z.number().min(1).max(2048).describe("Image height in pixels"),
  }).describe("Size of the map image"),
  mapType: z.enum(["roadmap", "satellite", "terrain", "hybrid"]).optional().describe("Map type. Default: roadmap"),
  markers: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    label: z.string().optional(),
    color: z.string().optional(),
  })).optional().describe("Optional markers to show on the map"),
  path: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })).optional().describe("Optional path/route to draw on the map"),
};

export type StaticMapParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);

    // Generate static map URL
    const result = await placesSearcher.getStaticMap(params);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to generate static map" }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            url: result.data.url,
            parameters: {
              center: params.center,
              zoom: params.zoom,
              size: params.size,
              mapType: params.mapType || "roadmap",
            }
          }, null, 2),
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error generating static map: ${errorMessage}` }],
    };
  }
}

export const StaticMap = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
