const { InfoDoesNotExistError } = require('../lib/errors.js');
const client = require('../tidb/config.js'); // Replace with your TiDB client module
const { v4: uuidv4 } = require('uuid');

async function addInfoInDB(doc) {
    try {
        const connection = await client.createConnection();
        const result = await connection.execute(`
      INSERT INTO info (
        _id, userID, contentType, fileName, bucketFileName, imageURL, dateAdded, dateLastModified, analyzedResults
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
            [
                uuidv4(), doc.userID, doc.contentType, doc.fileName, doc.bucketFileName,
                doc.imageURL, doc.dateAdded, doc.dateLastModified, JSON.stringify(doc.analyzedResults)
            ]
        );
        await connection.end();
        return result.insertId;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function getInfoInDB(infoID) {
    try {
        const connection = await client.createConnection();
        const sql = 'SELECT * FROM info WHERE _id = ?';
        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [infoID], function (err, result) {
                if (err) reject(err);
                resolve(result);
            });
        });
        
        await connection.end();

        if (result.length === 0) {
            throw new InfoDoesNotExistError(`No info found for infoID ${infoID}!`);
        }

        const info = result[0];
        // Handle the info data as needed
        return info;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function removeInfoInDB(infoID) {
    try {
        const connection = await client.createConnection();
        const sql = 'DELETE FROM info WHERE _id = ?';
        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [infoID], function (err, result) {
                if (err) reject(err);
                resolve(result);
            });
        });
        await connection.end();

        if (result.affectedRows !== 1) {
            throw new InfoDoesNotExistError(`No deletion occurred for deleting ${infoID}!`);
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function getInfoByUserIdInDB(userID) {
    try {
        const connection = await client.createConnection();

        const getInfoQuery = `
        SELECT i.*
        FROM info i
        JOIN users ur ON i.userID = ur._id
        WHERE ur._id = ?
      `;
        const getInfoParams = [userID];
        const infoResult = await new Promise((resolve, reject) => {
            connection.query(getInfoQuery, getInfoParams, function (err, result) {
                if (err) reject(err);
                resolve(result);
            });
        });

        await connection.end();

        return infoResult;
    } catch (error) {
        console.log(error);
        throw error;
    }
}


async function getInfoByUserIDAndBucketFileNameInDB(userID, bucketFileName) {
    try {
        const connection = await client.createConnection();

        const query = 'SELECT * FROM info WHERE userID = ? AND bucketFileName = ?';
        const params = [userID, bucketFileName];

        const result = await new Promise((resolve, reject) => {
            connection.query(query, params, function (err, rows) {
                if (err) reject(err);
                resolve(rows);
            });
        });

        await connection.end();

        if (result.length === 0) {
            throw new InfoDoesNotExistError(`No info found for userID ${userID} and bucketFileName ${bucketFileName}!`);
        }

        return result[0]
      
    } catch (error) {
        console.log(error);
        throw error;
    }
}


async function updateInfoInDB(infoID, updatedFieldsDoc) {
    try {
      const connection = await client.createConnection();
  
      const query = 'UPDATE info SET dateLastModified = ?, analyzedResults = ? WHERE _id = ?';
      const params = [
        updatedFieldsDoc.dateLastModified,
        JSON.stringify(updatedFieldsDoc.analyzedResults),
        infoID
      ];
  
      const result = await new Promise((resolve, reject) => {
        connection.query(query, params, function (err, rows) {
          if (err) reject(err);
          resolve(rows);
        });
      });
  
      await connection.end();
  
      if (result.affectedRows !== 1) {
        throw new InfoDoesNotExistError(`No info found for infoID ${infoID}!`);
      }
  
      return {
        ...updatedFieldsDoc,
        _id: infoID,
        analyzedResults: updatedFieldsDoc.analyzedResults,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  

module.exports = {
    addInfoInDB,
    getInfoInDB,
    removeInfoInDB,
    getInfoByUserIdInDB,
    getInfoByUserIDAndBucketFileNameInDB,
    updateInfoInDB,
};



