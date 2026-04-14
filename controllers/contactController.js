const ContactMessage = require("../models/contactMessage");

const submitContactForm = async (req, res) => {
  try {
    const contact = await ContactMessage.create(req.body);

    res.status(201).json({
      success: true,
      message: "Message submitted successfully",
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAllContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

const toggleReadStatus = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    message.isRead = !message.isRead;

    await message.save();

    res.status(200).json({
      success: true,
      message: "Status updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

const deleteContactMessage = async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Message deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};

module.exports = {
  submitContactForm,
  getAllContactMessages,
  toggleReadStatus,
  deleteContactMessage,
};