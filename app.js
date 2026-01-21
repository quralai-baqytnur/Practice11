const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
let productsCollection;

async function start() {
  await client.connect();
  console.log("Connected to MongoDB");

  const db = client.db("shop");
  productsCollection = db.collection("products");

  app.get("/", (req, res) => {
  res.json({
    message: "Practice Task 11 API",
    endpoints: ["/api/products"]
  });
});

  app.post("/api/products", async (req, res) => {
  const { name, price, category } = req.body || {};

  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: "name, price, category are required" });
  }

  if (typeof name !== "string" || typeof category !== "string" || typeof price !== "number") {
    return res.status(400).json({ error: "Invalid data types" });
  }

  const product = { name, price, category };
  const result = await productsCollection.insertOne(product);

  return res.status(201).json({ _id: result.insertedId, ...product });
});

app.get("/api/products", async (req, res) => {
  const { category, minPrice, sort, fields } = req.query;

  const filter = {};

if (category) {
  filter.category = category;
}

if (minPrice) {
  filter.price = { $gte: Number(minPrice) };
}

let sortOption = {};

if (sort === "price") {
  sortOption.price = 1;
}

let projection = {};

if (fields) {
  fields.split(",").forEach((field) => {
    projection[field] = 1;
  });
}

 const products = await productsCollection
  .find(filter, { projection })
  .sort(sortOption)
  .toArray();

res.json(products);

});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  const product = await productsCollection.findOne({ _id: new ObjectId(id) });

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(product);
});

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  const result = await productsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: req.body }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json({ message: "Product updated" });
});

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  const result = await productsCollection.deleteOne({
    _id: new ObjectId(id)
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json({ message: "Product deleted" });
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Startup error:", err);
  process.exit(1);
});
