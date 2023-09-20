import express from "express";
import Tesseract from 'tesseract.js';
import multer from 'multer';
import { dirname } from "path";
import { fileURLToPath } from "url";
//import bodyParser from "body-parser";
import { S3Client, PutObjectCommand,GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
//import {PrismaClient} from "@prisma/client";
import crypto from 'crypto';
dotenv.config();

const app = express();
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
//app.use(bodyParser.urlencoded({extended: true}));
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

app.get("/upload", async(req,res)=>{
  res.sendFile(__dirname+"/src/temp.html");
})

app.post("/upload/offline",upload.single('image'),async(req,res)=>{
   
  console.log("req.body: ", req.body);
  console.log("req.file: ", req.file);
  req.file.buffer
  const imageName= randomImageName();
  const params={
    Bucket:bucketName,
    Key: imageName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  }
  const command= new PutObjectCommand(params);
  await s3.send(command)
  const imageUrl = `https://s3-${bucketRegion}.amazonaws.com/${bucketName}/${accessKey}`;

  console.log(imageUrl);

  res.send(imageUrl)
})

app.post("/upload/online", upload.single("image"), async (req, res) => {
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

    res.status(200).send(imageUrl);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).send("Error uploading image.");
  }
});

app.get("/upload/catagorise",async(req,res)=>{

  const command = new GetObjectCommand("25839d4870a3245eb5f6477d89f917723b060f14b29e7aa20defe7710456f9bc");
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  console.log(url);
} )
function isInteger(str) {
    // Use parseInt() to attempt conversion
    const integer = parseInt(str);
    
    // Check if the result is a finite number (not NaN) and has no decimal part
    return Number.isFinite(integer) && Number.isInteger(integer);
  }

async function getTotalOffline(req,res){
    Tesseract.recognize(
   'https://pbs.twimg.com/media/FJPCYCdaMAMT1O3.jpg',
   'eng',
   { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
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
    }).catch((err)=>{
        console.log(err);
    });
}
//getTotalOffline();

async function getTotalOnline(req,res){
    Tesseract.recognize(
  'https://cdsassets.apple.com/live/7WUAS350/images/ios/ios-16-iphone-14-pro-wallet-apple-card-latest-transactions.png',
  'eng',
  { logger: m => console.log(m) }
).then(({ data: { text } }) => {
    console.log("\nHello");

  const lst=text.split("\n");
  console.log(lst);
  var arr=[];
  for(let i in lst){
      if(lst[i].toLowerCase().includes("$")){
          const index=lst[i].toLowerCase().indexOf("$");
          const spl=lst[i].slice(index+1,lst[i].length);
          //console.log(spl.split(" "));
          const smth=spl.split(" ");
          //console.log("\nHello");
          //console.log(smth);
          for(let j in smth){
                  if(isInteger(smth[j])){
                          arr.push(parseFloat(smth[j]));
                      
                  };

          }
      }
  }
  console.log(arr);
  //console.log(arr.length);
  }).catch((err)=>{
      console.log(err);
  });
}

//getTotalOnline();




app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });