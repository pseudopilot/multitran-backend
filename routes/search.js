const express = require("express");
const cheerio = require("cheerio");

const router = express.Router();

// l2 = Russian
// l1 = English

router.get("/", (req, res, next) => {
  const url = `https://www.multitran.com/m.exe?ll1=1&ll2=2&s=${encodeURIComponent(
    req.query.text
  )}`;

  return fetch(url, {
    headers: {
      Referer: url,
    },
  })
    .then((r) => r.text())
    .then((data) => {
      convertHtmlToData(data).then((data) => res.send(data));
    });
});

async function convertHtmlToData(htmlAsString) {
  htmlAsString = htmlAsString.replaceAll(">; <", "><br /><");
  const $ = cheerio.load(htmlAsString);

  const html = $(
    "body form#translation ~ table tr > td.orig11, td.subj, td.trans1"
  );

  let isContextBefore = true;

  const data = $.extract({
    rows: [
      {
        selector: "table tr:has(> td.orig11, td.subj, td.trans1)",
        value: {
          origins: {
            selector: "td.orig11",
            value: {
              context: {
                selector: "span:has(+ a[href])",
                value: "textContent",
              },
              term: {
                selector: "a[href]",
                value: "textContent",
              },
              transcript: {
                selector: "a[href] ~ span",
                value: "textContent",
              },
              part: {
                selector: "em",
                value: "textContent",
              },
            },
          },
          subjects: {
            selector: "td.subj a[href]",
            value: "title",
          },
          translations: [
            {
              selector: "td.trans1 > *:not(:has(>i))",
              // value: "textContent",
              value: (el, key) => {
                const text = $(el).text().trim();

                if (el.name === "a") {
                  isContextBefore = false;
                  return { mainTranslation: text };
                } else if (el.name === "span") {
                  const key = isContextBefore ? "preContext" : "afterContext";
                  return { [key]: text };
                } else {
                  isContextBefore = true;
                  return { divider: ";" };
                }
              },
            },
          ],
        },
      },
    ],
  });

  const parsedData = data.rows.reduce((acc, row) => {
    if (row.origins) {
      return [...acc, { ...row.origins, results: [] }];
    } else {
      acc[acc.length - 1] = {
        ...acc[acc.length - 1],
        results: [
          ...acc[acc.length - 1].results,
          {
            subjects: row.subjects,
            translations: row.translations.reduce(
              (accTr, item) => {
                if (item.divider) {
                  return [...accTr, {}];
                } else {
                  accTr[accTr.length - 1] = {
                    ...accTr[accTr.length - 1],
                    ...item,
                  };
                  return accTr;
                }
              },
              [{}]
            ),
          },
        ],
      };
      return acc;
    }
  }, []);

  return parsedData;
}

module.exports = router;
