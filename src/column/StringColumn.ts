/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {AVectorColumn, IStringVector} from './AVectorColumn';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';
import {IMultiFormOptions} from 'phovea_core/src/multiform';

export default class StringColumn extends AVectorColumn<string, IStringVector> {
  minWidth: number = 80;
  maxWidth: number = 300;
  minHeight: number = 19;
  maxHeight: number = 25;

  constructor(data: IStringVector, orientation: EOrientation, parent: HTMLElement) {
    super(data, orientation);
    this.$node = this.build(parent);
  }

  protected multiFormParams($body: d3.Selection<any>, actVis?): IMultiFormOptions {
    return mixin(super.multiFormParams($body, actVis), {
      initialVis: (actVis !== undefined) ? actVis : 'list',
      'list': {
        cssClass: 'taggle-vis-list'
      }
    });
  }

}
