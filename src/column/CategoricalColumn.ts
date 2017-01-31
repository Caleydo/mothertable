import AVectorColumn from './AVectorColumn';
import {ICategoricalVector} from 'phovea_core/src/vector';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class CategoricalColumn extends AVectorColumn<string, ICategoricalVector> {
  readonly node: HTMLElement;

  constructor(data: ICategoricalVector, columnParent: HTMLElement) {
    super(data);
    this.node = this.build(columnParent);
  }
}
