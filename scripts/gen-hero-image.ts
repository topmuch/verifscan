import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

async function main() {
  const zai = await ZAI.create();

  const prompt =
    "Realistic photo of an African consumer's hand holding a smartphone scanning a QR code printed on a food product package (a glass jar of jam with a small QR code sticker on the label). " +
    "The smartphone screen shows a green checkmark confirmation. " +
    "Bright, fresh, modern food product photography style. " +
    "Soft natural light, kitchen counter background slightly blurred. " +
    "High-end commercial photography, sharp focus on the phone screen and QR code, shallow depth of field. " +
    "Color palette: deep navy blue #0f4382, fresh green #2ebd5a, warm wood tones. " +
    "Modern, premium, trustworthy mood. 4k, ultra realistic. " +
    "No text, no words, no letters, no logos visible in the image — purely visual.";

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
