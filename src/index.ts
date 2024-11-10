import { createCrawl } from "x-crawl";
import * as fs from "node:fs";
import path from "node:path";
import { filePath } from "./utils/constant.ts";
import { getBanners } from "./banners.ts";
import * as cheerio from "cheerio";
import { textIsInInterval } from "./utils/index.ts";
import { text } from "node:stream/consumers";

// 创建爬虫应用
const crawlApp = createCrawl({
  enableRandomFingerprint: true,
});

/**
 * 获取网站主页html
 * */
async function getHomeHtml() {
  const homeHtmlPath = path.join(filePath, "/html/home.html");
  return new Promise((resolve, reject) => {
    fs.readFile(homeHtmlPath, "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      resolve({
        data: {
          html: data,
        },
      });
    });
  });

  // return crawlApp.crawlHTML(
  //   "https://www.luosiku.cn/plugin.php?id=xigua_sp&ac=cate&high=1&mobile=2",
  // );
}

async function Main() {
  getHomeHtml().then(async (res: any) => await getBanners(res.data.html));

  // const bannerHtmlPath = path.join(filePath, "/html/banner1.html");
  // fs.readFile(bannerHtmlPath, "utf8", (err, data) => {
  //   const $ = cheerio.load(data);
  //
  //   let imagesSrc: string[] = [];
  //   const images = $(".xwzx_nr").find("img");
  //   images.each((_, item) => {
  //     console.info(item.attributes);
  //     // const file = (item.attribs.src.split("/") || []).slice(-1)[0];
  //     // imagesSrc.push(`https://www.luosiqiyeku.com/upload/image/${file}`);
  //   });
  //
  //   fs.writeFile(
  //     path.join(filePath, "/logs/debug.txt"),
  //     imagesSrc.join("\r"),
  //     () => {
  //       console.info("写入成功");
  //     },
  //   );
  // });
}

Main();
