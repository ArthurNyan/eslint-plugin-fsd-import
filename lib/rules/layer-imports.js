/**
 * @fileoverview Restrict imports only from layers below
 */
'use strict';

const micromatch = require('micromatch');
const { getCurrentFileLayer, isPathRelative } = require('../helpers/helpers');

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Restrict imports from higher layer into layer below.',
            recommended: true,
            url: 'https://github.com/ArthurNyan/eslint-plugin-fsd-import-next/blob/main/docs/rules/layer-imports.md',
        },
        fixable: null,
        schema: [{
            type: 'object',
            properties: {
                alias: {
                    type: 'string',
                },
                ignoreImportPatterns: {
                    type: 'array',
                },
            },
        }],
    },

    create(context) {
        const { alias = '', ignoreImportPatterns = [] } = context.options[0] ?? {};

        const layers = {
            'app': ['views', 'widgets', 'features', 'entities', 'shared'],
            'views': ['widgets', 'features', 'entities', 'shared'],
            'widgets': ['features', 'entities', 'shared'],
            'features': ['entities', 'shared'],
            'entities': ['entities', 'shared'],
            'shared': ['shared'],
        };

        const availableLayers = {
            'app': 'app',
            'entities': 'entities',
            'features': 'features',
            'views': 'views',
            'widgets': 'widgets',
            'shared': 'shared',
        };

        const getImportLayer = (value) => {
            const importPath = alias ? value.replace(`${alias}/`, '') : value;
            const segments = importPath?.split('/');

            return segments?.[0];
        };

        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------

        return {
            ImportDeclaration(node) {
                const importPath = node.source.value;
                const fromFileName = context.getFilename();
                const currentFileLayer = getCurrentFileLayer(fromFileName);
                const importLayer = getImportLayer(importPath);

                if (isPathRelative(importPath)) {
                    return;
                }

                if (!availableLayers[importLayer] || !availableLayers[currentFileLayer]) {
                    return;
                }

                const isIgnored = ignoreImportPatterns.some((pattern) => {
                    return micromatch.isMatch(importPath, pattern);
                });

                if (isIgnored) {
                    return;
                }

                if (!layers[currentFileLayer]?.includes(importLayer)) {
                    context.report(node, `Current layer can import only layers below: (${layers[currentFileLayer]?.join(', ')}).`);
                }
            },
        };
    },
};
