import { definePages } from "@uni-helper/vite-plugin-uni-pages/config";

export default definePages({
  middleware: ["auth"],
  tabBar: {
    list: [
      {
        pagePath: "pages/index/index",
        iconPath: "static/image/icon_component.png",
        selectedIconPath: "static/image/icon_component_HL.png",
        text: "组件",
      },
      {
        pagePath: "pages/index/test",
        iconPath: "static/image/icon_API.png",
        selectedIconPath: "static/image/icon_API_HL.png",
        text: "接口",
      },
    ],
  },
});
