const res = await fetch(
  `https://qstash-us-east-1.upstash.io/v2/events`,
  { headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` } }
);
const data = await res.json();
console.log(JSON.stringify(data, null, 2).slice(0, 2000));
