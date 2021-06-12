const mysql = require("mysql");
const con = mysql.createConnection({
  host: "", // ip address of server running mysql amazon RDS
  user: "", //user name to your my sql server
  password: "", //password of Amazon RDS
  database: "splitwise_db", // Name of DB 
});

let BillAdd = (amount, billdesc, user, split_amount, group) => {
  console.log("===================");
  console.log(amount);
  console.log(billdesc);
  console.log(user);
  console.log(split_amount);
  console.log(group);
  console.log("===================");

  con.query(
    "INSERT INTO bill_table (bill_amount, bill_desc, created_by,split_amount,bill_group) VALUES (?,?,?,?,?)",
    [amount, billdesc, user, split_amount, group],
    (err, result) => {
      if (err == null || err == undefined) {
        console.log("success(Bill Added)");
        // console.log(result)
        // console.log(result.insertId);
        // return result.insertId;
      } else {
        console.log("failure(Bill Not Added)");
        console.log(err);
      }
    }
  );
};




module.exports = {
  BillAdd,
};
