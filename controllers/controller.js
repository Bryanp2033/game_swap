//require igdb npm package
const igdb = require('igdb-api-node').default;

//set api key to variable 
const client = igdb('be1ea7dccb14bcf3ae57b1e16d62cb74');

// Import current user id from session
const currentuserID = require('../config/currentuser.js');

//require mail.js
var mail = require("../config/mail.js")

//require node mailer
var nodemailer = require("nodemailer")

// Import express package
var express = require("express")

//Importing apiSearch.js
var gameSearch = require("../models/search.js")

// Establish router via express
var router = express.Router();

// Import the model to use its database functions.
var user = require("../models/user.js");
var game = require("../models/game.js");
// Create all our routes and set up logic within those routes where required.
//Login Page
router.get("/", function(request, response){
    response.render("index", {layout: 'landing'})
    console.log("Working Login")
})

// Home/Search Page
router.get("/search", function(request, response){
    //render to search handlebar
    response.render("search");
});

router.post("/search", function(request, response){
    var locationID = request.body.location;
    //let userID = currentuserID.currentID;

    response.redirect("/search/"+locationID);
});

router.get("/search/:locationID", function(request, response){
    var locationID = request.params.locationID;
    
    user.allBy( "locations_id", locationID, function(data) {
        // console.log("Post Result:" , data);
        var hbsObject = {
            users: data
        };
        console.log("Passing object", hbsObject);
        response.render("search", hbsObject);
    });
});

//Profile Page
router.get("/username/:id", function(request, response){
    // console.log(request.params.id);
    console.log(request.params.id);
    user.allBy("id",request.params.id, function(data){
        console.log(data);

        var hbsObject = {
            users_id : data
        }
        //render to profile handlebar
        response.render("user-page", hbsObject);
    });
    console.log("Working Profile");
});

//user
router.get("/username", function(request, response){
    let userID = currentuserID.currentID;
    console.log("User ID in .GET:\n", userID);
    user.allBy("id", userID, function(data){
        console.log(data);

        var hbsObject = {
            users_id : data
        }
        //render to profile handlebar
        response.render("user-page", hbsObject);
    });
});

//Add Game Page
router.get("/add/:username/:id", function(request, response){
    //render to add game handlebar
    response.render("index")
    console.log("Working Add Game")
})

// User Library
router.get("/library/:id?", function(request, response){
    //render to library handlebar
    // let userID = currentuserID.currentID;
    console.log("You are in the library page")

    user.allBy("id", request.params.id, function(data){
        console.log(data);
        console.log(request.params.id)

       let userID= request.params.id
        let userGames =[]
        user.gameList("users_id", userID, function(data){
            for(let i=0; i <data.length; i++){
                // userGames.push(data[i].games_id)
                // console.log(userGames);
                game.allBy("id", data[i].games_id, function(game){
                    console.log("Results: " + game)
                    // userGames.push(game[i][0].name);
                    // console.log("User Library R E S U L T S:\n",userGames)
                    
                });
            }
        });

        let hbsObject = {
            users_id : data,
            games: userGames
        }
        //render to profile handlebar
        response.render("user-library", hbsObject);
    });


});

//Post game search
//*****************************************NEEDS TO BE TESTED TO MAKE SURE CALLING CORRECTLY*************************/

router.get("/gamesearch", function(request, response){
    console.log(request);
    response.render("gamesearch");
})

router.post("/gamesearch", function(request, response){
    // console.log("Looking for games");
    // var string = request.params.string
    // gameSearch.search(string, function (data) {
    //     console.log (data);
    // });
    
    let game = request.body.game
    console.log('game string:\,', game);
    response.redirect("/gamesearch/"+game)
    response.end();
})

router.get("/gamesearch/:game", function(request, response){    
    function gameBuilder(name, image, id) {
        this.name = name;
        this.image = image;
        this.id = id;
    }
    let game = request.params.game;
    var gameResults = [];
    
    //console.log(game)
    gameSearch.search(game, function (data) {
        gameResults=[];
        //console.log (data);
        for (i = 0; i < data.body.length; i++) {
            let image;
            // console.log(data.body[i].name)
            //console.log(data.body[i])
            //if statement where cover art is available
            if (data.body[i].cover) {
                let imageId = data.body[i].cover.cloudinary_id
                //console.log("image ID", data.body[i].cover.cloudinary_id)
                // data.body contains the parsed JSON response to this query
                image = client.image({
                    cloudinary_id: imageId,
                }, 'cover_big', 'jpg')
            }
            
            //else set img link for when cover art is not available
            else {
                image = "//publications.iarc.fr/uploads/media/default/0001/02/thumb_1199_default_publication.jpeg"
            }
            //console.log("Image link", image)
            var newGame = new gameBuilder(data.body[i].name, image, data.body[i].id)
            // console.log("New Game: ", newGame)
            gameResults.push(newGame)
            console.log("Array: ", gameResults)   
        };         
            // console.log(image)
                var hbsObject = {
                    games: gameResults
                };
        response.render("gamesearch", hbsObject);        
    });
});

router.post("/message/:id", function(request, response){
    let id = request.params.id
    user.allBy( "id", id, function(data) {
        // console.log("Post Result:" , data);
        let email = data[0].email;
        mail.mailtouser(email)
        response.render("search")
    })    
});

// this route gets activated when the submit button gets clicked.
// this submit button is found in form for creating a new user
router.post("/create-user", function(request, response){
    user.create( "users",
    // the cols of the users table,  is location_id necessary?
    ["name", "email", "password", "locations_id"],
    // the user input in the form that is the vals
    [request.body.name, request.body.email, request.body.password, request.body.location],
     function(data) {
        console.log(data);
    });
});

router.get("/create-game/:name/:id", function(request, response){
    console.log(request.params.name);
    console.log(request.params.id);

    var gameTitle = request.params.name;
    var gameId = request.params.id;
    let userID = currentuserID.currentID;

    game.allBy("id", gameId, function(data){
        if (data.length < 1){
        console.log("No matching games, Making creating that game to the database");
        game.create(["id", "name"], [gameId, gameTitle], function(data){
                console.log(data);
            game.addtoUsers(["games_id", "users_id"], [gameId, userID], function(data){
                console.log(data)
            });
            response.render("gamesearch");
         });
        } else {
            console.log("Game is already in the database", data);
            response.render("gamesearch");
        }
    });

});

// Export routes for server.js to use.
module.exports = router;