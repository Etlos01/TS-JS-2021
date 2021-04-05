import { MongoClient, Db, Collection } from "mongodb"
import connect from "./connect";
import setupTestData from "./setupTestData"

(async function Tester() {
  const client = await connect();
  const db = client.db("day1ex1")
  const collection = db.collection("inventory")
  const status = await setupTestData(collection)
  
  //Add your play-around code here
  const demo = db.collection("demo")
  await demo.insertOne({name: "Kurt"})
  await demo.insertOne({animal: "Dog"})
   
  client.close()
})()
