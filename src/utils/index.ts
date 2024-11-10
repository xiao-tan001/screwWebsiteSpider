import axios from "axios";
import * as fs from "node:fs";
import path from "node:path";

export async function downloadImg(
  src: string,
  savePath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    axios
      .get(src, { responseType: "arraybuffer" })
      .then((response) => {
        // 创建目录（如果不存在）
        const dir = savePath
          .split("/")
          .slice(0, savePath.split("/").length - 1)
          .join("/");
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFile(path.resolve(savePath), response.data, (err) => {
          if (err) {
            reject(`保存图片到本地时出错：${err}`);
          } else {
            resolve(savePath);
          }
        });
      })
      .catch((error) => {
        reject(`获取图片数据时出错：${error}`);
      });
  });
}

export function textIsInInterval(text: string, start: number, end: number) {
  const len = text.length;
  return len >= start && len <= end;
}
