import { definePages } from "@uni-helper/vite-plugin-uni-pages";

export default definePages({
  middleware: ["global"],
  tabBar: {
    list: [
      {
        pagePath: "pages/index/index",
        iconPath: "static/logo.png",
        selectedIconPath: "static/logo.png",
        text: "Home",
      },
      {
        pagePath: "pages/vip/index",
        iconPath: "static/logo.png",
        selectedIconPath: "static/logo.png",
        text: "Vip",
      },
    ],
  },
});
