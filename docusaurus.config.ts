import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "um7a",
  favicon: "https://github.com/um7a.png",

  // Set the production url of your site here
  url: "https://your-docusaurus-site.example.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/notes/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "um7a", // Usually your GitHub org/user name.
  projectName: "notes", // Usually your repo name.
  trailingSlash: false, // https://docusaurus.io/docs/deployment recommended.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/um7a/notes/docs",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/um7a/notes/blog",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: "dark",
    },
    navbar: {
      items: [
        {
          to: "/notes/",
          activeBaseRegex: "^/notes/$",
          html: `<img class="navbar-item-icon" src="https://um7a.github.io/notes/img/home.svg"/>Home`,
          position: "left",
        },
        // {
        //   type: "docSidebar",
        //   sidebarId: "docsSidebar",
        //   position: "left",
        //   label: "Docs",
        // },
        {
          to: "/blog",
          activeBaseRegex: "/blog$",
          html: `<img class="navbar-item-icon" src="https://um7a.github.io/notes/img/blog.svg"/>Blog`,
          position: "left",
        },
        {
          to: "https://um7a.github.io/notes/blog/rss.xml",
          html: `<img class="navbar-item-icon" src="https://um7a.github.io/notes/img/rss.svg"/>RSS`,
          position: "left",
        },
        {
          to: "https://github.com/um7a/notes",
          html: `<img class="navbar-item-icon" src="https://um7a.github.io/notes/img/source_code.svg"/>Source Code`,
          position: "left",
        },
      ],
    },
    footer: {
      style: "dark",
      copyright: `Copyright © ${new Date().getFullYear()} um7a.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
