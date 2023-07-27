const mysql = require("mysql2");

var db_config = {
  host: "gateway01.us-west-2.prod.aws.tidbcloud.com",
  port: 4000,
  user: "2zN8pZsdS5CoC4Q.root",
  password: "9YzrqOVUrJlmUH2u",
  database: "Nutrition",
  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  },
};

var connection;

function handleDisconnect() {
  connection = mysql.createConnection(db_config);

  connection.connect(function (err) {
    if (err) {
      console.error("TiDB connection error:", err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log("connected to tidb");
    }
  });

  connection.on("error", function (err) {
    console.error("TiDB db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

function createConnection() {
  return new Promise((resolve, reject) => {
    if (connection && connection.state === "connected") {
      resolve(connection);
    } else {
      handleDisconnect();
      resolve(connection);
    }
  });
}

module.exports = {
  createConnection,
};
