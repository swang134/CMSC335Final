process.stdin.setEncoding("utf8");
let http = require("http");
const path = require("path");
let express = require("express");   /* Accessing express module */
let app = express();  /* app is a request handler function */
let bodyParser = require("body-parser"); /* To handle post parameters */

let fs = require("fs");
const { name } = require("ejs");
const res = require("express/lib/response");
if(process.argv.length != 2){
    console.log(`Usage supermarketServer.js jsonFile`);
    process.exit(0);
}
const port = 8080;

require("dotenv").config({ path: path.resolve(__dirname, 'env/.env') })  
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbname = process.env.MONGO_DB_NAME;
const collect = process.env.MONGO_COLLECTION;
 /* Our database and collection */
const databaseAndCollection = {db: dbname, collection:collect};
/****** DO NOT MODIFY FROM THIS POINT ONE ******/
http.createServer(app).listen(port);
async function main(){
    const { MongoClient, ServerApiVersion } = require('mongodb');
    const uri = `mongodb+srv://${userName}:${password}@cluster0.7ta5n.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    app.set("views", path.resolve(__dirname, "templates"));
    app.set("view engine", "ejs");
    app.use(express.static(path.join(__dirname, "/templates")));
    app.use(express.static(path.join(__dirname, "/templates/videos")));

    app.get("/", function(request, response) {
        response.render("index");
    });

    app.get("/explore", function(request, response) {
        response.render("explore");
    });

    app.get("/apply", function(request, response) {
        let {title, weather, location, moods, records} =  request.query;
        response.render("apply");
    });

    app.use(bodyParser.urlencoded({extended:false}));

    app.post("/apply", function(request, response) {
        let myDate = new Date();
        let variable = {title:request.body.title, weather:request.body.weather, moods:request.body.moods, location:request.body.location, records:request.body.records, date:myDate};
        insert(request.body.title,request.body.weather,request.body.location, request.body.moods, request.body.records, myDate);
        response.render("confirm", variable);
    });

    async function insert(title, weather, location, moods, records, date) {
        //const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        try {
            await client.connect();
            let student1 = {_id:title, title: title, weather: weather, location: location, moods: moods, records: records, date:date };
            await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(student1);
            } catch (e) {
                    console.error(e);
            }
    }

    app.get("/title", function(request, response) {
        let title =  request.query;
        response.render("title");
    });
    app.post("/title", function(request, response) {
        let a = find(request.body.title);
        a.then((r) => {
            if (r)
                response.render("confirm", {title:r.title, weather:r.weather, location:r.location, moods: r.moods, records: r.records, date:r.date});
            else 
                response.render("confirm", {title:"Null", weather:"Null", location:"Null", moods:"Null", records:"Null", date:"Null"});
        });
            
    });
    async function find(title) {
        try {
            await client.connect();
            const result = await lookUpOne(client, databaseAndCollection, {title: title});
            return result;
        } catch (e) {
            console.error(e);
        }
    }

    async function lookUpOne(client, databaseAndCollection, title) {
        const res = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(title);
        return res;
        
    }
    
    app.get("/mood", function(request, response) {
        let moods =  request.query;
        response.render("mood");
    });
    app.post("/mood", function(request, response) {
        let a = moods();
        let table = "<table border=1><tr><th>Title</th><th>Weather</th><th>Location</th><th>Date</th></tr>";
        a.then((r) => {
            if (r){
                r.forEach(element => {
                    if(element.moods === request.body.moods)
                        table += "<tr><td>"+element.title+"</td><td>"+element.weather+"</td><td>"+ element.location +"</td><td>"+ element.date +"</td></tr>";
                }); 
                table += "</table>";
                response.render("table", {moods:request.body.moods,result: table});
            } else{
                table += "</table>";
                response.render("table", {moods:request.body.moods,result: table});
            }
        });
        
    });
    async function moods() {
        try {
            await client.connect();
            let filter = {};
            const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);
            const result = await cursor.toArray();
            return result;
        } catch (e) {
            console.error(e);
        }
    }

    app.get("/location", function(request, response) {
        response.render("location");
    });

    app.get("/clean", function(request, response) {
        let title =  request.query;
        response.render("clean");
    });

    app.post("/clean", function(request, response) {
        clean(request.body.title);
        response.render("remove");
    });

    async function clean(title) {
        try {
            await client.connect();
            await deleteOne(client, databaseAndCollection, {title: title});
        } catch (e) {
            console.error(e);
        }
    }

    async function deleteOne(client, databaseAndCollection, title) {
        await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .deleteOne(title);
        
    }

}
main().catch(console.error);


console.log(`Web server is running at http://localhost:${port}`);
process.stdout.write("Stop to shutdown the server: ");
process.stdin.on('readable', function() {
    let dataInput;
    while ((dataInput= process.stdin.read()) !== null){
        if (dataInput !== null) {
            let command = dataInput.trim();
            if (command === "stop") {
                console.log("Shutting down the server");
                process.exit(0);
            } else {
                console.log(`Invalid command: ${command}`);
                process.stdout.write(`Type itemsList or stop to shutdown the server: `);
                //process.exit(0);
            }
        }
    }
});


