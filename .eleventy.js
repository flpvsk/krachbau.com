const fs = require('fs');
const htmlmin = require('html-minifier');
const markdown = require('markdown-it')({ html: true });
const music = import('music-metadata');
const prettydata = require('pretty-data');

module.exports = function main(config) {
  config.addPassthroughCopy('src/styles');
  config.addPassthroughCopy('src/images');
  config.addPassthroughCopy('src/{episodes}/**/*.!(md)');

  config.addFilter('length', (path) => {
    const stats = fs.statSync(path);
    return stats.size;
  });

  const getDuration = async (path) => {
    return (await music).parseFile(path, { duration: true })
      .then(metadata => {
        const duration = parseFloat(metadata.format.duration);
        return new Date(Math.ceil(duration) * 1000).toISOString().substring(11, 19);
      })
      .catch(error => {
        console.log(error);
      });
  }

  config.addNunjucksAsyncFilter('duration', async (path, callback) => {
    const duration = await getDuration(path);

    callback(null, duration);
  });

  config.addFilter('enDate', (value) => {
    return value.toLocaleString('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  config.addFilter('htmlmin', (value) => {
    return htmlmin.minify(
      value, {
        removeComments: true,
        collapseWhitespace: true
      }
    );
  });

  config.addFilter('markdown', (value) => {
    return markdown.render(value);
  });

  config.addTransform('xmlmin', (content, outputPath) => {
    if(outputPath && outputPath.endsWith('.xml')) {
      return prettydata.pd.xmlmin(content);
    }
    return content;
  });

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: 'includes',
      layouts: 'layouts',
      data: 'data'
    },
    dataTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
};

