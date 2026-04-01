import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

const BUCKET_NAME = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "replit-objstore-150e9c1e-6f85-4f67-b507-7f59e4190aaa";

const videoFiles: Record<number, string> = {
  1: "The_6th_Tool_Module_1_Overview_1770941347976.mp4",
  2: "Writing_Unconscious_Code_Module_2_Overview_1770692404655.mp4",
  3: "The_Inner_Anchor_Point_Module_3_Overview_1770763850683.mp4",
  4: "Debugging_Your_System_Module4_1770762619118.mp4",
  5: "Architecting_the_Impossible_Module5_1770762971177.mp4",
  6: "Translating_Words_to_Experience_Module6_1770763198728.mp4",
  7: "The_6th_Tool__Module_7_1770763363305.mp4",
};

async function uploadVideos() {
  const bucket = storage.bucket(BUCKET_NAME);

  for (const [moduleId, filename] of Object.entries(videoFiles)) {
    const localPath = path.join(process.cwd(), "client/public/assets", filename);
    
    if (!fs.existsSync(localPath)) {
      console.log(`SKIP: ${filename} not found at ${localPath}`);
      continue;
    }

    const destName = `public/videos/module-${moduleId}-overview.mp4`;
    const fileSize = fs.statSync(localPath).size;
    console.log(`Uploading Module ${moduleId}: ${filename} (${(fileSize / 1024 / 1024).toFixed(1)}MB) -> ${destName}`);

    try {
      await bucket.upload(localPath, {
        destination: destName,
        metadata: {
          contentType: "video/mp4",
          cacheControl: "public, max-age=86400",
        },
      });
      console.log(`  ✓ Module ${moduleId} uploaded successfully`);
    } catch (err) {
      console.error(`  ✗ Module ${moduleId} failed:`, err);
    }
  }

  console.log("\nAll uploads complete! Verifying...");
  
  for (let i = 1; i <= 7; i++) {
    const file = bucket.file(`public/videos/module-${i}-overview.mp4`);
    const [exists] = await file.exists();
    console.log(`  Module ${i}: ${exists ? "EXISTS" : "MISSING"}`);
  }
}

uploadVideos().catch(console.error);
