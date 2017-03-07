/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AVectorColumn from './AVectorColumn';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';

export default class CategoricalColumn extends AVectorColumn<string, ICategoricalVector> {

  minimumWidth: number = 30;
  preferredWidth: number = 200; //80
  minimumHeight: number = 2;
  preferredHeight: number = 10;

  constructor(data: ICategoricalVector, orientation: EOrientation, parent: HTMLElement) {
    super(data, orientation);
    this.$node = this.build(parent);
  }

  protected multiFormParams($body: d3.Selection<any>): IMultiFormOptions {
    return mixin(super.multiFormParams($body), {
      initialVis: 'phovea-vis-heatmap1d'
    });
  }


}
