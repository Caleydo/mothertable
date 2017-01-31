import {AVectorColumn} from './AVectorColumn';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
import {INumericalVector} from 'phovea_core/src/vector';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class NumberColumn extends AVectorColumn<number, INumericalVector> {
  readonly columnNode: HTMLElement;

  constructor(data: INumericalVector, columnParent: HTMLElement) {
    super(data);
    this.columnNode = this.build(columnParent);
  }

  private build(parent: HTMLElement) {
    const node = <HTMLDivElement><any>parent.ownerDocument.createElement('div');
    parent.appendChild(node);
    return node;
  }

  update(range: CompositeRange1D) {
    // TODO
  }
}
