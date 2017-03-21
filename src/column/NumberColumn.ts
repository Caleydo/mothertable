/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {AVectorColumn} from './AVectorColumn';
import {INumericalVector} from 'phovea_core/src/vector';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';
import NumberFilter from '../filter/NumberFilter';
import {NUMERICAL_COLOR_MAP} from './utils';
import VisManager from './VisManager';
import {AggMode} from './AggSwitcherColumn';

export default class NumberColumn extends AVectorColumn<number, INumericalVector> {
  minWidth: number = 2;
  maxWidth: number = 200;
  minHeight: number = 2;
  maxHeight: number = 25;

  constructor(data: INumericalVector, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
  }

  protected multiFormParams($body: d3.Selection<any>, domain?: number[]): IMultiFormOptions {
    return mixin(super.multiFormParams($body), {
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type, AggMode.Unaggregated),
      'phovea-vis-heatmap1d': {
        color: NUMERICAL_COLOR_MAP
      },
      'barplot': {
        cssClass: 'taggle-vis-barplot',
        min: domain[0],
        max: domain[1]
      }
    });
  }
}
