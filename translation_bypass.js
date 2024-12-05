// ==UserScript==
// @name         谷歌翻译绕过代码块
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  让谷歌翻译插件翻译网页的时候，绕过代码块和一些无需翻译的元素
// @author       xiandan；luojiahao
// @homeurl      https://github.com/xiandanin/LardMonkeyScripts
// @homeurl      https://github.com/luojiahao-cn/LardMonkeyScripts
// @homeurl      https://greasyfork.org/zh-CN/scripts/392357
// @match        https://github.com/*
// @match        https://npmjs.com/*
// @match        https://stackoverflow.com/*
// @match        https://*.google.com/*
// @match        https://ieeexplore.ieee.org/*
// @license      MIT
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 定义noTranslate函数
    function noTranslate(array) {
        array.forEach((name) => {
            [...document.querySelectorAll(name)].forEach(node => {
                if (node.className.indexOf('notranslate') === -1) {
                    node.classList.add('notranslate');
                }
            });
        });
    }

    // 需要避免翻译的元素选择器
    const bypassSelectorArray = [
        'pre',
        'code',
        '.prism-code',
        '.codeinput',
        '.CodeMirror-sizer',
        '.CodeMirror-lines',
        '.CodeMirror-scroll',
        '.CodeMirror-line',
        '.math',
        '.MathJax',
        '.MathJax_Display',
        '.MathRow',
        '.MathEquation',
        '.CodeBlock',
        '.MathJax_Preview',
        '.mjx-chtml.MJXc-display'
    ];

    // 如果是GitHub网站，添加GitHub特定的选择器
    if (window.location.hostname.indexOf("github") !== -1) {
        const githubSelector = [
            '#repository-container-header > div:nth-child(1)',
            'summary.btn.css-truncate',
            '.commit-author',
            '.js-navigation-open.link-gray-dark',
            '.Box-title',
            '.BorderGrid-cell > div.mt-3 > a.Link--muted',
            '.BorderGrid-cell > a[data-pjax="#repo-content-pjax-container"] > div > div:first-child',
            '.BorderGrid-cell > ul.list-style-none',
            'div[role="rowheader"]'
        ];
        bypassSelectorArray.push(...githubSelector);

        // 延迟处理GitHub插件
        setTimeout(function () {
            const githubPluginSelector = [
                '.github-repo-size-div',
                '.octotree-tree-view'
            ];
            noTranslate(githubPluginSelector);
        }, 3000); // 延时处理GitHub插件
    }

    // 如果是MathWorks网站，添加MathWorks特定的选择器
    if (window.location.hostname.indexOf("mathworks") !== -1) {
        const mathworksSelector = [
            '.codeinput',
            '.code_responsive',
            '.inlineequation',
            'inline'
        ];
        bypassSelectorArray.push(...mathworksSelector);
    }

    // 只有在IEEE网站上才启动MutationObserver
    if (window.location.hostname.indexOf("ieee.org") !== -1) {
        const mathJaxMessage = document.getElementById('MathJax_Message');

        // 如果MathJax_Message元素存在，使用MutationObserver监听
        if (mathJaxMessage) {
            let timeoutId; // 用于延时执行
            let isNoneStable = false; // 用于跟踪是否已经稳定为'none'

            const observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const mathJaxMessage = mutation.target;
                        if (mathJaxMessage.style.display === 'none') {
                            // MathJax_Message的display属性变为'none'
                            if (!isNoneStable) {
                                if (timeoutId) {
                                    clearTimeout(timeoutId); // 清除之前的超时检查
                                }
                                // 启动延时检查，确认MathJax渲染完成
                                timeoutId = setTimeout(function () {
                                    // 如果MathJax_Message的display依然为'none'，执行后续操作
                                    if (mathJaxMessage.style.display === 'none') {
                                        console.log('MathJax加载完成，开始执行自动操作');
                                        observer.disconnect(); // 停止观察
                                        noTranslate(bypassSelectorArray); // 执行绕过翻译操作
                                        isNoneStable = true; // 设置为稳定状态
                                    }
                                }, 2000); // 延时2秒
                            }
                        } else {
                            // 如果display不是'none'，则取消延时检查
                            if (timeoutId) {
                                clearTimeout(timeoutId); // 清除之前的超时检查
                            }
                            isNoneStable = false; // 设置为不稳定状态
                        }
                    }
                });
            });

            // 配置MutationObserver，观察style属性的变化
            observer.observe(mathJaxMessage, {
                attributes: true, // 只观察属性变化
                attributeFilter: ['style'] // 只关注style属性变化
            });
        }
    }

    // 执行避免翻译操作
    noTranslate(bypassSelectorArray);

})();
