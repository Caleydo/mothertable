/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {AVectorColumn, IStringVector} from './AVectorColumn';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';
import {IMultiFormOptions} from 'phovea_core/src/multiform';

export default class StringColumn extends AVectorColumn<string, IStringVector> {
  minimumWidth: number = 80;
  preferredWidth: number = 300;

  constructor(data: IStringVector, orientation: EOrientation, parent: HTMLElement) {
    super(data, orientation);
    this.$node = this.build(parent);
  }

  protected multiFormParams($body: d3.Selection<any>): IMultiFormOptions {
    return mixin(super.multiFormParams($body), {
      initialVis: 'list',
      'list': {
        cssClass: 'taggle-list'
      }
    });
  }

}
