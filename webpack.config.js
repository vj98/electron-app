const path = require("path");

module.exports = {
  entry: "./src/index.js", // Entry point for your application
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/", // Tells Webpack to serve from root URL
  },
  resolve: {
    extensions: [".js", ".jsx"], // Extensions Webpack will resolve
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "dist"),
    },
    hot: true,
    port: 8080,
    devMiddleware: {
      writeToDisk: true, // Optional: Forces Dev Server to write files to disk
    },
  },
};
