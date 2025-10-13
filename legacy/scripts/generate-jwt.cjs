const jwt = require("jsonwebtoken");

const teamId = "K5LGN7GCDG"; // ton Team ID Apple
const keyId = "4FC6LJR9BU"; // ton Key ID Apple
const clientId = "com.faceup.auth"; // ton Service ID Apple
const privateKey = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgii27Enn5HKUdXeO9
E779AMcC1NGgLnh9w1LUv/fZ/Q6gCgYIKoZIzj0DAQehRANCAAQC+sZdyH8wmJnE
fYAMykhOpENmXpUqa0EoO4SPWphBAOXGpsZBJkCqZFnfERvEEfz/A+O9c22WzhwT
LaCgqMnx
-----END PRIVATE KEY-----`;

const payload = {
  iss: teamId,
  sub: clientId,
  aud: "https://appleid.apple.com",
  exp: Math.floor(Date.now() / 1000) + 180 * 24 * 60 * 60, // 180 jours
};

const token = jwt.sign(payload, privateKey, {
  algorithm: "ES256",
  keyid: keyId,
});

console.log("Ton JWT (Secret Key) :");
console.log(token);
