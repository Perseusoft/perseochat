const path = require("path");
const { startHub } = require("@perseochat/shell/src/hub");

startHub({
  productName: "PerseoChat",
  icon: path.join(__dirname, "build/icon.png"),
});
