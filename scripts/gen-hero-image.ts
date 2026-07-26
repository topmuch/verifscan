import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

async function main() {
  const zai = await ZAI.create();

  const prompt =
    "Modern premium 3D illustration of food traceability concept for VerifScan brand. " +
    "A sleek smartphone in the center scanning a QR code on a juice bottle. " +
    "Floating UI cards around the phone: a green checkmark badge saying 'Authentic', a blue shield with blockchain icon, a small map pin showing 'Dakar, SN', a calendar card showing expiry date. " +
    "Background: subtle blue to green gradient (#2563EB to #10B981) with soft particles and gentle glow. " +
    "Style: clean minimal modern tech aesthetic, soft studio shadows, premium product render, high quality, octane render, 4k. " +
    "Color palette: deep blue #2563EB, fresh green #10B981, warm orange accent #F59E0B, clean white. " +
    "No text, no words, no letters in the image — purely visual.";

  console.log("Generating hero image (1344x768)...");
  const response = await zai.images.generations.create({
    prompt,
    size: "1344x768",
  });

  const base64 = response.data[0].base64;
  const buffer = Buffer.from(base64, "base64");
  const outPath = "/home/z/my-project/public/hero/hero-main.png";
  fs.writeFileSync(outPath, buffer);
  console.log(`Hero image saved to ${outPath} (${buffer.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
