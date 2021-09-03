import fs from "fs/promises";
import path from "path";

async function fixUp() {

    const writePackageJson = async (module) => {
        let type = 'module';

        if (module === 'cjs') {
            type = 'commonjs';
        }

        await fs.writeFile(path.resolve('dist', module, 'package.json'), JSON.stringify({ type }, null, 2));
    }

    await writePackageJson('esm');
    await writePackageJson('cjs');

}

fixUp()