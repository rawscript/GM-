import manifest from "../content/image-manifest.json";

export function imageSource(id) {
  const image = manifest.find((entry) => entry.id === id);
  if (!image) throw new Error(`Image manifest entry not found: ${id}`);
  return image.assetPath;
}
