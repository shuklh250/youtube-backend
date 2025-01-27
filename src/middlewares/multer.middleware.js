import multer from "multer";
import path from "path";


const Storage = multer.diskStorage({


    destination: function(req,file,cb){

        cb(null,"./public/temp")
    },
    filename: function(req,file,cb){
        const fileExtension = path.extname(file.originalname);  // Get file extension
        // console.log("fileExtension",fileExtension);
        
        const fileName = Date.now() + fileExtension; 
        cb(null,fileName)
    }
})

  export  const upload = multer ({
     storage:Storage
      
    })