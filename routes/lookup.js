const express = require("express");

const router = express.Router();

// l2 = Russian
// l1 = English

router.get("/", (req, res, next) => {
  const url = `https://www.multitran.com/ms.exe?l1=2&l2=1&s=${encodeURIComponent(
    req.query.text
  )}`;

  return fetch(url, {
    headers: {
      Referer: url,
    },
  })
    .then((r) => r.text())
    .then((data) => res.send(data))
    .catch((error) => {
      console.error(error);
      return res.status(500).send("Error");
    });
});

module.exports = router;
