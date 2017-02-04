import AVectorColumn from './AVectorColumn';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {EOrientation} from './AColumn';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class CategoricalColumn extends AVectorColumn<string, ICategoricalVector> {
  readonly node: HTMLElement;

  constructor(data: ICategoricalVector, orientation: EOrientation, parent: HTMLElement) {
    super(data, orientation);
    this.node = this.build(parent);
  }

  protected multiFormParams(): IMultiFormOptions {
    return {
      initialVis: 'phovea-vis-heatmap1d'
    };
  }



}
