import { test } from 'mapbox-gl-js-test';
import { createFunction } from '../../../src/style-spec/function';
import convertFunction from '../../../src/style-spec/function/convert';
import { createExpression } from '../../../src/style-spec/expression';
import resolveTokens from '../../../src/util/token';

function testEquivalence(t, legacyFunction, propertySpec, inputs) {
    const legacy = createFunction(legacyFunction, propertySpec);
    const converted = convertFunction(legacyFunction, propertySpec);
    const expression = createExpression(converted, propertySpec);
    t.equal(expression.result, 'success');
    for (const [globals, properties] of inputs) {
        const expressionValue = expression.value.evaluate(globals, {properties});
        let legacyValue = legacy.evaluate(globals, {properties});
        if (propertySpec.tokens && typeof legacyValue === 'string') {
            legacyValue = resolveTokens(properties, legacyValue);
        }
        t.equal(expressionValue, legacyValue, JSON.stringify({globals, properties}));
    }
}

test('convertFunction', (t) => {
    t.test('boolean categorical', (t) => {
        const fn = {
            type: 'categorical',
            property: 'p',
            stops: [
                [true, 'true'],
                [false, 'false']
            ],
            default: 'default'
        };

        testEquivalence(t, fn, {type: 'string'}, [
            [{}, {p: true}],
            [{}, {p: false}],
            [{}, {}],
            [{}, {p: 'wrong type'}]
        ]);

        t.end();
    });

    t.test('numeric categorical', (t) => {
        const fn = {
            type: 'categorical',
            property: 'p',
            stops: [
                [0, '0'],
                [1, '1']
            ],
            default: 'default'
        };

        testEquivalence(t, fn, {type: 'string'}, [
            [{}, {p: -1}],
            [{}, {p: 0}],
            [{}, {p: 0.75}],
            [{}, {p: 1}],
            [{}, {p: 2}],
            [{}, {}],
            [{}, {p: 'wrong type'}]
        ]);

        t.end();
    });

    t.test('feature-constant text-field with token replacement', (t) => {
        const functionValue = {
            stops: [
                [0, 'my name is {name}.'],
                [1, '{a} {b} {c}'],
                [2, 'no tokens'],
                [3, '{one_token}'],
                [4, '{leading} token'],
                [5, 'trailing {token}']
            ]
        };

        testEquivalence(t, functionValue, {
            type: 'string',
            'property-type': 'data-constant',
            expression: {
                'interpolated': false,
                'parameters': ['zoom']
            },
            tokens: true
        }, [
            [{zoom: 0}, {}],
            [{zoom: 1}, {}],
            [{zoom: 2}, {}],
            [{zoom: 3}, {}],
            [{zoom: 4}, {}],
            [{zoom: 5}, {}]
        ]);

        t.end();
    });

    t.test('duplicate step function stops', (t) => {
        const functionValue = {
            stops: [
                [0, 'a'],
                [1, 'b'],
                [1, 'c'],
                [2, 'd']
            ]
        };

        const expression = convertFunction(functionValue, {
            type: 'string',
            'property-type': 'data-constant',
            expression: {
                'interpolated': false,
                'parameters': ['zoom']
            }
        });

        t.deepEqual(expression, [
            'step',
            ['zoom'],
            'a',
            1,
            'b',
            2,
            'd'
        ]);

        t.end();
    });

    t.test('duplicate interpolate function stops', (t) => {
        const functionValue = {
            stops: [
                [0, 10],
                [1, 20],
                [1, 25],
                [2, 30]
            ]
        };

        const expression = convertFunction(functionValue, {
            type: 'number',
            'property-type': 'data-constant',
            expression: {
                'interpolated': true,
                'parameters': ['zoom']
            }
        });

        t.deepEqual(expression, [
            'interpolate',
            ['exponential', 1],
            ['zoom'],
            0,
            10,
            1,
            20,
            2,
            30
        ]);

        t.end();
    });

    t.end();
});
