import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import rollupTypescript from 'rollup-plugin-typescript2';
const name = process.env.npm_package_name;
const version = process.env.npm_package_version;
const main = process.env.npm_package_main;

export default [
  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/index.ts',
    output: [
      {
        file: main,
        format: 'cjs',
        banner: `/*!
* ${name} V${version}
* For promise
* Released under the MIT License.
*/`,
      },
    ],
    external: ['fs', 'path-to-regexp', 'querystring', '@webtanzhi/redis'],
    plugins: [
      rollupTypescript({ noEmit: false }),
      commonjs(),
      babel({
        exclude: '**/node_modules/**',
        extensions: ['.js', '.ts'], // 让babel能对ts解析过的代码编译
        runtimeHelpers: true,
      }),
    ],
  },
];
