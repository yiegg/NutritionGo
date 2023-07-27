const { DuplicateUsernameError, UserDoesNotExistError, UserInfoArrayUpdateFailureError } = require('../lib/errors');
const {createConnection} = require('../tidb/config.js'); 
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

async function registerUserInDB(username, password) {
    try {
      const connection = await createConnection();
      const sql = 'INSERT INTO users (_id, userName, password) VALUES (?, ?, ?)';
      const result = await new Promise((resolve, reject) => {
        connection.query(sql, [uuidv4(), username, password], function (err, result) {
          if (err) reject(err);
          resolve(result);
        });
      });
      //await connection.end();
      return result.insertId.toString();
    } catch (error) {
      console.log(error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new DuplicateUsernameError(`Username already exists: ${username}`);
      } else {
        throw new Error('Unexpected error in registerUserInDB()!');
      }
    }
  }
  
  

  async function checkUsernameExistenceInDB(username) {
    try {
      const connection = await createConnection();
      const sql = 'SELECT COUNT(*) AS count FROM users WHERE userName = ?';
      const result = await new Promise((resolve, reject) => {
        connection.query(sql, [username], function (err, result) {
          if (err) reject(err);
          resolve(result);
        });
      });
      await connection.end();
      return result[0].count > 0;
    } catch (error) {
      console.log(error);
      throw new Error("Unexpected error in checkUsernameExistenceInDB()!");
    }
  }
  

  async function getUserByUsernameInDB(un) {
    try {
      const connection = await createConnection();
      const sql = 'SELECT * FROM users WHERE userName = ?';
      const result = await new Promise((resolve, reject) => {
        connection.query(sql, [un], function (err, result) {
          if (err) reject(err);
          resolve(result);
        });
      });
      await connection.end();
      if (result.length === 0) {
        throw new UserDoesNotExistError(`Username does not exist: ${un}`);
      }
      const { _id, userName, password } = result[0];
      return { userID: _id, username: userName, password };
    } catch (error) {
      console.log(error);
      if (error instanceof UserDoesNotExistError) {
        throw error;
      } else {
        throw new Error("Unexpected error in getUserByUsernameInDB()!");
      }
    }
  }
  
// todo: add info to user  

//   async function addInfoToUserInDB(userID, infoID) {
//     try {
//       const connection = await createConnection();
      
//       // Insert the mapping of userID and infoID into the info table
//       const insertQuery = 'UPDATE info SET userID = ? WHERE _id = ?';
//       const insertResult = await new Promise((resolve, reject) => {
//         connection.query(insertQuery, [userID, infoID], function (err, result) {
//           if (err) reject(err);
//           resolve(result);
//         });
//       });
      
//       if (insertResult.affectedRows !== 1) {
//         throw new UserInfoArrayUpdateFailureError(`Failed to add info ID ${infoID} to user ${userID}.`);
//       }
      
//       // Retrieve the updated user information along with the associated info
//       const selectQuery = `
//         SELECT u.*, r.*
//         FROM user u
//         JOIN info r ON u._id = r.userID
//         WHERE u._id = ? AND r._id = ?
//       `;
//       const selectResult = await new Promise((resolve, reject) => {
//         connection.query(selectQuery, [userID, infoID], function (err, result) {
//           if (err) reject(err);
//           resolve(result);
//         });
//       });
      
//       await connection.end();
      
//       if (selectResult.length === 0) {
//         throw new UserInfoArrayUpdateFailureError(`Failed to retrieve user and info information after adding info ID ${infoID} to user ${userID}.`);
//       }
      
//       // Extract the relevant data from the result
//       const user = {
//         userID: selectResult[0]._id,
//         username: selectResult[0].userName,
//         password: selectResult[0].password
//         // Include other user fields as needed
//       };
//       const info = {
//         infoID: selectResult[0]._id,
//         // Include other info fields as needed
//       };
      
//       return { user, info };
//     } catch (error) {
//       console.log(error);
//       if (error instanceof UserInfoArrayUpdateFailureError) {
//         throw error;
//       } else {
//         throw new Error("Unexpected error in addInfoToUserInDB()!");
//       }
//     }
//   }
  
  
  

// async function removeInfoFromUserInDB(userID, infoID) {
//   try {
//     const connection = await client.createConnection();
//     const result = await connection.execute(
//       `UPDATE user SET infoIDs = JSON_REMOVE(infoIDs, JSON_UNQUOTE(JSON_SEARCH(infoIDs, 'one', ?))) WHERE _id = ?`,
//       [infoID, userID]
//     );
//     await connection.end();
//     if (result.affectedRows !== 1) {
//       throw new UserInfoArrayUpdateFailureError(`Failed to remove info ID ${infoID} from user ${userID}.`);
//     }
//     return result.insertId.toString();
//   } catch (error) {
//     console.log(error);
//     if (error instanceof UserInfoArrayUpdateFailureError) {
//       throw error;
//     } else {
//       throw new Error("Unexpected error in removeInfoFromUserInDB()!");
//     }
//   }
// }

module.exports = {
  registerUserInDB,
  checkUsernameExistenceInDB,
  getUserByUsernameInDB,
//   addInfoToUserInDB,
//   removeInfoFromUserInDB
};


// async function exampleUsage() {
//     try {
//       // Call the functions
//       await registerUserInDB('johnhhh', 'password123');
//       console.log("Registered user!");
//       await getUserByUsernameInDB('johnhhh');
//     } catch (error) {
//       console.log(error);
//       // Handle the error
//       // ...
//     }
//   }
  
//   exampleUsage();