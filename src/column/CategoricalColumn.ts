import AVectorColumn from './AVectorColumn';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class CategoricalColumn extends AVectorColumn<string, ICategoricalVector> {
  readonly node: HTMLElement;

  minimumWidth: number = 30;
  preferredWidth: number = 200; //80

  constructor(data: ICategoricalVector, orientation: EOrientation, parent: HTMLElement) {
    super(data, orientation);
    this.node = this.build(parent);
  }

  protected multiFormParams(body: HTMLElement): IMultiFormOptions {
    return mixin(super.multiFormParams(body), {
      initialVis: 'phovea-vis-heatmap1d'
    });
  }


}
