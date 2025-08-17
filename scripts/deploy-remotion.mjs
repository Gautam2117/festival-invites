import {deploySite} from "@remotion/lambda/client";
import path from "path";

const region = process.env.REMOTION_REGION || "ap-south-1";
const entry = path.join(process.cwd(), "src", "remotion", "entry.tsx");

const {serveUrl, bucketName} = await deploySite({
  region,
  entryPoint: entry,
});

console.log("Serve URL:", serveUrl);
console.log("Bucket:", bucketName);
