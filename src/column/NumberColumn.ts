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

export default class NumberColumn extends AVectorColumn<number, INumericalVector> {
  minWidth: number = 30;
  maxWidth: number = 200;
  minHeight: number = 2;
  maxHeight: number = 10;

  constructor(data: INumericalVector, orientation: EOrientation, parent: HTMLElement) {
    super(data, orientation);
    this.$node = this.build(parent);
  }

  protected multiFormParams($body: d3.Selection<any>, actVis?): IMultiFormOptions {
    return mixin(super.multiFormParams($body,actVis), {
      initialVis: (actVis !== undefined) ? actVis : 'barplot',
      'phovea-vis-heatmap1d': {
        color: NUMERICAL_COLOR_MAP
      },
      'barplot': {
        cssClass: 'taggle-vis-barplot'
      }
    });
  }
}
