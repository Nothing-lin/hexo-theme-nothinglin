/**
 * 借助 hexo-renderer-marked 扩展，自定义渲染 code
 * ref：https://github.com/hexojs/hexo-renderer-marked/blob/master/README.md#extensibility
 * 这个JS文件是是Hexo渲染配合EnlighterJS代码高亮插件一起使用的，调整code block的markdown渲染输出形式
 */

hexo.extend.filter.register('marked:renderer', function (renderer) {
  // 定义 renderer.code 来自定义代码块的解析行为
  renderer.code = (sourceCode, language) => {
    return `<pre data-enlighter-language="${language}">${sourceCode}</pre>`;
  };
});
