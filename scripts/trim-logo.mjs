import sharp from "sharp";

const input = "public/mazaaj-logo.png";
const output = "public/mazaaj-logo-trimmed.png";

const image = sharp(input).trim({ threshold: 10 });
const buffer = await image.toBuffer();
const meta = await sharp(buffer).metadata();
await sharp(buffer).toFile(output);

console.log("trimmed size:", meta.width, "x", meta.height);
