import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [{
    input: 'src/GoogleAdWordsEventForwarder.js',
    output: {
        file: 'GoogleAdWordsEventForwarder.js',
        format: 'umd',
        exports: 'named',
        name: 'mp-googleAdWords-kit',
        strict: false
    },
    plugins: [
        resolve({
            browser: true
        }),
        commonjs()
    ]
},
{
    input: 'src/GoogleAdWordsEventForwarder.js',
    output: {
        file: 'dist/GoogleAdWordsEventForwarder.js',
        format: 'umd',
        exports: 'named',
        name: 'mp-googleAdWords-kit',
        strict: false
    },
    plugins: [
        resolve({
            browser: true
        }),
        commonjs()
    ]
}
] 