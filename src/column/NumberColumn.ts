import {AVectorColumn} from './AVectorColumn';
import {INumericalVector} from 'phovea_core/src/vector';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class NumberColumn extends AVectorColumn<number, INumericalVector> {
  readonly node: HTMLElement;

  constructor(data: INumericalVector, orientation: EOrientation, parent: HTMLElement) {
    super(data, orientation);
    this.node = this.build(parent);
  }

  protected multiFormParams(body: HTMLElement): IMultiFormOptions {
    return mixin(super.multiFormParams(body), {
      initialVis: 'phovea-vis-heatmap1d'
    });
  }
}
