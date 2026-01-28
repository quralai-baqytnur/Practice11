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

function apiKeyAuth(req, res, next) {
  const key = req.header("x-api-key");

  if (!key) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (key !== process.env.API_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

const client = new MongoClient(process.env.MONGO_URI);
let productsCollection;

async function start() {
  await client.connect();
  console.log("Connected to MongoDB");

  const db = client.db("shop");
  productsCollection = db.collection("products");

  app.get("/", (req, res) => {
  res.json({
    message: "Backend API is updated"
  });
});

app.post("/api/items", apiKeyAuth, async (req, res) => {
  try {
    const { name, price, category } = req.body || {};

    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: "name, price, category are required" });
    }

    if (typeof name !== "string" || typeof category !== "string" || typeof price !== "number") {
      return res.status(400).json({ error: "Invalid data types" });
    }

    const item = { name, price, category };
    const result = await productsCollection.insertOne(item);

    return res.status(201).json({ _id: result.insertedId, ...item });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const { category, minPrice, sort, fields } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (minPrice) filter.price = { $gte: Number(minPrice) };

    const sortOption = {};
    if (sort === "price") sortOption.price = 1;

    const projection = {};
    if (fields) {
      fields.split(",").forEach((field) => {
        projection[field] = 1;
      });
    }

    const items = await productsCollection
      .find(filter, { projection })
      .sort(sortOption)
      .toArray();

    return res.status(200).json(items);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/items/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid item id" });
    }

    const item = await productsCollection.findOne({ _id: new ObjectId(id) });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.status(200).json(item);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/items/:id", apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category } = req.body || {};

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid item id" });
    }

    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: "name, price, category are required" });
    }

    if (typeof name !== "string" || typeof category !== "string" || typeof price !== "number") {
      return res.status(400).json({ error: "Invalid data types" });
    }

    const updatedData = { name, price, category };

    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    const updated = await productsCollection.findOne({ _id: new ObjectId(id) });
    return res.status(200).json(updated);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/items/:id", apiKeyAuth, async (req, res) => {
  try {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid item id" });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const result = await productsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: req.body }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Item not found" });
  }

  const updated = await productsCollection.findOne({ _id: new ObjectId(id) });
    return res.status(200).json(updated);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}); 

app.delete("/api/items/:id", apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid item id" });
    }

    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.status(204).send();
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

//   app.post("/api/products", async (req, res) => {
//   const { name, price, category } = req.body || {};

//   if (!name || price === undefined || !category) {
//     return res.status(400).json({ error: "name, price, category are required" });
//   }

//   if (typeof name !== "string" || typeof category !== "string" || typeof price !== "number") {
//     return res.status(400).json({ error: "Invalid data types" });
//   }

//   const product = { name, price, category };
//   const result = await productsCollection.insertOne(product);

//   return res.status(201).json({ _id: result.insertedId, ...product });
// });

// app.get("/api/products", async (req, res) => {
//   const { category, minPrice, sort, fields } = req.query;

//   const filter = {};

// if (category) {
//   filter.category = category;
// }

// if (minPrice) {
//   filter.price = { $gte: Number(minPrice) };
// }

// let sortOption = {};

// if (sort === "price") {
//   sortOption.price = 1;
// }

// let projection = {};

// if (fields) {
//   fields.split(",").forEach((field) => {
//     projection[field] = 1;
//   });
// }

//  const products = await productsCollection
//   .find(filter, { projection })
//   .sort(sortOption)
//   .toArray();

// res.json(products);

// });

// app.get("/api/products/:id", async (req, res) => {
//   const { id } = req.params;

//   if (!ObjectId.isValid(id)) {
//     return res.status(400).json({ error: "Invalid product id" });
//   }

//   const product = await productsCollection.findOne({ _id: new ObjectId(id) });

//   if (!product) {
//     return res.status(404).json({ error: "Product not found" });
//   }

//   res.json(product);
// });

// app.put("/api/products/:id", async (req, res) => {
//   const { id } = req.params;

//   if (!ObjectId.isValid(id)) {
//     return res.status(400).json({ error: "Invalid product id" });
//   }

//   const result = await productsCollection.updateOne(
//     { _id: new ObjectId(id) },
//     { $set: req.body }
//   );

//   if (result.matchedCount === 0) {
//     return res.status(404).json({ error: "Product not found" });
//   }

//   res.json({ message: "Product updated" });
// });

// app.delete("/api/products/:id", async (req, res) => {
//   const { id } = req.params;

//   if (!ObjectId.isValid(id)) {
//     return res.status(400).json({ error: "Invalid product id" });
//   }

//   const result = await productsCollection.deleteOne({
//     _id: new ObjectId(id)
//   });

//   if (result.deletedCount === 0) {
//     return res.status(404).json({ error: "Product not found" });
//   }

//   res.json({ message: "Product deleted" });
// });

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
