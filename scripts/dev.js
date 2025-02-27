// 这个文件会帮我们打包 packages 下的模块，最终打包出js文件

// node dev.js 要打包的名字 -f 打包格式

import minimist from "minimist";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// node中的命令函数参数通过process 来获取 process.argv
const args = minimist(process.argv.slice(2));\

// esm 使用 commonjs 变量
const __filename = fileURLToPath(import.meta.url); // 获取文件的绝对路径 file:
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const target = args._[0] || "reactivity"; //打包哪个项目
const format = args.f || "life"; // 打包后的模块化规范

// node中esm模块没有 __dirname
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
