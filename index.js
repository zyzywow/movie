const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary");
const { defaultFormat } = require("moment");

const MongoClient = require("mongodb").MongoClient;
let db = null;
MongoClient.connect(process.env.MONGO_URL, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.log(err);
  }
  db = client.db("crudapp");
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false })); // post에서 보낸데이터req.body로받으려면 있어야함.
app.use(express.static(path.join(__dirname, "/public"))); // 정적파일 경로에있는것 쓰겠다.
app.use("/upload", express.static(path.join(__dirname, "/upload")));

app.set("port", process.env.PORT || 8099);
const PORT = app.get("port");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: (req, file, done) => {
    done(null, path.join(__dirname, "/upload"));
  },
  filename: (req, file, done) => {
    done(null, file.originalname);
  },
});

const fileUpload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("index", { title: "main" });
});
app.get("/insert", (req, res) => {
  res.render("insert", { title: "insert" });
});
// 미들웨어 fileUpload.single("poster")
app.post("/register", fileUpload.single("poster"), (req, res) => {
  const movieTitle = req.body.movieTitle;
  const date = req.body.date;
  const genre = Array.isArray(req.body.genre) ? req.body.genre.join("/") : req.body.genre;
  const desc = req.body.desc;
  const point = req.body.point;

  // console.log(movieTitle);
  // console.log(date);
  // console.log(genre);
  // console.log(desc);
  // console.log(point);

  // console.log(req.file);
  //파일업로드는 req.file로받음.
  // db에 파일을 저장하는 두가지 방법.. 이미지파일을 text로 바꿔서 저장
  // 2. db에다가 경로만 저장하는것 (text로 이미지경로만 저장)

  cloudinary.uploader.upload(req.file.path, (result) => {
    console.log(result);
    db.collection("movie").insertOne({
      movieTitle: movieTitle,
      date: date,
      desc: desc,
      genre: genre,
      point: point,
      poster: result.url,
    });
  });
  res.redirect("/list");
});
app.get("/list", (req, res) => {
  db.collection("movie")
    .find()
    .toArray((err, result) => {
      res.render("list", { list: result, title: "list" });
    });
});
app.get("/movie/:title", (req, res) => {
  // console.log(req.query.id);
  console.log(req.params.title);
  const movieTitle = req.params.title;
  db.collection("movie").findOne({ movieTitle: movieTitle }, (err, result) => {
    if (result) {
      res.render("movie", { title: "detail", result: result });
    }
  });
});
app.get("/modify", (req, res) => {
  res.render("modify", { title: "modify" });
});
// app.post("/modify", (req, res) => {
//   const movieTitle = req.body.movieTitle;
//   const date = req.body.date;
//   const genre = Array.isArray(req.body.genre) ? req.body.genre.join("/") : req.body.genre;
//   const point = req.body.point;
//   const desc = req.body.desc;
//   const poster = req.body.poster;
//   db.collection("movie").updateOne(
//     {
//       $set: {
//         movieTitle: movieTitle,
//         date: date,
//         genre: genre,
//         point: point,
//         desc: desc,
//         poster: poster,
//       },
//     },
//     (err, result) => {
//       if (err) {
//         console.log(err);
//       }
//       // console.log(result);
//       res.send(`<script>alert("정보 수정이 되었습니다.");location.href="/list";</script>`);
//     }
//   );
// });

app.listen(PORT, () => {
  console.log(`${PORT}에서 서버 대기중`);
});
