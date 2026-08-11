export type Engine = {
  name: string;
  searchUrl: string;
  homeUrl: string;
  color: string;
  letter: string;
};

export const ENGINES: Engine[] = [
  { name: "百度", searchUrl: "https://www.baidu.com/s?wd=", homeUrl: "https://www.baidu.com", color: "#2932e1", letter: "百" },
  { name: "搜狗", searchUrl: "https://www.sogou.com/web?query=", homeUrl: "https://www.sogou.com", color: "#f94b15", letter: "搜" },
  { name: "必应", searchUrl: "https://www.bing.com/search?q=", homeUrl: "https://www.bing.com", color: "#007aa3", letter: "B" },
  { name: "抖音", searchUrl: "https://www.douyin.com/search/", homeUrl: "https://www.douyin.com", color: "#000000", letter: "d" },
  { name: "哔哩哔哩", searchUrl: "https://search.bilibili.com/all?keyword=", homeUrl: "https://www.bilibili.com", color: "#fb7299", letter: "B" },
  { name: "知乎", searchUrl: "https://www.zhihu.com/search?q=", homeUrl: "https://www.zhihu.com", color: "#0066ff", letter: "知" },
  { name: "优酷", searchUrl: "https://www.youku.com/search?q=", homeUrl: "https://www.youku.com", color: "#1989fa", letter: "优" },
  { name: "爱奇艺", searchUrl: "https://so.iqiyi.com/so/q_", homeUrl: "https://www.iqiyi.com", color: "#00be06", letter: "爱" },
  { name: "腾讯视频", searchUrl: "https://v.qq.com/x/search/?q=", homeUrl: "https://v.qq.com", color: "#ff6022", letter: "腾" },
  { name: "豆包", searchUrl: "https://www.doubao.com/chat/?q=", homeUrl: "https://www.doubao.com", color: "#4d6bfe", letter: "豆" },
  { name: "千问", searchUrl: "https://tongyi.aliyun.com/qianwen/?q=", homeUrl: "https://tongyi.aliyun.com/qianwen", color: "#615ced", letter: "千" },
];

export const DEFAULT_ENGINE_NAME = "百度";

export function getEngineByName(name: string): Engine {
  return ENGINES.find((e) => e.name === name) ?? ENGINES[0];
}
