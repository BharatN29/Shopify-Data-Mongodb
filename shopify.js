const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const url = require('url');
const shopify = express.Router();
const config = require("./config");

shopify.post("/register", async (req, resp) => {
  const { store_url, access_token } = req.body;

  if (!store_url) {
    return resp.status(400).send("No store URL provided");
  }
  if (!access_token) {
    return resp.status(400).send("No store Access Token");
  }

  let parsedURL;
  try {
    parsedURL = url.parse(store_url);
  }
  catch (error) {
    parsedURL = undefined;
    console.log(error);
  }
  finally {
    if (!parsedURL ||
      !parsedURL.protocol ||
      parsedURL.protocol.indexOf("http") !== 0) {
      return resp.status(400).send("Bad Store URL");
    }
  }

  // storeAllCustomers(store_url, access_token)
  // countCustomers(store_url, access_token)
  // storeAllProducts(store_url, access_token)
  // countProducts(store_url, access_token)
  // storeAllOrders(store_url, access_token)
  // countOrders(store_url, access_token)


  MongoClient.connect("mongodb://localhost:27017", function (err, client) {
    if (err) throw err;
    console.log("Connected successfully to server");

    const db = client.db("shopify");

    storeAllData("customers", db, store_url, access_token)
      .then(a => console.log(a, "Customers Stored"))
      .catch(error => console.error(error));

    storeAllData("products", db, store_url, access_token)
      .then(a => console.log(a, "Products Stored"))
      .catch(error => console.error(error));

    storeAllData("orders", db, store_url, access_token)
      .then(a => console.log(a, "Orders Stored"))
      .catch(error => console.error(error));

  });

  resp.send(store_url);

});

shopify.post("/webhook", (req, resp) => {
  resp.send("Hello");
});

async function storeAllData(datapoint, db, store_url, access_token) {
  let totalProducts = await fetch(`${store_url}/admin/${datapoint}/count.json`, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": access_token,
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*"
    }
  }).then(resp => resp.json())
  .then(resp => resp.count)
  let promiseArray = [];
  let pages = 1;
  while (totalProducts > 0) {
    promiseArray.push(
      new Promise((resolve, reject) => {
        fetch(`${store_url}/admin/${datapoint}.json?limit=250&page=${pages}`, {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json;charset=UTF-8",
            "Access-Control-Allow-Origin": "*"
          }
        }).then(resp => resp.json())
          .then(resp =>
            {
             
              createNewEntries(db, datapoint, resp[datapoint], resolve, reject)
            }
          )
      })
    );
    pages += 1;
    totalProducts -= 250;
  }

  return await Promise.all(promiseArray);

}

const createNewEntries = function (db, collection, entries, callback, error) {
  // Get the collection and bulk api artefacts
  var collection = db.collection(collection),
    bulkUpdateOps = [];

  entries.forEach(function (doc) {
    bulkUpdateOps.push({
      replaceOne: {
        filter: { id: doc.id },
        replacement: doc,
        upsert: true
      }
    });

    if (bulkUpdateOps.length === 1000) {
      collection
        .bulkWrite(bulkUpdateOps)
        .then(function (r) {
          // do something with result
          callback();
        })
        .catch(error);
      bulkUpdateOps = [];
    }
  });

  if (bulkUpdateOps.length > 0) {
    collection
      .bulkWrite(bulkUpdateOps)
      .then(function (r) {
        // do something with result
        callback();
      })
      .catch(error);
  }
};


// async function storeAllCustomers(store_url, access_token) {
//   let customers = await fetch(`${store_url}/admin/customers.json`, {
//     method: "GET",
//     headers: {
//       "X-Shopify-Access-Token": access_token,
//       "Content-Type": "application/json;charset=UTF-8",
//       "Access-Control-Allow-Origin": "*"
//     }
//   }).then(resp => resp.text())

//   // console.log("List " + customers)
// }

// async function countCustomers(store_url, access_token) {
//   let countC = await fetch(`${store_url}/admin/customers/count.json`, {
//     method: "GET",
//     headers: {
//       "X-Shopify-Access-Token": access_token,
//       "Content-Type": "application/json;charset=UTF-8",
//       "Access-Control-Allow-Origin": "*"
//     }
//   }).then(resp => resp.text())

//   // console.log("Count Customers " + countC)

// }

// async function storeAllProducts(store_url, access_token) {
//   let products = await fetch(`${store_url}/admin/products.json`, {
//     method: "GET",
//     headers: {
//       "X-Shopify-Access-Token": access_token,
//       "Content-Type": "application/json;charset=UTF-8",
//       "Access-Control-Allow-Origin": "*"
//     }
//   }).then(resp => resp.text())

//   // console.log(products)

// }

// async function countProducts(store_url, access_token) {
//   let countP = await fetch(`${store_url}/admin/products/count.json`, {
//     method: "GET",
//     headers: {
//       "X-Shopify-Access-Token": access_token,
//       "Content-Type": "application/json;charset=UTF-8",
//       "Access-Control-Allow-Origin": "*"
//     }
//   }).then(resp => resp.text())

//   // console.log("Count Products " + countP)
// }

// async function storeAllOrders(store_url, access_token) {
//   let orders = await fetch(`${store_url}/admin/orders.json`, {
//     method: "GET",
//     headers: {
//       "X-Shopify-Access-Token": access_token,
//       "Content-Type": "application/json;charset=UTF-8",
//       "Access-Control-Allow-Origin": "*"
//     }
//   }).then(resp => resp.text())

//   // console.log(orders)

// }

// async function countOrders(store_url, access_token) {
//   let countO = await fetch(`${store_url}/admin/orders/count.json?status=any`, {
//     method: "GET",
//     headers: {
//       "X-Shopify-Access-Token": access_token,
//       "Content-Type": "application/json;charset=UTF-8",
//       "Access-Control-Allow-Origin": "*"
//     }
//   }).then(resp => resp.text())

//   // console.log("Count Orders " + countO)

// }

module.exports = shopify;
