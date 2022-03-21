//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/todolistDB").
mongoose.connect(`mongodb+srv://admin-ashwani:${process.env.MONGO_DB_PASS}@cluster0.xv6tk.mongodb.net/todolistDB`).
  then(
    () => console.log("Succesfully connected to mongoDB")
  ).catch(
    err => console.log(err)
  )

const itemsSchema = mongoose.Schema({
  name: String
});

// items collection
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Click on + to add an item",
});
const item2 = new Item({
  name: "👈🏻 Check this box to delete this",
});
const item3 = new Item({
  name: "Have fun",
});

const defaultItems = [item1, item2, item3];

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

// lists collection
const List = mongoose.model("List", listSchema)

app.get("/", function (req, res) {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {

      Item.insertMany(defaultItems)
        .then(() => console.log("Success inserted default items"))
        .catch((err) => console.log(err));

      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = Item({
    name: itemName
  });
  
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect(`/${listName}`);
      }
    })
  }
});

app.post("/delete", (req, res) => {
  const itemID = req.body.checkbox;
  const listName = req.body.list;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemID, err => {
      if (err) {
        console.log(err)
      } else {
        console.log("Successfully deleted Object with id: ", itemID);
      }
      res.redirect("/")
    })
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {
        items: {_id: itemID}
      }},
      (err, results) => {
        if (!err) {
          res.redirect("/" + listName);
        } else {
          console.log(err);
        }
      }
    )
  }
})

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })

        list.save().then(() => console.log("Successfully added new list: ", customListName))
        res.redirect(`/${customListName}`)
      }
      else {
        // Show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
      }
    }
  })
})

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log(`Server started successfully`);
});
