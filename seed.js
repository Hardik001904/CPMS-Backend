const mongoose = require("mongoose");
const CollegeStudent = require("./models/collegeStudent");

mongoose
  // .connect("mongodb://127.0.0.1:27017/cpms")
  // .connect("mongodb+srv://hipravin19_db_user:jxqcJsrv3HaNLqlL@cluster0.qutys6g.mongodb.net/cpms")
  .then(async () => {
    console.log("MongoDB connected");

    const seedData = [
      {
        enrollmentNumber: "220020116009",
        name: "Hardik Dabhi",
        department: "Information Technology",
      },
      {
        enrollmentNumber: "220020116008",
        name: "Ananya Sharma",
        department: "Information Technology",
      },
      {
        enrollmentNumber: "220020111002",
        name: "Rahul Varma",
        department: "Electronics & Communication",
      },
      {
        enrollmentNumber: "220020107003",
        name: "Priya Singh",
        department: "Computer Engineering",
      },
      {
        enrollmentNumber: "220020119006",
        name: "Arjun Nair",
        department: "Mechanical Engineering",
      },
      {
        enrollmentNumber: "220020143001",
        name: "Sneha Reddy",
        department: "Data Science & AI",
      },
      {
        enrollmentNumber: "220020107018",
        name: "Vikram Malhotra",
        department: "Computer Engineering",
      },
      {
        enrollmentNumber: "220020116010",
        name: "Darshan Darji",
        department: "Information Technology",
      },
      {
        enrollmentNumber: "220020111033",
        name: "Rohan Das",
        department: "Electrical Engineering",
      },
      {
        enrollmentNumber: "220020116011",
        name: "Kunal Patel",
        department: "Information Technology",
      },
      {
        enrollmentNumber: "220020116012",
        name: "Neha Mehta",
        department: "Information Technology",
      },
      {
        enrollmentNumber: "220020107021",
        name: "Aakash Joshi",
        department: "Computer Engineering",
      },
      {
        enrollmentNumber: "220020107022",
        name: "Pooja Trivedi",
        department: "Computer Engineering",
      },
      {
        enrollmentNumber: "220020111045",
        name: "Sahil Gupta",
        department: "Electrical Engineering",
      },
      {
        enrollmentNumber: "220020111046",
        name: "Isha Verma",
        department: "Electrical Engineering",
      },
      {
        enrollmentNumber: "220020119012",
        name: "Nirav Shah",
        department: "Mechanical Engineering",
      },
      {
        enrollmentNumber: "220020119013",
        name: "Bhavya Solanki",
        department: "Mechanical Engineering",
      },
      {
        enrollmentNumber: "220020143004",
        name: "Aditi Kulkarni",
        department: "Data Science & AI",
      },
      {
        enrollmentNumber: "220020143005",
        name: "Ritesh Pawar",
        department: "Data Science & AI",
      },
      {
        enrollmentNumber: "220020111047",
        name: "Mohit Bansal",
        department: "Electronics & Communication",
      },
      {
        enrollmentNumber: "220020111048",
        name: "Kavya Iyer",
        department: "Electronics & Communication",
      },
      {
        enrollmentNumber: "220020116013",
        name: "Yash Rana",
        department: "Information Technology",
      },
      {
        enrollmentNumber: "220020107023",
        name: "Harshil Parmar",
        department: "Computer Engineering",
      },
      {
        enrollmentNumber: "220020119014",
        name: "Devang Chauhan",
        department: "Mechanical Engineering",
      },
    ];

    //Insert data
    await CollegeStudent.insertMany(seedData, { ordered: false });

    console.log("Master list populated successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  });
