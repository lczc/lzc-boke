var express = require("express");
var app = express();
var ejs = require("ejs");
var path = require("path");
var moment = require("moment");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
	session({
		name: "lzcc",
		secret: "123456", //为了安全性的考虑设置secret属性
		cookie: { maxAge: 60 * 1000 * 30 }, //设置过期时间
		resave: true, // 即使 session 没有被修改，也保存 session 值，默认为 true
		saveUninitialized: false //
	})
);
/*app.use(async function(req, res) {
	let lzc = req.cookies.lzcc;
	if (!lzc) {
		res.redirect("/index");
	}
});*/
mongoose.connect("mongodb://localhost/mydb"); //连接本地数据库blog

var db = mongoose.connection;
var nowdate = moment().format("YYYY-MM-DD HH:mm:ss");

const articleSchema = new mongoose.Schema(
	{
		title: String,
		content: String,
		date: Date,
		comments: Object
	},
	{
		versionKey: false
	}
);
const adminSchema = new mongoose.Schema(
	{
		email: String,
		pwd: String
	},
	{
		versionKey: false
	}
);
const articleModel = mongoose.model("articles", articleSchema);
const adminModel = mongoose.model("users", adminSchema);
// 连接成功
db.on("open", function() {
	console.log("MongoDB Connection Successed");
});
// 连接失败
db.on("error", function() {
	console.log("MongoDB Connection Error");
});
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.get("/", async (req, res, next) => {
	if (req.cookies.lzcc) {
		res.redirect("/index");
	} else {
		res.render("login");
	}
});
app.get("/login", async (req, res, next) => {
	res.render("login");
});

app.get("/index", async (req, res, next) => {
	console.log(req.session);
	articleModel.findOne({ tuijian: true }, function(error, result) {
		if (error) {
			console.log(error);
		} else {
			res.render("index", { articleResult: result });
		}
	});
});
app.post("/article", async (req, res, next) => {
	var content = req.body.content;
	var title = req.body.title;
	let newArticle = [
		{
			title: title,
			content: content,
			date: nowdate
		}
	];
	articleModel.create(newArticle, err => {
		if (err) return console.log(err);
	});
});
app.post("/article/comment", async (req, res, next) => {
	var newcomment = req.body;
	var articleid = newcomment.articleid;
	var name = newcomment.name;
	var text = newcomment.text;
	var nowdate = moment().format("YYYY-MM-DD HH:mm:ss");

	articleModel.update(
		{ _id: articleid },
		{ $push: { comments: { name: name, text: text, date: nowdate } } },
		function(error) {
			if (error) {
				console.log(error);
			} else {
				console.log("update ok!");
			}
		}
	);
});
app.post("/login", function(req, res, next) {
	adminModel.findOne(
		{
			email: req.body.mail,
			pwd: req.body.pwd
		},
		function(err, doc) {
			if (doc) {
				var user = {
					name: "Luo-zc",
					age: "22",
					address: "gd"
				};
				req.session.user = user;
				res.cookie();
				res.send("success");
			}
		}
	);
});

app.get("/articleList", async (req, res, next) => {
	articleModel.find(function(error, result) {
		if (error) {
			console.log(error);
		} else {
			res.render("articleList", { articleResult: result });
		}
	});
});
app.get("/articleDetail/:articleid", async (req, res, next) => {
	var articleid = req.params.articleid;
	articleModel.findOne({ _id: articleid }, function(error, result) {
		if (error) {
			console.log(error);
		} else {
			res.render("articleDetail", { articleResult: result });
		}
	});
});
app.get("/writeArticle", async (req, res, next) => {
	await res.render("writeArticle");
});
app.use(express.static("./public"));

app.listen(3001);
