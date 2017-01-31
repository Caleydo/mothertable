import {AVectorColumn, IStringVector} from './AVectorColumn';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class StringColumn extends AVectorColumn<string, IStringVector> {
  readonly columnNode: HTMLElement;

  constructor(data: IStringVector, columnParent: HTMLElement) {
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
