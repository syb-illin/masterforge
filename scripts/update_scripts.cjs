const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts.lint = "eslint .";
pkg.scripts["lint:fix"] = "eslint . --fix && prettier --write .";
pkg.scripts["format:check"] = "prettier --check .";
pkg.scripts["test:e2e"] = "playwright test";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
