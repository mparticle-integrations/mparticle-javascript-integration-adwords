import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/GoogleAdWordsEventForwarder.js',
        output: {
            file: 'GoogleAdWordsEventForwarder.js',
            format: 'iife',
            exports: 'named',
            name: 'mpAdWordsKit',
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
            file: 'dist/GoogleAdWordsEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpAdWordsKit',
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
            file: 'dist/GoogleAdWordsEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpAdWordsKit',
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