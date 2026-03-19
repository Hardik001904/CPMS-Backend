const bcrypt = require("bcrypt");
const User = require("../models/user");
const Job = require("../models/job");
const Application = require("../models/application");

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    // console.log("userId", req.user.id);

    const { description, location, size } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (user.role !== "COMPANY") {
      return res
        .status(403)
        .json({ message: "Only companies can update profile" });
    }

    //Update only these 3 fields
    if (description !== undefined) user.profile.description = description;
    if (location !== undefined) user.profile.location = location;
    if (size !== undefined) user.profile.size = size;

    // console.log("UpdatedProflie", updateMyProfile);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedFields: {
        description: user.profile.description,
        location: user.profile.location,
        size: user.profile.size,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Profile update failed:" + error.message });
  }
};

const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await User.findById(id).select("name email profile");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};



const getCompanyOverview = async (req, res) => {
  try {
    const companyId = req.user.id;

    const company = await User.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    //  Active Jobs (Mandates)
    const activeMandates = await Job.countDocuments({
      companyId,
      status: "Open"
    });


    // Total Applications (Talent Pool)
    const talentPool = await Application.countDocuments({
      companyId,
    });

    // Successful Hires
    const successfulHires = await Application.countDocuments({
      companyId,
      status: "Selected"
    });

    
    res.status(200).json({
      success: true,
      data: {
        name: company.name,
        activeMandates,
        talentPool,
        successfulHires,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};





//Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//Delete account
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user);
    return res.json({ message: "Account deleted succesfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { updateMyProfile, getCompanyById, getCompanyOverview, changePassword, deleteAccount, };
