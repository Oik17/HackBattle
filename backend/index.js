import express from "express";
import Tesseract from 'tesseract.js';
import multer from 'multer';
import { dirname } from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand,GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from 'crypto';
import mongoose from "mongoose";
//import catagory from "../catagory";
//const totalCost=require("./totalSchema");
dotenv.config();

mongoose.connect("mongodb://127.0.0.1/CategoryTesting");
const app = express();
app.use(express.json())
//const prisma=new PrismaClient();
const port = 2000;

const bucketName=process.env.BUCKET_NAME
const bucketRegion=process.env.BUCKET_REGION
const accessKey=process.env.ACCESS_KEY
const secretAccesskey=process.env.SECRET_ACCESS_KEY

const randomImageName= (bytes=32)=> crypto.randomBytes(bytes).toString('hex');
const s3= new S3Client({
  region: bucketRegion,
  credentials:{
    accessKeyId:accessKey,
    secretAccessKey: secretAccesskey,
  }})

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    // Handle preflight requests
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json())
//console.log("hello");

app.get("/upload", async(req,res)=>{
  res.sendFile(__dirname+"/src/temp.html");
})

app.post("/uploadFile/offline", upload.single("image"), async (req, res) => {
  try {
    console.log("req.body: ", req.body);
    console.log("req.file: ", req.file);

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const imageName = randomImageName();
    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    const imageUrl = `https://s3-${bucketRegion}.amazonaws.com/${params.Bucket}/${params.Key}`;
    console.log(imageUrl);

    getTotalOffline(imageUrl); //return id, expenses, vendor
    res.status(200).send(imageUrl);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).send("Error uploading image.");
  }
})

app.post("/uploadFile/online", upload.single("image"), async (req, res) => {
  try {
    console.log("req.body: ", req.body);
    console.log("req.file: ", req.file);

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const imageName = randomImageName();
    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    const imageUrl = `https://s3-${bucketRegion}.amazonaws.com/${params.Bucket}/${params.Key}`;
    console.log(imageUrl);
    getTotalOnline(imageUrl); //return id, expenses, vendor
    res.status(200).send(imageUrl);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).send("Error uploading image.");
  }
});

app.post("/stats/",(req,res)=>{                    //Calculate total from bill and add to db
  getTotalOffline(req.body.url);  
  res.status(201).send("Done");
})


app.post("/categorise/online", (req,res)=>{   //Calcuate amount for each catagory
  getCalc(req,res);
})

async function getCalc(req,res){
  try{
      const totalArray=req.body.total;     //total format: { "total": [{"1": ["leisure","543"]},{ "2": ["healthcare","929"]},{"3": ["healthcare","899"]}] }
      console.log(totalArray);
      var cat=[0,0,0,0,0,0];
      for(var i=0;i<totalArray.length;i++){
          for(const key in totalArray[i]){
              if (totalArray[i].hasOwnProperty(key)) {
                  const value = totalArray[i][key];
                  console.log(value[0]);
                  value[1]= parseInt(value[1]);
                  switch (value[0]) {
                      case "healthcare":
                        cat[0]+=value[1];
                        break;
                      case "leisure":
                          cat[1]+=value[1];
                        break;
                      case "vacations":
                          cat[2]+=value[1];
                        break;
                      case "essentials":
                          cat[3]+=value[1];
                        break;
                      case "groceries":
                          cat[4]+=value[1];
                        break;
                      case "misc":
                          cat[5]+=value[1];
                        break;
                      default:
                        break;
                    }
                }}}

      console.log(cat);

      const con= await catagory.create({
          healthcare: cat[0],
          leisure: cat[1],
          vacations: cat[2],
          essentials: cat[3],
          groceries: cat[4],
          misc: cat[5],
      })
      await con.save();
      return res.status(201).json(totalArray);
      
  }
  catch (error) {
      return res.status(500).json({
        message: error.message,
      });
    }
}

function isInteger(str) {
    // Use parseInt() to attempt conversion
    const integer = parseInt(str);
    
    // Check if the result is a finite number (not NaN) and has no decimal part
    return Number.isFinite(integer) && Number.isInteger(integer);
  }

async function getTotalOffline(ur){
  Tesseract.recognize(ur,'eng',
  { logger: m => console.log(m) }
 ).then(async ({ data: { text } }) => {
     console.log("\nHello");

 const lst=text.split("\n");
   console.log(lst);
   var num=0;
   for(let i in lst){
       if(lst[i].toLowerCase().includes("total")){
           const index=lst[i].toLowerCase().indexOf("total");
           const spl=lst[i].slice(index,lst[i].length);
           console.log(spl.split(" "));
           const smth=spl.split(" ");
           for(let j in smth){
                   if(isInteger(smth[j])){
                       if(smth[j]>num){
                           num=smth[j];
                       }
                   };

           }
       }
   }
   console.log(num);
  //  const cost= await totalCost.create({
  //      total: num, 
  //      url: ur
  //  })
  //  await cost.save();
    var temp={"id":1, "total": num}
    console.log(temp)
    return temp
    }).catch((err)=>{
        console.log(err);
    });
}
//getTotalOffline();

async function getTotalOnline(ur){
    Tesseract.recognize(ur,'eng',
      { logger: m => console.log(m) }
).then(({ data: { text } }) => {
    console.log("\nHello");

  const lst=text.split("\n");
  console.log(lst);
  var arr=[];
  var vendor=[];
  for(let i in lst){
      if(lst[i].toLowerCase().includes("-")){
        console.log(lst[i]);
        const index=lst[i].toLowerCase().indexOf("-");
        if(isInteger(lst[i][index+2])){
        const spl=lst[i].slice(index+2,lst[i].length);
        const spl1=lst[i].slice(2,index);
        //console.log(spl);
        arr.push(spl)    
        vendor.push(spl1);
      }
          };

          }
      
  console.log(arr);
  console.log(vendor);
  var actual=[];
  for(var i=0;i<arr.length;i++){
    var temp={"id":i+1, "vendor":vendor[i], "expense":arr[i]};
    actual.push(temp);
  }
  console.log(actual)
  return actual;
  }).catch((err)=>{
      console.log(err);
  });
}

//getTotalOnline();




app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });