const express = require("express");
const { submitContactForm, deleteContactMessage, toggleReadStatus, getAllContactMessages } = require("../controllers/contactController");
const router = express.Router();

router.post("/contact", submitContactForm);

router.get("/contact/messages", getAllContactMessages);

router.patch("/contact/:id/read", toggleReadStatus);

router.delete("/contact/:id", deleteContactMessage);


module.exports = router;