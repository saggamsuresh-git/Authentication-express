const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const app = express();
app.use(express.json());

//initializer
initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, async () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  if (password.length > 5) {
    const selectUserQuery = `
  SELECT
    *
  FROM
    user
  WHERE 
    username = '${username}';`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const addUserQuery = `
      INSERT INTO 
        user(username,name,password,gender,location)
      VALUES(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
      );`;
      await db.run(addUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } else {
    response.status(400);
    response.send("Password is too short");
  }
});

//User Login API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
  SELECT
    *
  FROM
    user
  WHERE
    username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    // console.log(isPasswordMatched);
    if (isPasswordMatched) {
      //   await db.run();
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// Change Password API
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
  SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatched) {
    if (newPassword.length <= 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
      UPDATE
        user
      SET
        password = '${updatedPassword}'
      WHERE
        username = '${username}';`;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
