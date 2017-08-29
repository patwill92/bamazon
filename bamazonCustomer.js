var mysql = require('mysql');
var inquirer = require("inquirer");

var connection = mysql.createConnection({
  host: 'bamazon.c4sc4gcfqq6s.us-east-2.rds.amazonaws.com',
  port: 3306,
  user: 'patwill92',
  password: 'Patwil$4485',
  database: 'bamazon'
});

connection.connect(function (err) {
  if (err) throw err;
  console.log('connected as id ' + connection.threadId);
  initialize();
});

function initialize() {
  connection.query('SELECT item_id, product_name, price FROM products', function (error, res) {
    if (error) throw error;
    console.log(res);
    beginPrompt(res.length);
  });
}

function beginPrompt(length) {
  let currentId;
  let newQty;
  inquirer.prompt([
    {
      name: "id",
      message: `Enter item ID (0 < id < ${length + 1})`,
      type: "input",
      validate: function (input) {
        currentId = parseInt(input);
        var done = this.async();
        if (parseInt(input) > length) {
          done(`Please enter value < ${length + 1} and > 0`);
          return;
        } else {
          done(null, true)
        }
      }
    },
    {
      name: "pQty",
      message: `Enter number of units to buy`,
      type: "input",
      filter: function (input) {
        return new Promise(function (resolve, reject) {
          connection.query('SELECT * FROM products WHERE ?', [
            {
              item_id: currentId
            }
          ], function (error, res) {
            if (error) throw error;
            if(parseInt(input) > res[0].stock_quantity) {
              reject(`Not enough inventory, please enter a quantity <= ${res[0].stock_quantity}`);
            } else if(parseInt(input) <= 0) {
              reject(`Please enter qty > 0`);
            } else {
              newQty = res[0].stock_quantity - parseInt(input);
              resolve(input);
            }
          });
        })
      }
    }
  ]).then((input) => {
    updateQty(newQty, input.id);
    console.log(`Qty was: ${input.pQty}`);
    console.log(`New qty is: ${newQty}`);
    console.log(`ID was: ${input.id}`);
  });
}

function updateQty(qty, id) {
  connection.query('UPDATE products SET ? WHERE ?',
    [
      {
        stock_quantity: qty
      },
      {
        item_id: id
      }
    ],
    function (error, res) {
    if (error) throw error;
    console.log(res);
    initialize();
  });
}
