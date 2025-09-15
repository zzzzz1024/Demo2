import HtmlInlineScriptWebpackPlugin from 'html-inline-script-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import url from 'node:url';
import { Server } from 'socket.io';
import TerserPlugin from 'terser-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { VueLoaderPlugin } from 'vue-loader';
import webpack from 'webpack';
<<<<<<< HEAD
=======
import WebpackObfuscator from 'webpack-obfuscator';
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
const require = createRequire(import.meta.url);
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Config {
  port: number;
  entries: Entry[];
}
interface Entry {
  script: string;
  html?: string;
}

function parse_entry(script_file: string) {
  const html = path.join(path.dirname(script_file), 'index.html');
  if (fs.existsSync(html)) {
    return { script: script_file, html };
  }
  return { script: script_file };
}

<<<<<<< HEAD
function glob_script_files() {
  const files: string[] = fs.globSync(`src/**/index.{ts,js}`);

  const results: string[] = [];
  for (const file of files) {
    // 排除不需要编译的目录
    if (file.includes('角色卡分析工具')) {
      continue; // 跳过角色卡分析工具，因为它是纯HTML+JS项目
    }
    results.push(file);
  }
=======
function common_path(lhs: string, rhs: string) {
  const lhs_parts = lhs.split(path.sep);
  const rhs_parts = rhs.split(path.sep);
  for (let i = 0; i < Math.min(lhs_parts.length, rhs_parts.length); i++) {
    if (lhs_parts[i] !== rhs_parts[i]) {
      return lhs_parts.slice(0, i).join(path.sep);
    }
  }
  return lhs_parts.join(path.sep);
}

function glob_script_files() {
  const files: string[] = fs
    .globSync(`src/**/index.{ts,js}`)
    .filter(file => process.env.CI !== 'true' || !fs.readFileSync(path.join(__dirname, file)).includes('@no-ci'));

  const results: string[] = [];
  const handle = (file: string) => {
    const file_dirname = path.dirname(file);
    for (const [index, result] of results.entries()) {
      const result_dirname = path.dirname(result);
      const common = common_path(result_dirname, file_dirname);
      if (common === result_dirname) {
        return;
      }
      if (common === file_dirname) {
        results.splice(index, 1, file);
        return;
      }
    }
    results.push(file);
  };
  files.forEach(handle);
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
  return results;
}

const config: Config = {
  port: 6621,
  entries: glob_script_files().map(parse_entry),
};

let io: Server;
function watch_it(compiler: webpack.Compiler) {
  if (compiler.options.watch) {
    if (!io) {
      const port = config.port ?? 6621;
      io = new Server(port, { cors: { origin: '*' } });
      console.info(`[Listener] 已启动酒馆监听服务, 正在监听: http://0.0.0.0:${port}`);
      io.on('connect', socket => {
        console.info(`[Listener] 成功连接到酒馆网页 '${socket.id}', 初始化推送...`);
<<<<<<< HEAD
=======
        io.emit('iframe_updated');
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
        socket.on('disconnect', reason => {
          console.info(`[Listener] 与酒馆网页 '${socket.id}' 断开连接: ${reason}`);
        });
      });
    }

    compiler.hooks.done.tap('updater', () => {
      console.info('\n[Listener] 检测到完成编译, 推送更新事件...');
      io.emit('iframe_updated');
    });
  }
}

function parse_configuration(entry: Entry): (_env: any, argv: any) => webpack.Configuration {
<<<<<<< HEAD
=======
  const should_obfuscate = fs.readFileSync(path.join(__dirname, entry.script), 'utf-8').includes('@obfuscate');
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
  const script_filepath = path.parse(entry.script);

  return (_env, argv) => ({
    experiments: {
      outputModule: true,
    },
    devtool: argv.mode === 'production' ? false : 'eval-source-map',
    watchOptions: {
      ignored: ['**/dist', '**/node_modules'],
    },
    entry: path.join(__dirname, entry.script),
    target: 'browserslist',
    output: {
      devtoolModuleFilenameTemplate: 'webpack://tavern_helper_template/[resource-path]?[loaders]',
      filename: `${script_filepath.name}.js`,
      path: path.join(__dirname, 'dist', path.relative(path.join(__dirname, 'src'), script_filepath.dir)),
      chunkFilename: `${script_filepath.name}.[contenthash].chunk.js`,
      asyncChunks: true,
<<<<<<< HEAD
      chunkLoading: 'import',
=======
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
      clean: true,
      publicPath: '',
      library: {
        type: 'module',
      },
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: 'vue-loader',
          exclude: /node_modules/,
        },
        {
          oneOf: [
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                onlyCompileBundledFiles: true,
                compilerOptions: {
                  noUnusedLocals: false,
                  noUnusedParameters: false,
                },
              },
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.(sa|sc)ss$/,
              use: ['postcss-loader', 'sass-loader'],
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.css$/,
              use: ['postcss-loader'],
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                onlyCompileBundledFiles: true,
                compilerOptions: {
                  noUnusedLocals: false,
                  noUnusedParameters: false,
                },
              },
              exclude: /node_modules/,
            },
            {
              test: /\.html?$/,
              use: 'html-loader',
              exclude: /node_modules/,
            },
          ].concat(
            entry.html === undefined
              ? <any[]>[
                  {
                    test: /\.vue\.s(a|c)ss$/,
                    use: [
<<<<<<< HEAD
                      'vue-style-loader',
=======
                      { loader: 'vue-style-loader', options: { ssrId: true } },
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                      'sass-loader',
                    ],
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.vue\.css$/,
<<<<<<< HEAD
                    use: ['vue-style-loader', { loader: 'css-loader', options: { url: false } }, 'postcss-loader'],
=======
                    use: [
                      { loader: 'vue-style-loader', options: { ssrId: true } },
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                    ],
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.s(a|c)ss$/,
<<<<<<< HEAD
                    use: [{ loader: 'css-loader', options: { url: false } }, 'postcss-loader', 'sass-loader'],
=======
                    use: [
                      'style-loader',
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                      'sass-loader',
                    ],
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.css$/,
<<<<<<< HEAD
                    use: [{ loader: 'css-loader', options: { url: false } }, 'postcss-loader'],
=======
                    use: ['style-loader', { loader: 'css-loader', options: { url: false } }, 'postcss-loader'],
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
                    exclude: /node_modules/,
                  },
                ]
              : <any[]>[
                  {
                    test: /\.s(a|c)ss$/,
                    use: [
                      MiniCssExtractPlugin.loader,
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                      'sass-loader',
                    ],
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.css$/,
                    use: [
                      MiniCssExtractPlugin.loader,
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                    ],
                    exclude: /node_modules/,
                  },
                ],
          ),
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js', '.tsx', '.jsx', '.css'],
      plugins: [
        new TsconfigPathsPlugin({
          extensions: ['.ts', '.js', '.tsx', '.jsx'],
          configFile: path.join(__dirname, 'tsconfig.json'),
        }),
      ],
      alias: {},
    },
    plugins: (entry.html === undefined
      ? [new MiniCssExtractPlugin()]
      : [
          new HtmlWebpackPlugin({
            template: path.join(__dirname, entry.html),
            filename: path.parse(entry.html).base,
            scriptLoading: 'module',
            cache: false,
          }),
          new HtmlInlineScriptWebpackPlugin(),
          new MiniCssExtractPlugin(),
          new HTMLInlineCSSWebpackPlugin({
            styleTagFactory({ style }: { style: string }) {
              return `<style>${style}</style>`;
            },
          }),
        ]
<<<<<<< HEAD
    ).concat({ apply: watch_it }, new VueLoaderPlugin()),
    optimization: {
      minimize: true,
=======
    )
      .concat({ apply: watch_it }, new VueLoaderPlugin())
      .concat(
        should_obfuscate
          ? [
              new WebpackObfuscator({
                controlFlowFlattening: true,
                numbersToExpressions: true,
                selfDefending: true,
                simplify: true,
                splitStrings: true,
              }),
            ]
          : [],
      ),
    optimization: {
      minimize: false,
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
      minimizer: [
        argv.mode === 'production'
          ? new TerserPlugin({
              terserOptions: { format: { quote_style: 1 }, mangle: { reserved: ['_', 'toastr', 'YAML', '$', 'z'] } },
            })
          : new TerserPlugin({
              extractComments: false,
              terserOptions: {
                format: { beautify: true, indent_level: 2 },
                compress: false,
                mangle: false,
              },
            }),
      ],
<<<<<<< HEAD
      splitChunks: false,
    },
    externals: [
      ({ context, request }, callback) => {
=======
      splitChunks: {
        chunks: 'async',
        minSize: 20000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
          },
          default: {
            name: 'default',
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },
    externals: ({ context, request }, callback) => {
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
        if (!context || !request) {
          return callback();
        }

        if (
          request.startsWith('-') ||
          request.startsWith('.') ||
          request.startsWith('/') ||
          request.startsWith('!') ||
          request.startsWith('http') ||
          path.isAbsolute(request) ||
          fs.existsSync(path.join(context, request)) ||
          fs.existsSync(request)
        ) {
          return callback();
        }

        const builtin = {
          jquery: '$',
          lodash: '_',
          toastr: 'toastr',
<<<<<<< HEAD
          yaml: 'YAML',
          zod: 'z',
=======
        vue: 'Vue',
        'vue-router': 'VueRouter',
        yaml: 'YAML',
        zod: 'z',
        'pixi.js': 'PIXI',
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
        };
        if (request in builtin) {
          return callback(null, 'var ' + builtin[request as keyof typeof builtin]);
        }
<<<<<<< HEAD
        
        // 允许vue、vue-router和所有vue相关包被正常打包，不作为外部依赖
        if (request === 'vue' || request === 'vue-router' || request.startsWith('@vue/')) {
          return callback();
        }
        
        return callback(null, 'module-import https://testingcf.jsdelivr.net/npm/' + request + '/+esm');
      },
    ],
=======
      if (['vue3-pixi', 'vue-demi'].includes(request)) {
        return callback();
      }
      return callback(null, 'module-import https://testingcf.jsdelivr.net/npm/' + request + '/+esm');
    },
>>>>>>> eea3fdb9001064d40a9b26593495d8cc9f1bafcb
  });
}

export default config.entries.map(parse_configuration);
