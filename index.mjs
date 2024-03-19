import { generate } from 'astring';
import { parse } from 'acorn';
import { ancestor } from 'acorn-walk';
import { transform } from 'esbuild';
import fs from 'fs/promises';
import RamDodger3000 from 'ramdodger3000';

/**
 *  @type {import('esbuild-bitburner-plugin').PluginExtension}
 */
export const RamDodgerExtension = {
  async afterBuild() {
    const output = await fs.readdir('./build', { recursive: true, withFileTypes: true })
      .then(f => f.filter(f => f.isFile()));

    await Promise.all(
      output.map(async file => fs.writeFile(
        `${file.path}/${file.name}`,
        RamDodger3000(await fs.readFile(`${file.path}/${file.name}`, { encoding: 'utf8' }), { indent: '', lineEnd: '\n' })
      ))
    ).catch(_ => console.log(_));
  }
};

/**
 * @type {import('esbuild').Plugin}
 */
export const UnsafePlugin = {
  name: 'UnsafePlugin',
  setup(pluginBuild) {

    pluginBuild.onLoad({ filter: /.*/ }, async (opts) => {
      if (opts.with.type == 'unsafe') {
        const file = await fs.readFile(opts.path, { encoding: 'utf8' });
        const { code } = await transform(file, { loader: 'tsx' });
        const ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module' });

        ancestor(ast, {
          ExpressionStatement(node, state) {
            if (node.directive) {
              const parent = state.at(-2);
              parent.body = parent.body.filter(node => !node.directive);
            }
          }
        });

        return {
          contents: generate(ast)
        };
      }

    });
  }
};
