import { defineConfig } from "vitepress";

export default defineConfig({
    lang: "en-US",
    title: "AI Translator",
    description: "AI-powered translation for Chrome and Firefox.",
    base: "/AI-translator/",
    themeConfig: {
        nav: [
            { text: "Guide", link: "/getting-started" },
            { text: "Providers", link: "/providers" },
            { text: "Troubleshooting", link: "/troubleshooting" },
            {
                text: "GitHub",
                link: "https://github.com/adinschmidt/AI-translator",
            },
        ],
        sidebar: [
            {
                text: "Overview",
                items: [
                    { text: "Getting Started", link: "/getting-started" },
                    { text: "Installation", link: "/installation" },
                    { text: "Usage", link: "/usage" },
                ],
            },
            {
                text: "Configuration",
                items: [
                    { text: "Settings", link: "/settings" },
                    { text: "Providers & API Keys", link: "/providers" },
                ],
            },
            {
                text: "Reference",
                items: [
                    { text: "Privacy & Permissions", link: "/privacy" },
                    { text: "Troubleshooting", link: "/troubleshooting" },
                ],
            },
        ],
        editLink: {
            pattern: "https://github.com/adinschmidt/AI-translator/edit/master/docs/:path",
            text: "Edit this page on GitHub",
        },
        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/adinschmidt/AI-translator",
            },
        ],
        footer: {
            message: "Released under the AGPL-3.0 License.",
            copyright: "Copyright © 2024–2026 Adin Schmidt",
        },
    },
});
