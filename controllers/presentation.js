const Presentation = require("../models/presentation");
const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
var Converter = require("ppt-png");
const fs = require("fs");
app.use(fileUpload());
const appRoot = require("app-root-path");
const path = require("path");
const rimraf = require("rimraf");

exports.getPresentation = (req, res, next) => {
  if (req.query.meetingId) {
    var username = req.query.meetingId;
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
};

exports.getPresentationData = function (req, res) {
  var username = req.query.meetingId;
  Presentation.fetchAll(username, (presentations, err) => {
    if (err) res.send(err);
    res.json(presentations);
  });
};

exports.postPresentation = (req, res, next) => {
  let sampleFile;
  let username;
  let uploadFilePath;
  let uploadPresentionImgPath;
  let userFileExistCheck;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send("No files were uploaded.");
    return;
  }
  sampleFile = req.files.sampleFile;
  sampleFileName = req.files.sampleFile.name;
  username = req.body.username;
  uploadPresentionImgPath =
    appRoot + "/static/fileupload/uploadedPresentationImage/" + username + "/";
  uploadFilePath =
    appRoot + "/static/fileupload/uploadedFiles/" + sampleFile.name;
  pathIm = "/fileupload/uploadedPresentationImage/" + username + "/";

  userFileExistCheck =
    appRoot + "/static/fileupload/uploadedPresentationImage/" + username;

  fs.exists(userFileExistCheck, function (exists) {
    console.log(exists);
    if (exists) {
      rimraf(userFileExistCheck, function () {
        console.log("File Removed");
      });
    }
  });

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
            //req.flash("error", err.message);
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
        res.redirect("/fileupload/?meetingId=" + username);
      } else {
        console.log("Conversion Failed");
      }
    });
};