import AVectorColumn from './AVectorColumn';
import {ICategoricalVector} from 'phovea_core/src/vector';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class CategoricalColumn extends AVectorColumn<string, ICategoricalVector> {
  readonly columnNode: HTMLElement;

  constructor(data: ICategoricalVector, columnParent: HTMLElement) {
    super(data);
    this.columnNode = this.buildColumn(columnParent);
  }

  private buildColumn(parent: HTMLElement) {
    const node = parent.ownerDocument.createElement('div');
    parent.appendChild(node);
    return node;
  }


  update(range: CompositeRange1D) {
    // TODO
  }
}
