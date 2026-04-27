const mongoose= require("mongoose");
const dotenv=require("dotenv");
dotenv.config();
const connectDB= require("../config/db")
const Role= require("../models/roleData.schema");
const fs= require("fs");
const path= require("path");
// const connectDB = require("../config/db");
// const data = JSON.parse(fs.readFileSync('./data/roleData.json'),'utf-8');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/roleData.json'), 'utf-8'));

const seedData = async ()=>{
    try{
        await connectDB()
        await Role.deleteMany();
        console.log("old data cleared");
        await Role.insertMany(data.roles);
        console.log("new data added");
        process.exit(0);
    }catch(err){
        console.error("error in seeding of data",err);
        process.exit(1);
    }
}
seedData();