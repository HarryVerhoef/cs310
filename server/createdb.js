var mongoose = require("mongoose");
var db = mongoose.connection;
mongoose.connect("mongodb://localhost/test", {useNewUrlParser: true});
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
    console.log("Connected to test database");
    var userSchema = new mongoose.Schema({
        id: int,
        refresh_token: String
    });
    var User = mongoose.model("User", userSchema);
    
});
