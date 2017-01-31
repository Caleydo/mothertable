import {AVectorColumn} from './AVectorColumn';
import {INumericalVector} from 'phovea_core/src/vector';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class NumberColumn extends AVectorColumn<number, INumericalVector> {
  readonly node: HTMLElement;

  constructor(data: INumericalVector, columnParent: HTMLElement) {
    super(data);
    this.node = this.build(columnParent);
  }
}
