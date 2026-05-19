import crypto from "crypto";

const encoded =
  "4a62a306-8965-4685-9ead-f88a4e8e5298:0854f1567b7fba53f23f472a9f5c0315b426381d49fcf05ac31be94151580c917477d3a31a5f9984dd99eb4adce82870a7886a77802f2a97079775f5d822d4ac";
const [salt, expected] = encoded.split(":");

const password = "asdfjkl;";
const digests = ["sha1", "sha256", "sha384", "sha512"];
const lengths = [32, 48, 64];
const iterations = [1000, 5000, 10000, 25000, 50000, 75000, 100000, 120000, 150000, 200000, 250000, 310000];

let matched = false;

for (const digest of digests) {
  for (const length of lengths) {
    for (const iteration of iterations) {
      const output = crypto.pbkdf2Sync(password, salt, iteration, length, digest).toString("hex");
      if (output === expected) {
        console.log(JSON.stringify({ digest, length, iteration }));
        matched = true;
      }
    }
  }
}

if (!matched) {
  console.log("no match");
}
