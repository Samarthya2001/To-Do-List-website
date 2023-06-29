//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


main().catch(err => console.log(err));
 
async function main() {
  await mongoose.connect('mongodb+srv://Samarthya:Test123@cluster0.ldjugdq.mongodb.net/todolist2DB', {useNewUrlParser: true});
  console.log("Connected");
}

const itemsSchema = mongoose.Schema({
  name: "String"
});  

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Complete this Module"
});

const item2 = new Item({
  name: "Work on the project"
});

const item3 = new Item({
  name: "Complete the course"
});

const defaultItems = [item1, item2, item3];


const ListSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", ListSchema);



app.get("/", function(req, res) {

const day = date.getDate();

Item.find()
.then(function (foundItems) {
  if(foundItems.length === 0){
    Item.insertMany(defaultItems);
    res.redirect("/");
  }
  else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  }
    });
});


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName})
    .then(function(foundList){
      if(!foundList){
        const list = new List({
        name:customListName,
        items:defaultItems
      });
      list.save();
      console.log("saved");
      res.redirect("/"+customListName);
    }
    else{
      res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch(function(err){});
});

app.post("/", (req, res) => {
  let itemName = req.body.newItem
  let listName = req.body.list.trim() 
  const item = new Item({
      name: itemName,
  })
  if (listName === "Today") {
      item.save()
      res.redirect("/")
  } else {
      List.findOne({ name: listName }).exec().then(foundList => {
          if (foundList) {
              foundList.items.push(item)
              foundList.save()
              res.redirect("/" + listName)
          } else {
              const newList = new List({
                  name: listName,
                  items: [item],
              })
              newList.save()
              res.redirect("/" + listName)
          }
      }).catch(err => {
          console.log(err);
      });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = (req.body.checkbox.trim());
  const listName = req.body.listName;

  if (listName === "Today")
  {
    Item.findByIdAndRemove(checkedItemId).then(function(del){
      if(del){
          console.log("deleted");
      }
  });
  res.redirect("/");
    } else{
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function (foundList)
      {
        res.redirect("/" + listName);
      });  
  }
});

app.get("/about", function(req, res){
  res.render("about");
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
