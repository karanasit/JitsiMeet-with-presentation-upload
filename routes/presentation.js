const path = require("path");
const express = require("express");

const presentationController = require("../controllers/presentation");

const router = express.Router();

router.get("/", presentationController.getPresentation);

router.post("/", presentationController.postPresentation);

router.get("/presentationData", presentationController.getPresentationData);

module.exports = router;
