import AColumn from './AColumn';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
import {INumericalMatrix} from 'phovea_core/src/matrix';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class MatrixColumn extends AColumn<number, INumericalMatrix> {
  readonly columnNode: HTMLElement;

  constructor(data: INumericalMatrix, columnParent: HTMLElement) {
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
