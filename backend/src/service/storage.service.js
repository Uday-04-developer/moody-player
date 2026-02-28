// import ImageKit from "imagekit";

// or
require('dotenv').config();
var ImageKit = require("imagekit");
const { mongoose } = require('mongoose');

var imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : "https://ik.imagekit.io/udaydev"
});

function uploadFile(file){
    return new Promise ((resolve, reject) => {
        imagekit.upload({
            file : file.buffer,
            fileName: new mongoose.Types.ObjectId().toString() + "_" + file.originalname,
            folder:"moodyplayer"
        }, (error, result) => {
            if (error){
                reject(error);
            }else{
                resolve(result.url);
            }
        })
    })
}
module.exports = uploadFile;