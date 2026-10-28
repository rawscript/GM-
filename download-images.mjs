import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const images = [
  { id: "care-team", url: "https://images.unsplash.com/photo-1758691463569-66de91d76452?auto=format&fit=crop&w=1600&q=85" },
  { id: "wearable-health", url: "https://images.unsplash.com/photo-1777496410127-b299effbaa69?auto=format&fit=crop&w=1600&q=85" },
  { id: "lab-research", url: "https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&w=1600&q=85" },
  { id: "medical-tech", url: "https://images.unsplash.com/photo-1758691462620-9018c602ed3e?auto=format&fit=crop&w=1600&q=85" },
  { id: "pilot-planning", url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=85" },
  { id: "integration-systems", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=85" },
  { id: "assurance-compliance", url: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1600&q=85" },
  { id: "signin-secure", url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=85" }
];

async function downloadImage(id, url) {
  const dest = path.join(__dirname, "public/images", id + ".webp");
  console.log("Downloading " + id + "...");
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (u) => {
      https.get(u, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          request(response.headers.location);
        } else {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log("Downloaded: " + dest);
            resolve();
          });
        }
      }).on("error", reject);
    };
    request(url);
  });
}

for (const img of images) {
  await downloadImage(img.id, img.url);
}
console.log("All downloads complete");
