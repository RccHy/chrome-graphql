// devtools.js
chrome.devtools.panels.create(
    "rcc-graphql",
    "icon.png",
    "panel.html",
    function(panel) {
        // 面板创建后的回调函数
        console.log("panel created!");
    }
);