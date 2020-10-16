const lessToJS = require('less-vars-to-js');
const fs = require('fs');
const path = require('path');

const getTotalVars = (curRelativePathArr) => {
  const totalVars = curRelativePathArr.reduce(
    (sum, relativePath) => ({
      ...sum,
      ...lessToJS(
        fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8'),
        { resolveVariables: true },
      ),
    }),
    {},
  );
  return totalVars;
};

const totalVars = getTotalVars(['./theme.less', './color.less']);

module.exports = totalVars;
