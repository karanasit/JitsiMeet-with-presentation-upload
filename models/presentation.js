const fs = require("fs");
const path = require("path");
var replace = require("replace");

const p = path.join(
  path.dirname(process.mainModule.filename),
  "data",
  "products.json"
);

const getProductsFromFile = (cb) => {
  fs.readFile(p, (err, fileContent) => {
    if (err) {
      cb([]);
    } else {
      cb(JSON.parse(fileContent));
    }
  });
};

module.exports = class Presentation {
  constructor(sampleFileName, username, path) {
    this.username = username;
    this.sampleFileName = sampleFileName;
    this.path = path;
  }

  save() {
    const p = path.join(
      path.dirname(process.mainModule.filename),
      "data",
      "products.json"
    );

      fs.truncate(p, 0, (err) => {
//    fs.readFile(p, (err, fileContent) => {
      let products = [];
      if (!err) {
//        products = JSON.parse(fileContent);
      }

      // products = replace({
      //   regex: "test",
      //   replacement: "replacement string",
      //   paths: [p],
      //   recursive: true,
      //   silent: true,
      // });

  

    products.push(this);
      fs.writeFile(p, JSON.stringify(products), (err) => {
        if (err) {
          console.log(err);
          //req.flash("error", err.message);
          return err;
        }
      });
    });
  }

  // static findById(id, cb) {
  //   getProductsFromFile((products) => {
  //     const product = products.find((p) => p.id === id);
  //     cb(product);
  //     console.log("hello " + product);
  //   });
  // }

  // Fetch data using username

  static fetchAll(username, cb) {
    const p = path.join(
      path.dirname(process.mainModule.filename),
      "data",
      "products.json"
    );
    fs.readFile(p, (err, fileContent) => {
      if (err) {
        //        req.flash("error", err.message);
        return err;
      }
      //fileContent = fileContent.filter();
      // cb(JSON.parse(fileContent));
      var data = JSON.parse(fileContent);
      let yourDesiredContentId = username;
      let filteredData = data.filter(
        (el) => el.username === yourDesiredContentId
      );
      cb(filteredData);
      console.log("File Data Fetched");
    });
  }
};
