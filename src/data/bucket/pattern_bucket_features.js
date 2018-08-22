// @flow
import EvaluationParameters from '../../style/evaluation_parameters';
import loadGeometry from '../load_geometry';

import type FillStyleLayer from '../../style/style_layer/fill_style_layer';
import type FillExtrusionStyleLayer from '../../style/style_layer/fill_extrusion_style_layer';
import type LineStyleLayer from '../../style/style_layer/line_style_layer';
import type {ImagePosition} from '../../render/image_atlas';
import type Point from '@mapbox/point-geometry';

import type {
    BucketFeature,
    IndexedFeature,
    PopulateParameters
} from '../bucket';

type PatternStyleLayers =
    Array<LineStyleLayer> |
    Array<FillStyleLayer> |
    Array<FillExtrusionStyleLayer>;

export default function addPatternFeatures(type: string, zoom: number, layers: PatternStyleLayers, features: Array<IndexedFeature>, options: PopulateParameters, bucketIndex: number, addFeature: (BucketFeature, Array<Array<Point>>, number, {[string]: ImagePosition}) => void) {

    const patterns = options.patternDependencies;
    const patternFeatures = [];
    let hasPattern = false;

    for (const layer of layers) {
        const patternProperty = layer.paint.get(`${type}-pattern`);
        if (!patternProperty.isConstant()) {
            hasPattern = true;
        }

        const constantPattern = patternProperty.constantOr(null);
        if (constantPattern) {
            hasPattern = true;
            patterns[constantPattern.to] =  true;
            patterns[constantPattern.from] =  true;
        }
    }

    for (const {feature, index, sourceLayerIndex} of features) {
        if (!layers[0]._featureFilter(new EvaluationParameters(zoom), feature)) continue;

        const geometry = loadGeometry(feature);

        const patternFeature: BucketFeature = {
            sourceLayerIndex: sourceLayerIndex,
            index: index,
            geometry: geometry,
            properties: feature.properties,
            type: feature.type,
            patterns: {}
        };

        if (typeof feature.id !== 'undefined') {
            patternFeature.id = feature.id;
        }

        if (hasPattern) {
            for (const layer of layers) {
                const patternProperty = layer.paint.get(`${type}-pattern`);

                const patternPropertyValue = patternProperty.value;
                if (patternPropertyValue.kind !== "constant") {
                    const min = patternPropertyValue.evaluate({zoom: zoom - 1}, feature, {});
                    const mid = patternPropertyValue.evaluate({zoom: zoom}, feature, {});
                    const max = patternPropertyValue.evaluate({zoom: zoom + 1}, feature, {});
                    // add to patternDependencies
                    patterns[min] = true;
                    patterns[mid] = true;
                    patterns[max] = true;

                    // save for layout
                    patternFeature.patterns[layer.id] = { min, mid, max };
                }
            }
            patternFeatures.push(patternFeature);
        } else {
            addFeature(patternFeature, geometry, index, {});
        }

        options.featureIndex.insert(feature, geometry, index, sourceLayerIndex, bucketIndex);
    }

    return patternFeatures;
}
