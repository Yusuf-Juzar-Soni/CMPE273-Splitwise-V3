const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql");
const PORT = 3001;
const session = require("express-session");
const groupWorkerFunc = require("./groupWorkers");
const billWorkerFunc = require("./billWorker");
const transactWorkerFunc = require("./transactionWorker");
const multer = require("multer");
const fs = require("fs");
const util = require("util");
const upload = multer();
const pipeline = util.promisify(require("stream").pipeline);
app.use(express.static(__dirname + "/public"));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
const bcrypt = require("bcryptjs");
const graphql = require("graphql");
const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} = graphql;
const { graphqlHTTP } = require("express-graphql");

app.use(
  session({
    secret: "compe273_lab1_splitwise",
    resave: false,
    saveUninitialized: false,
    duration: 60 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const con = mysql.createPool({
  connectionLimit: 10,
  host: "graphql-splitwise-database.ca0vnrrcatej.us-east-2.rds.amazonaws.com",
  user: "admin",
  password: "test1234",
  ssl: true,
  database: "splitwise_db",
});

// const con = mysql.createConnection({
//   host: "graphql-splitwise-database.ca0vnrrcatej.us-east-2.rds.amazonaws.com", // ip address of server running mysql
//   user: "admin", //user name to your my sql server
//   password: "test1234",
//   database: "splitwise_db",
// });

// con.connect((err) => {
//   if (err) {
//     console.log(err);
//   }
//   console.log("Connected!");
// });

//Allow Access Control

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const Signup = (args) => {
  return new Promise(async (resolve, reject) => {
    console.log(args);
    const name = args.username;
    const email = args.user_email;
    const password = args.password;
    const salt = bcrypt.genSaltSync(10);
    const encryptedpassword = bcrypt.hashSync(password, salt);

    con.query(
      "INSERT INTO users (username, user_email, password) VALUES (?,?,?)",
      [name, email, encryptedpassword],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            console.log("User already present!!");
            //res.status(409).json({ message: "User already exists!" });
            reject(err);
          }
        } else {
          const user = {
            username: args.user_email,
            password: args.password,
          };
          session.user = user;
          // res.status(200).json({ name: req.body.name, email: req.body.email });
          console.log(result);
          resolve(result);
        }
      }
    );
  });
};

const Login = (args) => {
  return new Promise(async (resolve, reject) => {
    const email = args.email;
    console.log(args.password);

    con.query(
      "SELECT * FROM  users WHERE user_email=?",
      [email],
      (err, result) => {
        if (result) {
          if (result.length) {
            bcrypt.compare(
              args.password,
              result[0].password,
              (err, results) => {
                console.log(result[0].password);
                console.log(results);
                if (results) {
                  user = {
                    username: args.email,
                    password: args.password,
                  };
                  session.user = user;
                  console.log(results);
                  // res.status(200).json({ result });
                  console.log("This is result", result[0]);
                  resolve(result[0]);
                } else {
                  reject({ message: "Invalid Password!" });
                }
              }
            );
          } else if (result.length === 0) {
            res.status(404).json({ message: "Invalid credentials!" });
          }
        }
      }
    );
  });
};

const dashboard = (args) => {
  return new Promise(async (resolve, reject) => {
    let email = args.email;
    con.query(
      "SELECT group_name FROM user_group WHERE user_email=? AND invite_status= 1",
      [email],
      function (err, result) {
        let groups = [];
        for (let i = 0; i < result.length; i++) {
          groups.push(result[i].group_name);
        }
        //res.status(200).json(groups);
        console.log(groups);
        resolve({ group_list: groups });
      }
    );
  });
};

const AllUsers = (args) => {
  return new Promise(async (resolve, reject) => {
    con.query(
      "select user_email, username from users where user_email != ?",
      [args],
      (err, result) => {
        if (!err) {
          // res.status(200).send(result);
          resolve(result);
        } else {
          // res.status(400).json({ error: "an error occured" });
          reject({ error: "an error occured" });
        }
      }
    );
  });
};

const AllMembers = (args) => {
  return new Promise(async (resolve, reject) => {
    console.log(args.email);
    console.log(args.groupname);
    con.query(
      "select user_email from user_group where group_name = ? and invite_status= 1",
      [args.groupname],
      (err, result) => {
        if (!err) {
          // res.status(200).send(result);
          resolve(result);
        } else {
          // res.status(400).json({ error: "an error occured" });
          reject({ error: "an error occured" });
        }
      }
    );
  });
};

const AddBill = (args) => {
  return new Promise(async (resolve, reject) => {
    console.log(args);
    const user = args.user;
    const billdesc = args.billData;
    const amount = args.amount;
    const group = args.group;
    const members = args.members;
    const split_amount = amount / members.length;
    console.log(user);
    console.log(billdesc);
    console.log(amount);
    console.log(group);
    console.log(members);
    console.log(split_amount);

    billWorkerFunc.BillAdd(amount, billdesc, user, split_amount, group);

    // con.query(
    //   "INSERT INTO bill_table (bill_amount, bill_desc, created_by,split_amount,bill_group) VALUES (?,?,?,?,?)",
    //   [amount,billdesc,user,split_amount,group],
    //   (err, result) => {
    //     if (err) {
    //       if (err.code === "ER_DUP_ENTRY") {
    //         console.log("Bill addition failed");
    //       }
    //     } else {
    //       console.log("Bill Added Successfully" );

    //     }

    //   }
    // );

    for (member of members) {
      con.query(
        "INSERT INTO transaction_table (sender, receiver, transaction_amount,bill_group) VALUES (?,?,?,?)",
        [user, member.user_email, split_amount, group],
        (err, result) => {
          if (err) {
            if (err) {
              console.log(err);
            }
          } else {
            console.log("Bill Added Successfully in transaction table");
          }
        }
      );
    }
    // res.status(200).json({ message: " successfully added in both" });
    resolve({ message: " successfully added in both" });
  });
};

const AddGroup = (args) => {
  return new Promise(async (resolve, reject) => {
    console.log(args.members);
    console.log(args.groupName);

    groupWorkerFunc
      .createGroup(args.groupName, args.members, args.user)
      .then((result) => {
        if (result == true) {
          // res.status(200).json({ messgae: "successful" });
          resolve({ message: "successful" });
        } else {
          if (result.code === "ER_DUP_ENTRY") {
            // res.status(409).json({ message: "failure" });
            reject({ message: "failure" });
          } else {
            // res.status(400).json({ message: "failure" });
            reject({ message: "failure" });
          }
        }
      });
  });
};

const fetchBills = (args) => {
  return new Promise(async (resolve, reject) => {
    con.query(
      "select created_by, bill_amount, bill_timestamp from bill_table where bill_group = ?",
      [args.group],
      (err, result) => {
        if (!err) {
          //res.status(200).send(result);
          resolve(result);
        } else {
          //res.status(400).json({ error: "an error occured" });
          reject({ error: "an error occured" });
        }
      }
    );
  });
};

const Activity = (args) => {
  return new Promise(async (resolve, reject) => {
    con.query(
      "SELECT * from bill_table where bill_group IN(select group_name from user_group where user_email = ?)",
      [args.email],
      (err, result) => {
        if (!err) {
          console.log(result);
          //res.status(200).send(result);
          resolve(result);
        } else {
          //res.status(400).json({ error: "an error occured" });
          reject({ error: "an error occured" });
        }
      }
    );
  });
};

const userDetails = (args) => {
  return new Promise(async (resolve, reject) => {
    console.log(args);
    con.query(
      "SELECT * from users where user_email = ?",
      [args],
      (err, result) => {
        console.log(err);
        if (!err) {
          console.log(result);
          //res.status(200).send(result);
          resolve(result[0]);
        } else {
          //res.status(400).json({ error: "an error occured" });
          reject({ error: "an error occured" });
        }
      }
    );
  });
};

// app.get("/fetchAmountsOwed/:email", (req, res) => {
//   transactWorkerFunc.amountOwedToMe(req.params.email).then((result) => {
//     if (result) {
//       console.log("Success fetched owed amount");
//       res.status(200).send(result);
//     }
//   });
// });

// app.get("/fetchAmountsIOwe/:email", (req, res) => {
//   transactWorkerFunc.amountIOwe(req.params.email).then((result) => {
//     if (result) {
//       console.log("Success fetched owed amount");
//       res.status(200).send(result);
//     }
//   });
// });

async function fetchResultIOwe(user) {
  let result = [];
  let groups = await groupWorkerFunc.getGroups(user);
  console.log(groups);
  let stringGroups = "";
  if (!groups) {
    return;
  }
  for (let group of groups) {
    stringGroups = stringGroups + "'" + group.group_name + "',";
  }
  stringGroups = stringGroups.substring(0, stringGroups.length - 1);
  let members = await groupWorkerFunc.getMembersAcrossGroups(stringGroups);

  if (!members) {
    members = [];
  }

  for (let email of members) {
    let sent = await groupWorkerFunc.getAmount(user, email.user_email);
    let recieved = await groupWorkerFunc.getAmount(email.user_email, user);
    let diff = sent[0].Sum - recieved[0].Sum;
    result.push({ email: email.user_email, amt: diff });
  }
  console.log(result);
  return result;
}

const Amount = (args) => {
  return new Promise(async (resolve, reject) => {
    console.log(args.user);

    fetchResultIOwe(args.user)
      .then((result) => {
        //res.send(result);
        resolve(result);
      })
      .catch((err) => {
        //need to add error handling
        reject(err);
      });
  });
};

const settleUpOwe = (args) => {
  return new Promise(async (resolve, reject) => {
    console.log("user", args.user);
    console.log("sender", args.sender);
    console.log("amount", args.amt);

    con.query(
      "INSERT INTO transaction_table (sender, receiver, transaction_amount,bill_group) VALUES (?,?,?,?)",
      [args.user, args.sender, args.amt, "Group 0"],
      (err, result) => {
        if (!err) {
          //res.status(200).send(result);
          // resolve(result);
          resolve({ message: "Successful settleUp Owe" });
        } else {
          //res.status(400).json({ error: "an error occured" });
          reject({ error: "an error occured" });
        }
      }
    );
  });
};

const settleUpOwed = (args) => {
  return new Promise(async (resolve, reject) => {
    console.log("user", args.user);
    console.log("sender", args.sender);
    console.log("amount owed:", args.amount);

    con.query(
      "INSERT INTO transaction_table (sender, receiver, transaction_amount,bill_group) VALUES (?,?,?,?)",
      [args.sender, args.user, args.amount, "Group 0"],
      (err, result) => {
        if (!err) {
          //res.status(200).send(result);
          // resolve(result);
          resolve({ message: "Successful settleUp Owed" });
        } else {
          // res.status(400).json({ error: "an error occured" });
          reject({ error: "an error occured" });
        }
      }
    );
  });
};

const getInvites = (args) => {
  return new Promise(async (resolve, reject) => {
    con.query(
      "SELECT group_name FROM user_group WHERE user_email=? AND invite_status = 0;",
      [args.email],
      (err, result) => {
        if (result) {
          console.log(result);
          const group_list = [];
          for (let i = 0; i < result.length; i++) {
            console.log("Inside if1");
            group_list.push(result[i].group_name);
          }
          // res.status(200).json({ group_list: group_list });
          // resolve({ group_list: group_list });
          resolve({ group_list: group_list });
        } else {
          //res.status(400).json({ message: "failed" });
          reject({ message: "failed" });
        }
      }
    );
  });
};

const acceptInvite = (args) => {
  return new Promise(async (resolve, reject) => {
    // app.post("/acceptInvite", (req, res) => {
    console.log(args.selectedgroup);
    console.log(args.user);

    con.query(
      "UPDATE user_group SET invite_status = 1 where group_name= ? and user_email = ?",
      [args.selectedgroup, args.user],
      (err, result) => {
        if (!err) {
          // res.status(200).json({ message: "successful" });
          resolve({ message: "successful" });
        } else {
          //res.status(400).json({ error: "an error occured" });
          reject({ error: "an error occured" });
        }
      }
    );
  });
};

const leaveGroup = (args) => {
  return new Promise(async (resolve, reject) => {
    // app.post("/leaveGroup", (req, res) => {
    console.log("inside Leave group", args.user);
    console.log(args.group);

    console.log("inside leave group ");
    con.query(
      "UPDATE user_group SET invite_status = 2 where group_name= ? and user_email = ?",
      [args.group, args.user],
      (err, result) => {
        if (!err) {
          //res.status(200).json({ message: "successful" });
          resolve({ message: "successful" });
        } else {
          //res.status(400).json({ error: "an error occured" });
          reject({ error: "an error occured" });
        }
      }
    );
  });
};

//=========================================================================================================================//
//=========================================================================================================================//

const UserType = new GraphQLObjectType({
  name: "users",
  fields: () => ({
    username: { type: GraphQLString },
    user_email: { type: GraphQLString },
    password: { type: GraphQLString },
  }),
});

const BillType = new GraphQLObjectType({
  name: "bill_table",
  fields: () => ({
    bill_id: { type: GraphQLString },
    bill_amount: { type: GraphQLInt },
    bill_desc: { type: GraphQLString },
    created_by: { type: GraphQLString },
    split_amount: { type: GraphQLInt },
    bill_group: { type: GraphQLString },
  }),
});

const GroupType = new GraphQLObjectType({
  name: "groups",
  fields: () => ({
    group_name: { type: GraphQLString },
    group_desc: { type: GraphQLString },
  }),
});

const UserGroupType = new GraphQLObjectType({
  name: "user_group",
  fields: () => ({
    user_email: { type: GraphQLString },
    group_name: { type: GraphQLString },
    invite_status: { type: GraphQLInt },
  }),
});

const TransactionType = new GraphQLObjectType({
  name: "transaction_table",
  fields: () => ({
    transaction_id: { type: GraphQLInt },
    sender: { type: GraphQLString },
    receiver: { type: GraphQLString },
    transaction_amount: { type: GraphQLInt },
    bill_group: { type: GraphQLString },
  }),
});

const Result = new GraphQLObjectType({
  name: "Result",
  fields: () => ({
    message: { type: GraphQLString },
  }),
});

const AmountResult = new GraphQLObjectType({
  name: "AmountResult",
  fields: () => ({
    email: { type: GraphQLString },
    amt: { type: GraphQLInt },
  }),
});

const GroupList = new GraphQLObjectType({
  name: "GroupList",
  fields: () => ({
    group_list: { type: GraphQLList(GraphQLString) },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    userDetails: {
      type: UserType,
      args: { user_email: { type: GraphQLString } },
      resolve(parent, args) {
        return userDetails(args.user_email)
          .then((result) => {
            console.log(result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    allUsers: {
      type: new GraphQLList(UserType),
      args: { email: { type: GraphQLString } },
      resolve(parent, args) {
        return AllUsers(args.email)
          .then((result) => {
            console.log(result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    fetchBills: {
      type: new GraphQLList(BillType),
      args: { group: { type: GraphQLString } },
      resolve(parent, args) {
        return fetchBills(args)
          .then((result) => {
            console.log(result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    Activity: {
      type: new GraphQLList(BillType),
      args: { email: { type: GraphQLString } },
      resolve(parent, args) {
        return Activity(args)
          .then((result) => {
            console.log(result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    getInvites: {
      type: GroupList,
      args: { email: { type: GraphQLString } },
      resolve(parent, args) {
        return getInvites(args)
          .then((result) => {
            console.log(result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: "Mutations",
  fields: {
    Signup: {
      type: Result,
      args: {
        username: { type: GraphQLString },
        user_email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      resolve(parent, args) {
        return Signup(args)
          .then((result) => {
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    Login: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      resolve(parent, args) {
        return Login(args)
          .then((result) => {
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    dashboard: {
      type: GroupList,
      args: {
        email: { type: GraphQLString },
      },
      resolve(parent, args) {
        return dashboard(args)
          .then((result) => {
            console.log("This is result in gql", result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    AllMembers: {
      type: GraphQLList(UserGroupType),
      args: {
        groupname: { type: GraphQLString },
      },
      resolve(parent, args) {
        return AllMembers(args)
          .then((result) => {
            console.log("This is result in gql", result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    AddBill: {
      type: Result,
      args: {
        user: { type: GraphQLString },
        billData: { type: GraphQLString },
        amount: { type: GraphQLInt },
        group: { type: GraphQLString },
        members: { type: GraphQLList(GraphQLString) },
      },
      resolve(parent, args) {
        return AddBill(args)
          .then((result) => {
            console.log("This is result in gql", result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    createGroup: {
      type: Result,
      args: {
        user: { type: GraphQLString },
        groupName: { type: GraphQLString },
        members: { type: GraphQLList(GraphQLString) },
      },
      resolve(parent, args) {
        return AddGroup(args)
          .then((result) => {
            console.log("This is result in gql", result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    acceptInvites: {
      type: Result,
      args: {
        user: { type: GraphQLString },
        selectedgroup: { type: GraphQLString },
      },
      resolve(parent, args) {
        return acceptInvite(args)
          .then((result) => {
            console.log("This is result in gql", result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    leaveGroup: {
      type: Result,
      args: {
        user: { type: GraphQLString },
        group: { type: GraphQLString },
      },
      resolve(parent, args) {
        return leaveGroup(args)
          .then((result) => {
            console.log("This is result in gql", result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    settleUpOwe: {
      type: Result,
      args: {
        user: { type: GraphQLString },
        sender: { type: GraphQLString },
        amt: { type: GraphQLInt },
      },
      resolve(parent, args) {
        return settleUpOwe(args)
          .then((result) => {
            console.log("This is result in gql", result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    settleUpOwed: {
      type: Result,
      args: {
        user: { type: GraphQLString },
        sender: { type: GraphQLString },
        amt: { type: GraphQLInt },
      },
      resolve(parent, args) {
        return settleUpOwed(args)
          .then((result) => {
            console.log("This is result in gql", result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
    amount: {
      type: GraphQLList(AmountResult),
      args: {
        user: { type: GraphQLString },
      },
      resolve(parent, args) {
        return Amount(args)
          .then((result) => {
            console.log("This is result in gql", result);
            return result;
          })
          .catch((err) => {
            return err;
          });
      },
    },
  },
});

const schema = new GraphQLSchema({ query: RootQuery, mutation: Mutation });

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

app.listen(PORT, () => {
  console.log("Server connected to port 3001");
});

module.exports = app;
