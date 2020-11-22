const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const app = express();
var Converter = require("ppt-png");
var appRoot = require("app-root-path");
const Presentation = require("./models/presentation");
//var rimraf = require("rimraf");

app.use(express.static(path.join(__dirname, "static")));

app.use("/presentations", express.static(__dirname + "/static"));

app.set("view engine", "ejs");

const presentationRoutes = require("./routes/presentation");

// default options
app.use(fileUpload());

//app.use("/presentation", presentationRoutes);
app.use("/fileupload", presentationRoutes);
app.use("/presentationData", presentationRoutes);

app.get("/?username", function (req, res, next) {
  if (req.query.username) {
    console.log(req.query.username);
    var username = req.query.username;
    Presentation.fetchAll(username, (presentations) => {
      res.render("presentations", {
        data: presentations,
        pageTitle: "Presentation",
        path: "/",
        hasProducts: presentations.length > 0,
        activeShop: true,
        presentationsCSS: true,
      });
    });
  } else {
    res.render("presentation");
  }
});

app.post("/", function (req, res, next) {
  let sampleFile;
  let username;
  let uploadFilePath;
  let uploadPresentionImgPath;
  //let userFileExistCheck;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send("No files were uploaded.");
    return;
  }
  sampleFile = req.files.sampleFile;
  sampleFileName = req.files.sampleFile.name;
  username = req.body.username;
  uploadPresentionImgPath =
    appRoot + "/static/uploadedPresentationImage/" + username + "/";
  uploadFilePath = appRoot + "/static/uploadedFiles/" + sampleFile.name;
  pathIm = "/uploadedPresentationImage/" + username + "/";

  //userFileExistCheck =
   // appRoot + "/static/uploadedPresentationImage/" + username;

 // fs.exists(userFileExistCheck, function (exists) {
   // if (!exists) {
     // rimraf(userFileExistCheck, function () {
       // console.log("File Removed");
     // });
   // }
 // });

  sampleFile.mv(uploadFilePath, function (err) {
    if (err) {
      req.flash("error", err.message);
      return res.status(500).send(err);
    }
  });
  new Converter({
    files: [uploadFilePath],
    output: uploadPresentionImgPath,
    invert: true,
    deletePdfFile: true,
    outputType: "png",
    logLevel: 2,
  })
    .wait()
    .then(function (data) {
      if (data.success) {
        console.log("Converted");
        var sampleFileName = [];
        fs.readdir(uploadPresentionImgPath, (err, files) => {
          if (err) {
            console.log(err);
            req.flash("error", err.message);
            return err;
          }
          files.forEach((file) => {
            var fileType = path.extname(file);
            if (fileType == ".png") {
              sampleFileName.push(file);
            }
          });
        });
        const presentation = new Presentation(sampleFileName, username, pathIm);
        presentation.save();
        //res.redirect("/presentations", { username: username });
        res.redirect("/?username=" + username);
      } else {
        console.log("Conversion Failed");
      }
    });
});

app.use("/?", presentationRoutes);

app.listen(process.env.port || 3002);
console.log("Running at Port 3002");
