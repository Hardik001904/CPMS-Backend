const express = require("express");
const { getPendingApprovals, approveUser, rejectUser, getSystemStats, getAllStudents, getAllCompanies, getBinUsers, restoreUser, deletePermanently, getStudentById, getAdminDashboard, getMasterStudent, addMasterStudent, deleteMasterStudent } = require("../controllers/adminController");
const { authMiddleware, roleCheck } = require("../middleware/auth");
const router = express.Router();

router.get("/approvals",  authMiddleware, roleCheck(["ADMIN"]) , getPendingApprovals);
router.patch("/approve/:id",  authMiddleware, roleCheck(["ADMIN"]) , approveUser);
router.patch("/reject/:id",  authMiddleware, roleCheck(["ADMIN"]) , rejectUser);
router.get("/bin",  authMiddleware, roleCheck(["ADMIN"]) , getBinUsers);
router.patch("/restore/:id",  authMiddleware, roleCheck(["ADMIN"]) , restoreUser);
router.delete("/delete/:id",  authMiddleware, roleCheck(["ADMIN"]) , deletePermanently);
router.get("/stats",  authMiddleware, roleCheck(["ADMIN"]) , getSystemStats);
router.get("/students",  authMiddleware, roleCheck(["ADMIN"]) , getAllStudents);
router.get("/students/:id",  authMiddleware, roleCheck(["ADMIN"]) , getStudentById);
router.get("/companies",  authMiddleware, roleCheck(["ADMIN"]) , getAllCompanies);
router.get("/overview",  authMiddleware, roleCheck(["ADMIN"]) , getAdminDashboard);


//Master students list 
router.get("/students/master",  authMiddleware, roleCheck(["ADMIN"]) , getMasterStudent);
router.post("/students/master",  authMiddleware, roleCheck(["ADMIN"]) , addMasterStudent);
router.delete("/students/master/:id",  authMiddleware, roleCheck(["ADMIN"]) , deleteMasterStudent); 

module.exports = router;