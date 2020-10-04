const path = require("path");

module.exports = {
  entry: {
    main: path.resolve(__dirname, "src/index.tsx")
  },
  output: {
    publicPath: "/dist",
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "ts-loader",
        options: { transpileOnly: true }
      }
    ]
  },
  devtool: "source-map"
};
