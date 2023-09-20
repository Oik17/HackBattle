import Image from "next/image";
// import { Inter, Agdasima } from 'next/font/google'
import Head from "next/head";
import { useState } from "react";
import Bg from "../Components/Bg";
import axios from 'axios';
import { headers } from "../../next.config";

export default function Home() {
  const [send, setSend] = useState(false);
  // console.log(send);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const uploadURL = !setSend? "http://localhost:2000/upload/online" : "http://localhost:2000/upload/offline";

  const handleFileChange = (event) => {
    const files = event.target.files;
    const allowedFormats = ["image/png", "image/jpeg", "image/jpg"];
    const selectedFiles = [];
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (allowedFormats.includes(file.type)) {
        selectedFiles.push(file);
      } else {
        console.warn(`File ${file.name} is not a valid format (PNG, JPG, JPEG) and will be ignored.`);
      }
    }
  
    setSelectedFiles(selectedFiles);
  };

  const handleUpload = async () => {
    // let formData = new FormData();
    // console.log(selectedFiles);
    
    // for (let i = 0; i < selectedFiles.length; i++) {
    //   console.log('here')
    //   formData.append("image", selectedFiles[i]);
    // }
    // console.log(formData);
    try {
      await axios.post(uploadURL, selectedFiles, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Files uploaded successfully");
    } catch (error) {
      console.error("Error uploading files", error);
    }
  };

  return (
    <>
      <Head>
        <title>FinEase</title>
        <link rel="icon" href="../assets/favi.avif" />
      </Head>
      <main
        className={`flex h-[100vh] w-[100vw] flex-col items-center p-6 justify-items-center m-0`}
      >
        <Bg />
        <div className="flex justify-center text-9xl font-agdasima tracking-wide">
          FinEase
        </div>
        <div className="flex mt-16 lg:gap-[40vw] md:gap-[30vw] sm:gap-[20vw] gap-[10vw] ">
          <div
            className={`px-10 py-2 rounded-full  font-agdasima tracking-wide text-xl sm:text-3xl md:text-4xl ${
              !send
                ? "bg-white text-black border-4 border-gray-500"
                : "bg-black text-white border-2 border-white"
            } hover:bg-white hover:text-black`}
            onClick={() => {
              setSend(false);
            }}
          >
            Reciepts
          </div>
          <div
            className={` px-10 py-2 rounded-full bg-black font-agdasima tracking-wide text-xl sm:text-3xl  md:text-4xl ${
              send
                ? "bg-white text-black border-4 border-gray-500"
                : "bg-black text-white border-2 border-white"
            } hover:bg-white hover:text-black`}
            onClick={() => {
              setSend(true);
            }}
          >
            Online Payments
          </div>
        </div>
        <div className="border-2 border-white mt-10 flex flex-col justify-between h-[40vh] py-5 bg-black/40 rounded-2xl border-dashed w-[50vw] sm:w-auto justify-items-center">
          <input type="file" name="image" multiple onChange={handleFileChange} className="px-10 font-agdasima text-xl sm:text-2xl "/>
          <button onClick={handleUpload} className="bg-white font-agdasima text-black min-w-[13vw] mx-auto text-2xl">Upload Files</button>
        </div>
      </main>
    </>
  );
}
