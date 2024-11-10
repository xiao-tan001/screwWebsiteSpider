import * as cheerio from "cheerio";
import path from "node:path";
import { downloadImg, textIsInInterval } from "./utils/index.ts";
import { filePath } from "./utils/constant.ts";
import * as fs from "node:fs";
import { createCrawl } from "x-crawl";

const crawlApp = createCrawl({
  enableRandomFingerprint: true,
});
export async function getBanners(html: string) {
  const $ = cheerio.load(html);
  const tagA = $(".swipe-wrap").find("a");
  const images = tagA.find("img");
  const asyncOps: Array<Promise<any>> = [];

  tagA.each((index, item) => {
    const imgSrc = images[index].attribs.src;
    const aSrc = item.attribs.href;

    // 获取首页中banner图片并存储
    const bannerPath = path.join(filePath, `/banners/${index}/banner.jpg`);
    asyncOps.push(downloadImg(imgSrc, bannerPath));

    const bannerDataPath = path.join(filePath, `/banners/${index}`);
    asyncOps.push(getBannerPage(aSrc, bannerDataPath));
  });

  await Promise.all(asyncOps);
}

/**
 * @规则：banner中网址匹配规则
 *    标题: p->strong->span [0]
 *    主营：p->span(<span style="font-size: 16px) “匹配一半数组即可”
 *    电话：.ajaxBut -> text
 *    手机：.ajaxBut2 && .ajaxBut3 -> text
 *    地址：匹配文字："地址:"
 *    工厂图集：.xwzx_nr->img
 * */
async function getBannerPage(pageUrl: string, folderPath: string) {
  const res = await crawlApp.crawlHTML(pageUrl);

  const pageDataPath = path.join(folderPath, "/page.json");
  const $ = cheerio.load(res.data!.html);

  const pageJson = {
    pageUrl,
    title: "",
    mainBusiness: "",
    telephone: 0,
    phone: [] as Number[],
    factoryImages: [],
    address: {
      text: "",
    },
  };

  // 标题
  const p = $("p");
  pageJson.title = p.find("strong").first().find("span").text();

  let texts: string[] = [];
  p.find("span")
    .attr("style", "font-size: 16px")
    .each((_, el) => {
      const tempText = $(el)
        .text()
        .replace(/[ \t\u00A0]+/g, " ");

      if (
        textIsInInterval(tempText, 3, 5) &&
        (tempText.includes("市") || tempText.includes("区"))
      ) {
        return;
      }

      if (texts.includes(tempText)) {
        return;
      }

      texts.push(tempText);
    });

  // 主营
  pageJson.mainBusiness = texts.join("");

  // 电话
  pageJson.telephone = Number($(".ajaxBut").first().text() || 0);

  // 手机
  pageJson.phone.push(
    ...[
      Number($(".ajaxBut2").first().text() || 0),
      Number($(".ajaxBut3").first().text() || 0),
    ],
  );

  // 地址：匹配文字："地址:"
  const attr = p.attr(
    "style",
    "text-align: center; font-size: 18px; padding-bottom: 10px",
  );
  pageJson.address.text =
    attr
      .text()
      .match(/.*地址:.*/g)?.[0]
      ?.trim() || "";

  // 匹配并执行js代码
  const scriptText = $("script").text();

  const expression = scriptText.match(
    /document.querySelector\("\#openLocation"\).onclick = function \(\) \{([\s\S]*?)\};/,
  )?.[1];

  const wx = {
    // @ts-ignore
    openLocation: function (params) {
      return params;
    },
    obj: {},
  };

  console.info(expression);
  if (expression) {
    new Function("wx", `wx.obj = ${expression}`)(wx);
    console.log(wx.obj);
    pageJson.address = {
      ...pageJson.address,
      ...wx.obj,
    };
  }

  // 创建目录（如果不存在）
  const dir = pageDataPath
    .split("/")
    .slice(0, pageDataPath.split("/").length - 1)
    .join("/");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(
      path.resolve(pageDataPath),
      JSON.stringify(pageJson, null, 2),
      (err) => {
        if (err) {
          reject(`保存json文件报错：${err}`);
        } else {
          resolve("json文件保存成功");
        }
      },
    );
  });

  // TODO：可能需要headless浏览器 工厂图集：.xwzx_nr->img
}
