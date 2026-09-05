import env from dotenv
const crypto = require("crypto");

const header = {
  alg: "HS256",
  typ: "JWT"
};

const now = Math.floor(Date.now()/1000);

const payload = {
  iss: "payshield-client",
  nbf: now,
  exp: now + 3600
};

const secret = process.env.JWT_SECRET;

const encode = obj =>
  Buffer.from(JSON.stringify(obj))
    .toString("base64url");

const encodedHeader = encode(header);
const encodedPayload = encode(payload);

const data = `${encodedHeader}.${encodedPayload}`;

const signature = crypto
  .createHmac("sha256", secret)
  .update(data)
  .digest("base64url");

console.log(`${data}.${signature}`);
